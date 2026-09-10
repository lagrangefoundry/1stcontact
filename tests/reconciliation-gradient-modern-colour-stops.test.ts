import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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
  type Capture,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UAT for story-82eb6908 — **AC-1612**: "a modern-colour-space
 * gradient captures its full ordered stop list resolved to hex in-browser".
 *
 * The blind spot, in the AC's words: a Tailwind-authored gradient computes to
 * `oklch(...)` / `oklab(...)` / `color(...)`, which the tool-side stop parser
 * (`normalizeGradient`, `values-diff.ts:661`) cannot read — and a stop list it
 * cannot read is an EMPTY stop list. The gradient then captures as direction-only,
 * so AC-634/635 (stop positions) and AC-636 (surface gradient) have nothing to
 * compare: both sides record no stops, the gate reads clean, and the gradients
 * visibly differ. The fix resolves each stop token INSIDE the page
 * (`hexifyGradient`, `capture/extract.ts:334` → the canvas colour probe in
 * `rgbaOf`) before the list crosses back to the tool, which is what makes the
 * captured list syntax-independent by construction.
 *
 * **Why this file is browser-gated.** The criterion is *about* the browser's own
 * colour conversion, so a jsdom harness cannot stand in for it: jsdom does not
 * resolve `oklch(...)` and has no canvas colour probe, so it would assert the
 * absence rather than the behaviour. The repo idiom for a clause that needs a
 * real engine is `it.runIf(browserOk)` (`tests/req58-wrapper-treatments.test.ts:32`,
 * `tests/req62-gradient-panel.test.ts:33`), which reports SKIPPED where no Chromium
 * exists rather than passing over zero assertions. Everything is served from an
 * ephemeral loopback server over committed fixtures — no third-party site.
 *
 * **What this file does NOT duplicate.** `tests/req62-gradient-panel.test.ts` and
 * `tests/reconcile-gradient-first-class.test.ts` (AC-634/635/636/638) cover the
 * gradient axes themselves, but every one of their fixtures and manifests is
 * authored in `#hex` — i.e. entirely inside the syntax the tool-side parser could
 * always read. `tests/reconciliation-surface-gradient-selection.test.ts` (AC-1611)
 * covers WHICH ancestor's gradient is chosen, under jsdom, also in `#hex`.
 * `tests/req52-oklch-colour.test.ts` covers modern colour resolution for the
 * scalar `color` axis only, never for a gradient stop list. The clause added here
 * is the one none of them touch: that the STOP LIST survives a modern colour space
 * at all, for both gradient kinds.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)
const MIME: Record<string, string> = { '.html': 'text/html' }

const HEX = /^#[0-9a-f]{6}$/

/** Parse `#rrggbb` → [r, g, b]. */
function channels(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

type Stop = { color: string; position: number | null }
type Grad = { angleDeg: number | null; stops: Stop[] } | null | undefined

const hasDelta = (deltas: { text: string; property: string }[], sub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(sub) && d.property === property)

describe('story-82eb6908 — AC-1612 modern-colour-space gradient stops (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let ref: ValueManifest
  let drift: ValueManifest
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const capture = async (page: string): Promise<Capture> => {
        const cwd = mkdtempSync(path.join(tmpdir(), 'ac1612-'))
        tmpDirs.push(cwd)
        return (await cmdCapturePage(`${server.origin}/${page}`, { cwd })).capture
      }
      ref = flattenCapture(await capture('gradient-modern-stops.html'))
      drift = flattenCapture(await capture('gradient-modern-stops-drift.html'))
    }
  }, 240000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  /** The surface gradient recorded for the run inside the named panel. */
  const surfaceOf = (m: ValueManifest, text: string): Grad =>
    (m.elements.find((e) => e.text === text) as { surfaceGradient?: Grad } | undefined)?.surfaceGradient

  /** The text-fill gradient recorded ON the named wordmark run. */
  const fillOf = (m: ValueManifest, text: string): Grad =>
    (m.elements.find((e) => e.text === text) as { gradient?: Grad } | undefined)?.gradient

  itB('test_UAT_AC1612_oklch_stops_capture_non_empty_ordered_and_hex_on_both_kinds', () => {
    // The core criterion, asserted once per gradient KIND — the AC requires both,
    // and they travel different code paths (surfaceGradientOf vs the
    // background-clip:text branch), so one cannot stand in for the other.
    for (const [kind, grad] of [
      ['surface', surfaceOf(ref, 'Oklch Surface')],
      ['text-fill', fillOf(ref, 'Oklch Wordmark')],
    ] as const) {
      expect(grad, `${kind} gradient captured`).toBeTruthy()

      // NOT direction-only. This is the whole defect: pre-fix `stops` was `[]`
      // while `angleDeg` came through fine, so the axis had nothing to compare.
      expect(grad!.stops.length, `${kind} stop list non-empty`).toBe(2)

      // Every stop is a resolved sRGB literal — the browser's own conversion read
      // back off the page, not a colour-space token the tool would have to
      // reimplement maths for.
      for (const s of grad!.stops) expect(s.color, `${kind} stop is #rrggbb`).toMatch(HEX)

      // Painted ORDER is preserved, asserted by channel dominance rather than by
      // exact bytes: stop 0 is the blue (b greatest), stop 1 the orange (r
      // greatest). A reversed or set-valued list would fail here while still
      // being "non-empty and hex".
      const [r0, g0, b0] = channels(grad!.stops[0].color)
      const [r1, g1, b1] = channels(grad!.stops[1].color)
      expect(b0, `${kind} first stop is blue-dominant`).toBeGreaterThan(Math.max(r0, g0))
      expect(r1, `${kind} last stop is red-dominant`).toBeGreaterThan(Math.max(g1, b1))

      // The stop OFFSETS and the direction survive resolution untouched — the
      // hexify pass rewrites colour tokens only (AC-634/635 stand on these).
      expect(grad!.stops.map((s) => s.position), `${kind} offsets`).toEqual([0, 100])
    }
    expect(surfaceOf(ref, 'Oklch Surface')!.angleDeg).toBe(135)
    expect(fillOf(ref, 'Oklch Wordmark')!.angleDeg).toBe(90)
  })

  itB('test_UAT_AC1612_modern_and_legacy_syntax_capture_stop_for_stop_identically', () => {
    // Syntax-independence, stated exactly. `color-mix(in srgb, X 100%, Y 0%)` is X
    // byte-for-byte — pure sRGB arithmetic, no gamut mapping — so the modern-syntax
    // panel/wordmark PAINT what the `#hex` twins paint, while being just as
    // unreadable to the tool-side stop regex as `oklch(...)` is. Exact equality is
    // therefore the right assertion, and it is what makes the captured list
    // comparable by simple colour equality.
    expect(surfaceOf(ref, 'Mix Surface')).toEqual(surfaceOf(ref, 'Hex Surface'))
    expect(fillOf(ref, 'Mix Wordmark')).toEqual(fillOf(ref, 'Hex Wordmark'))

    // The hex twin is itself pinned, so the pair above cannot agree by both being
    // empty — the exact failure mode the AC describes.
    expect(surfaceOf(ref, 'Hex Surface')!.stops).toEqual([
      { color: '#3b82f6', position: 0 },
      { color: '#f97316', position: 100 },
    ])

    // The oklch panel paints the same design colours through a LOSSY space, so it
    // is held to the same stop list within 8-bit round-trip rounding rather than
    // to exact bytes. Tolerance is 2/255 per channel: enough for OKLCH→sRGB
    // rounding, far too tight for the empty-list or wrong-stop failures.
    const oklch = surfaceOf(ref, 'Oklch Surface')!.stops
    const hex = surfaceOf(ref, 'Hex Surface')!.stops
    expect(oklch.length).toBe(hex.length)
    for (let i = 0; i < hex.length; i++) {
      const [ar, ag, ab] = channels(oklch[i].color)
      const [er, eg, eb] = channels(hex[i].color)
      expect(Math.abs(ar - er), `stop ${i} red`).toBeLessThanOrEqual(2)
      expect(Math.abs(ag - eg), `stop ${i} green`).toBeLessThanOrEqual(2)
      expect(Math.abs(ab - eb), `stop ${i} blue`).toBeLessThanOrEqual(2)
    }
  })

  itB('test_UAT_AC1612_a_differing_modern_syntax_stop_is_reported_on_each_kind', () => {
    // The end of the chain, and the case that passed CLEAN while the stop list was
    // empty: the drifted page's oklch gradients turn green where the reference
    // turns orange, with identical direction, offsets, stop count and text. Both
    // sides are REAL captures, so this exercises capture → projection → diff.
    const { deltas } = diffManifests(ref, drift)
    expect(hasDelta(deltas, 'Oklch Surface', 'surfaceGradient'), 'surface kind flagged').toBe(true)
    expect(hasDelta(deltas, 'Oklch Wordmark', 'gradient'), 'text-fill kind flagged').toBe(true)

    // The no-false-delta control: the panels and wordmarks that did NOT change are
    // byte-identical between the two pages, so a delta on them would mean the axis
    // fires on capture noise rather than on the drifted stop.
    expect(hasDelta(deltas, 'Hex Surface', 'surfaceGradient')).toBe(false)
    expect(hasDelta(deltas, 'Mix Surface', 'surfaceGradient')).toBe(false)
    expect(hasDelta(deltas, 'Hex Wordmark', 'gradient')).toBe(false)
    expect(hasDelta(deltas, 'Mix Wordmark', 'gradient')).toBe(false)
  })
})

// ── local fixture server (mirrors req62-gradient-panel / req58) ───────────────

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
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
