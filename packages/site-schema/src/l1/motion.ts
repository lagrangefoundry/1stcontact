/**
 * REQ-326 — the one reading of what a node's entrance actually animates.
 *
 * `reveal` is a union since REQ-326 (one behaviour, or two or more composed),
 * and two very different consumers need the same answer out of it: the
 * **validator**, which refuses a document where two behaviours claim the same
 * property, and the **renderer**, which emits one pre-state declaration and one
 * transition per claimed property. A collision rule enforced against a property
 * set the renderer no longer uses is a rule that refuses the wrong documents and
 * lets the real ones through, so the projection is stated once, here, and read
 * by both — the same construction {@link l1TextRuns} uses for REQ-211's `text`.
 *
 * Nothing here invents a behaviour. A single object is the one-behaviour case
 * read the same way as a list, which is what keeps the single form from drifting
 * away from the composed form as either side gains an axis.
 */
import type { L1Entrance, L1Reveal } from './types'

/**
 * The CSS properties an entrance behaviour can move.
 *
 * Exactly the two the renderer emits: the node's opacity, and the independent
 * `translate` property it rises on (independent so it composes with a hover's
 * `transform` rather than replacing it — see the renderer's entrance section).
 * A third appears here the day L1 gains a third entrance axis, and both the
 * refusal and the emission gain it together.
 */
export type L1EntranceProperty = 'opacity' | 'translate'

/** One behaviour of an entrance, paired with what it will actually move. */
export interface L1EntranceStep {
  /** The authored behaviour, verbatim. */
  readonly behaviour: L1Reveal
  /**
   * The properties this behaviour animates, in emit order.
   *
   * CLAIMED BY WHAT WILL MOVE, not by which keys were typed: a `yPx` of 0 moves
   * nothing and the renderer emits nothing for it, so counting it as a claim
   * would refuse a composition that has no actual contest in it. Empty is a
   * behaviour that animates nothing, which the validator refuses.
   */
  readonly properties: readonly L1EntranceProperty[]
}

/**
 * An entrance read as an ordered list of behaviours and the properties each one
 * claims. Authored order is preserved, because it is the order the renderer
 * emits in and therefore the composition order an author is choosing.
 *
 * THE DEFAULT FADE BELONGS TO THE ENTRANCE, NOT TO EACH BEHAVIOUR. `reveal` has
 * meant "fade in, and optionally rise" since REQ-100 — `fromOpacity` absent
 * implies 0 — and applying that per behaviour would make every composed entrance
 * collide on `opacity` and be refused, which would leave the list form able to
 * express nothing at all. So the default is resolved once for the entrance: if
 * no behaviour names `fromOpacity`, the FIRST one fades from 0. For a single
 * object that is exactly REQ-100's behaviour, unchanged; for a list it puts the
 * fade somewhere an author can name and move rather than nowhere.
 */
export function l1EntranceSteps(entrance: L1Entrance): readonly L1EntranceStep[] {
  const behaviours = Array.isArray(entrance) ? entrance : [entrance]
  const fadeNamed = behaviours.some((b) => b.fromOpacity !== undefined)
  return behaviours.map((behaviour, index) => {
    const properties: L1EntranceProperty[] = []
    if (behaviour.fromOpacity !== undefined || (!fadeNamed && index === 0)) {
      properties.push('opacity')
    }
    if (behaviour.yPx !== undefined && behaviour.yPx !== 0) properties.push('translate')
    return { behaviour, properties }
  })
}
