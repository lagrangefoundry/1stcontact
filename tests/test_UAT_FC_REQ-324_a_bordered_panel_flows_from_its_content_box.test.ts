/**
 * REQ-324 — two ways the fold's flow recovery mis-measures a BORDERED panel.
 *
 * The defect these UATs pin, both measured on `gigabytealchemy.ai` and both a
 * consequence of BUG-142's surface-containment nesting:
 *
 *  1. Every leading offset inside a panel that paints a border was measured from
 *     the panel's BORDER box instead of its content box. The fold's absolute base
 *     is right (`rebaseInto` subtracts `surfaceBorderInset`); the recovery that
 *     produces the served document wrote the same run 4px further right, because
 *     the renderer then lays that margin off the content box the border has
 *     already inset. 23 of the round's 27 value deltas, all CRITICAL, all +4px in
 *     x and 0 in y — the panel carried `borderLeft` and no `border`, so only one
 *     axis was wrong, and the other axis is latent rather than absent.
 *
 *  2. A panel owning exactly ONE run never flowed it at all. The recovery's
 *     region search is a search for COLLISIONS between pinned siblings, so a lone
 *     child can produce no pair and fell out at the "components of size ≥ 2"
 *     filter — not a decision, the absence of one. The panel then kept its
 *     captured one-line height while the run inside it was free to wrap, and hung
 *     146px out of its own panel at 320px.
 *
 * Read together they are one contract, which these tests state as one: an L1
 * child's `geometry.x`/`geometry.y` is relative to its parent's PADDING box, and
 * a flow lead is measured from the same corner — so the recovered offset of a run
 * is the base's pinned offset, unchanged, whatever border the panel paints.
 *
 * Entry points: `promoteToFlow` (the recovery that writes the served document),
 * `evaluateLayout` / `contentRobustnessProbe` (the model the acceptance gate
 * grades it with) and `renderL1Document` (the CSS a browser is handed). Real
 * components throughout — the fixture is an authored L1 document, which is what
 * the fold produces, and the reference bundles this was measured on are not
 * committed.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import {
  contentRobustnessProbe,
  evaluateLayout,
  promoteToFlow,
  type MeasuredTextHeights,
} from '../tools/generate/src'

const WIDTHS = [768, 1280]
const LINE_H = 25
const FONT = 18
/** ~5 chars a word: 26 words wraps to two lines at 600px / 18px, more when grown. */
const PARAGRAPH = 'word '.repeat(26).trim()
const ACCENT = { widthPx: 4, color: '#ffb900' }
const FULL = { widthPx: 6, color: '#ffb900', style: 'solid' as const }
const CARD_FILL = '#f8f5f2'

/** The x every panel below is pinned at, and the width it spans. */
const PANEL_X = 88
const PANEL_W = 600
/** Every run's offset inside its panel's CONTENT box — the number under test. */
const RUN_X = 32

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase()

const kidsOf = (n: L1Node): readonly L1Node[] =>
  n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []

/** The first node in `doc` carrying `id`, at any depth. */
function nodeById(doc: L1Document, id: string): L1Node {
  const walk = (n: L1Node): L1Node | undefined =>
    n.id === id ? n : kidsOf(n).reduce<L1Node | undefined>((a, c) => a ?? walk(c), undefined)
  const found = walk(doc.root)
  if (!found) throw new Error(`no node with id ${id}`)
  return found
}

/** The text node whose copy is `content`, anywhere under `node`. */
function runUnder(node: L1Node, content: string): L1Node {
  const walk = (n: L1Node): L1Node | undefined =>
    n.kind === 'text' && n.text === content
      ? n
      : kidsOf(n).reduce<L1Node | undefined>((a, c) => a ?? walk(c), undefined)
  const found = walk(node)
  if (!found) throw new Error(`no run with text ${JSON.stringify(content)}`)
  return found
}

/** The same, scoped to the panel carrying `id` — the paragraphs repeat across panels. */
const runIn = (doc: L1Document, id: string, content: string): L1Node =>
  runUnder(nodeById(doc, id), content)

const frameAt = (node: L1Node, at: number): { x: number; y: number; height?: number } => {
  const kf = ('geometry' in node ? node.geometry : undefined)?.keyframes.find((k) => k.at === at)
  if (!kf) throw new Error(`no keyframe at ${at}`)
  return { x: kf.x, y: kf.y, height: kf.height }
}

const placeOf = (node: L1Node): string =>
  ('geometry' in node ? node.geometry : undefined)?.place ?? 'pinned'

/**
 * Where the evaluator resolved the `occurrence`-th run carrying `content`, at
 * `width`. The paragraph appears on two panels, so the index is the pairing —
 * the same document-order occurrence pairing the fidelity probe uses.
 */
function runBox(
  doc: L1Document,
  content: string,
  width: number,
  occurrence = 0,
  measured?: MeasuredTextHeights,
): { x: number; y: number; width: number; height: number } {
  const hits = evaluateLayout(doc, width, { measured }).leaves.filter((l) => l.text === content)
  const leaf = hits[occurrence]
  if (!leaf) throw new Error(`no leaf ${occurrence} for ${JSON.stringify(content)}`)
  return leaf.box
}

/**
 * The box the evaluator resolved for the panel carrying `id`. `boxes` is keyed
 * by path, so the path is rebuilt the way the evaluator walks — root `'0'`, then
 * `${path}.${i}` per child — and matched on the node at the end of it.
 */
function panelBox(
  doc: L1Document,
  id: string,
  width: number,
  measured: MeasuredTextHeights,
): { x: number; y: number; width: number; height: number } {
  const boxes = evaluateLayout(doc, width, { measured }).boxes
  const walk = (n: L1Node, path: string): string | undefined =>
    n.id === id
      ? path
      : kidsOf(n).reduce<string | undefined>((a, c, i) => a ?? walk(c, `${path}.${i}`), undefined)
  const path = walk(doc.root, '0')
  const box = path === undefined ? undefined : boxes.get(path)
  if (!box) throw new Error(`no evaluated box for ${id}`)
  return box
}

const text = (content: string, y: number, height: number): L1Node => ({
  kind: 'text',
  text: content,
  axes: { fontSizePx: FONT, lineHeightPx: LINE_H, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
  geometry: {
    keyframes: WIDTHS.map((at) => ({ at, x: RUN_X, y, width: PANEL_W - RUN_X * 2, height })),
  },
})

/**
 * A fold-synthesized backing panel: pinned, painted, and owning its runs — the
 * shape BUG-142 introduced and the one this ticket measures.
 *
 * `border` is the axis under test. Its children's keyframes are padding-box
 * relative, exactly as `rebaseInto` writes them, so an absolute placement of
 * `PANEL_X + border + RUN_X` is what both the base and the recovery must produce.
 */
const panel = (
  id: string,
  y: number,
  height: number,
  border: { borderLeft?: typeof ACCENT; border?: typeof FULL },
  children: L1Node[],
): L1Node => ({
  kind: 'box',
  id,
  axes: { surfaceFill: CARD_FILL, ...border },
  geometry: { keyframes: WIDTHS.map((at) => ({ at, x: PANEL_X, y, width: PANEL_W, height })) },
  children,
})

/** The heights a browser gave each run, as `measuredTextHeights` reads them. */
function measuredFor(runs: Array<[string, number]>): MeasuredTextHeights {
  const tracks = new Map<string, Array<{ at: number; height: number }>>()
  const seen = new Map<string, number>()
  for (const [content, height] of runs) {
    const key = norm(content)
    const occurrence = seen.get(key) ?? 0
    seen.set(key, occurrence + 1)
    tracks.set(`${key}#${occurrence}`, WIDTHS.map((at) => ({ at, height })))
  }
  return { tracks }
}

const TAIL = 'closing line'
const TAIL_PARA = `${PARAGRAPH} tail`
const LONE = 'A single-line callout nobody collides with'

/**
 * Four panels in one column, each one a case.
 *
 *  - `card-0` — a `borderLeft` accent over three runs. Its paragraph collides
 *    with the line under it when the copy grows, and its closing paragraph
 *    reaches down into `card-1` — the first collision is why the panel's own runs
 *    flow, the second is why the COLUMN flows its panels, which is how a panel's
 *    height gets handed to its content at all.
 *  - `card-1` — the same shape with a full `border`, so the inset is non-zero on
 *    BOTH axes and the latent y-axis error is measurable.
 *  - `card-2` — a `borderLeft` accent over exactly ONE run: issue 2's shape, and
 *    the panel whose two defects compound (flowing it while issue 1 stood would
 *    put its run 4px right of where the capture had it).
 *  - `card-3` — one child that is genuinely out of flow (`stacked`), so the height
 *    exemption BUG-142 wrote still holds and nothing about it may change.
 *
 * Authored rather than folded because the recovery is DEMAND-driven: it flows the
 * regions whose content collides when the copy grows and nothing else, so a
 * document that makes that demand is the only way to reach the path under test.
 * The reference bundle this was measured on is not committed.
 */
function authored(): { doc: L1Document; measured: MeasuredTextHeights } {
  const doc: L1Document = {
    widths: WIDTHS,
    root: {
      kind: 'box',
      children: [
        panel('card-0', 0, 200, { borderLeft: ACCENT }, [
          text(PARAGRAPH, 32, LINE_H * 2),
          text(TAIL, 120, LINE_H),
          text(TAIL_PARA, 145, LINE_H * 2),
        ]),
        panel('card-1', 220, 200, { border: FULL }, [
          text(PARAGRAPH, 32, LINE_H * 2),
          text(TAIL, 120, LINE_H),
        ]),
        panel('card-2', 460, 29.25, { borderLeft: ACCENT }, [text(LONE, 0, 29.25)]),
        {
          kind: 'box',
          id: 'card-3',
          axes: { surfaceFill: CARD_FILL, borderLeft: ACCENT },
          geometry: {
            keyframes: WIDTHS.map((at) => ({ at, x: PANEL_X, y: 520, width: PANEL_W, height: 40 })),
          },
          children: [
            {
              kind: 'text',
              text: 'watermark',
              stacked: true,
              axes: {
                fontSizePx: FONT,
                lineHeightPx: LINE_H,
                color: '#999999',
                fontFamily: 'Arial',
                fontWeight: 400,
              },
              geometry: {
                keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: PANEL_W, height: LINE_H })),
              },
            },
          ],
        },
      ],
    },
  }
  const measured = measuredFor([
    [PARAGRAPH, LINE_H * 2],
    [TAIL, LINE_H],
    [TAIL_PARA, LINE_H * 2],
    [PARAGRAPH, LINE_H * 2],
    [TAIL, LINE_H],
    [LONE, 29.25],
    ['watermark', LINE_H],
  ])
  return { doc, measured }
}

describe('REQ-324 — a bordered panel flows from its content box', () => {
  it('test_UAT_FC_REQ-324_a_bordered_panels_flow_lead_is_its_base_offset', () => {
    const { doc, measured } = authored()
    const recovered = promoteToFlow(doc, { measured }).doc

    // The base pins the run inside the panel's PADDING box; the recovery must
    // hand the renderer the same number as a margin, because the border the
    // renderer emits has already inset the content box it measures that margin
    // from. Before this ticket the lead was `RUN_X + 4` on every width.
    const base = runIn(doc, 'card-0', PARAGRAPH)
    const flowed = runIn(recovered, 'card-0', PARAGRAPH)
    expect(placeOf(base)).toBe('pinned')
    expect(placeOf(flowed)).toBe('flow')
    for (const at of WIDTHS) {
      expect(frameAt(flowed, at).x).toBe(frameAt(base, at).x)
      expect(frameAt(flowed, at).x).toBe(RUN_X)
    }

    // And the model agrees with the CSS box model it is standing in for: the run
    // lands at the panel's border-box x, plus the border, plus the lead — the
    // same absolute place the base put it. Either half alone is not the fix: a
    // corrected lead read against an un-inset frame lands 4px SHORT.
    const absolute = PANEL_X + ACCENT.widthPx + RUN_X
    for (const at of WIDTHS) {
      expect(runBox(doc, PARAGRAPH, at, 0, measured).x).toBeCloseTo(absolute, 2)
      expect(runBox(recovered, PARAGRAPH, at, 0, measured).x).toBeCloseTo(absolute, 2)
    }

    // What a browser is handed: the accent rule, and a margin that is the offset
    // from inside it.
    const { css } = renderL1Document(recovered, { title: 'req324' })
    expect(css).toContain(`border-left: ${ACCENT.widthPx}px`)
    expect(css).toContain(`margin-left: ${RUN_X}px`)
  })

  it('test_UAT_FC_REQ-324_a_full_border_panel_leads_from_its_content_box_on_both_axes', () => {
    const { doc, measured } = authored()
    const recovered = promoteToFlow(doc, { measured }).doc

    // `card-1` carries a full `border`, so the inset is non-zero on both axes.
    // The x error was the one the reference exhibited; the y error was latent
    // only because that page had no fully-bordered surface. Both are pinned here.
    const first = runIn(recovered, 'card-1', PARAGRAPH)
    expect(placeOf(first)).toBe('flow')
    for (const at of WIDTHS) {
      expect(frameAt(first, at).x).toBe(RUN_X)
      expect(frameAt(first, at).y).toBe(32)
    }
    for (const at of WIDTHS) {
      const box = runBox(recovered, PARAGRAPH, at, 1, measured)
      expect(box.x).toBeCloseTo(PANEL_X + FULL.widthPx + RUN_X, 2)
    }

    // And the height the panel gets back once its content sizes it is the height
    // the capture had, not that plus its own bottom edge. The slack handed to
    // `responsivePadding.bottomPx` is what is left of the BORDER box after the
    // content and BOTH horizontal edges — the top one is already in the measured
    // span, the bottom one is not, and on an accent-rule panel it is 0, which is
    // why only a fully-bordered panel can show it.
    for (const at of WIDTHS) {
      expect(panelBox(doc, 'card-1', at, measured).height).toBeCloseTo(200, 2)
      expect(panelBox(recovered, 'card-1', at, measured).height).toBeCloseTo(200, 2)
    }
  })

  it('test_UAT_FC_REQ-324_a_single_run_panel_flows_and_its_height_follows_the_copy', () => {
    const { doc, measured } = authored()
    const recovered = promoteToFlow(doc, { measured }).doc

    // Nothing collides inside `card-2` — there is one run, so there is no pair to
    // find. That is why it never flowed, and it is not a reason: flowing it is
    // what lets the panel's height come from it.
    const lone = runIn(recovered, 'card-2', LONE)
    expect(placeOf(runIn(doc, 'card-2', LONE))).toBe('pinned')
    expect(placeOf(lone)).toBe('flow')

    // Issue 1 is a prerequisite, not a neighbour: this panel carries the same 4px
    // accent, so flowing it while the lead was measured from the border box would
    // have traded the escape below for a new CRITICAL position delta.
    for (const at of WIDTHS) expect(frameAt(lone, at).x).toBe(RUN_X)
    for (const at of WIDTHS) {
      expect(runBox(recovered, LONE, at, 0, measured).x).toBeCloseTo(
        PANEL_X + ACCENT.widthPx + RUN_X,
        2,
      )
    }

    // The panel's height is no longer a constant the copy cannot move: the
    // keyframe height is gone, so the browser measures it from its interior.
    const panelNode = nodeById(recovered, 'card-2')
    expect(frameAt(nodeById(doc, 'card-2'), 1280).height).toBe(29.25)
    expect(frameAt(panelNode, 1280).height).toBeUndefined()

    // Which is the escape, closed. Under the gate's own content perturbation the
    // run used to hang out of the bottom of a panel that stayed one line tall.
    const escapesFor = (d: L1Document): number =>
      contentRobustnessProbe(d, { measured }).byWidth.flatMap((w) =>
        w.findings.filter((f) => f.kind === 'escape' && f.detail.includes('card-2')),
      ).length
    expect(escapesFor(doc)).toBeGreaterThan(0)
    expect(escapesFor(recovered)).toBe(0)
  })

  it('test_UAT_FC_REQ-324_a_panel_whose_only_child_is_out_of_flow_keeps_its_height', () => {
    const { doc, measured } = authored()
    const recovered = promoteToFlow(doc, { measured }).doc

    // The collapse case BUG-142's height exemption was written for, unchanged: a
    // child pinned because it is GENUINELY out of flow is not promotable, so the
    // panel still has an interior the browser measures as empty and keeps the
    // height that makes it paint at all. Admitting a lone child may not widen
    // into admitting this one.
    const kept = nodeById(recovered, 'card-3')
    expect(kidsOf(kept).map(placeOf)).toEqual(['pinned'])
    expect(frameAt(kept, 1280).height).toBe(40)
    expect(validateL1(recovered).ok).toBe(true)
    expect(evaluateLayout(recovered, 1280, { measured }).boxes.size).toBeGreaterThan(0)
  })
})
