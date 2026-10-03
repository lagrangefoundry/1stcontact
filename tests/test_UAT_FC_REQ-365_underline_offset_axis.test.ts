/**
 * REQ-365 — L1 can say where an underline sits.
 *
 * faelan.com's hero links "Musician" with `text-underline-offset: 4px`. L1's
 * only decoration field was the closed `textDecoration` enum of LINES, so the
 * reproduction painted the same underline at the engine's `auto` offset — 2px
 * high, the round's only ranked pixel region (score 333.89 of 333.89) — and the
 * comparator, which only compared the line enum, reported 0 deltas for it.
 *
 * Issue 1 (the ceiling): an `underlineOffsetPx` axis on a run, a text node and an
 * interaction state, bounded by the envelope, emitted as `text-underline-offset`,
 * recorded by the capture and carried through the fold.
 * Issue 2 (the instrument): the values-diff compares the placement, so a line in
 * the wrong place is a delta rather than silence.
 *
 * Everything but the last case is deterministic (validator, renderer, fold,
 * comparator, register). The extractor case needs a real Chromium and is skipped
 * where none can launch.
 */
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { l1PlainText, validateL1, type L1Document, type L1Node, type L1Text } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import { diffManifests, type ValueElement, type ValueManifest } from '../tools/generate/src/cli'
import {
  CAPTURE_COVERAGE,
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  chromiumAvailable,
  createPlaywrightDriver,
  staleCaptureAxes,
  type Capture,
  type MultiStateCapture,
  type RawRun,
  type RawSignals,
  type StateProjection,
} from '../tools/generate/src/cli/capture'

const WIDTHS = [320, 1280]
const SPOTIFY = 'https://open.spotify.com/artist/4YkpJkV28COxXYjbGUi0S9'

const docWith = (node: L1Node): L1Document => ({ widths: WIDTHS, root: { kind: 'box', children: [node] } })

/** The hero sentence as L1 writes it once the axis exists. */
const SENTENCE: L1Text = {
  kind: 'text',
  text: [
    { text: 'Artist • ' },
    { text: 'Musician', axes: { textDecoration: 'underline', underlineOffsetPx: 4 }, link: { href: SPOTIFY } },
    { text: ' • Creator' },
  ],
  axes: { fontSizePx: 24, color: '#ffffff' },
}

/** The CSS rule whose selector is exactly `selector`, as one string. */
function ruleFor(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`)
  expect(at, `a rule for ${selector}`).toBeGreaterThanOrEqual(0)
  return css.slice(at, css.indexOf('}', at))
}

describe('REQ-365 issue 1 — L1 expresses where an underline sits', () => {
  it('test_UAT_FC_REQ-365_the_envelope_admits_an_offset_on_a_run_a_text_node_and_a_hover_state', () => {
    expect(validateL1(docWith(SENTENCE)).ok).toBe(true)
    const node: L1Text = {
      kind: 'text',
      text: 'Read the story',
      axes: { textDecoration: 'underline', underlineOffsetPx: -2 },
      interaction: { hover: { textDecoration: 'underline', underlineOffsetPx: 6 } },
    }
    const res = validateL1(docWith(node))
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-365_an_offset_that_has_left_its_word_behind_is_refused_by_path', () => {
    const run: L1Text = {
      kind: 'text',
      text: [{ text: 'far', axes: { textDecoration: 'underline', underlineOffsetPx: 400 } }, { text: ' away' }],
    }
    const node: L1Text = {
      kind: 'text',
      text: 'far',
      axes: { textDecoration: 'underline', underlineOffsetPx: -101 },
      interaction: { hover: { underlineOffsetPx: 1000 } },
    }
    const doc: L1Document = { widths: WIDTHS, root: { kind: 'box', children: [run, node] } }
    const res = validateL1(doc)
    expect(res.ok).toBe(false)
    const paths = res.ok ? [] : res.errors.map((e) => e.path)
    expect(paths.some((p) => p.endsWith('/text/0/axes/underlineOffsetPx'))).toBe(true)
    expect(paths.some((p) => p.endsWith('/axes/underlineOffsetPx') && !p.includes('/text/'))).toBe(true)
    expect(paths.some((p) => p.endsWith('/hover/underlineOffsetPx'))).toBe(true)
  })

  it('test_UAT_FC_REQ-365_the_offset_is_a_number_never_a_css_string', () => {
    // Structured-only: the axis is a finite number, so a would-be declaration
    // break-out cannot even be spelled.
    const smuggled = {
      kind: 'text',
      text: [{ text: 'x', axes: { textDecoration: 'underline', underlineOffsetPx: '4px; background: url(x)' } }, { text: 'y' }],
    } as unknown as L1Text
    expect(validateL1(docWith(smuggled)).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-365_the_renderer_places_the_line_on_the_run_the_node_and_the_state', () => {
    // The run: its own rule carries the line AND where it sits.
    const { html, css } = renderL1Document(docWith(SENTENCE))
    const m = /<a class="([^"]+)"[^>]*>Musician<\/a>/.exec(html)
    expect(m, 'the linked run is an anchor with its own class').not.toBeNull()
    const runRule = ruleFor(css, `.${m![1]}`)
    expect(runRule).toContain('text-decoration: underline')
    expect(runRule).toContain('text-underline-offset: 4px')
    // ...and the runs either side, which declare nothing, place nothing.
    expect(css.match(/text-underline-offset/g)).toHaveLength(1)

    // The node and its hover state.
    const node: L1Text = {
      kind: 'text',
      text: 'Read the story',
      axes: { textDecoration: 'underline', underlineOffsetPx: 3 },
      interaction: { hover: { underlineOffsetPx: 6 } },
    }
    const out = renderL1Document(docWith(node)).css
    expect(out).toContain('text-underline-offset: 3px')
    expect(out).toContain('text-underline-offset: 6px')

    // Absent is the engine's own `auto`: nothing is emitted.
    const plain = renderL1Document(docWith({ kind: 'text', text: 'x', axes: { textDecoration: 'underline' } })).css
    expect(plain).not.toContain('text-underline-offset')
  })
})

// ── the fold: capture → L1 ───────────────────────────────────────────────────

const INLINE_BOX = { x: 102.39, y: 168, width: 267.64, height: 36 }
function word(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#ffffff',
    fontFamily: 'Inter',
    fontSizePx: 24,
    fontWeight: 400,
    lineHeightPx: 36,
    textDecoration: null,
    underlineOffsetPx: null,
    inlineGroup: 'f1:0',
    inlineBox: INLINE_BOX,
    ...over,
  } as ValueElement
}

/** faelan.com's hero sentence as a schema-13 capture records it. */
function sentence(): ValueElement[] {
  return [
    word({ text: 'Artist •', textFlow: 'Artist • ', inlineIndex: 0, box: { x: 102.39, y: 172, width: 76.78, height: 28 } }),
    word({
      text: 'Musician',
      textFlow: 'Musician',
      inlineIndex: 1,
      box: { x: 179.17, y: 168, width: 93.3, height: 36 },
      textDecoration: 'underline',
      underlineOffsetPx: 4,
      href: SPOTIFY,
      a11yRole: 'link',
    }),
    word({ text: '• Creator', textFlow: ' • Creator', inlineIndex: 2, box: { x: 272.47, y: 172, width: 97.56, height: 28 } }),
  ]
}

function captureOf(elements: ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = [320, 768, 1280].map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `faelan@${width}`, viewport: { width, height: 900 }, sections: [], elements },
  })) as never
  return { url: 'http://faelan.test/', notes: [], projections } as never
}

function textNodes(doc: L1Document): L1Text[] {
  const out: L1Text[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    for (const c of (n as { children?: L1Node[] }).children ?? []) walk(c)
  }
  walk(doc.root)
  return out
}

describe('REQ-365 issue 1 — the fold carries the captured offset', () => {
  it('test_UAT_FC_REQ-365_the_linked_run_carries_its_offset_into_l1_and_onto_the_page', () => {
    const doc = foldToL1(captureOf(sentence()))
    expect(validateL1(doc).ok).toBe(true)
    const node = textNodes(doc).find((n) => l1PlainText(n.text).includes('Musician'))!
    const runs = node.text as Array<{ text: string; axes?: { textDecoration?: string; underlineOffsetPx?: number } }>
    expect(runs[1].axes?.textDecoration).toBe('underline')
    expect(runs[1].axes?.underlineOffsetPx).toBe(4)
    // The words either side underline nothing and so place nothing.
    expect(runs[0].axes?.underlineOffsetPx).toBeUndefined()
    expect(runs[2].axes?.underlineOffsetPx).toBeUndefined()
    expect(renderL1Document(doc).css).toContain('text-underline-offset: 4px')
  })

  it('test_UAT_FC_REQ-365_an_underlined_node_carries_its_offset_and_auto_carries_none', () => {
    const lone = (offset: number | null): ValueElement =>
      word({
        text: 'Read the story',
        inlineGroup: undefined,
        inlineBox: undefined,
        box: { x: 20, y: 40, width: 180, height: 36 },
        textDecoration: 'underline',
        underlineOffsetPx: offset,
      })
    const placed = textNodes(foldToL1(captureOf([lone(4)]))).find((n) => l1PlainText(n.text) === 'Read the story')!
    expect(placed.axes?.underlineOffsetPx).toBe(4)
    const auto = textNodes(foldToL1(captureOf([lone(null)]))).find((n) => l1PlainText(n.text) === 'Read the story')!
    expect(auto.axes?.textDecoration).toBe('underline')
    expect(auto.axes?.underlineOffsetPx).toBeUndefined()
  })
})

// ── issue 2: the comparator sees the placement ───────────────────────────────

const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })
const link = (offset: number | null | undefined): ValueElement => ({
  role: 'link',
  text: 'Musician',
  color: '#ffffff',
  fontFamily: 'Inter',
  fontSizePx: 24,
  fontWeight: 400,
  textDecoration: 'underline',
  underlineOffsetPx: offset,
})
const offsetDeltas = (ref: number | null | undefined, act: number | null | undefined) =>
  diffManifests(mani('ref', [link(ref)]), mani('act', [link(act)])).deltas.filter(
    (d) => d.property === 'underlineOffsetPx',
  )

describe('REQ-365 issue 2 — the values-diff compares where a line sits', () => {
  it('test_UAT_FC_REQ-365_a_line_at_auto_against_a_declared_offset_is_a_delta', () => {
    const ds = offsetDeltas(4, null)
    expect(ds).toHaveLength(1)
    expect(ds[0].expected).toBe('4px')
    expect(ds[0].actual).toBe('auto')
    // A different declared offset is a delta too, with its size.
    const by = offsetDeltas(4, 2)
    expect(by).toHaveLength(1)
    expect(by[0].actual).toBe('2px')
  })

  it('test_UAT_FC_REQ-365_agreeing_or_unrecorded_offsets_report_nothing', () => {
    expect(offsetDeltas(4, 4)).toHaveLength(0)
    expect(offsetDeltas(4, 4.25), 'within half a pixel').toHaveLength(0)
    expect(offsetDeltas(null, null)).toHaveLength(0)
    // A pre-13 bundle never recorded the axis: skipped, not compared against a default.
    expect(offsetDeltas(undefined, 2)).toHaveLength(0)
  })
})

// ── the capture's register and schema stamp ──────────────────────────────────

const bundleAt = (schema: number, runs: Array<Record<string, unknown>>): Capture =>
  ({
    url: 'https://example.test/',
    host: 'example.test',
    path: '/',
    capturedAt: '2026-10-03T00:00:00.000Z',
    captureSchema: schema,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null, subScales: {} },
    sections: [{ content: runs, items: [] }],
    assets: [],
  }) as unknown as Capture

describe('REQ-365 — the capture records the offset and says so', () => {
  it('test_UAT_FC_REQ-365_the_register_calls_text_underline_offset_recorded', () => {
    const entry = CAPTURE_COVERAGE.get('text-underline-offset')!
    expect(entry.verdict).toBe('recorded')
    expect(entry.present?.(bundleAt(CAPTURE_SCHEMA, [{ underlineOffsetPx: 4 }]))).toBe(true)
    expect(entry.present?.(bundleAt(CAPTURE_SCHEMA, [{ underlineOffsetPx: null }]))).toBe(false)
  })

  it('test_UAT_FC_REQ-365_a_bundle_taken_before_the_axis_is_named_stale_for_it', () => {
    expect(CAPTURE_SCHEMA).toBeGreaterThanOrEqual(13)
    const named = (c: Capture): boolean => staleCaptureAxes(c).some((a) => a.axis.includes('underlineOffsetPx'))
    expect(named(bundleAt(12, [{ textDecoration: 'underline' }]))).toBe(true)
    // A pre-13 stamp on a bundle that demonstrably carries the key is not.
    expect(named(bundleAt(12, [{ textDecoration: 'underline', underlineOffsetPx: null }]))).toBe(false)
  })
})

// ── the extractor, in a real browser ─────────────────────────────────────────

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

describe('REQ-365 — the extractor reads the computed offset', () => {
  it.runIf(browserOk)('test_UAT_FC_REQ-365_the_extractor_records_a_declared_offset_and_null_for_auto', async () => {
    const signals = await rawSignals('req365-underline-offset.html')
    const runs: RawRun[] = signals.bands.flatMap((b) => [...b.content, ...b.items.flat()])
    const named = (t: string): RawRun => runs.find((r) => r.text.startsWith(t))!
    expect(named('Musician').textDecoration).toBe('underline')
    expect(named('Musician').underlineOffsetPx).toBe(4)
    expect(named('Read the story').textDecoration).toBe('underline')
    expect(named('Read the story').underlineOffsetPx).toBeNull()
    expect(named('Artist').underlineOffsetPx).toBeNull()
  })
})
