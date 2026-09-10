/**
 * REQ-211 — putting a sentence back together.
 *
 * WHY THIS IS A MODULE AND NOT A BRANCH IN THE FOLD. A page's inline structure
 * is recovered in two places that must agree exactly: the **fold**, which turns
 * a flow of captured runs into one L1 `text` node, and the **fidelity oracle**,
 * which counts what the reference had so a reproduction can be measured against
 * it. If the fold rejoins a flow the oracle still counts as three elements, the
 * gate reports two phantom `unmatched` runs on every page that emphasises a
 * word — and the measure that exists to catch reproduction defects starts
 * manufacturing them. So the decision is stated once and both sides ask it.
 *
 * WHAT A FLOW IS. The capture records it (`ValueElement.inlineGroup`): the runs
 * that share one inline formatting context, in document order, with `<br>` and
 * every blockified element already acting as a boundary. Nothing here re-derives
 * that from geometry — the browser already knows, and a guess from boxes would
 * be wrong exactly where the layout is interesting.
 *
 * WHICH FLOWS ARE REJOINED, and this is the load-bearing judgement: **only the
 * ones that vary.** A flow whose runs all paint the same colour at the same size
 * and weight has no inline variation to express; rejoining it would trade a set
 * of exactly-transcribed boxes for one flowed box on nothing but a hope that the
 * browser re-wraps them identically. That is a real loss and buys nothing. A
 * flow that DOES vary is the case the pinned-fragment transcription gets wrong —
 * three absolutely-positioned pieces of one sentence, which come apart at the
 * first width the copy reflows at — and is exactly what a run list is for.
 *
 * The rule has a pleasant consequence: a rejoined node always carries at least
 * one run with axes, so the run list is never a pointless second spelling of a
 * plain string (`l1TextContentSchema` refuses those anyway).
 */

/**
 * A rect, stated structurally rather than imported.
 *
 * Same reason `OracleSource` is structural: this module is asked the same
 * question by the fold (which holds captured `ValueElement`s) and by the
 * fidelity oracle (which deliberately holds a minimal shape so the gate can run
 * without the capture package in its graph). A shared nominal type would drag
 * one side's dependencies into the other for four numbers.
 */
export interface InlineBox {
  x: number
  y: number
  width: number
  height: number
}

/** The only fields this module reads off a captured run. */
export interface InlineRunElement {
  text?: string
  color?: string
  colorInferred?: boolean
  fontSizePx?: number
  fontWeight?: number
  fontStyle?: string | null
  inlineGroup?: string
  inlineIndex?: number
  inlineBox?: InlineBox | null
  textFlow?: string
  verticalAlign?: string | null
}

/** One inline flow: the runs of a single formatting context, in document order. */
export interface InlineFlow<T extends InlineRunElement = InlineRunElement> {
  key: string
  members: T[]
  /** The flow root's rect — the box the rejoined runs lay out inside. */
  box: InlineBox | undefined
}

/** Every multi-run inline flow among `elements`, keyed as the capture keyed it. */
export function inlineFlows<T extends InlineRunElement>(elements: readonly T[]): InlineFlow<T>[] {
  const byKey = new Map<string, T[]>()
  for (const el of elements) {
    if (el.inlineGroup === undefined || el.inlineIndex === undefined) continue
    const list = byKey.get(el.inlineGroup)
    if (list) list.push(el)
    else byKey.set(el.inlineGroup, [el])
  }
  const out: InlineFlow<T>[] = []
  for (const [key, members] of byKey) {
    if (members.length < 2) continue
    members.sort((a, b) => (a.inlineIndex ?? 0) - (b.inlineIndex ?? 0))
    out.push({ key, members, box: members[0].inlineBox ?? undefined })
  }
  return out
}

/** The text axes that decide whether a flow varies — and how a run differs. */
function signature(el: InlineRunElement): string {
  return [el.color ?? '', el.fontSizePx ?? 0, el.fontWeight ?? 0, el.fontStyle ?? 'normal'].join('|')
}

/**
 * Does this flow actually vary within itself?
 *
 * Compared on the four axes a run may carry — fill, size, weight, slope. A
 * baseline shift is deliberately NOT one of them: `vertical-align` without any
 * other difference is a raised run of identical type, which is rare enough that
 * admitting it would widen what gets rejoined for a case nobody has met.
 */
export function flowVaries(flow: InlineFlow<InlineRunElement>): boolean {
  const first = signature(flow.members[0])
  return flow.members.some((m) => signature(m) !== first)
}

/**
 * The flows the fold rejoins — the ones with somewhere to put a run's axes.
 *
 * A flow with no `inlineBox` is dropped: the rejoined node lays out inside its
 * flow root, and without that rect there is no box to lay out in. That cannot
 * happen from a current capture and is checked anyway, because the alternative
 * is a node pinned at whichever fragment's box happened to be first.
 */
export function rejoinableFlows<T extends InlineRunElement>(elements: readonly T[]): InlineFlow<T>[] {
  return inlineFlows(elements).filter((f) => f.box !== undefined && flowVaries(f))
}

/**
 * The words a rejoined flow holds — its runs concatenated, spaces and all.
 *
 * `textFlow` rather than `text`, because `text` is trimmed for the join key and
 * a trimmed join turns "Hello world" into "Helloworld". The capture keeps each
 * run's own separating spaces for exactly this, and strips only the flow's
 * leading and trailing whitespace, which never paints.
 */
export function flowText(flow: InlineFlow<InlineRunElement>): string {
  return flow.members.map((m) => m.textFlow ?? m.text ?? '').join('')
}

/**
 * Which run of a rejoined flow carries the NODE — the one with the most words.
 *
 * The node's own axes are the paragraph's: its family, its measure, its
 * alignment, its per-width size track. Those belong to whichever run is the
 * paragraph rather than the ornament, and length is what tells them apart — an
 * ordinal is two characters and a headline is forty. Taking the first run
 * instead would hand a sentence that opens with an emphasised word its
 * emphasis's type as the paragraph's own.
 *
 * Ties go to the earlier run, so the choice is stable across widths.
 */
export function flowLead<T extends InlineRunElement>(flow: InlineFlow<T>): T {
  let best = flow.members[0]
  for (const m of flow.members) {
    if ((m.text ?? '').trim().length > (best.text ?? '').trim().length) best = m
  }
  return best
}
