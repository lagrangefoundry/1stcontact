/**
 * REQ-384 — two things the capture recorded differently from what the page paints.
 *
 * Issue 1: the line a run PAINTS, including one an ancestor propagates.
 *
 * hearingzone510.com wraps four links in `<u>` and gives each link its own
 * `text-decoration: none`. That does not cancel the `<u>`'s underline (a
 * decoration propagates to the declaring box's in-flow content), so the page
 * paints 494px of #001e42 under "Discover what our clients think…". The
 * extractor read only the run's own, non-inherited `text-decoration-line` and
 * recorded `null`, so nothing downstream could reproduce the line.
 *
 * Issue 2: an inline run's line-box top. The capture derived it from the span's
 * content area with the EXACT half-leading, where Chromium floors it to a whole
 * pixel — 0.70px high at 18px/23.39, 0.5px at 18/27 — and the reproduction,
 * pinned at that top, painted its glyphs high by as much.
 *
 * The extractor case needs a real Chromium and is skipped where none can launch
 * (set `CHROMIUM_LAUNCH_ARGS=--single-process` under a sandbox).
 */
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  chromiumAvailable,
  createPlaywrightDriver,
  staleCaptureAxes,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli/capture'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

async function rawSignals(page: string): Promise<RawSignals> {
  const server: Server = createServer((req, res) => {
    const file = path.join(FIXTURES, decodeURIComponent((req.url ?? '/').replace(/^\/+/, '')) || 'index.html')
    if (!file.startsWith(FIXTURES) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  const driver = await createPlaywrightDriver()
  try {
    await driver.navigate(`http://127.0.0.1:${port}/${page}`)
    return await driver.query<RawSignals>(EXTRACT_SCRIPT)
  } finally {
    await driver.close()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

const browserOk = await chromiumAvailable()

describe('REQ-384 issue 1 — the extractor reads a propagated decoration', () => {
  it.runIf(browserOk)('test_UAT_FC_REQ-384_a_line_an_ancestor_paints_is_recorded_on_the_run', async () => {
    const signals = await rawSignals('req384-propagated-decoration.html')
    const runs: RawRun[] = signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
    const named = (t: string): RawRun => {
      const r = runs.find((x) => x.text.startsWith(t))
      expect(r, `a run for "${t}"`).toBeDefined()
      return r!
    }
    // The <u> around a link that cancels its own line still paints one.
    expect(named('Discover what our clients').textDecoration).toBe('underline')
    // A block's decoration reaches its in-flow block descendants.
    expect(named('Under a block').textDecoration).toBe('underline')
    // The line sits where its declarer says, not at the run's own `auto`.
    expect(named('Placed by its declarer').textDecoration).toBe('underline')
    expect(named('Placed by its declarer').underlineOffsetPx).toBe(3)
    // Any line propagates, not only an underline — and it places no underline.
    expect(named('Struck through').textDecoration).toBe('line-through')
    expect(named('Struck through').underlineOffsetPx).toBeNull()
  })

  it.runIf(browserOk)('test_UAT_FC_REQ-384_an_atomic_inline_a_float_and_an_undecorated_run_paint_none', async () => {
    const signals = await rawSignals('req384-propagated-decoration.html')
    const runs: RawRun[] = signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
    const named = (t: string): RawRun => runs.find((x) => x.text.startsWith(t))!
    expect(named('Boxed inside').textDecoration).toBeNull()
    expect(named('Floated out').textDecoration).toBeNull()
    expect(named('Plain words').textDecoration).toBeNull()
    expect(named('Plain words').underlineOffsetPx).toBeNull()
  })
})

describe('REQ-384 issue 2 — an inline run is placed at the line top Chromium laid out', () => {
  // Each paragraph is absolutely placed with no padding, so its top IS its line
  // box's top. The run is an inline <span>, so the capture derives that top from
  // the span's content area — and the half-leading between them is the browser's,
  // floored to a whole pixel, not the exact half. Line-heights of both parities
  // and a fractional one make at least one leading odd for any font.
  it.runIf(browserOk)('test_UAT_FC_REQ-384_an_inline_runs_box_top_is_the_line_top_the_browser_used', async () => {
    const signals = await rawSignals('req384-floored-half-leading.html')
    const runs: RawRun[] = signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
    const cases: Array<[string, number]> = [
      ['Fractional leading', 100],
      ['Odd or even leading at twenty seven', 200],
      ['Odd or even leading at twenty eight', 300],
      ['Tall type sixty one', 600],
      ['Tall type sixty', 400],
    ]
    for (const [text, top] of cases) {
      const run = runs.find((r) => r.text.startsWith(text))
      expect(run, `a run for "${text}"`).toBeDefined()
      expect(run!.box!.y, `${text}: the line top`).toBeCloseTo(top, 2)
      // The glyphs sit a whole number of pixels below that top.
      const off = run!.renderedTextBox!.y - run!.box!.y
      expect(Math.abs(off - Math.round(off)), `${text}: offset ${off}`).toBeLessThan(0.02)
    }
  })
})

const bundleAt = (schema: number, run: Record<string, unknown> = { textDecoration: null }): Capture =>
  ({
    url: 'https://example.test/',
    host: 'example.test',
    path: '/',
    capturedAt: '2026-10-04T00:00:00.000Z',
    captureSchema: schema,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [{ content: [run], items: [] }],
    assets: [],
  }) as unknown as Capture

describe('REQ-384 — a bundle taken before the fix asks for a re-capture', () => {
  it('test_UAT_FC_REQ-384_a_pre_22_bundle_is_named_stale_for_the_propagated_line', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(22)
    const named = (c: Capture): boolean =>
      staleCaptureAxes(c).some((a) => a.axis.includes('ancestor propagates'))
    expect(named(bundleAt(21))).toBe(true)
    expect(named(bundleAt(CAPTURE_SCHEMA))).toBe(false)
  })

  it('test_UAT_FC_REQ-384_a_pre_22_bundle_with_a_fractional_glyph_offset_is_named_stale_for_the_line_top', () => {
    const named = (c: Capture): boolean => staleCaptureAxes(c).some((a) => a.axis.includes('floored half-leading'))
    const at = (glyphY: number) => ({ box: { x: 0, y: 2766.57, width: 460, height: 23.39 }, renderedTextBox: { x: 0, y: glyphY, width: 460, height: 22 } })
    // hearingzone510.com's "We match…": glyphs 0.70px below the recorded top.
    expect(named(bundleAt(21, at(2767.27)))).toBe(true)
    // A whole-pixel offset is what a floored half-leading leaves: nothing to redo.
    expect(named(bundleAt(21, at(2768.57)))).toBe(false)
    expect(named(bundleAt(CAPTURE_SCHEMA, at(2767.27)))).toBe(false)
  })
})
