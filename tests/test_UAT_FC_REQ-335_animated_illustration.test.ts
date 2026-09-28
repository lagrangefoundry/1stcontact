/**
 * REQ-335 — **an illustration that performs**: motion that loops, motion that
 * expresses a sequence, and motion aimed at PART of a drawing.
 *
 * The request names three walls and asks for three fixes in cost order. Two of the
 * three answers here differ from what it asked for, and both differences are the
 * point of the ticket rather than a narrowing of it.
 *
 * **Option A — permit declarative SMIL in a generated drawing — was refused.** Not
 * on the security argument the request anticipates and rebuts (it is right:
 * `<animate>` is declarative and is not script), but on two facts it could not see
 * from outside:
 *
 *   1. SMIL has no media-query gate and can be paused only by script, so a drawing
 *      carrying it would animate for a visitor who asked their operating system for
 *      no motion. Every other motion in this platform degrades to the authored
 *      design; this one could not be made to.
 *   2. `prefers-reduced-motion: reduce` is the capture gate's freeze-determinism
 *      precondition. SMIL ignores the emulated preference, so an animated drawing
 *      would be photographed at an arbitrary animation time.
 *
 * And a third fact removes the motive: `begin="mouseover"`, which the request calls
 * "most of what I actually wanted", **cannot work through the channel a drawing
 * arrives on at all.** A drawing reaches the page as `<img src>`, and browsers run
 * `<img>`-embedded SVG with interactivity off — it receives no pointer events.
 * Permitting the attribute would have accepted it and then done nothing.
 *
 * So `validateSvg` is untouched, and what replaces A is C: the drawing is placed IN
 * the page, where it has real pointer events, real cascade participation and the
 * platform's own reduced-motion gate — and the animation is authored in L1 as
 * structured data rather than as free-form timing strings inside a file.
 *
 * **B and C are ONE primitive, not two features.** The request's own "Related" note
 * asks for one coherent model of *what animates, when it is triggered, and how
 * several animations on one node compose*. `animate` is that model: a timed track
 * that may aim at the node or at a named part, so there is one schema, one
 * collision rule, one reduced-motion gate and one emitter instead of two of each.
 * It is deliberately the same SHAPE as REQ-325's scroll track — ordered stops, a
 * list form that composes — so the three drivers (entrance, scroll, clock) read as
 * one language and the envelope's one exclusivity rule covers all of them.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_ENVELOPE,
  L1_STRUCTURAL_RULES,
  l1InlinedDrawings,
  l1MotionClaims,
  validateL1,
  validateSvg,
  type L1AnimateTrack,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

function section(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children } as L1Node
}

/** The hero plate, as a node: an image that may or may not declare `parts`. */
function plate(extra: Record<string, unknown>): L1Node {
  return { kind: 'image', src: '/assets/hero.svg', alt: 'The machine', ...extra } as L1Node
}

/**
 * A drawing with two independently named parts — the request's own example,
 * reduced to its bones: the arm that must move, and the parchment that must not.
 */
const DRAWING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<g id="left-arm"><path d="M10 10 L50 50" stroke="#000" stroke-width="2"/></g>' +
  '<g id="lever-beam"><line x1="20" y1="80" x2="80" y2="80" stroke="#000"/></g>' +
  '<g id="parchment"><rect x="0" y="0" width="100" height="100" fill="#eee"/></g>' +
  '</svg>'

const DRAWINGS = { 'hero.svg': DRAWING }

function escapeSelector(selector: string): string {
  return selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
}

/** Everything outside any `@media` / `@supports` block. */
function baseCss(css: string): string {
  return css.split('@media')[0].split('@supports')[0]
}

/** The body of the `not (prefers-reduced-motion)` block — where all motion lives. */
function motionBlock(css: string): string {
  const at = css.indexOf('@media not (prefers-reduced-motion: reduce)')
  if (at === -1) return ''
  const open = css.indexOf('{', at)
  let depth = 0
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  return css.slice(open + 1)
}

/** The declarations a selector carries inside a given block of CSS. */
function declsIn(block: string, selector: string): string[] {
  const rules = [...block.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

/** The value of one longhand within a declaration list. */
function longhand(decls: string[], prop: string): string | undefined {
  const found = decls.find((d) => d.startsWith(`${prop}:`))
  return found?.slice(prop.length + 1).trim()
}

/** A comma-list longhand, split into its entries. */
function longhandList(decls: string[], prop: string): string[] {
  const v = longhand(decls, prop)
  return v === undefined ? [] : v.split(',').map((s) => s.trim())
}

/** The body of a named `@keyframes` block. */
function keyframesBlock(css: string, name: string): string {
  const m = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css)
  return m ? m[1] : ''
}

/** Every refusal, as `path: message`, so an assertion can pin both. */
function refusals(d: L1Document): string[] {
  const r = validateL1(d)
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`)
}

/** A breath: three stops, a loop, alternating — the ambient case, end to end. */
const BREATHE: L1AnimateTrack = {
  durationMs: 4000,
  iterations: 'infinite',
  direction: 'alternate',
  easing: 'ease-in-out',
  stops: [
    { at: 0, scale: 1 },
    { at: 0.5, scale: 1.04 },
    { at: 1, scale: 1 },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
describe('REQ-335 B — the clock as a driver: looping, sequenced, re-triggerable', () => {
  /**
   * The capability the request opens with: "Neither can express a sequence,
   * neither loops." Both halves, in one assertion — three stops (a sequence, which
   * a two-state transition cannot be) and `infinite` (a loop, which a one-shot
   * entrance cannot be).
   */
  it('test_UAT_FC_REQ-335_a_plate_loops_and_carries_a_sequence', () => {
    const d = doc(section([plate({ animate: BREATHE })]))
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d)

    // A SEQUENCE: three keyframe stops, not two states.
    const frames = keyframesBlock(css, 'l1-1-an')
    expect(frames).toContain('0% { scale: 1 }')
    expect(frames).toContain('50% { scale: 1.04 }')
    expect(frames).toContain('100% { scale: 1 }')

    // A LOOP, with the timing the author chose.
    const decls = declsIn(motionBlock(css), '.l1-1')
    expect(longhand(decls, 'animation-name')).toBe('l1-1-an')
    expect(longhand(decls, 'animation-duration')).toBe('4000ms')
    expect(longhand(decls, 'animation-iteration-count')).toBe('infinite')
    expect(longhand(decls, 'animation-direction')).toBe('alternate')
    expect(longhand(decls, 'animation-timing-function')).toBe('ease-in-out')
    // Both ends held, so a finite track does not snap back to the design.
    expect(longhand(decls, 'animation-fill-mode')).toBe('both')
  })

  /**
   * "a trigger (`load`, `hover`, `in-view`)". `hover` is the one the request cares
   * most about, and the whole of it is a selector — no script, no observer, nothing
   * to fail.
   */
  it('test_UAT_FC_REQ-335_hover_triggers_with_no_script_at_all', () => {
    const d = doc(section([plate({ animate: { ...BREATHE, trigger: 'hover' } })]))
    expect(refusals(d)).toEqual([])
    const { html, css } = renderL1Document(d)
    expect(declsIn(motionBlock(css), '.l1-1:hover')).toContain('animation-name: l1-1-an')
    // The resting node is not animating: the rule is the hovered one only.
    expect(longhand(declsIn(motionBlock(css), '.l1-1'), 'animation-name')).toBeUndefined()
    expect(html).not.toContain('<script')
  })

  /**
   * `in-view` BORROWS REQ-100's observer rather than bringing a second one — so it
   * inherits that mechanism's fail-visible property for free: the marker and the
   * class both come from the script, and with no script neither arrives.
   *
   * Asked of a node with NO entrance, which is the case that proves the observer is
   * driven by the node rather than by the `reveal` axis: a hero that only drifts
   * has no entrance to hang off.
   */
  it('test_UAT_FC_REQ-335_in_view_borrows_the_entrance_observer', () => {
    const d = doc(section([plate({ animate: { ...BREATHE, trigger: 'in-view' } })]))
    expect(refusals(d)).toEqual([])
    const { html, css } = renderL1Document(d)
    // The observer's handle is on the node even though it has no `reveal`...
    expect(html).toContain('class="l1-1 l1-rv"')
    // ...the animation is gated on BOTH the script's marker and the class it adds...
    expect(
      declsIn(motionBlock(css), 'html[data-l1-motion] .l1-1.l1-in'),
    ).toContain('animation-name: l1-1-an')
    // ...and the script ships, because this page now has motion to drive.
    expect(html).toContain('<script')
  })

  /**
   * THE GUARANTEE THAT DECIDED AGAINST SMIL, asserted directly: every animation
   * declaration is inside the reduced-motion gate, and the node's base rule carries
   * none. A visitor who asked for no motion gets the authored design.
   */
  it('test_UAT_FC_REQ-335_every_track_degrades_to_the_design_under_reduced_motion', () => {
    const d = doc(section([plate({ parts: true, animate: { ...BREATHE, part: 'left-arm' } })]))
    const { css } = renderL1Document(d, { drawings: DRAWINGS })
    expect(css).toContain('@media not (prefers-reduced-motion: reduce)')
    // Not one `animation-*` longhand escapes the gate, anywhere in the document.
    expect(baseCss(css)).not.toMatch(/animation-/)
    // And the gated block is where they all are.
    expect(motionBlock(css)).toMatch(/animation-name/)
  })

  /** REQ-116 — the edit channel renders settled, so it emits no animation at all. */
  it('test_UAT_FC_REQ-335_the_edit_channel_emits_no_animation', () => {
    const d = doc(section([plate({ parts: true, animate: { ...BREATHE, part: 'left-arm' } })]))
    const { css } = renderL1Document(d, { drawings: DRAWINGS, edit: true })
    expect(css).not.toMatch(/animation-name/)
    expect(css).not.toMatch(/@keyframes/)
  })

  /**
   * REQ-329's composition, extended to the clock rather than duplicated for it: two
   * tracks on one node become ONE rule carrying two comma-joined animations, which
   * is how CSS itself composes. A second `animation-name` declaration would have
   * replaced the first.
   */
  it('test_UAT_FC_REQ-335_two_tracks_on_one_node_compose_as_one_list', () => {
    const d = doc(
      section([
        plate({
          animate: [
            BREATHE,
            { durationMs: 9000, iterations: 'infinite', stops: [{ at: 0, rotateDeg: -1 }, { at: 1, rotateDeg: 1 }] },
          ],
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d)
    const decls = declsIn(motionBlock(css), '.l1-1')
    expect(longhandList(decls, 'animation-name')).toEqual(['l1-1-an0', 'l1-1-an1'])
    expect(longhandList(decls, 'animation-duration')).toEqual(['4000ms', '9000ms'])
    // Each track keeps its own iteration count within the list.
    expect(longhandList(decls, 'animation-iteration-count')).toEqual(['infinite', 'infinite'])
  })

  /**
   * And the contest that is NOT composition: two animations claiming one property of
   * one element. Refused naming the property and both claimants, on exactly REQ-329's
   * terms — the later claim moves no pixel and would say nothing about why.
   */
  it('test_UAT_FC_REQ-335_two_tracks_claiming_one_property_are_refused', () => {
    const d = doc(
      section([
        plate({
          animate: [
            BREATHE,
            { durationMs: 2000, stops: [{ at: 0, scale: 1 }, { at: 1, scale: 2 }] },
          ],
        }),
      ]),
    )
    const said = refusals(d)
    expect(said).toHaveLength(1)
    expect(said[0]).toContain(L1_STRUCTURAL_RULES.animatedPropertyIsExclusive)
    expect(said[0]).toContain("'scale'")
    // BOTH claimants named: the offender in the path, the incumbent in the message.
    expect(said[0]).toContain('animate/1')
    expect(said[0]).toContain('`animate/0`')
  })

  /**
   * A timed track composes with the OTHER drivers where they move different
   * properties — "fade in as I arrive, then breathe forever" is one node with two
   * triggers, and it is the first thing an author asks for once both exist.
   */
  it('test_UAT_FC_REQ-335_a_track_composes_with_an_entrance_that_moves_something_else', () => {
    const d = doc(
      section([
        plate({
          reveal: { durationMs: 400, fromOpacity: 0 },
          animate: BREATHE,
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    // The claims agree: the entrance owns `opacity`, the track owns `scale`, and
    // the reading the validator refuses from is the reading the emitter emits from.
    const claims = l1MotionClaims(
      { reveal: { durationMs: 400, fromOpacity: 0 }, animate: BREATHE },
    )
    expect(claims.map((c) => `${c.at}:${c.property}:${c.animated}`)).toEqual([
      'reveal:opacity:false',
      'animate:scale:true',
    ])
  })

  /** The envelope's numbers, each refused by name and at its own path. */
  it('test_UAT_FC_REQ-335_the_envelope_bounds_a_timed_track', () => {
    const over = L1_ENVELOPE.animateDurationMs.max + 1
    expect(refusals(doc(section([plate({ animate: { ...BREATHE, durationMs: over } })])))).toEqual([
      `/root/children/0/animate/durationMs: durationMs ${over} out of range [${L1_ENVELOPE.animateDurationMs.min}, ${L1_ENVELOPE.animateDurationMs.max}]`,
    ])

    // Stops read start-to-end, so they ascend strictly.
    const backwards = doc(
      section([
        plate({
          animate: { durationMs: 1000, stops: [{ at: 0.6, scale: 1 }, { at: 0.2, scale: 2 }] },
        }),
      ]),
    )
    expect(refusals(backwards)[0]).toContain(L1_STRUCTURAL_RULES.ascendingAnimateStops)

    // A stop that names no property is a stop nobody would ever see move.
    const inert = doc(
      section([plate({ animate: { durationMs: 1000, stops: [{ at: 0 }, { at: 1, scale: 2 }] } })]),
    )
    expect(refusals(inert)[0]).toContain(L1_STRUCTURAL_RULES.animateStopMoves)

    // An iteration COUNT is bounded; `infinite` is a different spelling, not a number.
    const tooMany = L1_ENVELOPE.animateIterations.max + 1
    expect(
      refusals(doc(section([plate({ animate: { ...BREATHE, iterations: tooMany } })])))[0],
    ).toContain(`iterations ${tooMany} out of range`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('REQ-335 C — addressable parts: the illustration that performs', () => {
  /**
   * The wall itself, removed. An `<img>` is a window onto another document and
   * nothing in the page can reach inside it; declaring `parts` places the drawing
   * IN the page, where an `id` is an ordinary element.
   */
  it('test_UAT_FC_REQ-335_a_declared_drawing_is_placed_in_the_page', () => {
    const d = doc(section([plate({ parts: true })]))
    expect(refusals(d)).toEqual([])
    const { html } = renderL1Document(d, { drawings: DRAWINGS })
    expect(html).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(html).not.toContain('<img')
    // Announced as ONE image carrying the node's `alt`, which is what the `<img>`
    // it replaces already was — not as hundreds of anonymous paths.
    expect(html).toContain('role="img" aria-label="The machine"')
    // Every rule the emitter wrote for this node still lands on the node.
    expect(html).toContain('class="l1-1"')
  })

  /**
   * NOTHING REWRITES THE DRAWING. The bytes that passed the content validator are
   * the bytes the browser receives — no id renamed, no reference rewritten — which
   * is the property `validateSvg` exists to provide and the property a sanitiser
   * that edits-and-continues cannot offer.
   */
  it('test_UAT_FC_REQ-335_the_accepted_bytes_reach_the_page_unaltered', () => {
    const { html } = renderL1Document(doc(section([plate({ parts: true })])), {
      drawings: DRAWINGS,
    })
    expect(html).toContain(DRAWING)
  })

  /**
   * **THE CAPABILITY THE WHOLE REQUEST IS ABOUT**: "the arms must move while the
   * parchment does not". Two parts of one drawing, each on its own clock, and no
   * refusal — because the exclusivity rule is keyed by target as well as property,
   * so two tracks that both rotate contest nothing when they rotate different arms.
   */
  it('test_UAT_FC_REQ-335_two_parts_of_one_drawing_animate_independently', () => {
    const d = doc(
      section([
        plate({
          parts: true,
          animate: [
            { part: 'left-arm', durationMs: 1200, iterations: 'infinite', stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 18 }] },
            { part: 'lever-beam', durationMs: 3000, iterations: 'infinite', stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: -6 }] },
          ],
        }),
      ]),
    )
    // Two animations, both moving `rotate`, and NOT a collision.
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d, { drawings: DRAWINGS })
    const block = motionBlock(css)
    expect(longhand(declsIn(block, '.l1-1 #left-arm'), 'animation-duration')).toBe('1200ms')
    expect(longhand(declsIn(block, '.l1-1 #lever-beam'), 'animation-duration')).toBe('3000ms')
    // And the parchment, which was named by neither, animates nothing.
    expect(declsIn(block, '.l1-1 #parchment')).toEqual([])
  })

  /**
   * Two tracks on the SAME part DO contest, which is the other half of keying by
   * target: the rule did not become weaker, it became exact.
   */
  it('test_UAT_FC_REQ-335_two_tracks_on_one_part_still_contest', () => {
    const d = doc(
      section([
        plate({
          parts: true,
          animate: [
            { part: 'left-arm', durationMs: 1200, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 18 }] },
            { part: 'left-arm', durationMs: 900, stops: [{ at: 0, rotateDeg: 5 }, { at: 1, rotateDeg: 9 }] },
          ],
        }),
      ]),
    )
    const said = refusals(d)
    expect(said).toHaveLength(1)
    expect(said[0]).toContain("'rotate' on part 'left-arm' is already animated")
  })

  /**
   * A part turns about ITS OWN CENTRE. An SVG element's `transform-box` defaults to
   * the viewBox origin, so "turn the arm" would otherwise swing it around the corner
   * of the drawing — what CSS was asked for, and never what an author meant.
   */
  it('test_UAT_FC_REQ-335_a_part_turns_about_its_own_centre', () => {
    const d = doc(
      section([plate({ parts: true, animate: { part: 'left-arm', durationMs: 1200, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 18 }] } })]),
    )
    const { css } = renderL1Document(d, { drawings: DRAWINGS })
    const decls = declsIn(baseCss(css), '.l1-1 #left-arm')
    expect(decls).toContain('transform-box: fill-box')
    expect(decls).toContain('transform-origin: center')
  })

  /**
   * "the arms begin to draw each other under the cursor" — hover, on a part. The
   * thing option A could never have delivered, because an `<img>` receives no
   * pointer events however its contents are animated.
   */
  it('test_UAT_FC_REQ-335_a_hover_track_on_a_part_is_reachable', () => {
    const d = doc(
      section([
        plate({
          parts: true,
          animate: { part: 'left-arm', trigger: 'hover', durationMs: 900, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 24 }] },
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d, { drawings: DRAWINGS })
    expect(declsIn(motionBlock(css), '.l1-1:hover #left-arm')).toContain('animation-name: l1-1-an')
  })

  /**
   * INERT DEGRADATION, on the terms a slot with no module bound to it already
   * renders by: a render that was handed no drawing emits the `<img>` the node
   * always was, and no rule for a part that is not in the page.
   */
  it('test_UAT_FC_REQ-335_a_drawing_that_cannot_be_supplied_stays_an_img', () => {
    const d = doc(
      section([plate({ parts: true, animate: { part: 'left-arm', durationMs: 900, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 24 }] } })]),
    )
    // Valid either way — `parts` is a request, and its absence is not an error.
    expect(refusals(d)).toEqual([])
    const { html, css } = renderL1Document(d)
    expect(html).toContain('<img')
    expect(html).not.toContain('<svg')
    // No dead rule for a part nobody can see.
    expect(css).not.toContain('#left-arm')
    expect(css).not.toMatch(/@keyframes/)
  })

  /**
   * **THE SECURITY OBLIGATION THAT COMES WITH INLINING.** An asset store
   * legitimately holds operator-placed SVGs, vouched for by a human and never put
   * through a content validator — `IMAGE_EXTENSIONS` accepts `svg` on exactly that
   * footing. Inlining one of those would be a stored-XSS sink that the `<img>`
   * channel had closed for free, so the bytes are re-validated at the last point
   * before they reach the page, and a document that fails stays an `<img>`.
   */
  it('test_UAT_FC_REQ-335_an_unvalidated_drawing_is_never_placed_in_the_page', () => {
    const hostile = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    // Stated as a premise, not assumed: this is a document the validator refuses.
    expect(validateSvg(hostile).ok).toBe(false)
    const { html } = renderL1Document(doc(section([plate({ parts: true })])), {
      drawings: { 'hero.svg': hostile },
    })
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<svg')
    expect(html).toContain('<img')
  })

  /**
   * A part the drawing does not contain is DROPPED, not refused: only the render
   * holds the drawing, and refusing there would take a site off the air over a
   * renamed id. Nothing is emitted for it, so there is no dead rule to mislead
   * whoever debugs it — while the track beside it, whose part is real, still runs.
   */
  it('test_UAT_FC_REQ-335_a_part_the_drawing_lacks_is_dropped_not_refused', () => {
    const d = doc(
      section([
        plate({
          parts: true,
          animate: [
            { part: 'left-arm', durationMs: 1200, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 18 }] },
            { part: 'no-such-part', durationMs: 900, stops: [{ at: 0, opacity: 0.2 }, { at: 1, opacity: 1 }] },
          ],
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d, { drawings: DRAWINGS })
    expect(css).not.toContain('no-such-part')
    // The real one is untouched by its neighbour's absence.
    expect(longhand(declsIn(motionBlock(css), '.l1-1 #left-arm'), 'animation-duration')).toBe('1200ms')
  })

  /**
   * A `part` named where no drawing can ever be placed is REFUSED, because the
   * envelope can see that: the author's mistake is one word, and the symptom would
   * otherwise be a page that simply does not move.
   */
  it('test_UAT_FC_REQ-335_a_part_named_without_parts_is_refused', () => {
    const d = doc(
      section([plate({ animate: { part: 'left-arm', durationMs: 900, stops: [{ at: 0, rotateDeg: 0 }, { at: 1, rotateDeg: 24 }] } })]),
    )
    expect(refusals(d)).toEqual([
      `/root/children/0/animate/part: ${L1_STRUCTURAL_RULES.animatePartNeedsPartsImage}`,
    ])
    // And on a kind that is not an image at all — a box has no drawing to look in.
    const box = doc(
      section([
        { kind: 'box', animate: { part: 'left-arm', durationMs: 900, stops: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] } } as L1Node,
      ]),
    )
    expect(refusals(box)[0]).toContain(L1_STRUCTURAL_RULES.animatePartNeedsPartsImage)
  })

  /**
   * THE DOCUMENT NEVER NAMES A SELECTOR, which has to keep holding now that a
   * document-supplied string reaches one. A part name carrying CSS syntax is emitted
   * through the identifier escape, so it closes nothing and opens nothing.
   */
  it('test_UAT_FC_REQ-335_a_part_name_cannot_become_selector_syntax', () => {
    const nasty = 'a}html{display:none'
    const drawing = DRAWING.replace('id="left-arm"', `id="${nasty}"`)
    expect(validateSvg(drawing).ok).toBe(true)
    const d = doc(
      section([plate({ parts: true, animate: { part: nasty, durationMs: 900, stops: [{ at: 0, opacity: 0.2 }, { at: 1, opacity: 1 }] } })]),
    )
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d, { drawings: { 'hero.svg': drawing } })
    // The braces are escaped rather than emitted, so no rule was closed or opened.
    expect(css).not.toContain('}html{display:none')
    expect(css).toContain('#a\\7d html\\7b display\\3a none')
  })

  /**
   * A placed drawing still LINKS. The inlined form stands in for the `<img>` rather
   * than short-circuiting past it, so every role a picture could already take
   * survives the change.
   */
  it('test_UAT_FC_REQ-335_a_placed_drawing_still_links', () => {
    const d = doc(section([plate({ parts: true, link: { href: '/how' } })]))
    expect(refusals(d)).toEqual([])
    const { html } = renderL1Document(d, { drawings: DRAWINGS })
    expect(html).toContain('<a href="how" style="display:contents">')
    expect(html).toContain('<svg')
    // The anchor wraps the placed drawing, rather than the drawing replacing it.
    expect(html).toMatch(/<a [^>]*><span class="l1-1"/)
  })

  /**
   * ONLY THE DRAWINGS A PAGE ASKED FOR ARE READ. This is what makes the feature free
   * for every site that does not use it: the caller asks the document what to fetch,
   * and a document that declares no `parts` names nothing.
   */
  it('test_UAT_FC_REQ-335_only_the_drawings_a_page_asked_for_are_read', () => {
    const asked = doc(
      section([
        plate({ parts: true }),
        { kind: 'image', src: '/assets/photo.png', alt: 'A photograph' } as L1Node,
        { kind: 'image', src: '/assets/mark.svg', alt: 'A mark' } as L1Node,
      ]),
    )
    // The drawing that asked, and nothing else — not the photograph beside it, and
    // not the SVG that never asked to be placed in the page.
    expect(l1InlinedDrawings(asked)).toEqual(['hero.svg'])
    expect(l1InlinedDrawings(doc(section([plate({})])))).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('REQ-335 A — the drawing surface is deliberately unchanged', () => {
  /**
   * The refusal the request quotes is still the refusal, on purpose. Recorded as a
   * test rather than only as prose, because "we decided not to permit SMIL" is a
   * decision a later reader will otherwise read as an oversight — and because the
   * closed-by-construction property of `validateSvg` is the thing that makes
   * inlining a drawing safe at all.
   */
  it('test_UAT_FC_REQ-335_smil_is_still_refused_by_the_drawing_surface', () => {
    const smil =
      '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="10">' +
      '<animate attributeName="cx" values="20;80;20" dur="3s" repeatCount="indefinite"/>' +
      '</circle></svg>'
    const result = validateSvg(smil)
    expect(result.ok).toBe(false)
    // The element AND every attribute it would have carried — the request's own
    // five messages, unchanged.
    const said = result.errors.map((e) => e.message).join('\n')
    expect(said).toContain('<animate> is not an element a generated image may use.')
    for (const attr of ['attributeName', 'values', 'dur', 'repeatCount']) {
      expect(said).toContain(`'${attr}' is not an attribute a generated image may carry.`)
    }
  })

  /**
   * And the drawing a performing illustration needs passes unchanged — `id` was
   * always an allowed attribute, so naming a part costs the drawing surface nothing.
   * That is why C needed no change to the validator: the language was already there,
   * and what was missing was a page that could reach it.
   */
  it('test_UAT_FC_REQ-335_a_drawing_with_named_parts_needs_no_new_permission', () => {
    expect(validateSvg(DRAWING).ok).toBe(true)
  })
})

/**
 * REQ-335 D — **the film strip: an animation somebody ANIMATED.**
 *
 * B and C move a picture, or a named piece of one, along axes this schema happens
 * to have: opacity, offset, scale, rotation. That is enough for a plate that
 * breathes and an arm that sways, and it is not enough for a walk cycle, a machine
 * that assembles itself, or anything else whose motion is drawn rather than
 * parameterised. The strip is the answer to that: the frames are the animator's,
 * and the only thing the platform contributes is WHICH ONE IS SHOWING.
 *
 * **Why not an animated GIF, which is the obvious form of this.** A GIF begins the
 * instant it decodes and runs on a clock the page cannot reach — there is no
 * property that starts it, stops it, restarts it or holds it still. So it cannot
 * take the `hover` and `in-view` triggers REQ-335 asks for by name, and it cannot
 * be frozen for a visitor who asked their system for no motion or for a capture
 * that has to photograph the same frame twice. A strip gives all of that away for
 * free: the thing being animated is an ordinary CSS property, and this platform
 * already knows how to gate one of those.
 *
 * It is DELIBERATELY NOT A FOURTH DRIVER. A frame track is the same clock, the same
 * triggers, the same `direction` / `iterations` / `delayMs`, the same
 * reduced-motion gate and the same exclusivity rule as B — pointed at a different
 * subject. What differs is only what it is allowed to say: no `easing` (a frame is
 * showing or it is not, so the timing function is derived), and no `part` (a strip
 * has frames, not pieces).
 */
describe('REQ-335 D — the film strip: stepping frames somebody drew', () => {
  /** A six-frame strip of the machine, and the whole sequence played on hover. */
  const STRIP = { src: '/assets/machine.png', frames: 6 }
  const PLAY = { frames: { from: 0, to: 5 }, durationMs: 600, iterations: 'infinite' as const }

  function strip(extra: Record<string, unknown>): L1Node {
    return { kind: 'image', alt: 'The machine, working', ...STRIP, ...extra } as L1Node
  }

  /**
   * THE CAPABILITY, END TO END. The window is static and unconditional; the motion
   * is two keyframes and a step function; the step function lands on every frame of
   * the range and on both of its ends.
   */
  it('test_UAT_FC_REQ-335_a_strip_steps_through_the_frames_it_was_given', () => {
    const d = doc(section([strip({ animate: { ...PLAY, trigger: 'hover' } })]))
    expect(refusals(d)).toEqual([])
    const { html, css } = renderL1Document(d)

    // THE WINDOW. The node's box is one frame; the strip inside it is six times as
    // wide and clipped by the box — which is why the node became a wrapper.
    expect(html).toContain('<span class="l1-1"')
    expect(declsIn(baseCss(css), '.l1-1')).toContain('overflow: hidden')
    const inner = declsIn(baseCss(css), '.l1-1 img')
    expect(inner).toContain('width: 600%')
    expect(inner).toContain('height: 100%')
    expect(inner).toContain('max-width: none')

    // THE MOTION. Frame 0 to frame 5, in six steps that include both ends — so the
    // last frame of a finite pass is the one the author named, not one past it.
    const frames = keyframesBlock(css, 'l1-1-an')
    expect(frames).toContain('0% { translate: 0% 0 }')
    expect(frames).toContain('100% { translate: -83.3333% 0 }')
    const decls = declsIn(motionBlock(css), '.l1-1:hover img')
    expect(longhand(decls, 'animation-name')).toBe('l1-1-an')
    expect(longhand(decls, 'animation-timing-function')).toBe('steps(6, jump-none)')
    expect(longhand(decls, 'animation-duration')).toBe('600ms')
    expect(longhand(decls, 'animation-iteration-count')).toBe('infinite')
  })

  /**
   * THE STOP CONTROL, which is the half of the request a GIF cannot answer. The
   * trigger is a `:hover` selector, so the animation exists only while the pointer
   * is over the picture — and the resting rule, which is what the browser falls back
   * to the moment it leaves, carries no animation at all.
   */
  it('test_UAT_FC_REQ-335_a_strip_stops_when_the_pointer_leaves', () => {
    const d = doc(section([strip({ animate: { ...PLAY, trigger: 'hover' } })]))
    const { css } = renderL1Document(d)
    expect(longhand(declsIn(motionBlock(css), '.l1-1 img'), 'animation-name')).toBeUndefined()
    // And what it falls back to is frame 0 — a real resting state, which is the
    // thing a GIF has no way to express.
    expect(declsIn(baseCss(css), '.l1-1 img')).toContain('translate: 0% 0')
  })

  /**
   * THE OTHER TRIGGER THE REQUEST NAMES — "if we scroll down to an image, the
   * animation begins" — on REQ-100's existing observer, the same one B's tracks
   * borrow. One mechanism, two subjects.
   */
  it('test_UAT_FC_REQ-335_a_strip_can_start_when_it_reaches_the_reader', () => {
    const d = doc(section([strip({ animate: { ...PLAY, trigger: 'in-view' } })]))
    expect(refusals(d)).toEqual([])
    const { html, css } = renderL1Document(d)
    expect(html).toContain('class="l1-1 l1-rv"')
    expect(
      declsIn(motionBlock(css), 'html[data-l1-motion] .l1-1.l1-in img'),
    ).toContain('animation-name: l1-1-an')
  })

  /**
   * ONE FILE, SEVERAL SEQUENCES. A sub-range plays only its own frames, and the
   * step count follows the range rather than the strip — which is what makes an
   * idle loop and an action loop expressible in one asset.
   */
  it('test_UAT_FC_REQ-335_a_sub_range_plays_only_its_own_frames', () => {
    const d = doc(section([strip({ animate: { frames: { from: 2, to: 5 }, durationMs: 400 } })]))
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d)
    const frames = keyframesBlock(css, 'l1-1-an')
    expect(frames).toContain('0% { translate: -33.3333% 0 }')
    expect(frames).toContain('100% { translate: -83.3333% 0 }')
    expect(
      longhand(declsIn(motionBlock(css), '.l1-1 img'), 'animation-timing-function'),
    ).toBe('steps(4, jump-none)')
  })

  /**
   * THE GUARANTEE A GIF CANNOT GIVE, and the reason this shape was chosen over one.
   * Every animation declaration is inside the reduced-motion gate — and the
   * WINDOWING is outside it, so a visitor who asked for no motion sees one frame of
   * the illustration rather than the whole strip squashed into the box.
   */
  it('test_UAT_FC_REQ-335_a_strip_holds_one_frame_under_reduced_motion', () => {
    const d = doc(section([strip({ animate: PLAY })]))
    const { css } = renderL1Document(d)
    expect(baseCss(css)).not.toMatch(/animation-/)
    const inner = declsIn(baseCss(css), '.l1-1 img')
    expect(inner).toContain('width: 600%')
    expect(inner).toContain('translate: 0% 0')
    expect(declsIn(baseCss(css), '.l1-1')).toContain('overflow: hidden')
  })

  /**
   * A strip with NO track is still a window. The declaration is about layout, not
   * about motion, which is what lets the reduced-motion case above be a fallback
   * rather than a second code path.
   */
  it('test_UAT_FC_REQ-335_a_strip_with_no_track_is_still_one_frame', () => {
    const d = doc(section([strip({})]))
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d)
    expect(declsIn(baseCss(css), '.l1-1 img')).toContain('width: 600%')
    expect(css).not.toMatch(/animation-/)
  })

  /**
   * THE COMPOSITION THE WHOLE `animate` MODEL EXISTS FOR, in its cheapest form: the
   * plate drifts on its own clock while the strip inside it plays on another. They
   * both move `translate`, and they do not contest — because they move DIFFERENT
   * ELEMENTS, which is exactly what the claim model's target is for.
   */
  it('test_UAT_FC_REQ-335_a_strip_plays_while_its_plate_drifts', () => {
    const d = doc(
      section([
        strip({
          animate: [
            PLAY,
            {
              durationMs: 8000,
              iterations: 'infinite',
              direction: 'alternate',
              stops: [
                { at: 0, translateXPct: 0 },
                { at: 1, translateXPct: 2 },
              ],
            },
          ],
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const { css } = renderL1Document(d)
    // The strip's track lands on the picture...
    expect(declsIn(motionBlock(css), '.l1-1 img')).toContain('animation-name: l1-1-an0')
    // ...and the plate's on the node, each with its own keyframes.
    expect(declsIn(motionBlock(css), '.l1-1')).toContain('animation-name: l1-1-an1')
    expect(keyframesBlock(css, 'l1-1-an1')).toContain('100% { translate: 2% 0% }')
  })

  /**
   * TWO FRAME TRACKS DO CONTEST, because they drive one element. The refusal names
   * the strip rather than inventing a part that does not exist — REQ-329's rule,
   * reading correctly about a target it did not know about when it was written.
   */
  it('test_UAT_FC_REQ-335_two_frame_tracks_on_one_node_are_refused', () => {
    const d = doc(
      section([
        strip({
          animate: [PLAY, { frames: { from: 0, to: 2 }, durationMs: 300 }],
        }),
      ]),
    )
    expect(refusals(d)).toEqual([
      `/root/children/0/animate/1: ${L1_STRUCTURAL_RULES.animatedPropertyIsExclusive}: 'translate' on the frame strip is already animated by \`animate/0\``,
    ])
  })

  /**
   * A FRAME TRACK NEEDS A STRIP. Refused rather than dropped: the author omitted one
   * field on the node, and the symptom without a refusal is a picture that simply
   * never moves and says nothing about why.
   */
  it('test_UAT_FC_REQ-335_a_frame_track_without_a_strip_is_refused', () => {
    const d = doc(section([{ kind: 'image', src: '/a.png', alt: '', animate: PLAY } as L1Node]))
    expect(refusals(d)).toEqual([
      `/root/children/0/animate/frames: ${L1_STRUCTURAL_RULES.frameTrackNeedsFramesImage}`,
    ])
  })

  /** A range that runs off the end of the strip names a frame the file does not hold. */
  it('test_UAT_FC_REQ-335_a_range_past_the_end_of_the_strip_is_refused', () => {
    const d = doc(section([strip({ animate: { frames: { from: 3, to: 9 }, durationMs: 400 } })]))
    expect(refusals(d)).toEqual([
      `/root/children/0/animate/frames/to: ${L1_STRUCTURAL_RULES.frameRangeWithinStrip}: frame 9 is past the last of 6`,
    ])
  })

  /** A range of one frame is a still, and a backwards one is a `direction`. */
  it('test_UAT_FC_REQ-335_a_range_that_does_not_run_forward_is_refused', () => {
    const d = doc(section([strip({ animate: { frames: { from: 4, to: 4 }, durationMs: 400 } })]))
    expect(refusals(d)).toEqual([
      `/root/children/0/animate/frames: ${L1_STRUCTURAL_RULES.ascendingFrameRange} (got 4…4)`,
    ])
  })

  /**
   * THE TWO MECHANISMS ARE EXCLUSIVE. A drawing placed in the page and a strip
   * stepped inside a window are different answers to different art, and a node that
   * asked for both would have the emitter decide which it meant.
   */
  it('test_UAT_FC_REQ-335_a_node_cannot_be_both_a_drawing_and_a_strip', () => {
    const d = doc(section([strip({ parts: true })]))
    expect(refusals(d)).toEqual([
      `/root/children/0/frames: ${L1_STRUCTURAL_RULES.partsAndFramesExclusive}`,
    ])
  })

  /**
   * A STRIP OWNS ITS OWN FIT. `objectFit` and `objectPosition` place a picture
   * inside its box, which is precisely what the frame mechanism is doing — so an
   * author writing one is writing a value the renderer must ignore. Refused, on the
   * envelope's standing rule that nothing is accepted and then inert.
   */
  it('test_UAT_FC_REQ-335_a_strip_cannot_also_place_its_own_picture', () => {
    const d = doc(section([strip({ axes: { objectFit: 'cover' } })]))
    expect(refusals(d)).toEqual([
      `/root/children/0/axes: ${L1_STRUCTURAL_RULES.framesOwnsObjectFit}`,
    ])
  })

  /** The strip is bounded, because every frame of it is downloaded before one paints. */
  it('test_UAT_FC_REQ-335_the_envelope_bounds_a_strip', () => {
    const over = doc(section([strip({ frames: L1_ENVELOPE.frameCount.max + 1 })]))
    expect(refusals(over)).toEqual([
      `/root/children/0/frames: frames ${L1_ENVELOPE.frameCount.max + 1} out of range [${L1_ENVELOPE.frameCount.min}, ${L1_ENVELOPE.frameCount.max}]`,
    ])
    // The floor is the schema's own: a one-frame strip is a picture.
    const under = doc(section([strip({ frames: 1 })]))
    expect(refusals(under).length).toBeGreaterThan(0)
  })

  /**
   * THE STRIP SURVIVES THE DELIVERY LADDER. A publish wraps the same `<img>` in a
   * `<picture>`, so the mechanism is keyed on a descendant rather than a child — a
   * strip must not stop working the day its site gains responsive renditions.
   */
  it('test_UAT_FC_REQ-335_a_strip_still_steps_inside_a_picture_element', () => {
    const d = doc(section([strip({ animate: PLAY })]))
    const { html, css } = renderL1Document(d, {
      delivery: {
        'machine.png': {
          width: 3000,
          height: 500,
          renditions: [
            { src: 'assets/d/machine-640.png', width: 640 },
            { src: 'assets/machine.png', width: 3000 },
          ],
          sources: [
            {
              type: 'image/webp',
              renditions: [
                { src: 'assets/d/machine-640.webp', width: 640 },
                { src: 'assets/d/machine-3000.webp', width: 3000 },
              ],
            },
          ],
        },
      },
    })
    expect(html).toContain('<span class="l1-1"><picture')
    expect(declsIn(motionBlock(css), '.l1-1 img')).toContain('animation-name: l1-1-an')
  })

  /**
   * THE EDIT CHANNEL RENDERS SETTLED, on B's terms and C's — but it still WINDOWS,
   * because an operator editing the page must see the frame a visitor sees rather
   * than a contact sheet.
   */
  it('test_UAT_FC_REQ-335_the_edit_channel_windows_but_does_not_play', () => {
    const d = doc(section([strip({ animate: PLAY })]))
    const { css } = renderL1Document(d, { edit: true })
    expect(css).not.toMatch(/animation-/)
    expect(declsIn(baseCss(css), '.l1-1 img')).toContain('width: 600%')
  })

  /**
   * The picture is still a picture. The `alt` stays on the `<img>` — a strip is a
   * window onto an image, not a replacement for one, so nothing here has to teach
   * assistive technology a new shape (which is what C's inlined drawing did need).
   */
  it('test_UAT_FC_REQ-335_a_strip_is_still_announced_as_its_picture', () => {
    const d = doc(section([strip({ animate: PLAY })]))
    const { html } = renderL1Document(d)
    expect(html).toContain('alt="The machine, working"')
    expect(html).not.toContain('role="img"')
  })
})
