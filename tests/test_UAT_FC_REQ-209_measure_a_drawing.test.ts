/**
 * REQ-209 — the AI can measure a drawing (DOC-52 §3.3–3.4, §5).
 *
 * WHAT IS UNDER TEST HERE, AND WHAT IS NOT. This file exercises the vocabulary
 * and the arithmetic over a measurement, plus the surface that carries them: what
 * the anchors mean, that a mismatched pair is refused, that `solve` hands back a
 * place as well as a number, and that `assert` reports without blocking and costs
 * no render when nobody asked for one. None of that needs a browser, and running
 * it against a real one would make the suite slow AND less exact — the fixture
 * below is DOC-52 §5.3's own measurement of the 1st Contact wordmark, so the
 * numbers the ticket argues from are the numbers asserted against.
 *
 * The script that produces such a measurement is a browser's job and is tested
 * in `test_UAT_FC_REQ-209_measure_in_a_browser.test.ts`, which reports loudly
 * when it cannot run.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  ANCHOR_NAMES,
  anchorAxis,
  anchorFamily,
  anchorValue,
  parseAnchorRef,
  parseRelation,
  recordedRelations,
} from '../packages/site-schema/src/anchors'
import type { RawMeasurement } from '../tools/generate/src/cli/capture/measure-svg'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

/**
 * The wordmark as DOC-52 §5.3 measures it.
 *
 * The two facts the whole ticket turns on are visible in these numbers, and both
 * are asserted below rather than described: `#one`'s ink ends at 26.0 while its
 * pen lands at 34.4 — 8.4 units apart — and aligning the two runs by ink-top is
 * 4.4 units where aligning them by cap-top is 3.6.
 */
const WORDMARK: RawMeasurement = {
  viewBox: [0, 0, 320, 86],
  space: 'root user units, y-down; nested transforms resolved',
  fonts: [
    {
      key: 'f0',
      requested: 'Satoshi',
      resolved: 'Satoshi',
      generic: false,
      capHeight: 0.7,
      xHeight: 0.5,
      ascender: 0.75,
      descender: -0.25,
    },
  ],
  nodes: [
    {
      ref: '#one',
      id: 'one',
      kind: 'text',
      text: '1',
      font: 'f0',
      fontSize: 62,
      box: [0, 15.5, 34.4, 46.5],
      ink: [1.2, 18.6, 24.8, 43.4],
      baseline: 62,
      advanceStart: 0,
      advanceWidth: 34.4,
      attrs: { x: '0', y: '62' },
      scale: [1, 1],
      skewed: false,
      path: '0.1',
    },
    {
      ref: '#ord',
      id: 'ord',
      kind: 'text',
      text: 'st',
      font: 'f0',
      fontSize: 20,
      box: [34.4, 14, 18.2, 20],
      ink: [35.1, 14.2, 16.8, 14.8],
      baseline: 29,
      advanceStart: 34.4,
      advanceWidth: 18.2,
      attrs: { x: '34.4', y: '29' },
      scale: [1, 1],
      skewed: false,
      path: '0.2',
    },
    {
      // No `id`, so it is addressed by its path — the case that would otherwise
      // measure to nothing, and the one that prompts giving it an id.
      ref: '0.3',
      id: null,
      kind: 'line',
      box: [80, 76.25, 160, 3.5],
      attrs: { x: null, y: null, cx: null, cy: null },
      scale: [1, 1],
      skewed: false,
      path: '0.3',
    },
  ],
  warnings: [],
}

/** The same drawing with `#ord` moved down by `delta`, as writing a `y` would. */
function withOrdMovedBy(delta: number): RawMeasurement {
  return {
    ...WORDMARK,
    nodes: WORDMARK.nodes.map((node) =>
      node.ref === '#ord'
        ? {
            ...node,
            baseline: (node.baseline ?? 0) + delta,
            box: [node.box[0], node.box[1] + delta, node.box[2], node.box[3]] as [
              number,
              number,
              number,
              number,
            ],
            ink: [node.ink![0], node.ink![1] + delta, node.ink![2], node.ink![3]] as [
              number,
              number,
              number,
              number,
            ],
            attrs: { ...node.attrs, y: String((node.baseline ?? 0) + delta) },
          }
        : node,
    ),
  }
}

const A_DRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 86">' +
  '<text id="one" x="0" y="62" font-family="Satoshi" font-size="62">1</text>' +
  '</svg>'

/** A measurer that answers with a fixture and counts how often it was asked. */
function fakeMeasurer(answer: RawMeasurement = WORDMARK): {
  measure: (svg: string) => Promise<RawMeasurement>
  calls: string[]
} {
  const calls: string[] = []
  return {
    calls,
    measure: async (svg: string) => {
      calls.push(svg)
      return answer
    },
  }
}

describe('REQ-209 the anchor vocabulary', () => {
  it('test_UAT_FC_REQ_209_ink_and_advance_are_different_places', () => {
    const one = { node: WORDMARK.nodes[0], font: WORDMARK.fonts[0] }
    const inkRight = anchorValue(one, 'ink-right')
    const advanceEnd = anchorValue(one, 'advance-end')
    expect(inkRight).toBeCloseTo(26, 3)
    expect(advanceEnd).toBeCloseTo(34.4, 3)
    // The point of naming the families: "where the 1 ends" is two answers, and
    // in a wordmark this size they are units apart.
    expect(Math.abs(advanceEnd - inkRight)).toBeCloseTo(8.4, 3)
  })

  it('test_UAT_FC_REQ_209_cap_top_and_ink_top_are_different_alignments', () => {
    const one = { node: WORDMARK.nodes[0], font: WORDMARK.fonts[0] }
    const ord = { node: WORDMARK.nodes[1], font: WORDMARK.fonts[0] }
    const byCap = anchorValue(one, 'cap-top') - anchorValue(ord, 'cap-top')
    const byInk = anchorValue(one, 'ink-top') - anchorValue(ord, 'ink-top')
    expect(byCap).toBeCloseTo(3.6, 3)
    expect(byInk).toBeCloseTo(4.4, 3)
    expect(byCap).not.toBeCloseTo(byInk, 1)
  })

  it('test_UAT_FC_REQ_209_font_lines_derive_from_the_metrics', () => {
    const one = { node: WORDMARK.nodes[0], font: WORDMARK.fonts[0] }
    expect(anchorValue(one, 'baseline')).toBe(62)
    expect(anchorValue(one, 'cap-top')).toBeCloseTo(62 - 0.7 * 62, 3)
    expect(anchorValue(one, 'x-top')).toBeCloseTo(62 - 0.5 * 62, 3)
    expect(anchorValue(one, 'ascender')).toBeCloseTo(62 - 0.75 * 62, 3)
    // The descender's ratio is negative, so the same expression carries it below
    // the baseline without a special case.
    expect(anchorValue(one, 'descender')).toBeCloseTo(62 + 0.25 * 62, 3)
  })

  it('test_UAT_FC_REQ_209_axis_is_inferred_from_the_anchor', () => {
    expect(anchorAxis('cap-top')).toBe('y')
    expect(anchorAxis('ink-right')).toBe('x')
    expect(anchorAxis('nonsense')).toBeNull()
    expect(anchorFamily('advance-end')).toBe('advance')
    expect(anchorFamily('centre-x')).toBe('box')
    expect(ANCHOR_NAMES).toContain('descender')
  })

  it('test_UAT_FC_REQ_209_a_shape_has_no_ink_or_baseline', () => {
    const line = { node: WORDMARK.nodes[2], font: null }
    expect(anchorValue(line, 'left')).toBe(80)
    expect(anchorValue(line, 'centre-y')).toBeCloseTo(78, 3)
    expect(() => anchorValue(line, 'ink-left')).toThrow(/paints no glyphs/)
    expect(() => anchorValue(line, 'cap-top')).toThrow(/no\s+baseline/)
  })

  it('test_UAT_FC_REQ_209_a_node_reference_may_contain_a_dot', () => {
    expect(parseAnchorRef('#ord.cap-top')).toEqual({ node: '#ord', anchor: 'cap-top' })
    // An un-id'd node is called `0.3`, so the split is at the LAST dot.
    expect(parseAnchorRef('0.3.top')).toEqual({ node: '0.3', anchor: 'top' })
    expect(parseAnchorRef('#ord.middle')).toBeNull()
    expect(parseAnchorRef('#ord')).toBeNull()
  })

  it('test_UAT_FC_REQ_209_a_relation_is_read_from_the_same_sentence_either_way', () => {
    expect(parseRelation('#ord.cap-top = #one.cap-top')).toEqual({
      a: '#ord.cap-top',
      b: '#one.cap-top',
      offset: 0,
    })
    expect(parseRelation('#ord.ink-left = #one.ink-right + 2')?.offset).toBe(2)
    expect(parseRelation('#ord.ink-left = #one.ink-right - 1.5')?.offset).toBe(-1.5)
    expect(parseRelation('#ord.cap-top < #one.cap-top')).toBeNull()
    // The comment form the drawing records its own intent in.
    expect(
      recordedRelations('<svg><!-- #ord.cap-top = #one.cap-top --><!-- a note --></svg>'),
    ).toEqual([{ a: '#ord.cap-top', b: '#one.cap-top', offset: 0 }])
  })
})

describe('REQ-209 measuring, relating and solving through the surface', () => {
  let site: SiteFixture | undefined

  afterEach(() => {
    site?.dispose()
    site = undefined
  })

  /** The surface, over a real store, with a drawing already in it. */
  async function surface(measurer: ((svg: string) => Promise<RawMeasurement>) | null) {
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, measurer)
    await ops.write_image({ name: 'wordmark', svg: A_DRAWING })
    return ops
  }

  it('test_UAT_FC_REQ_209_measure_reports_the_primitives_and_the_font_once', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const out = (await ops.measure_drawing({ drawing: 'wordmark' })) as Record<string, unknown>
    expect(out.drawing).toBe('wordmark')
    expect(out.viewBox).toEqual([0, 0, 320, 86])
    // Once per font, not once per node: two text nodes, one font entry.
    expect(out.fonts).toHaveLength(1)
    const nodes = out.nodes as Record<string, unknown>[]
    expect(nodes.map((n) => n.ref)).toEqual(['#one', '#ord', '0.3'])
    // A node with no id still appears, under its path — seeing it is what
    // prompts giving it one.
    expect(nodes[2].ref).toBe('0.3')
    // The internals `solve` works from are not part of the answer: a field the
    // model can see is a field it will try to do arithmetic with.
    expect(nodes[0]).not.toHaveProperty('attrs')
    expect(nodes[0]).not.toHaveProperty('scale')
    expect(nodes[0]).not.toHaveProperty('skewed')
    expect(nodes[0]).not.toHaveProperty('path')
  })

  it('test_UAT_FC_REQ_209_a_recorded_relation_is_reported_with_what_it_is_worth_now', async () => {
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, fakeMeasurer().measure)
    await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING.replace('<text', '<!-- #ord.cap-top = #one.cap-top --><text'),
    })
    const out = (await ops.measure_drawing({ drawing: 'wordmark' })) as Record<string, unknown>
    const recorded = out.recorded as Record<string, unknown>[]
    expect(recorded).toHaveLength(1)
    expect(recorded[0].relation).toBe('#ord.cap-top = #one.cap-top')
    // It does not hold today, and saying so is the whole value of the note.
    expect(recorded[0].delta).toBeCloseTo(3.6, 3)
    expect(recorded[0].holds).toBe(false)
  })

  it('test_UAT_FC_REQ_209_relate_answers_one_number', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const out = (await ops.relate({
      drawing: 'wordmark',
      a: '#ord.cap-top',
      b: '#one.cap-top',
    })) as Record<string, unknown>
    expect(out.axis).toBe('y')
    expect(out.delta).toBeCloseTo(3.6, 3)
  })

  it('test_UAT_FC_REQ_209_relate_refuses_two_anchors_of_different_axes', async () => {
    const ops = await surface(fakeMeasurer().measure)
    await expect(
      ops.relate({ drawing: 'wordmark', a: '#ord.top', b: '#one.left' }),
    ).rejects.toThrow(/y axis and .* x axis/)
  })

  it('test_UAT_FC_REQ_209_an_unknown_node_is_refused_with_what_is_there', async () => {
    const ops = await surface(fakeMeasurer().measure)
    await expect(
      ops.relate({ drawing: 'wordmark', a: '#nope.top', b: '#one.top' }),
    ).rejects.toThrow(/#one, #ord, 0\.3/)
  })

  it('test_UAT_FC_REQ_209_solve_returns_the_node_and_the_attribute', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const out = (await ops.solve({
      drawing: 'wordmark',
      move: '#ord',
      so: '#ord.cap-top',
      equals: '#one.cap-top',
    })) as Record<string, unknown>
    // Never a bare number: the measurement is in root space and the attribute is
    // written in local space, so the answer has to say where it goes.
    expect(out.node).toBe('#ord')
    expect(out.attr).toBe('y')
    expect(out.from).toBe(29)
    expect(out.value).toBeCloseTo(32.6, 3)
    expect(out.delta).toBeCloseTo(3.6, 3)
  })

  it('test_UAT_FC_REQ_209_applying_a_solved_value_zeroes_the_relation', async () => {
    const before = fakeMeasurer()
    const ops = await surface(before.measure)
    const solved = (await ops.solve({
      drawing: 'wordmark',
      so: '#ord.cap-top',
      equals: '#one.cap-top',
    })) as { value: number; from: number }

    // Move the node by exactly what `solve` said and ask again.
    site!.opts.store // keep the fixture alive for the reader
    const after = l1Operations(
      site!.slug,
      site!.opts,
      {},
      fakeMeasurer(withOrdMovedBy(solved.value - solved.from)).measure,
    )
    const out = (await after.relate({
      drawing: 'wordmark',
      a: '#ord.cap-top',
      b: '#one.cap-top',
    })) as { delta: number }
    expect(out.delta).toBeCloseTo(0, 6)
  })

  it('test_UAT_FC_REQ_209_solve_offsets_by_a_stated_gap', async () => {
    const ops = await surface(fakeMeasurer().measure)
    const out = (await ops.solve({
      drawing: 'wordmark',
      so: '#ord.ink-left',
      equals: '#one.ink-right',
      offset: 2,
    })) as Record<string, unknown>
    expect(out.attr).toBe('x')
    // ink-left is 35.1, ink-right is 26.0, so landing 2 past it moves it by -7.1.
    expect(out.delta).toBeCloseTo(-7.1, 3)
    expect(out.value).toBeCloseTo(34.4 - 7.1, 3)
  })

  it('test_UAT_FC_REQ_209_solve_refuses_a_node_no_attribute_moves', async () => {
    const ops = await surface(fakeMeasurer().measure)
    await expect(
      ops.solve({ drawing: 'wordmark', so: '0.3.top', equals: '#one.top' }),
    ).rejects.toThrow(/<line> has no single attribute/)
  })

  it('test_UAT_FC_REQ_209_solve_refuses_a_move_that_names_another_node', async () => {
    const ops = await surface(fakeMeasurer().measure)
    await expect(
      ops.solve({
        drawing: 'wordmark',
        move: '#one',
        so: '#ord.cap-top',
        equals: '#one.cap-top',
      }),
    ).rejects.toThrow(/is not the node/)
  })

  it('test_UAT_FC_REQ_209_a_drawing_that_is_not_there_is_refused_by_name', async () => {
    const ops = await surface(fakeMeasurer().measure)
    await expect(ops.measure_drawing({ drawing: 'nothing' })).rejects.toThrow(
      /no drawing called 'nothing\.svg'/,
    )
  })

  it('test_UAT_FC_REQ_209_a_builder_with_no_browser_says_so', async () => {
    const ops = await surface(null)
    await expect(ops.measure_drawing({ drawing: 'wordmark' })).rejects.toThrow(
      /no browser/,
    )
  })
})

describe('REQ-209 asserting on the write', () => {
  let site: SiteFixture | undefined

  afterEach(() => {
    site?.dispose()
    site = undefined
  })

  it('test_UAT_FC_REQ_209_an_assertion_reports_and_still_writes', async () => {
    site = makeMemorySite()
    const measurer = fakeMeasurer()
    const ops = l1Operations(site.slug, site.opts, {}, measurer.measure)
    const out = (await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING,
      assert: ['#ord.cap-top = #one.cap-top', '#ord.ink-left = #one.ink-right + 2'],
    })) as Record<string, unknown>

    // Written, whatever the assertions said. Advisory, never gating.
    expect(await site.store.listAssets(site.slug)).toContain('wordmark.svg')
    const asserted = out.asserted as Record<string, unknown>[]
    expect(asserted).toHaveLength(2)
    expect(asserted[0].holds).toBe(false)
    expect(asserted[0].delta).toBeCloseTo(3.6, 3)
    expect(asserted[1].holds).toBe(false)
    expect(asserted[1].delta).toBeCloseTo(-7.1, 3)
  })

  it('test_UAT_FC_REQ_209_an_assertion_that_holds_reports_zero', async () => {
    site = makeMemorySite()
    const ops = l1Operations(
      site.slug,
      site.opts,
      {},
      fakeMeasurer(withOrdMovedBy(3.6)).measure,
    )
    const out = (await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING,
      assert: ['#ord.cap-top = #one.cap-top'],
    })) as Record<string, unknown>
    const asserted = out.asserted as Record<string, unknown>[]
    expect(asserted[0].holds).toBe(true)
    expect(asserted[0].delta).toBeCloseTo(0, 6)
  })

  it('test_UAT_FC_REQ_209_a_relation_that_cannot_be_read_is_said_not_dropped', async () => {
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, fakeMeasurer().measure)
    const out = (await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING,
      assert: ['make it line up', '#gone.top = #one.top'],
    })) as Record<string, unknown>
    const asserted = out.asserted as Record<string, unknown>[]
    // An absent assertion reads exactly like one that passed, so neither is
    // allowed to disappear.
    expect(asserted).toHaveLength(2)
    expect(asserted[0].why).toMatch(/not a relation/)
    expect(asserted[0].holds).toBeUndefined()
    expect(asserted[1].why).toMatch(/no node called '#gone'/)
  })

  it('test_UAT_FC_REQ_209_a_write_with_no_assertion_renders_nothing', async () => {
    site = makeMemorySite()
    const measurer = fakeMeasurer()
    const ops = l1Operations(site.slug, site.opts, {}, measurer.measure)
    const out = (await ops.write_image({ name: 'wordmark', svg: A_DRAWING })) as Record<
      string,
      unknown
    >
    // The whole reason `assert` is opt-in: an ordinary write still costs no
    // browser at all.
    expect(measurer.calls).toHaveLength(0)
    expect(out).not.toHaveProperty('asserted')
    expect(out).toHaveProperty('asset')
  })

  it('test_UAT_FC_REQ_209_an_assertion_with_no_browser_says_it_checked_nothing', async () => {
    site = makeMemorySite()
    const ops = l1Operations(site.slug, site.opts, {}, null)
    const out = (await ops.write_image({
      name: 'wordmark',
      svg: A_DRAWING,
      assert: ['#ord.cap-top = #one.cap-top'],
    })) as Record<string, unknown>
    expect(await site.store.listAssets(site.slug)).toContain('wordmark.svg')
    const asserted = out.asserted as Record<string, unknown>[]
    expect(asserted[0].why).toMatch(/no browser/)
  })
})
