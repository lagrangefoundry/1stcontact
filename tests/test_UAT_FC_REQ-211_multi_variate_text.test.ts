/**
 * REQ-211 — one string of page copy can vary within itself (DOC-52 §3.7).
 *
 * WHAT THIS FILE IS FOR. Before this change the only way to get a coloured word
 * in a headline, an ordinal set as a superscript, or an emphasised phrase was
 * three absolutely-positioned `text` leaves — coordinates that are a guess, and a
 * layout that comes apart at the first width the copy reflows at. The substrate
 * was not merely missing a nicety; it pushed the author toward brittle geometry
 * for ordinary typography. So the probes below are about the four surfaces that
 * decide whether inline variation is expressible AT ALL: the schema, the
 * envelope, the renderer, and the editor's exposure rule.
 *
 * All of it is deterministic — validator, emitter, derivation, estimator — so the
 * whole file runs on any runner with no browser. The capture-and-fold half of the
 * ticket lives in `test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  applyCopyFields,
  copyFieldsOf,
  l1PlainText,
  l1TextRuns,
  validateL1,
  type L1Document,
  type L1Node,
  type L1Text,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { evaluateLayout } from '../tools/generate/src/l1/probes'

const WIDTHS = [320, 1280]

function docWith(node: L1Node): L1Document {
  return { widths: WIDTHS, root: { kind: 'box', children: [node] } }
}

/** A heading whose copy is whatever is handed in — a string, or runs. */
function heading(text: L1Text['text']): L1Text {
  return {
    kind: 'text',
    text,
    axes: { color: '#1a3a6b', fontFamily: 'Satoshi', fontSizePx: 62, fontWeight: 800 },
  } as L1Text
}

function render(node: L1Node): { html: string; css: string } {
  const res = validateL1(docWith(node))
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(docWith(node))
}

/** The DOC-52 §2 wordmark, as runs: a big `1`, a small raised `st`, then `Contact`. */
const WORDMARK: L1Text['text'] = [
  { text: '1' },
  { text: 'st', axes: { sizeScale: 0.32, fontWeight: 700, color: '#e76f51', baselineShiftEm: 0.9 } },
  { text: 'Contact' },
]

describe('REQ-211 the substrate accepts inline variation', () => {
  // ── The string form is untouched ────────────────────────────────────────────
  //
  // The whole point of a union is that no existing document had to change. This
  // is the control for every probe below: if a plain string stopped validating,
  // or started rendering a span, the capability would have been bought with a
  // migration of every page ever folded.
  it('test_UAT_FC_REQ_211_a_plain_string_validates_and_renders_as_before', () => {
    const { html } = render(heading('1st Contact'))
    expect(html).toContain('>1st Contact<')
    expect(html).not.toContain('<span')
  })

  // ── A run list validates, and each run carries its own axes ────────────────
  it('test_UAT_FC_REQ_211_each_run_renders_carrying_its_own_axes', () => {
    const { html, css } = render(heading(WORDMARK))

    // One span for the run that varies, and NONE for the two that do not: the
    // markup a multi-run node emits is the markup the same copy would have
    // emitted as a plain string, plus exactly the differences the author asked
    // for.
    expect(html.match(/<span/g)?.length).toBe(1)
    expect(html).toContain('>1<span')
    expect(html).toContain('st</span>Contact<')

    // The run's own fill, weight and size reach the stylesheet — and the sizes
    // are RELATIVE, so the run rides the node's own size rather than pinning a
    // pixel value that would win at every width.
    const runClass = /class="([^"]*-r1)"/.exec(html)?.[1]
    expect(runClass, 'the varying run carries its own class').toBeTruthy()
    const rule = css.split('}').find((r) => r.includes(`.${runClass}`)) ?? ''
    expect(rule).toContain('color: #e76f51')
    expect(rule).toContain('font-weight: 700')
    expect(rule).toContain('font-size: 0.32em')
    expect(rule).toContain('vertical-align: 0.9em')
  })

  // ── The words are still the words ──────────────────────────────────────────
  //
  // A run carries its own separating spaces, so joining is concatenation and
  // nothing invents a space. `['super','script']` has to stay one word, which a
  // joiner that put a space between runs could not express.
  it('test_UAT_FC_REQ_211_the_plain_text_of_runs_is_the_same_copy', () => {
    expect(l1PlainText(WORDMARK)).toBe('1stContact')
    expect(l1PlainText([{ text: 'Hello ' }, { text: 'world' }])).toBe('Hello world')
    expect(l1PlainText('Hello world')).toBe('Hello world')
    // The read projection normalises the other way, so no consumer needs a
    // branch for the string case and the two cases cannot drift.
    expect(l1TextRuns('Hello world')).toEqual([{ text: 'Hello world' }])
  })

  // ── The schema stays closed ────────────────────────────────────────────────
  it('test_UAT_FC_REQ_211_a_run_rejects_nesting_and_unpermitted_axes', () => {
    // Nesting is rich text, which is a different product decision. One level.
    const nested = validateL1(
      docWith({ kind: 'text', text: [{ text: 'a' }, { text: [{ text: 'b' }] }] } as unknown as L1Node),
    )
    expect(nested.ok).toBe(false)

    // An axis outside the permitted subset — `fontFamily` describes the FACE and
    // is what makes a paragraph read as one paragraph, so it is a node axis and
    // never a run's.
    const wideAxis = validateL1(
      docWith({
        kind: 'text',
        text: [{ text: 'a' }, { text: 'b', axes: { fontFamily: 'Satoshi' } }],
      } as unknown as L1Node),
    )
    expect(wideAxis.ok).toBe(false)

    // A link inside a run is a second addressing problem; the renderer stays the
    // sole `<a>` sink.
    const inlineLink = validateL1(
      docWith({
        kind: 'text',
        text: [{ text: 'a' }, { text: 'b', link: { href: '/x' } }],
      } as unknown as L1Node),
    )
    expect(inlineLink.ok).toBe(false)
  })

  // ── One spelling per document ──────────────────────────────────────────────
  //
  // A one-element array would be a second way to write a plain string, and two
  // spellings of one thing is how the fold comes to disagree with the renderer
  // about which it emits. Refused structurally rather than by convention.
  it('test_UAT_FC_REQ_211_a_single_run_array_is_not_a_spelling_of_a_string', () => {
    const lone = validateL1(docWith({ kind: 'text', text: [{ text: 'Hello' }] } as unknown as L1Node))
    expect(lone.ok).toBe(false)
  })

  // ── The envelope reaches inside the runs ───────────────────────────────────
  //
  // A run is a piece of the same paragraph. An envelope that stopped at the node
  // would leave the one place inline variation can be authored as the one place
  // it is unbounded.
  it('test_UAT_FC_REQ_211_run_axes_are_bounded_by_the_envelope', () => {
    const admits = (axes: Record<string, unknown>): boolean =>
      validateL1(docWith({ kind: 'text', text: [{ text: 'a' }, { text: 'b', axes }] } as unknown as L1Node)).ok

    expect(admits({ sizeScale: 400 })).toBe(false)
    expect(admits({ baselineShiftEm: 500 })).toBe(false)
    expect(admits({ fontWeight: 9000 })).toBe(false)
    // …and the ordinary values a superscript actually uses are admitted.
    expect(admits({ sizeScale: 0.6, baselineShiftEm: 0.5, fontWeight: 700 })).toBe(true)
  })
})

describe('REQ-211 the editor exposes multi-run copy as plain strings', () => {
  // ── One field per run ──────────────────────────────────────────────────────
  //
  // DOC-28 §3 promises the user "a plain string or a pick from a closed list".
  // The alternative — one field holding markup that encodes the runs — would
  // hand the user a syntax to get wrong, and a syntax is exactly what that rule
  // refuses.
  it('test_UAT_FC_REQ_211_a_multi_run_node_opens_as_one_field_per_run', () => {
    const single = copyFieldsOf(heading('1st Contact'))!
    expect(single.fields.filter((f) => f.type === 'string').map((f) => f.name)).toEqual(['text'])

    const multi = copyFieldsOf(heading(WORDMARK))!
    const words = multi.fields.filter((f) => f.type === 'string')
    expect(words.map((f) => f.name)).toEqual(['text1', 'text2', 'text3'])
    expect(words.map((f) => f.label)).toEqual(['Text 1', 'Text 2', 'Text 3'])
    expect(words.every((f) => f.type === 'string')).toBe(true)
    expect(multi.values).toMatchObject({ text1: '1', text2: 'st', text3: 'Contact' })

    // The words still come FIRST, which is what the modal keys on to put the
    // cursor in the copy rather than in a parameter.
    expect(multi.fields[0].name).toBe('text1')
  })

  // ── Writing one run leaves the others, and its own axes, alone ─────────────
  it('test_UAT_FC_REQ_211_editing_one_run_disturbs_nothing_else', () => {
    const node = heading(structuredClone(WORDMARK))
    const before = copyFieldsOf(node)!.values

    const res = applyCopyFields(node, { ...before, text3: 'Contact Ltd' })
    expect(res.ok).toBe(true)
    expect(res.ok && res.changed).toEqual(['text3'])

    const runs = node.text as Exclude<L1Text['text'], string>
    expect(runs.map((r) => r.text)).toEqual(['1', 'st', 'Contact Ltd'])
    // The ornament's axes are none of a copy control's business.
    expect(runs[1].axes).toMatchObject({ sizeScale: 0.32, color: '#e76f51' })
  })

  // ── A field name that addresses no run is refused, not guessed at ──────────
  it('test_UAT_FC_REQ_211_a_run_field_outside_the_derivation_is_refused', () => {
    const node = heading(structuredClone(WORDMARK))
    const res = applyCopyFields(node, { text9: 'nope' })
    expect(res.ok).toBe(false)
    expect(res.ok === false && res.field).toBe('text9')
  })
})

describe('REQ-211 measuring a multi-run node', () => {
  // ── Emphasis cannot move a page's predicted height ─────────────────────────
  //
  // The analytic evaluator measures a line as a character count against one
  // average glyph width. A node whose runs declare no scale must therefore cost
  // exactly what the same copy costs as one string — otherwise emphasising a
  // word would silently re-predict the height of everything below it.
  const measure = (text: L1Text['text']): number => {
    const node: L1Text = { kind: 'text', text, axes: { fontSizePx: 20, lineHeightPx: 28 } } as L1Text
    const { leaves } = evaluateLayout(docWith(node), 320)
    return leaves.find((l) => l.kind === 'text')!.box.height
  }

  it('test_UAT_FC_REQ_211_runs_measure_as_the_same_copy_written_once', () => {
    const words = 'A variety of offerings to please everyone at the dinner table every day.'
    const split: L1Text['text'] = [
      { text: 'A variety of offerings to please ' },
      { text: 'everyone', axes: { fontWeight: 700 } },
      { text: ' at the dinner table every day.' },
    ]
    expect(l1PlainText(split)).toBe(words)
    expect(measure(split)).toBe(measure(words))
  })

  it('test_UAT_FC_REQ_211_a_smaller_run_consumes_less_of_the_line', () => {
    const long = 'x'.repeat(200)
    const full: L1Text['text'] = [{ text: 'lead ' }, { text: long, axes: { fontWeight: 700 } }]
    const shrunk: L1Text['text'] = [{ text: 'lead ' }, { text: long, axes: { sizeScale: 0.5 } }]
    expect(measure(shrunk)).toBeLessThan(measure(full))
  })
})
