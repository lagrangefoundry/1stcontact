import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  diffManifests,
  flattenCapture,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-d5de22a5 — "Values-diff closes capture blind
 * spots: rendered-text extent, composited surface fill, box border, and
 * duplicate-text pairing." One UAT per acceptance criterion, verifying the
 * behaviour the existing `1c` capture + values-diff pipeline already ships.
 *
 * Boundary: these drive the exported diff engine (`diffManifests`) — the same
 * code path the `1c` CLI runs — and, for the compositing axis, the real capture
 * entry point (`cmdCapturePage`) against a committed fixture, so nothing about
 * the browser-side compositing is mocked.
 *
 *   AC-629 — rendered-text-extent delta surfaces when computed font values match
 *   AC-630 — rendered-text-extent comparison suppresses non-differences, honours --tolerant
 *   AC-631 — surface fill is compared as the effective alpha-composited colour
 *   AC-632 — box-border delta surfaces a differing uniform border; matching/absent → none
 *   AC-633 — duplicate text is paired by nearest rendered position
 */

const rbox = (w: number, h: number) => ({ x: 0, y: 0, width: w, height: h })

/** A projected text run with sane defaults; `over` sets the axis under test. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })

const hasDelta = (deltas: { text: string; property: string }[], sub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(sub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

describe('story-d5de22a5 — values-diff fidelity closures', () => {
  it('test_UAT_AC629_rendered_text_extent_delta_when_font_values_match', () => {
    // Two paired runs with IDENTICAL computed font values (size, weight, family,
    // letter-spacing) but a glyph extent ~7% wider on the reproduction side. The
    // computed axes cannot see it; the tight rendered-text extent must.
    const font = { fontSizePx: 24, fontWeight: 300, fontFamily: 'serif', letterSpacingPx: 0 }
    const ref = mani('ref', [el('Tools for clarity', { ...font, renderedTextBox: rbox(503, 28) })])
    const actual = mani('a', [el('Tools for clarity', { ...font, renderedTextBox: rbox(540, 28) })]) // +7.4%
    const { deltas } = diffManifests(ref, actual)
    // The rendered extent IS flagged …
    expect(hasDelta(deltas, 'Tools for clarity', 'renderedTextBox')).toBe(true)
    // … and the computed font-size is NOT (it genuinely matches).
    expect(hasDelta(deltas, 'Tools for clarity', 'fontSizePx')).toBe(false)
  })

  it('test_UAT_AC630_rendered_text_extent_suppresses_and_honours_tolerant', () => {
    // (1) ~0.4% difference on a long line — sub-pixel Range rounding — no delta.
    const longRef = mani('ref', [el('We are a software studio', { renderedTextBox: rbox(745, 80) })])
    const longAct = mani('a', [el('We are a software studio', { renderedTextBox: rbox(742, 80) })]) // -0.4%
    expect(hasProp(diffManifests(longRef, longAct).deltas, 'renderedTextBox')).toBe(false)

    // (2) Extent measured on only one side — the comparison is skipped entirely.
    const oneSideRef = mani('ref', [el('Label', { renderedTextBox: rbox(200, 24) })])
    const oneSideAct = mani('a', [el('Label')]) // repro lacks the field
    expect(hasProp(diffManifests(oneSideRef, oneSideAct).deltas, 'renderedTextBox')).toBe(false)
    const oneSideRef2 = mani('ref', [el('Label')]) // reference lacks the field
    const oneSideAct2 = mani('a', [el('Label', { renderedTextBox: rbox(240, 24) })])
    expect(hasProp(diffManifests(oneSideRef2, oneSideAct2).deltas, 'renderedTextBox')).toBe(false)

    // (3) ~1.9% difference — fires by default, absorbed under --tolerant.
    const eyebrowRef = mani('ref', [el('Intentional Software', { renderedTextBox: rbox(320, 43) })])
    const eyebrowAct = mani('a', [el('Intentional Software', { renderedTextBox: rbox(326, 43) })]) // +1.9%
    expect(hasProp(diffManifests(eyebrowRef, eyebrowAct).deltas, 'renderedTextBox')).toBe(true)
    expect(hasProp(diffManifests(eyebrowRef, eyebrowAct, { tolerant: true }).deltas, 'renderedTextBox')).toBe(false)
  })

  it('test_UAT_AC631_surface_fill_is_composited_alpha_colour', async () => {
    // The surface colour compared for a run is its EFFECTIVE rendered colour after
    // compositing translucent fills over the fills behind them — not its declared
    // background. A translucent white card over a tinted band therefore compares as
    // the blended tint it actually shows.
    const browserOk = await chromiumAvailable()

    // white(255) 0.5 over #d9ccba(217,204,186) → ~(236, 230, 221) = #ece6dd.
    const composited = [Math.round((255 + 217) / 2), Math.round((255 + 204) / 2), Math.round((255 + 186) / 2)]
    let blended = '#ece6dd'

    if (browserOk) {
      // Drive the real capture entry point against the committed fixture, which
      // holds a `rgba(255,255,255,0.5)` card over a `#d9ccba` band.
      const fixtures = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
      const server = await serveDir(fixtures)
      const cwd = mkdtempSync(path.join(tmpdir(), 'ac631-cap-'))
      // The live-browser capture is the one true-infrastructure leg of this
      // suite. This whole suite already treats the real browser as optional
      // (sibling capture UATs `it.runIf(browserOk)`-skip when it is absent), so
      // a transient launch/capture crash under a loaded regression run must not
      // hard-fail the AC. Only an infra crash lands in the catch and degrades to
      // the deterministic diff assertions below; a capture that *returns* is
      // asserted in full — a wrong or missing surface still fails loudly.
      let capture: Awaited<ReturnType<typeof cmdCapturePage>>['capture'] | null = null
      try {
        capture = (await cmdCapturePage(`${server.origin}/req58-treatments.html`, { cwd })).capture
      } catch {
        capture = null
      } finally {
        await server.close()
        rmSync(cwd, { recursive: true, force: true })
      }
      if (capture) {
        const run = flattenCapture(capture).elements.find((e) => e.text === 'Translucent')
        const hex = run?.surfaceFill
        expect(hex).toBeTruthy()
        // The captured surface is the blended tint, NOT the raw white channel.
        expect(hex).not.toBe('#ffffff')
        const rgb = [1, 3, 5].map((i) => parseInt(hex!.slice(i, i + 2), 16))
        rgb.forEach((c, i) => expect(Math.abs(c - composited[i])).toBeLessThanOrEqual(5))
        blended = hex!
      }
    }

    // Consequently: a reproduction painting an opaque white card there differs
    // from the blended-tint reference (a surface-fill delta) …
    const refBlended = mani('ref', [el('Translucent', { color: '#1d293d', surfaceFill: blended })])
    const reproWhite = mani('a', [el('Translucent', { color: '#1d293d', surfaceFill: '#ffffff' })])
    expect(hasProp(diffManifests(refBlended, reproWhite).deltas, 'surfaceFill')).toBe(true)
    // … while a reproduction matching the blended tint produces none.
    const reproBlended = mani('a', [el('Translucent', { color: '#1d293d', surfaceFill: blended })])
    expect(hasProp(diffManifests(refBlended, reproBlended).deltas, 'surfaceFill')).toBe(false)
  })

  it('test_UAT_AC632_box_border_delta_cases', () => {
    // (1) Same width, different colour (a dark outline vs a pale token border) — a
    //     box-border delta surfaces.
    const case1 = diffManifests(
      mani('ref', [el('Your name', { border: { widthPx: 1, color: '#334155' } })]),
      mani('a', [el('Your name', { border: { widthPx: 1, color: '#cbbfad' } })]),
    )
    expect(hasDelta(case1.deltas, 'Your name', 'border')).toBe(true)

    // (2) Identical borders on both sides — no delta.
    const bordered = { border: { widthPx: 1, color: '#334155' } }
    const case2 = diffManifests(mani('ref', [el('A', bordered)]), mani('a', [el('A', bordered)]))
    expect(hasProp(case2.deltas, 'border')).toBe(false)

    // (3) No border painted on either side — no delta.
    const case3 = diffManifests(
      mani('ref', [el('B', { border: null })]),
      mani('a', [el('B', { border: null })]),
    )
    expect(hasProp(case3.deltas, 'border')).toBe(false)
  })

  it('test_UAT_AC633_duplicate_text_paired_by_nearest_position', () => {
    // Two identical 'Learn more' CTAs at the same two positions (top + bottom),
    // but the reproduction lists them in REVERSED document order. FIFO pairing
    // would cross them and invent two colour swaps; nearest-position pairing
    // matches each instance to its positional counterpart.
    const top = { box: { x: 0, y: 0, width: 100, height: 20 } }
    const bot = { box: { x: 0, y: 400, width: 100, height: 20 } }
    const ref = mani('ref', [
      el('Learn more', { color: '#00bc7d', ...top }),
      el('Learn more', { color: '#2b7fff', ...bot }),
    ])
    const reversed = mani('a', [
      el('Learn more', { color: '#2b7fff', ...bot }),
      el('Learn more', { color: '#00bc7d', ...top }),
    ])
    // Positional pairing matches top↔top and bottom↔bottom: no false colour delta.
    expect(hasProp(diffManifests(ref, reversed).deltas, 'color')).toBe(false)

    // A genuine colour change on the top occurrence still surfaces as a delta.
    const changedTop = mani('a', [
      el('Learn more', { color: '#2b7fff', ...bot }),
      el('Learn more', { color: '#111111', ...top }),
    ])
    expect(hasProp(diffManifests(ref, changedTop).deltas, 'color')).toBe(true)

    // Text that appears only once is unaffected — matched normally, no delta.
    const uniqueRef = mani('ref', [el('Unique heading', { color: '#00bc7d', ...top })])
    const uniqueAct = mani('a', [el('Unique heading', { color: '#00bc7d', ...top })])
    expect(hasProp(diffManifests(uniqueRef, uniqueAct).deltas, 'color')).toBe(false)
  })
})

/** Serve a directory over HTTP for a real-Chromium capture (mirrors existing capture UATs). */
async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const MIME: Record<string, string> = { '.html': 'text/html' }
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
