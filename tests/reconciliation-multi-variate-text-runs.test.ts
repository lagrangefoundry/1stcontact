/**
 * Reconciliation UATs — story-1e340c9a "Multi-variate text runs: one string of
 * L1 page text can vary within itself" (REQ-211, BUNDLE-41).
 *
 * One UAT per acceptance criterion:
 *
 *   AC-2443  a plain-string text node validates and renders exactly as before
 *   AC-2444  a run-array node validates; each varying run renders with its own axes
 *   AC-2445  the run form is closed: nesting, links, off-subset axes refused
 *   AC-2446  a one-element (or empty) run array is refused
 *   AC-2447  a run with no axes renders as bare text with no span
 *   AC-2448  run axes are bounded by the L1 envelope; superscript values admitted
 *   AC-2449  capture records inline-flow membership; <br>/blockified child end a flow  (browser)
 *   AC-2450  a varying captured flow folds to one multi-run node in the flow root's box
 *   AC-2451  a flow that varies in nothing (or only in baseline) stays separate nodes
 *   AC-2452  a rejoined node takes its axes from the longest run, ties to the earlier
 *   AC-2453  the fidelity oracle and round-trip manifest agree with the fold
 *   AC-2454  the editor opens a multi-run node as Text 1…N plain strings, no run axes
 *   AC-2455  editing one run's field changes only that run's words
 *   AC-2456  a copy field addressing no run is refused, naming it, with no partial write
 *   AC-2457  text-height estimation over runs is consistent with the one-run copy
 *
 * Everything except AC-2449 (and the real-browser leg of AC-2453) is deterministic
 * — validator, emitter, fold, oracle, editor derivation, estimator — and runs on
 * any runner. The browser legs skip cleanly when Chromium is unavailable.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyCopyFields,
  copyFieldsOf,
  l1PlainText,
  L1_ENVELOPE,
  validateL1,
  type L1Document,
  type L1Node,
  type L1Text,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { chromiumAvailable, cmdCapturePage, type Capture, type ContentRun } from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import {
  captureL1,
  diffManifests,
  engineAvailable,
  expectedTextManifest,
  foldToL1,
  roundTripReport,
} from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli'
import { evaluateLayout, oracleBoxes } from '../tools/generate/src/l1/probes'

type Runs = Exclude<L1Text['text'], string>

const WIDTHS = [320, 1280]

function docWith(node: L1Node, widths: number[] = WIDTHS): L1Document {
  return { widths, root: { kind: 'box', children: [node] } }
}

function heading(text: L1Text['text']): L1Text {
  return {
    kind: 'text',
    text,
    axes: { color: '#1a3a6b', fontFamily: 'Satoshi', fontSizePx: 62, fontWeight: 800 },
  } as L1Text
}

function validates(node: L1Node): boolean {
  return validateL1(docWith(node)).ok
}

function renderValid(node: L1Node): { html: string; css: string } {
  const res = validateL1(docWith(node))
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(docWith(node))
}

/** The CSS rule (declarations) for a class, or '' if none. */
function ruleFor(css: string, cls: string): string {
  return css.split('}').find((r) => r.includes(`.${cls}`)) ?? ''
}

// ── AC-2443 ─────────────────────────────────────────────────────────────────────

describe('AC-2443 a plain-string text node validates and renders as before runs existed', () => {
  it('test_UAT_AC2443_plain_string_node_validates_and_renders_without_run_spans', () => {
    const node = heading('1st Contact')
    const res = validateL1(docWith(node))
    expect(res.ok).toBe(true)

    const { html } = renderL1Document(docWith(node))
    // The words appear exactly once, as the node's direct text, with no span.
    expect(html.split('1st Contact').length - 1).toBe(1)
    expect(html).toContain('>1st Contact<')
    expect(html).not.toContain('<span')
    expect(html).not.toMatch(/-r\d+"/)
  })
})

// ── AC-2444 ─────────────────────────────────────────────────────────────────────

describe('AC-2444 a run-array node validates and each varying run carries its own axes', () => {
  it('test_UAT_AC2444_each_varying_run_is_a_span_styled_with_exactly_its_axes', () => {
    const runs: Runs = [
      { text: 'Hello ' },
      { text: 'world', axes: { color: '#e76f51', fontWeight: 700 } },
      { text: 'st', axes: { sizeScale: 0.6, baselineShiftEm: 0.4, fontStyle: 'italic' } },
    ]
    const { html, css } = renderValid(heading(runs))

    // Words in order, concatenated byte-for-byte once the run spans are removed.
    const text = html.replace(/<[^>]+>/g, '')
    expect(text).toContain('Hello worldst')

    const classes = [...html.matchAll(/<span class="([^"]+)"/g)].map((m) => m[1])
    expect(classes.length).toBe(2)
    expect(html).toMatch(/<span class="[^"]+">world<\/span>/)
    expect(html).toMatch(/<span class="[^"]+">st<\/span>/)

    const worldCls = /<span class="([^"]+)">world<\/span>/.exec(html)![1]
    const stCls = /<span class="([^"]+)">st<\/span>/.exec(html)![1]
    const world = ruleFor(css, worldCls)
    const st = ruleFor(css, stCls)

    expect(world).toContain('color: #e76f51')
    expect(world).toContain('font-weight: 700')
    // Exactly its axes: nothing it did not declare.
    expect(world).not.toContain('font-size')
    expect(world).not.toContain('vertical-align')

    expect(st).toContain('font-size: 0.6em')
    expect(st).toContain('vertical-align: 0.4em')
    expect(st).toContain('font-style: italic')
    expect(st).not.toContain('transform')
    expect(st).not.toContain('color:')
  })
})

// ── AC-2445 ─────────────────────────────────────────────────────────────────────

describe('AC-2445 the run form is closed', () => {
  it('test_UAT_AC2445_nesting_links_and_off_subset_axes_are_refused', () => {
    const cases: Array<[string, unknown]> = [
      ['nested run', [{ text: 'a' }, { text: [{ text: 'b' }, { text: 'c' }] }]],
      ['run with a link key', [{ text: 'a' }, { text: 'b', link: { href: '/x' } }]],
      ['run with an href key', [{ text: 'a' }, { text: 'b', href: '/x' }]],
      ['fontFamily axis', [{ text: 'a' }, { text: 'b', axes: { fontFamily: 'Satoshi' } }]],
      ['align axis', [{ text: 'a' }, { text: 'b', axes: { textAlign: 'center' } }]],
      ['letterSpacing axis', [{ text: 'a' }, { text: 'b', axes: { letterSpacingPx: 2 } }]],
      ['absolute pixel size', [{ text: 'a' }, { text: 'b', axes: { fontSizePx: 30 } }]],
    ]
    for (const [label, text] of cases) {
      expect(validates({ kind: 'text', text } as unknown as L1Node), label).toBe(false)
    }
    // Control: the same shape within the subset validates.
    expect(
      validates({
        kind: 'text',
        text: [{ text: 'a' }, { text: 'b', axes: { color: '#000000', fontStyle: 'italic' } }],
      } as unknown as L1Node),
    ).toBe(true)
  })
})

// ── AC-2446 ─────────────────────────────────────────────────────────────────────

describe('AC-2446 one spelling of single-run copy', () => {
  it('test_UAT_AC2446_one_element_and_empty_run_arrays_are_refused', () => {
    const t = (text: unknown): L1Node => ({ kind: 'text', text }) as unknown as L1Node
    expect(validates(t([{ text: 'x' }]))).toBe(false)
    expect(validates(t([{ text: 'x', axes: { fontWeight: 700 } }]))).toBe(false)
    expect(validates(t([]))).toBe(false)
    expect(validates(t([{ text: 'x' }, { text: 'y', axes: { fontWeight: 700 } }]))).toBe(true)
  })
})

// ── AC-2447 ─────────────────────────────────────────────────────────────────────

describe('AC-2447 a run with no axes renders as bare text', () => {
  it('test_UAT_AC2447_unstyled_runs_are_direct_text_and_only_the_varying_run_is_spanned', () => {
    const plain = renderValid(heading('Serving real food'))

    for (const lastAxes of [undefined, {}]) {
      const runs = [
        { text: 'Serving ' },
        { text: 'real', axes: { color: '#e76f51' } },
        lastAxes === undefined ? { text: ' food' } : { text: ' food', axes: lastAxes },
      ] as Runs
      const { html } = renderValid(heading(runs))

      const spans = [...html.matchAll(/<span class="[^"]+">([^<]*)<\/span>/g)]
      expect(spans.length, `axes=${JSON.stringify(lastAxes)}`).toBe(1)
      expect(spans[0][1]).toBe('real')
      // First and last runs are direct text of the node, not wrapped.
      expect(html).toMatch(/>Serving <span/)
      expect(html).toMatch(/<\/span> food</)
      // The markup is the plain-string markup plus exactly one span.
      expect(html.replace(/<span class="[^"]+">/, '').replace('</span>', '')).toBe(plain.html)
    }
  })
})

// ── AC-2448 ─────────────────────────────────────────────────────────────────────

describe('AC-2448 run axes are bounded by the L1 envelope', () => {
  it('test_UAT_AC2448_out_of_range_run_axes_fail_naming_the_axis_and_bounds_pass', () => {
    const check = (axes: Record<string, unknown>) =>
      validateL1(docWith({ kind: 'text', text: [{ text: 'a' }, { text: 'b', axes }] } as unknown as L1Node))

    const { min: wMin, max: wMax } = L1_ENVELOPE.fontWeight
    const refused: Array<[Record<string, unknown>, string]> = [
      [{ sizeScale: 0.05 }, 'sizeScale'],
      [{ sizeScale: 9 }, 'sizeScale'],
      [{ baselineShiftEm: -11 }, 'baselineShiftEm'],
      [{ baselineShiftEm: 11 }, 'baselineShiftEm'],
      [{ fontWeight: wMax + 1 }, 'fontWeight'],
    ]
    for (const [axes, axis] of refused) {
      const res = check(axes)
      expect(res.ok, JSON.stringify(axes)).toBe(false)
      if (!res.ok) {
        const msg = JSON.stringify(res.errors)
        expect(msg, JSON.stringify(axes)).toContain(axis)
      }
    }
    // The landed envelope messages state the permitted range.
    const scale = check({ sizeScale: 9 })
    expect(!scale.ok && JSON.stringify(scale.errors)).toContain('[0.1, 8]')
    const shift = check({ baselineShiftEm: 11 })
    expect(!shift.ok && JSON.stringify(shift.errors)).toContain('[-10, 10]')

    const admitted: Array<Record<string, unknown>> = [
      { sizeScale: 0.6, baselineShiftEm: 0.4, fontWeight: 700 },
      { sizeScale: 0.1 },
      { sizeScale: 8 },
      { baselineShiftEm: -10 },
      { baselineShiftEm: 10 },
      { fontWeight: wMin },
      { fontWeight: wMax },
    ]
    for (const axes of admitted) {
      const res = check(axes)
      expect(res.ok, `${JSON.stringify(axes)} ${res.ok ? '' : JSON.stringify(res.errors)}`).toBe(true)
    }
  })
})

// ── AC-2449 (browser) ───────────────────────────────────────────────────────────

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

const itBrowser = it.runIf(await chromiumAvailable())

describe('AC-2449 capture records which text runs share an inline flow', () => {
  itBrowser(
    'test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it',
    async () => {
      const server = await serveDir(FIXTURES)
      const cwd = mkdtempSync(path.join(tmpdir(), 'ac2449-'))
      let c: Capture
      try {
        c = (await cmdCapturePage(`${server.origin}/req211-inline-runs.html`, fsReferenceStore(cwd))).capture
      } finally {
        await server.close()
        rmSync(cwd, { recursive: true, force: true })
      }

      // One sentence: shared flow id, ascending positions, the root's rect.
      const sentence = ['Serving', 'real', 'food'].map((t) => runByText(c, t))
      expect(sentence.every(Boolean)).toBe(true)
      const flowId = sentence[0]!.inlineGroup
      expect(flowId).toBeTruthy()
      expect(sentence.map((r) => r!.inlineGroup)).toEqual([flowId, flowId, flowId])
      const idx = sentence.map((r) => r!.inlineIndex!)
      expect(idx[0]).toBeLessThan(idx[1])
      expect(idx[1]).toBeLessThan(idx[2])
      expect(sentence[1]!.inlineBox).toEqual(sentence[0]!.inlineBox)
      expect(sentence[0]!.inlineBox!.width).toBeGreaterThan(sentence[0]!.box!.width)
      // Own separating spaces kept on the flow text; vertical alignment recorded.
      expect(sentence[0]!.textFlow).toBe('Serving ')
      expect(runByText(c, '19')?.verticalAlign).toBe('super')

      // A <br> starts a new flow.
      const first = runByText(c, 'First captured line')
      const second = runByText(c, 'second captured line')
      expect(first?.inlineGroup).toBeDefined()
      expect(second?.inlineGroup).toBeDefined()
      expect(second!.inlineGroup).not.toBe(first!.inlineGroup)

      // A flex row's blockified links are not one flow.
      const links = ['Home', 'About', 'Contact'].map((t) => runByText(c, t))
      const groups = links.map((l) => l?.inlineGroup).filter((g) => g !== undefined)
      expect(new Set(groups).size).toBe(groups.length)
    },
    120000,
  )
})

// ── Hand-built captures for the fold / oracle ACs (AC-2450..2453) ──────────────

const LADDER = [375, 1280]
const flowBox = (width: number) => ({ x: 20, y: 100, width: width - 40, height: 60 })

function run(
  width: number,
  group: string,
  index: number,
  text: string,
  textFlow: string,
  over: Partial<ValueElement> = {},
  y = 100,
  box = flowBox(width),
): ValueElement {
  return {
    text,
    role: 'heading',
    color: '#111827',
    fontFamily: 'Georgia',
    fontSizePx: 48,
    fontWeight: 700,
    box: { x: 20 + index * 120, y, width: 110, height: 60 },
    inlineGroup: group,
    inlineIndex: index,
    inlineBox: { ...box, y },
    textFlow,
    ...over,
  }
}

function captureOf(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1000 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1000 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A varying headline: an italic word, a coloured bolder word, a lifted ordinal. */
const varying = (w: number): ValueElement[] => [
  run(w, 'f1:0', 0, 'Serving', 'Serving '),
  run(w, 'f1:0', 1, 'real', 'real', { fontStyle: 'italic' }),
  run(w, 'f1:0', 2, 'food', ' food since ', { color: '#e76f51', fontWeight: 800 }),
  run(w, 'f1:0', 3, '19', '19', { fontSizePx: 29, verticalAlign: 'super' }),
  run(w, 'f1:0', 4, '92', '92'),
]

/** Two runs of identical type. */
const uniform = (w: number): ValueElement[] => [
  run(w, 'f2:0', 0, 'Plain words', 'Plain words ', { role: 'body', fontSizePx: 20, fontWeight: 400 }, 300),
  run(w, 'f2:0', 1, 'and more of them', 'and more of them', { role: 'body', fontSizePx: 20, fontWeight: 400 }, 300),
]

/** Two runs that differ ONLY in vertical alignment. */
const liftedOnly = (w: number): ValueElement[] => [
  run(w, 'f3:0', 0, 'Raised flow lead', 'Raised flow lead ', { role: 'body', fontSizePx: 20, fontWeight: 400 }, 500),
  run(w, 'f3:0', 1, 'lifted tail', 'lifted tail', { role: 'body', fontSizePx: 20, fontWeight: 400, verticalAlign: 'super' }, 500),
]

function textLeaves(doc: L1Document): L1Text[] {
  const out: L1Text[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
  }
  walk(doc.root)
  return out
}

const stripFlow = (els: ValueElement[]): ValueElement[] =>
  els.map((e) => {
    const { inlineGroup: _g, inlineIndex: _i, inlineBox: _b, textFlow: _t, ...rest } = e
    return rest as ValueElement
  })

// ── AC-2450 ─────────────────────────────────────────────────────────────────────

describe('AC-2450 a varying captured flow folds to one multi-run node', () => {
  it('test_UAT_AC2450_varying_flow_is_one_run_array_node_in_the_flow_roots_rect_without_nowrap', () => {
    const doc = foldToL1(captureOf(varying))
    const leaves = textLeaves(doc)

    const fragments = ['Serving', 'real', 'food', '19', '92']
    const holders = leaves.filter((n) => fragments.some((f) => l1PlainText(n.text).includes(f)))
    expect(holders.length, 'one node replaces the fragments').toBe(1)
    const node = holders[0]

    expect(Array.isArray(node.text)).toBe(true)
    const runs = node.text as Runs
    expect(runs.map((r) => r.text).join('')).toBe('Serving real food since 1992')
    expect(runs.some((r) => r.axes !== undefined)).toBe(true)
    expect(runs[2].axes).toMatchObject({ color: '#e76f51', fontWeight: 800 })
    expect(runs[1].axes).toEqual({ fontStyle: 'italic' })

    // Geometry is the flow root's rect at every captured width.
    const kfs = node.geometry!.keyframes
    expect(kfs.map((k) => k.at)).toEqual(LADDER)
    for (const kf of kfs) {
      const box = flowBox(kf.at)
      expect({ x: kf.x, y: kf.y, width: kf.width }).toEqual({ x: box.x, y: box.y, width: box.width })
    }
    // No no-wrap width pin.
    expect((node.axes as Record<string, unknown> | undefined)?.nowrapFromPx).toBeUndefined()
  })
})

// ── AC-2451 ─────────────────────────────────────────────────────────────────────

describe('AC-2451 a flow that varies in nothing stays separate nodes', () => {
  it('test_UAT_AC2451_uniform_and_baseline_only_flows_fold_as_without_flow_information', () => {
    const withFlow = (w: number) => [...uniform(w), ...liftedOnly(w)]
    const texts = ['Plain words', 'and more of them', 'Raised flow lead', 'lifted tail']

    const pick = (doc: L1Document) =>
      textLeaves(doc).filter((n) => texts.some((t) => l1PlainText(n.text).includes(t)))

    const folded = pick(foldToL1(captureOf(withFlow)))
    expect(folded.length).toBe(4)
    expect(folded.every((n) => typeof n.text === 'string')).toBe(true)
    expect(folded.map((n) => n.text).sort()).toEqual([...texts].sort())

    // Exactly as the fold emits them with no flow information at all.
    const baseline = pick(foldToL1(captureOf((w) => stripFlow(withFlow(w)))))
    expect(folded).toEqual(baseline)
  })
})

// ── AC-2452 ─────────────────────────────────────────────────────────────────────

describe('AC-2452 a rejoined node takes its axes from the longest run', () => {
  it('test_UAT_AC2452_node_axes_come_from_the_longest_run_and_ties_go_to_the_earlier', () => {
    // A short emphasised lead in a different face, then a long plain run.
    const shortLead = (w: number): ValueElement[] => [
      run(w, 'g1:0', 0, 'New', 'New ', { fontFamily: 'Satoshi', fontStyle: 'italic', textAlign: 'left' }),
      run(w, 'g1:0', 1, 'seasonal menu every week', 'seasonal menu every week', {
        fontFamily: 'Georgia',
        textAlign: 'center',
        fontSizePx: w === 1280 ? 48 : 32,
      }),
    ]
    const long = textLeaves(foldToL1(captureOf(shortLead))).find((n) =>
      l1PlainText(n.text).includes('seasonal'),
    )!
    expect(Array.isArray(long.text)).toBe(true)
    expect(long.axes?.fontFamily).toBe('Georgia')
    expect(long.axes?.textAlign).toBe('center')
    expect(long.axes?.fontStyle).toBeUndefined()
    // The per-width size track is the long run's (32 → 48), not the lead's.
    const track = long.responsive?.fontSizePx
    expect(track, 'per-width size track').toBeDefined()
    expect(JSON.stringify(track)).toContain('32')
    // The short lead carries its own slope as a run axis.
    expect((long.text as Runs)[0].axes?.fontStyle).toBe('italic')

    // Two equally long runs: the earlier one carries the node.
    const tie = (w: number): ValueElement[] => [
      run(w, 'g2:0', 0, 'alpha', 'alpha ', { fontFamily: 'Satoshi', color: '#222222' }),
      run(w, 'g2:0', 1, 'gamma', 'gamma', { fontFamily: 'Georgia', color: '#e76f51' }),
    ]
    const tied = textLeaves(foldToL1(captureOf(tie))).find((n) => l1PlainText(n.text).includes('alpha'))!
    expect(Array.isArray(tied.text)).toBe(true)
    expect(tied.axes?.fontFamily).toBe('Satoshi')
    expect(tied.axes?.color).toBe('#222222')
    expect((tied.text as Runs)[1].axes?.color).toBe('#e76f51')
  })
})

// ── AC-2453 ─────────────────────────────────────────────────────────────────────

const chromiumReady = await engineAvailable('chromium')

describe('AC-2453 the fidelity measure and round-trip agree with the fold', () => {
  it(
    'test_UAT_AC2453_oracle_and_round_trip_count_what_the_fold_emits_with_no_phantom_unmatched',
    async () => {
      const cap = captureOf((w) => [...varying(w), ...uniform(w)])
      const leaves = textLeaves(foldToL1(cap))
      const boxes = oracleBoxes(cap).filter((b) => b.kind === 'text' && b.width === 1280)

      // Varying flow: the fold emits one node; the oracle counts one element.
      const foldVarying = leaves.filter((n) => l1PlainText(n.text).includes('Serving'))
      const oracleVarying = boxes.filter((b) => b.text.includes('Serving') || b.text === 'real' || b.text === 'food')
      expect(foldVarying.length).toBe(1)
      expect(oracleVarying.length).toBe(foldVarying.length)

      // Non-varying flow: the fold emits two nodes; the oracle counts two.
      const uni = ['Plain words', 'and more of them']
      const foldUniform = leaves.filter((n) => uni.includes(l1PlainText(n.text).trim()))
      const oracleUniform = boxes.filter((b) => uni.includes(b.text.trim()))
      expect(foldUniform.length).toBe(2)
      expect(oracleUniform.length).toBe(foldUniform.length)

      // The round-trip expected manifest projects one element per run.
      const runs: Runs = [
        { text: 'Serving ' },
        { text: 'real', axes: { fontStyle: 'italic' } },
        { text: ' food', axes: { color: '#e76f51', fontWeight: 900 } },
      ]
      const doc: L1Document = {
        widths: WIDTHS,
        root: {
          kind: 'box',
          children: [
            {
              kind: 'text',
              text: runs,
              axes: { color: '#111827', fontFamily: 'Georgia', fontSizePx: 40, fontWeight: 400 },
              geometry: { keyframes: [{ at: 320, x: 10, y: 10, width: 300 }, { at: 1280, x: 10, y: 10, width: 900 }] },
            } as L1Text,
          ],
        },
      }
      expect(validateL1(doc).ok).toBe(true)
      const expected = expectedTextManifest(doc, { width: 1280, height: 900 })
      expect(expected.elements.map((e) => e.text)).toEqual(['Serving ', 'real', ' food'])
      expect(expected.elements[2]).toMatchObject({ color: '#e76f51', fontWeight: 900 })
      expect(expected.elements[1]).toMatchObject({ fontStyle: 'italic' })

      // A reproduction holding the same per-run elements leaves nothing unmatched.
      const self = diffManifests(expected, { ...expected, source: 'repro' })
      expect(self.unmatched).toBe(0)
      expect(self.matched).toBe(3)

      // The real round trip: render → browser → capture → diff. Every run matches.
      if (chromiumReady) {
        const projections = await captureL1(doc, { engines: ['chromium'], widths: WIDTHS })
        expect(projections.length).toBe(WIDTHS.length)
        for (const proj of projections) {
          const report = roundTripReport(doc, proj.manifest)
          expect(report.unmatched, `@${proj.viewport.width}`).toBe(0)
          expect(report.matched, `@${proj.viewport.width}`).toBe(3)
        }
      }
    },
    180000,
  )
})

// ── AC-2454 ─────────────────────────────────────────────────────────────────────

const THREE_RUNS: Runs = [
  { text: '1' },
  { text: 'st', axes: { sizeScale: 0.32, fontWeight: 700, color: '#e76f51', baselineShiftEm: 0.9 } },
  { text: 'Contact', axes: { fontStyle: 'italic' } },
]

describe('AC-2454 the editor opens a multi-run node as one plain-string field per run', () => {
  it('test_UAT_AC2454_multi_run_node_exposes_text1_to_textN_and_no_run_axis_controls', () => {
    const single = copyFieldsOf(heading('1st Contact'))!
    const singleCopy = single.fields.filter((f) => /^text\d*$/.test(f.name))
    expect(singleCopy.map((f) => f.name)).toEqual(['text'])
    expect(single.fields[0].name).toBe('text')

    const multi = copyFieldsOf(heading(structuredClone(THREE_RUNS)))!
    const copy = multi.fields.filter((f) => /^text\d*$/.test(f.name))
    expect(copy.map((f) => f.name)).toEqual(['text1', 'text2', 'text3'])
    expect(copy.map((f) => f.label)).toEqual(['Text 1', 'Text 2', 'Text 3'])
    expect(copy.every((f) => f.type === 'string')).toBe(true)
    expect(multi.values.text1).toBe('1')
    expect(multi.values.text2).toBe('st')
    expect(multi.values.text3).toBe('Contact')
    // Listed first, in order.
    expect(multi.fields.slice(0, 3).map((f) => f.name)).toEqual(['text1', 'text2', 'text3'])

    // No run-axis control: beyond the per-run words, the multi-run node exposes
    // exactly the same controls as the same node written as one string.
    const rest = (fs: typeof multi.fields) => fs.filter((f) => !/^text\d*$/.test(f.name)).map((f) => f.name)
    expect(rest(multi.fields)).toEqual(rest(single.fields))
    const names = multi.fields.map((f) => f.name).join(' ')
    expect(names).not.toMatch(/sizeScale|baselineShift|run/i)
  })
})

// ── AC-2455 ─────────────────────────────────────────────────────────────────────

describe('AC-2455 editing one run changes only that run', () => {
  it('test_UAT_AC2455_editing_text2_replaces_only_run_two_words', () => {
    const node = heading(structuredClone(THREE_RUNS))
    const before = structuredClone(node.text as Runs)

    const res = applyCopyFields(node, { text2: 'nd' })
    expect(res.ok).toBe(true)
    expect(res.ok && res.changed).toEqual(['text2'])

    const after = node.text as Runs
    expect(Array.isArray(after)).toBe(true)
    expect(after.length).toBe(3)
    expect(after[1].text).toBe('nd')
    expect(after[1].axes).toEqual(before[1].axes)
    expect(after[0]).toEqual(before[0])
    expect(after[2]).toEqual(before[2])
  })
})

// ── AC-2456 ─────────────────────────────────────────────────────────────────────

describe('AC-2456 a copy field addressing no run is refused with no partial write', () => {
  it('test_UAT_AC2456_unaddressable_run_field_is_refused_naming_it_and_nothing_is_written', () => {
    const cases: Array<{ text: L1Text['text']; values: Record<string, unknown>; bad: string }> = [
      { text: structuredClone(THREE_RUNS), values: { text1: 'changed', text9: 'nope' }, bad: 'text9' },
      { text: structuredClone(THREE_RUNS), values: { text2: 'changed', text: 'flat' }, bad: 'text' },
      { text: '1st Contact', values: { text: 'changed', text1: 'nope' }, bad: 'text1' },
    ]
    for (const { text, values, bad } of cases) {
      const node = heading(text)
      const before = structuredClone(node)
      const res = applyCopyFields(node, values)
      expect(res.ok, bad).toBe(false)
      if (!res.ok) {
        expect(res.field).toBe(bad)
        expect(res.message).toContain(bad)
      }
      expect(node, `no partial write for ${bad}`).toEqual(before)
    }
  })
})

// ── AC-2457 ─────────────────────────────────────────────────────────────────────

describe('AC-2457 text-height estimation over runs', () => {
  const MEASURE_WIDTHS = [320, 768, 1280]
  const measure = (text: L1Text['text'], width: number): number => {
    const node = { kind: 'text', text, axes: { fontSizePx: 20, lineHeightPx: 28 } } as L1Text
    const { leaves } = evaluateLayout(docWith(node, MEASURE_WIDTHS), width)
    return leaves.find((l) => l.kind === 'text')!.box.height
  }

  it('test_UAT_AC2457_unscaled_runs_estimate_as_one_string_and_a_smaller_run_estimates_less', () => {
    const words = 'A variety of offerings to please everyone at the dinner table every single day of the week.'
    const split: Runs = [
      { text: 'A variety of offerings to please ' },
      { text: 'everyone', axes: { fontWeight: 700, color: '#e76f51' } },
      { text: ' at the dinner table every single day of the week.', axes: { fontStyle: 'italic' } },
    ]
    expect(l1PlainText(split)).toBe(words)
    for (const w of MEASURE_WIDTHS) {
      expect(measure(split, w), `@${w}`).toBe(measure(words, w))
    }

    const long = 'x'.repeat(240)
    const full: Runs = [{ text: 'lead ' }, { text: long, axes: { fontWeight: 700 } }]
    const shrunk: Runs = [{ text: 'lead ' }, { text: long, axes: { sizeScale: 0.5 } }]
    expect(measure(full, 320)).toBeGreaterThan(28) // the long run really wraps
    expect(measure(shrunk, 320)).toBeLessThan(measure(full, 320))
    // Never exceeds the full-size single-run copy at any width.
    for (const w of MEASURE_WIDTHS) {
      expect(measure(shrunk, w), `@${w}`).toBeLessThanOrEqual(measure(`lead ${long}`, w))
    }
  })
})
