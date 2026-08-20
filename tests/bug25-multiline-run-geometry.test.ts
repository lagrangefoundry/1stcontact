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
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  type Capture,
  type ContentRun,
  type RawSignals,
} from '../tools/generate/src/cli/capture'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli'

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
    const { capture } = await cmdCapturePage(`${server.origin}/bug25-multiline.html`, { cwd })
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── The two-branch rule itself, browser-free ─────────────────────────────────

/**
 * AC-1310's rule is "measure off the element when it holds ONE run, off the text
 * node when it holds several". That decision is made in `EXTRACT_SCRIPT`, so it
 * runs under jsdom — which has no layout engine, so this harness supplies the
 * layout (per-element rects, and per-text-node rects for the `Range` the rule
 * reads). Only the *layout numbers* are stubbed, exactly as the sibling BUG-15 /
 * REQ-63 harnesses do; the branch under test is the shipped code path.
 *
 * This keeps the criterion proved on a runner with no Chromium, where the browser
 * UATs above skip.
 */
describe('BUG-25 — the two-branch geometry rule (EXTRACT_SCRIPT under jsdom)', () => {
  type Box = [x: number, y: number, w: number, h: number]
  const rect = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

  /**
   * Run EXTRACT_SCRIPT with layout supplied two ways: element rects by class, and
   * Range rects by the trimmed text the Range covers (which is how the browser
   * distinguishes one text node's painted line from its sibling's).
   */
  function extract(
    html: string,
    boxByClass: Record<string, Box>,
    boxByRangeText: Record<string, Box>,
  ): RawSignals {
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
    dom.window.Element.prototype.getBoundingClientRect = function () {
      const cls = (this as Element).className || ''
      const b = boxByClass[cls]
      return b ? rect(...b) : rect(0, 0, 0, 0)
    }
    dom.window.Range.prototype.getBoundingClientRect = function () {
      const b = boxByRangeText[(this as Range).toString().replace(/\s+/g, ' ').trim()]
      return b ? rect(...b) : rect(0, 0, 0, 0)
    }
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
    const win = dom.window as unknown as { eval(s: string): unknown }
    return win.eval(EXTRACT_SCRIPT) as RawSignals
  }

  /** A hero whose h1 is split by a <br>, plus a single-run heading below it. */
  const SPLIT_PAGE =
    '<!doctype html><html><body>' +
    '<section class="band">' +
    `<h1 class="hero" style="line-height: 64px">${HERO_A}<br>${HERO_B}</h1>` +
    '<h2 class="solo" style="line-height: 40px">Single line heading</h2>' +
    '</section></body></html>'

  const ELEMENT_BOXES: Record<string, Box> = {
    band: [0, 0, 1280, 400],
    hero: [20, 100, 1240, 128], // the SHARED element box — two lines tall
    solo: [20, 260, 1240, 40],
  }
  const RANGE_BOXES: Record<string, Box> = {
    [HERO_A]: [20, 100, 815, 64], // line one
    [HERO_B]: [20, 164, 620, 64], // line two, one line-height below
    [`${HERO_A} ${HERO_B}`]: [20, 100, 815, 128], // the element's own contents
    'Single line heading': [20, 262, 430, 36],
  }

  const runOf = (sig: RawSignals, text: string) =>
    sig.bands.flatMap((b) => b.content).find((r) => r.text.trim() === text)

  it('test_UAT_AC1310_a_split_element_yields_one_run_per_text_node_each_with_its_own_box', () => {
    const sig = extract(SPLIT_PAGE, ELEMENT_BOXES, RANGE_BOXES)
    const a = runOf(sig, HERO_A)
    const b = runOf(sig, HERO_B)
    expect(a, `run "${HERO_A}" captured`).toBeDefined()
    expect(b, `run "${HERO_B}" captured`).toBeDefined()

    // The bug: both runs handed the element's box. Each must now carry its OWN
    // line's rect, differing vertically by one line-height.
    expect(a!.box).not.toEqual(b!.box)
    expect(b!.box!.y).toBe(a!.box!.y + 64)
    expect(a!.renderedTextBox).not.toEqual(b!.renderedTextBox)
    expect(b!.renderedTextBox!.y).toBe(a!.renderedTextBox!.y + 64)
    // …and neither is the shared two-line element box.
    expect(a!.box!.height).toBe(64)
    expect(a!.box!.height).not.toBe(ELEMENT_BOXES.hero[3])
  })

  it('test_UAT_AC1310_a_single_run_element_is_still_measured_off_the_element', () => {
    // The no-regression branch: one run ⇒ the box is the ELEMENT's (full container
    // width), with the glyph extent measured separately and narrower.
    const sig = extract(SPLIT_PAGE, ELEMENT_BOXES, RANGE_BOXES)
    const solo = runOf(sig, 'Single line heading')
    expect(solo?.box).toEqual({ x: 20, y: 260, width: 1240, height: 40 })
    expect(solo!.renderedTextBox!.width).toBeLessThan(solo!.box!.width)
  })

  it('test_UAT_AC1310_two_runs_whose_elements_share_a_rect_still_record_identical_boxes', () => {
    // The rule is "its own rect", not "always differ": two single-run elements that
    // genuinely occupy the same rect must still report the same box, or the axis
    // would fabricate a difference where the render shows none.
    const sig = extract(
      '<!doctype html><html><body><section class="band">' +
        '<p class="twinA">Alpha</p><p class="twinB">Beta</p>' +
        '</section></body></html>',
      { band: [0, 0, 1280, 400], twinA: [20, 100, 600, 40], twinB: [20, 100, 600, 40] },
      { Alpha: [20, 100, 90, 36], Beta: [20, 100, 90, 36] },
    )
    expect(runOf(sig, 'Alpha')!.box).toEqual(runOf(sig, 'Beta')!.box)
  })

  it('test_UAT_AC1310_each_split_run_derives_a_line_count_of_one_from_its_own_box', () => {
    // The second downstream consequence: nowrapFromPx reads
    // renderedTextBox.height / lineHeightPx. Off the SHARED box both one-line runs
    // measured 2 lines and neither could be pinned; off their own boxes each is 1.
    const sig = extract(SPLIT_PAGE, ELEMENT_BOXES, RANGE_BOXES)
    const lines = (text: string) => {
      const r = runOf(sig, text)!
      return Math.max(1, Math.round(r.renderedTextBox!.height / r.lineHeightPx!))
    }
    expect(lines(HERO_A)).toBe(1)
    expect(lines(HERO_B)).toBe(1)
    // The shared element box would have read 2 — that is the value being avoided.
    expect(Math.round(ELEMENT_BOXES.hero[3] / 64)).toBe(2)
  })
})

describe('BUG-25 — per-run geometry for a multi-line text element', () => {
  // ── 1. The two hero runs are separated, in both boxes ────────────────────────
  itB('test_UAT_AC1310_multiline_runs_get_distinct_geometry', async () => {
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
  itB('test_UAT_AC1310_no_two_runs_share_a_rendered_text_box', async () => {
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
  itB('test_UAT_AC1310_single_run_element_keeps_element_geometry', async () => {
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
  itB('test_UAT_AC1310_line_count_is_measured_per_run', async () => {
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
  it('test_UAT_AC1310_distinct_run_boxes_stack_and_pin_in_the_fold', () => {
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
