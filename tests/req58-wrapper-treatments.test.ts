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
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-58 items 3b + 4 — treatments the capture read off the wrong
 * element, so a visible defect was invisible to the gate:
 *   • the green left emphasis bar sits on a WRAPPER div, not the text run, so the
 *     capture recorded borderLeft: none and the missing bar could not surface;
 *   • the card/panel fill behind a run was never captured (only text colour was),
 *     so a slightly-off panel colour was invisible.
 * The fixes walk a few ancestors for the accent bar and record a per-run
 * surfaceFill. The capture UATs drive a REAL headless Chromium against a
 * committed fixture (no third-party site); the diff UAT drives the engine.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)
const MIME: Record<string, string> = { '.html': 'text/html' }

describe('REQ-58 items 3b/4 — wrapper accent bar + card fill (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture
  const tmpDirs: string[] = []

  beforeAll(async () => {
    server = await serveDir(FIXTURES)
    if (browserOk) {
      const cwd = mkdtempSync(path.join(tmpdir(), 'req58-cap-'))
      tmpDirs.push(cwd)
      capture = (await cmdCapturePage(`${server.origin}/req58-treatments.html`, { cwd })).capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  })

  itB('test_UAT_FC_REQ-58_accent_bar_read_from_wrapper', () => {
    const els = flattenCapture(capture).elements
    const callout = els.find((e) => e.text.includes("These aren't just features"))
    // The bar is on the wrapper; before the ancestor walk this was null.
    expect(callout?.borderLeft?.widthPx).toBe(4)
    expect(callout?.borderLeft?.color).toBe('#00d492')
  })

  itB('test_UAT_FC_REQ-58_surface_fill_captured_per_run', () => {
    const els = flattenCapture(capture).elements
    const cardTitle = els.find((e) => e.text === 'Presence')
    const bandRun = els.find((e) => e.text.includes('Plain band paragraph'))
    // The card run carries its white fill; a run on the band carries the band fill.
    expect(cardTitle?.surfaceFill).toBe('#ffffff')
    expect(bandRun?.surfaceFill).toBe('#d9ccba')
  })
})

describe('REQ-58 item 3b — values-diff flags an off panel colour', () => {
  const el = (text: string, over: Partial<ValueElement> = {}): ValueElement => ({
    role: 'body',
    text,
    color: '#1d293d',
    fontFamily: 'sans',
    fontSizePx: 20,
    fontWeight: 600,
    ...over,
  })
  const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
  const has = (deltas: { text: string; property: string }[], sub: string, p: string): boolean =>
    deltas.some((d) => d.text.includes(sub) && d.property === p)

  it('test_UAT_FC_REQ-58_surface_fill_delta_when_text_colour_matches', () => {
    // Same text colour on both sides (as gigabytealchemy's cards were), but the
    // panel fill differs (#ffffff ref vs #ece4d6 ours) — invisible before.
    const ref = mani('ref', [el('Presence', { color: '#1d293d', surfaceFill: '#ffffff' })])
    const actual = mani('a', [el('Presence', { color: '#1d293d', surfaceFill: '#ece4d6' })])
    const { deltas } = diffManifests(ref, actual)
    expect(has(deltas, 'Presence', 'color')).toBe(false) // text colour genuinely matches
    expect(has(deltas, 'Presence', 'surfaceFill')).toBe(true) // panel fill now visible
  })

  it('test_UAT_FC_REQ-58_surface_fill_skipped_when_absent', () => {
    // A run on the band (no fill on one side) never produces a false delta.
    const ref = mani('ref', [el('Line', { surfaceFill: '#ffffff' })])
    const actual = mani('a', [el('Line')])
    expect(diffManifests(ref, actual).deltas.some((d) => d.property === 'surfaceFill')).toBe(false)
  })
})

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
