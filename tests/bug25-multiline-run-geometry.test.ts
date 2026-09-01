/**
 * BUG-25 — a multi-line text element splits into runs that must not share a box.
 *
 * Symptom (joyfulculinarycreations hero, `<h1>A<br>B</h1>`): the element split
 * into two runs, and both were handed the *element's* geometry — the same `box`
 * and the same `renderedTextBox`:
 *
 *   'Dreaming of healthier meals'  box={20,171.5,1240x301.6}  glyphs={20,311.3,815x172.4}
 *   'on your dinner table?'        box={20,171.5,1240x301.6}  glyphs={20,311.3,815x172.4}
 *
 * Two consequences, both verified here:
 *
 *  1. **Position.** A fold that positions runs absolutely has nothing to separate
 *     them by, so it printed one on top of the other
 *     (`ONDYEOAUMRIDNIGNNEROATHAEBALLTEHIER MEALS`).
 *  2. **Line count.** `nowrapFromPx` derives a run's line count from
 *     `renderedTextBox.height / lineHeightPx`. A shared glyph box describes the
 *     PAIR, so two one-line runs both measured two lines and neither was pinned.
 *
 * The fix reads geometry off the *text node* (a `Range` over the node itself)
 * whenever its element holds more than one run, and off the element — exactly as
 * before — when it holds one. So the common single-run case is untouched, and a
 * single text node that wraps stays ONE run whose glyph box spans its lines: the
 * wrap decision REQ-88 closed is not re-opened.
 *
 * The browser UATs drive a REAL headless Chromium against a committed fixture over
 * an ephemeral loopback server (no third-party site). The fold UAT pins the
 * downstream consequence with no browser at all.
 */
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
  type Capture,
  type ContentRun,
} from '../tools/generate/src/cli/capture'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])

const runByText = (c: Capture, text: string): ContentRun | undefined =>
  allRuns(c).find((r) => (r.text ?? '').trim() === text)

/** The fold's own line-count reading, restated so the UAT measures what it measures. */
const lineCount = (r: ContentRun | undefined): number | undefined => {
  const lh = r?.lineHeightPx
  const g = r?.renderedTextBox
  return lh && g ? Math.max(1, Math.round(g.height / lh)) : undefined
}

const HERO_A = 'Dreaming of healthier meals'
const HERO_B = 'on your dinner table?'

/** Capture the BUG-25 fixture once per UAT, over loopback. */
async function captureFixture(): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'bug25-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/bug25-multiline.html`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

describe('BUG-25 — per-run geometry for a multi-line text element', () => {
  // ── 1. The two hero runs are separated, in both boxes ────────────────────────
  itB('test_UAT_FC_BUG-25_multiline_runs_get_distinct_geometry', async () => {
    const capture = await captureFixture()
    const a = runByText(capture, HERO_A)
    const b = runByText(capture, HERO_B)
    expect(a, `hero run "${HERO_A}" captured`).toBeDefined()
    expect(b, `hero run "${HERO_B}" captured`).toBeDefined()

    // The bug: identical box AND identical glyph box. Both must now differ, and
    // differ *vertically* — the second line sits one line-height below the first.
    expect(a!.box).toBeDefined()
    expect(b!.box).toBeDefined()
    expect(b!.box!.y).toBeGreaterThan(a!.box!.y + 40)
    expect(a!.renderedTextBox).toBeDefined()
    expect(b!.renderedTextBox).toBeDefined()
    expect(b!.renderedTextBox!.y).toBeGreaterThan(a!.renderedTextBox!.y + 40)

    // Each run's box now bounds only its own line, not the element's two.
    expect(a!.box!.height).toBeLessThan(120)
    expect(b!.box!.height).toBeLessThan(120)
  }, 120000)

  // ── 2. No two runs report the same glyph box ────────────────────────────────
  itB('test_UAT_FC_BUG-25_no_two_runs_share_a_rendered_text_box', async () => {
    const capture = await captureFixture()
    const runs = allRuns(capture).filter((r) => r.renderedTextBox)
    expect(runs.length).toBeGreaterThan(3)
    // Runs whose SOURCE text differs may not report the same rect — that is the
    // shared-element signature the bug produced. (Band content and item content
    // legitimately restate the same run, so pair on text as well as rect.)
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const r of runs) {
      const g = r.renderedTextBox!
      const key = `${g.x}|${g.y}|${g.width}|${g.height}`
      const prior = seen.get(key)
      if (prior !== undefined && prior !== r.text) collisions.push(`${prior} ↔ ${r.text}`)
      else seen.set(key, r.text)
    }
    expect(collisions).toEqual([])
  }, 120000)

  // ── 3. A single-run element is untouched, and a wrapping run stays ONE run ──
  itB('test_UAT_FC_BUG-25_single_run_element_keeps_element_geometry', async () => {
    const capture = await captureFixture()

    // A block heading with one text node still reports its ELEMENT box — the full
    // container width — not its glyph extent. This is the no-regression control:
    // gigabytealchemy is entirely single-run headings.
    const h2 = runByText(capture, 'Single line heading')
    expect(h2?.box).toBeDefined()
    expect(h2!.box!.width).toBeGreaterThan(1000)
    expect(h2!.renderedTextBox!.width).toBeLessThan(h2!.box!.width - 100)

    // A single text node that WRAPS is still one run whose glyph box spans its
    // lines — capture does not split per line, so the renderer keeps the wrap.
    const para = runByText(capture, 'A variety of offerings to please everyone at the dinner table every day.')
    expect(para, 'wrapping paragraph captured as a single run').toBeDefined()
    expect(lineCount(para)).toBeGreaterThanOrEqual(3)
    expect(allRuns(capture).filter((r) => r.text.startsWith('A variety of offerings')).length).toBe(1)
  }, 120000)

  // ── 4. Line count is read per run, not per pair ─────────────────────────────
  itB('test_UAT_FC_BUG-25_line_count_is_measured_per_run', async () => {
    const capture = await captureFixture()
    // Before the fix both runs shared a two-line glyph box and read as 2 lines, so
    // `nowrapThreshold` refused to pin either. Each is one line; say so.
    expect(lineCount(runByText(capture, HERO_A))).toBe(1)
    expect(lineCount(runByText(capture, HERO_B))).toBe(1)

    // Two text nodes on the SAME line (split by an inline <em>) differ in x, not y
    // — the rule is "its own rect", not "one run per line".
    const lead = runByText(capture, 'Leading words')
    const trail = runByText(capture, 'trailing words')
    expect(lead?.box).toBeDefined()
    expect(trail?.box).toBeDefined()
    expect(trail!.box!.x).toBeGreaterThan(lead!.box!.x)
    expect(Math.abs(trail!.box!.y - lead!.box!.y)).toBeLessThan(4)
  }, 120000)

  // ── 5. The downstream consequence, with no browser ──────────────────────────
  it('test_UAT_FC_BUG-25_distinct_run_boxes_stack_and_pin_in_the_fold', () => {
    // Two one-line runs of a wrapped heading, each carrying its OWN line's
    // geometry — what capture now emits. The fold must stack them and, because
    // each measures one line at every width, pin both against re-wrapping.
    const LADDER = [1024, 1280, 1440]
    const line = (text: string, y: number, width: number): ValueElement =>
      ({
        role: 'heading',
        text,
        color: '#111111',
        fontFamily: 'Georgia, serif',
        fontSizePx: 64,
        fontWeight: 700,
        lineHeightPx: 80,
        box: { x: 20, y, width, height: 80 },
        renderedTextBox: { x: 20, y, width, height: 72 },
      }) as ValueElement

    const projections: StateProjection[] = LADDER.map((w) => ({
      engine: 'chromium',
      viewport: { width: w, height: 800 },
      state: 'rest',
      manifest: {
        source: `t:${w}`,
        elements: [line(HERO_A, 40, w - 480), line(HERO_B, 120, w - 900)],
        sections: [] as never,
        viewport: { width: w, height: 800 },
      },
    }))
    const ms: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }

    const nodes: Array<Record<string, unknown>> = []
    const walk = (n: Record<string, unknown>): void => {
      nodes.push(n)
      for (const c of (n.children as Array<Record<string, unknown>>) ?? []) walk(c)
    }
    walk(foldToL1(ms).root as never)
    const find = (t: string): Record<string, unknown> =>
      nodes.find((n) => n.kind === 'text' && n.text === t)!

    const a = find(HERO_A)
    const b = find(HERO_B)
    expect(a, 'first line folded to its own text node').toBeDefined()
    expect(b, 'second line folded to its own text node').toBeDefined()

    // Stacked, not overprinted.
    const yOf = (n: Record<string, unknown>): number =>
      ((n.geometry as { keyframes: Array<{ y: number }> }).keyframes[0]).y
    expect(yOf(b)).toBeGreaterThan(yOf(a))

    // …and each is pinned to one line, which a shared pair-height box could not do.
    expect((a.axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(LADDER[0])
    expect((b.axes as { nowrapFromPx?: number }).nowrapFromPx).toBe(LADDER[0])
  })
})
