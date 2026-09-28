/**
 * REQ-326 / REQ-329 — the one reading of what a node's motion actually animates.
 *
 * `reveal` is a union since REQ-326 (one behaviour, or two or more composed) and
 * `scrollTrack` is one since REQ-329, and two very different consumers need the
 * same answer out of both: the **validator**, which refuses a document where two
 * behaviours claim the same property, and the **renderer**, which emits one
 * pre-state declaration and one transition per claimed property. A collision rule
 * enforced against a property set the renderer no longer uses is a rule that
 * refuses the wrong documents and lets the real ones through, so the projection is
 * stated once, here, and read by both — the same construction {@link l1TextRuns}
 * uses for REQ-211's `text`.
 *
 * Nothing here invents a behaviour. A single object is the one-behaviour case read
 * the same way as a list, which is what keeps the single form from drifting away
 * from the composed form as either side gains an axis.
 *
 * REQ-329 — AND THE READING SPANS TRIGGERS, not just the list inside one of them.
 * A node may carry an entrance, a scroll track and a hover at once; each of them
 * moves CSS properties, and which ones they move is the whole of whether they
 * compose or clobber. {@link l1MotionClaims} is that cross-trigger reading, and it
 * is what the one exclusivity rule in the envelope is enforced from.
 */
import type {
  L1AnimateTrack,
  L1Animation,
  L1FrameTrack,
  L1TimedTrack,
  L1Entrance,
  L1Interaction,
  L1Reveal,
  L1ScrollMotion,
  L1ScrollTrack,
} from './types'

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

/**
 * REQ-329 — every CSS property any of a node's motions can move.
 *
 * The entrance's two plus the independent `scale` a scroll track drives, plus the
 * independent `rotate` REQ-335's timed track adds. A hover adds nothing to this
 * list even though it moves: its offsets and its scale compile to `transform`,
 * which is a *different* property from `translate` / `scale` / `rotate` and
 * composes with them natively — which is exactly why the renderer chose the
 * independent properties in the first place.
 */
export type L1MotionProperty = L1EntranceProperty | 'scale' | 'rotate'

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

/**
 * REQ-329 — a node's scroll motion read as an ordered list of tracks.
 *
 * The single-object case is the one-track list, read the same way, for the reason
 * {@link l1EntranceSteps} gives: one reading means the single form cannot drift
 * away from the composed form as either gains an axis.
 */
export function l1ScrollTracks(motion: L1ScrollMotion): readonly L1ScrollTrack[] {
  return Array.isArray(motion) ? motion : [motion]
}

/**
 * The properties one scroll track animates, in the order the renderer emits its
 * keyframe declarations.
 *
 * A property is claimed where ANY stop names it — a track whose stops mention
 * `opacity` twice and `scale` once animates both, because the browser interpolates
 * a property named anywhere in the block across the whole of it. Unlike an
 * entrance's `yPx`, a value equal to the node's resting one is still a claim: the
 * keyframe is emitted, the animation owns the property for the length of the
 * range, and anything else transitioning it is inert whether the number moves or
 * not.
 */
export function l1ScrollTrackProperties(track: L1ScrollTrack): readonly L1MotionProperty[] {
  const properties: L1MotionProperty[] = []
  if (track.stops.some((s) => s.opacity !== undefined)) properties.push('opacity')
  if (track.stops.some((s) => s.translateYPct !== undefined)) properties.push('translate')
  if (track.stops.some((s) => s.scale !== undefined)) properties.push('scale')
  return properties
}

/**
 * REQ-335 — a node's timed motion read as an ordered list of tracks.
 *
 * The single-object case is the one-track list, read the same way, for the reason
 * {@link l1EntranceSteps} gives: one reading means the single form cannot drift
 * away from the composed form as either gains an axis.
 */
export function l1AnimateTracks(motion: L1Animation): readonly L1TimedTrack[] {
  return Array.isArray(motion) ? motion : [motion]
}

/**
 * REQ-335 — is this timed track the FRAME-STEPPING kind?
 *
 * The one place the two kinds are told apart, so the validator, the claim model
 * and the renderer all read the discriminant the same way. Asked of `frames`
 * rather than of `stops`, because `frames` is what a frame track cannot be written
 * without — and both object schemas are `.strict()`, so no track can carry both.
 */
export function l1IsFrameTrack(track: L1TimedTrack): track is L1FrameTrack {
  return (track as L1FrameTrack).frames !== undefined
}

/**
 * REQ-335 — **the element a frame track moves, spelled as a claim target.**
 *
 * A frame track does not move the node: it moves the picture INSIDE the node's
 * window, which is a different element and therefore contests nothing the node's
 * own entrance, scroll track or hover states claim. Two frame tracks on one node
 * do contest — they would both drive that one element's `translate` — and this is
 * the key that makes the existing exclusivity rule say so without a second rule.
 *
 * It cannot be mistaken for a part `id`, because `parts` and `frames` are
 * exclusive on a node ({@link L1_STRUCTURAL_RULES.partsAndFramesExclusive}): a node
 * with a frame track has no parts to name at all.
 */
export const L1_FRAME_TARGET = '\u0000frames'

/**
 * The properties one timed track animates, in the order the renderer emits its
 * keyframe declarations.
 *
 * Claimed where ANY stop names it, on {@link l1ScrollTrackProperties}' terms and
 * for its reason: the browser interpolates a property named anywhere in the block
 * across the whole of it, and a value equal to the target's resting one is still a
 * claim because the animation owns the property for the length of the cycle.
 *
 * `translateXPct` and `translateYPct` are ONE claim, not two. They are two axes of
 * the single `translate` property, so a track naming both emits one declaration —
 * and two tracks that each name only one of them would still clobber each other,
 * which is exactly what the claim is for.
 */
export function l1AnimateTrackProperties(track: L1TimedTrack): readonly L1MotionProperty[] {
  // A frame track steps the strip by translating it, so `translate` is exactly what
  // it claims — on its own target, which is why it never contests the node's own.
  if (l1IsFrameTrack(track)) return ['translate']
  const properties: L1MotionProperty[] = []
  if (track.stops.some((s) => s.opacity !== undefined)) properties.push('opacity')
  if (track.stops.some((s) => s.translateXPct !== undefined || s.translateYPct !== undefined)) {
    properties.push('translate')
  }
  if (track.stops.some((s) => s.scale !== undefined)) properties.push('scale')
  if (track.stops.some((s) => s.rotateDeg !== undefined)) properties.push('rotate')
  return properties
}

/** One motion's claim on one CSS property. */
export interface L1MotionClaim {
  /** The property this motion moves. */
  readonly property: L1MotionProperty
  /**
   * REQ-335 — **WHICH ELEMENT it moves that property on.**
   *
   * `undefined` is the node itself, which is every motion that predates REQ-335.
   * A string is the `id` of a part inside the node's inlined drawing.
   *
   * This is what keeps the exclusivity rule from refusing the composition the
   * whole of REQ-335 exists to allow. Two tracks that both animate `rotate` are a
   * clobber when they are aimed at the same element and are the ENTIRE POINT when
   * one turns the left arm and the other the right — the arms move while the
   * parchment does not. A rule keyed on the property alone cannot tell those two
   * apart, so it would have to refuse both.
   */
  readonly target?: string
  /**
   * Where the claim was authored, as a path fragment relative to the node —
   * `reveal`, `reveal/1`, `scrollTrack`, `scrollTrack/0`, `interaction/hover`.
   * It is both where a refusal is reported and how it names the claimant, so an
   * author is told which of several motions on one node to change.
   */
  readonly at: string
  /**
   * True where this motion compiles to a CSS **animation** rather than to a
   * transition or a state declaration.
   *
   * This is the whole of why any of these claims contest each other. An animation
   * wins its properties outright against every non-`!important` declaration and
   * against any transition, so a second claim on a property an animation owns
   * moves no pixel and says nothing about why — while two claims that are both
   * transitions are two different *states* of the node and compose fine.
   */
  readonly animated: boolean
}

/**
 * REQ-329 — every property every motion on this node claims, in declaration
 * order: the entrance's behaviours, then the scroll tracks, then the interaction
 * states.
 *
 * The order is what makes a refusal read as "this one is in breach": the second
 * claim on a contested property is the one reported, so an entrance that predates
 * a scroll track is named as the incumbent rather than as the offender.
 *
 * Interaction states claim `opacity` and nothing else. Their motion is a
 * `transform`, which is a different property from the independent `translate` /
 * `scale` / `rotate` a scroll or timed track drives and composes with them
 * natively; their paint deltas are properties no other motion here touches.
 *
 * REQ-335 — the timed tracks come last, and each claims on ITS OWN TARGET. A
 * part-scoped track therefore never contests the node's own entrance or scroll
 * track, because they move different elements; two tracks on the same part do.
 */
export function l1MotionClaims(
  node: Readonly<{
    reveal?: L1Entrance
    scrollTrack?: L1ScrollMotion
    interaction?: L1Interaction
    animate?: L1Animation
  }>,
): readonly L1MotionClaim[] {
  const claims: L1MotionClaim[] = []

  if (node.reveal) {
    const composed = Array.isArray(node.reveal)
    l1EntranceSteps(node.reveal).forEach((step, index) => {
      const at = composed ? `reveal/${index}` : 'reveal'
      for (const property of step.properties) claims.push({ property, at, animated: false })
    })
  }

  if (node.scrollTrack) {
    const composed = Array.isArray(node.scrollTrack)
    l1ScrollTracks(node.scrollTrack).forEach((track, index) => {
      const at = composed ? `scrollTrack/${index}` : 'scrollTrack'
      for (const property of l1ScrollTrackProperties(track)) {
        claims.push({ property, at, animated: true })
      }
    })
  }

  for (const state of ['hover', 'focus'] as const) {
    if (node.interaction?.[state]?.opacity !== undefined) {
      claims.push({ property: 'opacity', at: `interaction/${state}`, animated: false })
    }
  }

  if (node.animate) {
    const composed = Array.isArray(node.animate)
    l1AnimateTracks(node.animate).forEach((track, index) => {
      const at = composed ? `animate/${index}` : 'animate'
      const target = l1IsFrameTrack(track) ? L1_FRAME_TARGET : track.part
      for (const property of l1AnimateTrackProperties(track)) {
        claims.push({ property, at, animated: true, target })
      }
    })
  }

  return claims
}
