/**
 * REQ-329 — **more than one animation on one element, across triggers, composed
 * rather than replaced.**
 *
 * REQ-326 gave one trigger — the entrance — a list, so a node could fade quickly
 * and rise slowly. This is the other half, and the half the ticket names as the
 * hard blocker: the natural authoring request the moment a second motion primitive
 * exists is *"fade in on entry, and then drift as I scroll"* — two animations on one
 * node, with DIFFERENT triggers. REQ-325 refused exactly that, by name
 * (`oneMotionDriver`: "a node cannot carry both `reveal` and `scrollTrack`").
 *
 * The composition rules the ticket asks to be decided, and what was decided:
 *
 *   - **Two motions targeting the same property.** REFUSED, not later-wins. The
 *     ticket offers later-wins as "the simplest rule and probably right"; the
 *     codebase had already answered the same question three days earlier for two
 *     behaviours of one entrance (REQ-326) and answered it with a refusal, because
 *     the dropped half moves no pixel and says nothing about why — an author meets
 *     it as a design that did not arrive instead of as a refusal naming the
 *     contest. One answer, one rule, both triggers.
 *   - **Transform in particular.** Already composed, and REQ-329 keeps it that way
 *     rather than inventing a merge: an entrance rises on the independent
 *     `translate` property, a track drives independent `translate` / `scale`, and a
 *     hover nudges `transform` — so a hover and a track compose natively, and the
 *     only genuine contest left is two motions on the SAME independent property.
 *     That is the one the envelope refuses.
 *   - **Ordering.** Triggers are independent; order is only meaningful *within* a
 *     list, where it is the emission order. Declaration order does decide which
 *     claimant a refusal names as the offender — the second one — so an entrance
 *     that predates the track added beside it reads as the incumbent.
 *
 * And the list form generalises: `scrollTrack` takes one track or a list of two or
 * more, exactly as `reveal` does, so "fade on the way in, scale on the way out" is
 * two triggers on one node rather than a choice between them.
 *
 * MIGRATION IS BY CONSTRUCTION: both fields are unions whose first member is the
 * single object, so every document already authored stays valid and renders
 * byte-identically.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_ENVELOPE,
  L1_STRUCTURAL_RULES,
  l1MotionClaims,
  validateL1,
  type L1Document,
  type L1Node,
  type L1ScrollTrack,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

function escapeSelector(selector: string): string {
  return selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
}

/** Every declaration a selector carries outside any `@media` / `@supports`. */
function baseDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0].split('@supports')[0]
  const rules = [...head.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

/** The body of the `@supports` block every scroll-track declaration is gated on. */
function supportsBlock(css: string): string {
  const at = css.indexOf('@supports (animation-timeline: view())')
  return at === -1 ? '' : css.slice(at)
}

/** The declarations of a selector inside the `@supports` gate. */
function gatedDecls(css: string, selector: string): string[] {
  const rules = [
    ...supportsBlock(css).matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g')),
  ]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

/** The body of a named `@keyframes` block. */
function keyframesBlock(css: string, name: string): string {
  const m = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css)
  return m ? m[1] : ''
}

/** The value of a longhand on a rule, e.g. `animation-name` → its list. */
function longhand(list: string[], prop: string): string | undefined {
  const found = list.find((d) => d.startsWith(`${prop}:`))
  return found?.slice(prop.length + 1).trim()
}

/** A comma-list longhand, split into its entries. */
function longhandList(list: string[], prop: string): string[] {
  const v = longhand(list, prop)
  return v === undefined ? [] : v.split(',').map((s) => s.trim())
}

/** Every refusal, as `path: message`, so an assertion can pin both. */
function refusals(d: L1Document): string[] {
  const r = validateL1(d)
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`)
}

const pre = (n: number) => `html[data-l1-motion] .l1-${n}:not(.l1-in)`

/** A deep parent, so a node inside it has somewhere to be pinned or tracked. */
function section(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children } as L1Node
}

function hero(extra: Record<string, unknown>): L1Node {
  return { kind: 'image', src: '/hero.jpg', alt: 'The hero', ...extra } as L1Node
}

/** A track that drifts and nothing else — claims `translate` alone. */
const DRIFT: L1ScrollTrack = {
  stops: [
    { at: 0, translateYPct: 10 },
    { at: 1, translateYPct: -10 },
  ],
}

/** A track that fades and nothing else — claims `opacity` alone. */
const FADE_TRACK: L1ScrollTrack = {
  stops: [
    { at: 0, opacity: 0.2 },
    { at: 1, opacity: 1 },
  ],
}

describe('REQ-329 — one element, more than one animation, across triggers', () => {
  /**
   * AC1 — **the composition the ticket was filed for**: an element that both
   * rises-and-fades on entry AND shifts as the reader scrolls.
   *
   * Before this, `oneMotionDriver` refused the pair outright. The reason it gave
   * was true of a *property* and the rule was drawn over the whole *pairing*: a
   * CSS animation wins the properties it names, so an entrance that fades while a
   * track drifts has no contest in it at all.
   *
   * What composition means concretely, and what is asserted: the entrance's
   * transition and pre-state are emitted for `opacity`, the track's `@keyframes`
   * and animation are emitted for `translate`, and neither emitter has dropped a
   * declaration on account of the other.
   */
  it('test_UAT_FC_REQ-329_an_entrance_and_a_scroll_track_compose_on_one_node', () => {
    const d = doc(section([hero({ reveal: { fromOpacity: 0, durationMs: 500 }, scrollTrack: DRIFT })]))
    expect(refusals(d)).toEqual([])
    const { css, html } = renderL1Document(d)

    // The entrance, intact: the pre-state it fades from, and its transition.
    expect(baseDecls(css, pre(1))).toEqual(['opacity: 0'])
    const base = baseDecls(css, '.l1-1')
    expect(longhandList(base, 'transition-property')).toEqual(['opacity'])
    expect(longhand(base, 'transition-duration')).toBe('500ms')
    // And the observer that drives it is still on the page and still owns the node.
    expect(html).toContain('l1-rv')
    expect(html).toContain('IntersectionObserver')

    // The track, intact: its own block, and the animation naming it.
    expect(keyframesBlock(css, 'l1-1-sc')).toContain('0% { translate: 0 10% }')
    const gated = gatedDecls(css, '.l1-1')
    expect(longhandList(gated, 'animation-name')).toEqual(['l1-1-sc'])
    expect(longhandList(gated, 'animation-timeline')).toEqual(['view()'])

    // THE TWO TOUCH DIFFERENT PROPERTIES, which is the whole of why they compose:
    // the animation owns `translate` outright and never contends for the `opacity`
    // the entrance transitions. Read from the projection the validator refuses by,
    // so the disjointness asserted here is the disjointness enforced there.
    expect(keyframesBlock(css, 'l1-1-sc')).not.toContain('opacity')
    expect(
      l1MotionClaims({ reveal: { fromOpacity: 0, durationMs: 500 }, scrollTrack: DRIFT }).map(
        (c) => `${c.at}:${c.property}`,
      ),
    ).toEqual(['reveal:opacity', 'scrollTrack:translate'])

    // And both degrade to the design rather than to a blank: the entrance's
    // reduced-motion rule restores the settled opacity, and the animation is not
    // emitted under that preference at all — so a visitor who asked for no motion
    // sees the node, placed and opaque, not a node waiting to be revealed.
    const reducedBlocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\}/g)]
    const reduced = reducedBlocks.find((b) => b[1].trim() === '(prefers-reduced-motion: reduce)')
    expect(reduced?.[2]).toContain('opacity: 1')
    expect(reduced?.[2]).not.toContain('animation-name')
  })

  /**
   * AC2 — **a contested property is refused, naming the property and both
   * claimants** — never resolved by precedence.
   *
   * The ticket offers later-wins; this is the deliberate departure from it, on
   * REQ-326's grounds. Every pairing that can contest is checked, because the rule
   * is one rule over the node's motions rather than one per pair of axes: entrance
   * against track, track against track, and hover against track. A hover's
   * `opacity` beside a track's fade is the same trap wearing a third trigger's
   * clothes, and leaving it out would be exactly the retrofit the ticket says is
   * more expensive later.
   */
  it('test_UAT_FC_REQ-329_a_contested_property_is_refused_and_names_both_claimants', () => {
    // Entrance fades, track fades: `opacity` twice.
    const entranceVsTrack = refusals(
      doc(section([hero({ reveal: { fromOpacity: 0 }, scrollTrack: FADE_TRACK })])),
    )
    expect(entranceVsTrack).toContain(
      "/root/children/0/scrollTrack: a property a `scrollTrack` animates cannot be animated by anything else on the node: 'opacity' is already animated by `reveal`",
    )

    // Two tracks, both drifting: within one animation list the LAST animation to
    // name a property wins, so the first track's drift would silently vanish.
    const trackVsTrack = refusals(doc(section([hero({ scrollTrack: [DRIFT, { ...DRIFT }] })])))
    expect(trackVsTrack).toContain(
      "/root/children/0/scrollTrack/1: a property a `scrollTrack` animates cannot be animated by anything else on the node: 'translate' is already animated by `scrollTrack/0`",
    )

    // A hover that dims beside a track that fades. The animation wins for the
    // length of the range, so the hover moves nothing — a control that looks dead
    // under the pointer with nothing anywhere to say why.
    const hoverVsTrack = refusals(
      doc(section([hero({ interaction: { hover: { opacity: 0.6 } }, scrollTrack: FADE_TRACK })])),
    )
    expect(hoverVsTrack).toContain(
      "/root/children/0/interaction/hover: a property a `scrollTrack` animates cannot be animated by anything else on the node: 'opacity' is already animated by `scrollTrack`",
    )

    // ORDERING: triggers are independent, and declaration order decides only which
    // claimant is named as the offender — the second. The claim projection is one
    // reading shared with the renderer, so what is refused and what is emitted
    // cannot come apart.
    expect(
      l1MotionClaims({ reveal: { fromOpacity: 0 }, scrollTrack: FADE_TRACK }).map((c) => [
        c.property,
        c.at,
        c.animated,
      ]),
    ).toEqual([
      ['opacity', 'reveal', false],
      ['opacity', 'scrollTrack', true],
    ])

    // TWO TRANSITIONS ON ONE PROPERTY ARE NOT A CONTEST. An entrance fade and a
    // hover dim both move `opacity` and both compose: the pre-state stops matching
    // the moment the node settles, and the hover rule takes it from there. Only a
    // contest involving an ANIMATION is refused.
    expect(
      refusals(doc(section([hero({ reveal: { fromOpacity: 0 }, interaction: { hover: { opacity: 0.6 } } })]))),
    ).toEqual([])
  })

  /**
   * AC3 — **`scrollTrack` takes a list**, each entry with its own trigger (its own
   * view range) and its own stops.
   *
   * One track carries one `range`, so "resolve on the way in, lift away on the way
   * out" had no spelling: naming a second track replaced the first. The renderer
   * emits one `@keyframes` block and one entry in each `animation-*` list per
   * track, which is CSS's own composition mechanism — a second `animation-name`
   * declaration would replace the first, which is the clobber the list avoids.
   */
  it('test_UAT_FC_REQ-329_two_scroll_tracks_compose_each_over_its_own_range', () => {
    const d = doc(
      section([
        hero({
          scrollTrack: [
            { range: 'enter', stops: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] },
            { range: 'exit', stops: [{ at: 0, scale: 1 }, { at: 1, scale: 1.2 }] },
          ],
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const css = renderL1Document(d).css

    // One block per track, each indexed — and each holding only its own property.
    expect(keyframesBlock(css, 'l1-1-sc0')).toContain('0% { opacity: 0 }')
    expect(keyframesBlock(css, 'l1-1-sc1')).toContain('100% { scale: 1.2 }')

    // One entry per track in every animation longhand, in authored order, so both
    // run at once rather than the second replacing the first.
    const gated = gatedDecls(css, '.l1-1')
    expect(longhandList(gated, 'animation-name')).toEqual(['l1-1-sc0', 'l1-1-sc1'])
    expect(longhandList(gated, 'animation-range')).toEqual([
      'entry 0% entry 100%',
      'exit 0% exit 100%',
    ])
    expect(longhandList(gated, 'animation-timeline')).toEqual(['view()', 'view()'])
    expect(longhandList(gated, 'animation-fill-mode')).toEqual(['both', 'both'])
    expect(longhandList(gated, 'animation-duration')).toEqual(['auto', 'auto'])

    // Every block rides above the gate that names it, as REQ-325 established: an
    // unreferenced block is inert, so a browser that never enters the gate never
    // runs one.
    expect(css.indexOf('@keyframes l1-1-sc0')).toBeLessThan(css.indexOf('@supports'))
    expect(css.indexOf('@keyframes l1-1-sc1')).toBeLessThan(css.indexOf('@supports'))
  })

  /**
   * AC4 — **a single object keeps working, unchanged**, and a one-element list is
   * refused rather than admitted as a second spelling of it.
   *
   * The ticket asks for exactly this ("accept either an object or a list, so
   * nothing already authored breaks"), and the renderer's output for the single
   * form is byte-identical to what REQ-325 shipped: the same keyframes NAME, and
   * single-valued longhands rather than one-element lists. Two spellings of one
   * thing is the drift the schema refuses everywhere else.
   */
  it('test_UAT_FC_REQ-329_a_single_track_is_unchanged_and_a_one_item_list_is_refused', () => {
    const single = doc(section([hero({ scrollTrack: FADE_TRACK })]))
    expect(refusals(single)).toEqual([])
    const gated = gatedDecls(renderL1Document(single).css, '.l1-1')
    expect(longhand(gated, 'animation-name')).toBe('l1-1-sc')
    expect(longhand(gated, 'animation-duration')).toBe('auto')
    expect(longhand(gated, 'animation-range')).toBe('cover 0% cover 100%')

    // A one-element array is not a legal spelling of the single form — refused by
    // the schema itself, before any structural rule is reached.
    expect(validateL1(doc(section([hero({ scrollTrack: [FADE_TRACK] })]))).ok).toBe(false)
  })

  /**
   * AC5 — **each track is bounded on its own, and the refusal says which.**
   *
   * REQ-326's reason, restated for the second list: told only that some stop on
   * this node is out of range, an author with two tracks has to bisect to find out
   * which. And the list itself is bounded — at three, because a track claims at
   * least one of the three properties a scroll animation drives and no two may
   * claim the same one, so a fourth track could not animate anything.
   */
  it('test_UAT_FC_REQ-329_each_track_is_bounded_and_the_refusal_names_which', () => {
    const outOfRange = refusals(
      doc(
        section([
          hero({
            scrollTrack: [
              DRIFT,
              { stops: [{ at: 0, scale: 1 }, { at: 1, scale: L1_ENVELOPE.transformScale.max * 10 }] },
            ],
          }),
        ]),
      ),
    )
    expect(outOfRange.some((m) => m.startsWith('/root/children/0/scrollTrack/1/stops/1/scale:'))).toBe(
      true,
    )

    // A single track keeps REQ-325's paths verbatim, so an existing refusal reads
    // exactly as it always did.
    const singleOutOfRange = refusals(
      doc(section([hero({ scrollTrack: { stops: [{ at: 0, scale: 1 }, { at: 1, scale: 1e6 }] } })])),
    )
    expect(singleOutOfRange.some((m) => m.startsWith('/root/children/0/scrollTrack/stops/1/scale:'))).toBe(
      true,
    )

    // The list's own ceiling, stated as a number an author can read rather than
    // met as three separate contests.
    const tooMany = refusals(
      doc(
        section([
          hero({
            scrollTrack: [
              { range: 'enter', stops: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] },
              { range: 'exit', stops: [{ at: 0, scale: 1 }, { at: 1, scale: 1.2 }] },
              { range: 'contain', stops: [{ at: 0, translateYPct: 0 }, { at: 1, translateYPct: 5 }] },
              { range: 'cover', stops: [{ at: 0, translateYPct: 0 }, { at: 1, translateYPct: 5 }] },
            ],
          }),
        ]),
      ),
    )
    expect(tooMany).toContain(
      `/root/children/0/scrollTrack: 4 scroll tracks out of range [${L1_ENVELOPE.scrollTracks.min}, ${L1_ENVELOPE.scrollTracks.max}]`,
    )
  })

  /**
   * AC6 — **a hover composes with a track and with an entrance**, because the three
   * move different CSS properties.
   *
   * This is the ticket's "transform in particular" bullet, and the answer is the
   * one the renderer already chose and REQ-329 keeps: an entrance rises on the
   * independent `translate`, a track drives independent `translate` / `scale`, and a
   * hover nudges `transform`. CSS applies the independent properties and then
   * `transform`, so a hover's lift ADDS to whatever the track has the node at
   * rather than replacing it — which is why there is no merge to invent and why
   * nothing here needs a rule.
   */
  it('test_UAT_FC_REQ-329_a_hover_composes_with_an_entrance_and_a_track', () => {
    const d = doc(
      section([
        hero({
          reveal: { fromOpacity: 0, durationMs: 400 },
          scrollTrack: [DRIFT, { stops: [{ at: 0, scale: 1 }, { at: 1, scale: 1.1 }] }],
          interaction: { transition: { durationMs: 150 }, hover: { motion: { offsetYPx: -4 } } },
        }),
      ]),
    )
    expect(refusals(d)).toEqual([])
    const css = renderL1Document(d).css

    // The hover moves `transform`; the tracks move `translate` and `scale`. Three
    // properties, three owners, nothing replaced.
    expect(baseDecls(css, '.l1-1:hover')).toEqual(['transform: translate(0px, -4px)'])
    expect(keyframesBlock(css, 'l1-1-sc0')).toContain('translate: 0 10%')
    expect(keyframesBlock(css, 'l1-1-sc1')).toContain('scale: 1.1')

    // And the hover's transition and the entrance's reach ONE merged declaration
    // set, as REQ-100 established — two independent emissions would leave only the
    // last one standing.
    const base = baseDecls(css, '.l1-1')
    expect(longhandList(base, 'transition-property').sort()).toEqual(['opacity', 'transform'])
    expect(longhandList(base, 'transition-duration')).toHaveLength(2)
  })

  /**
   * AC7 — **composing costs the track none of the properties that make it safe.**
   *
   * REQ-325's guarantees are per-mechanism, and a list is more mechanisms: every
   * animation declaration for every track still sits inside BOTH the feature query
   * and the reduced-motion query, so a browser without view-progress timelines and
   * a visitor who asked for no motion each get the node's own authored design
   * rather than a blank. And the edit channel still renders settled — it emits no
   * animation for any track, for the same reason it emits no entrance.
   */
  it('test_UAT_FC_REQ-329_a_composed_track_keeps_the_safety_properties', () => {
    const d = doc(
      section([
        hero({
          scrollTrack: [
            { range: 'enter', stops: [{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }] },
            { range: 'exit', stops: [{ at: 0, scale: 1 }, { at: 1, scale: 1.2 }] },
          ],
        }),
      ]),
    )
    const css = renderL1Document(d).css

    // Not one `animation-*` declaration outside the gate, for either track.
    expect(baseDecls(css, '.l1-1').filter((x) => x.startsWith('animation-'))).toEqual([])
    const gate = supportsBlock(css)
    expect(gate.slice(0, gate.indexOf('{', gate.indexOf('@media')))).toContain(
      'not (prefers-reduced-motion: reduce)',
    )

    // The edit channel renders SETTLED: a track's first stop is not the settled
    // state, so the whole mechanism — every block and every declaration — is
    // withheld rather than half-emitted.
    const edit = renderL1Document(d, { edit: true }).css
    expect(edit).not.toContain('@keyframes')
    expect(edit).not.toContain('animation-name')

    // The structural rule is projected from the validator's own table, so the
    // reference states it the day it is declared (BUG-48).
    expect(L1_STRUCTURAL_RULES.animatedPropertyIsExclusive).toContain('scrollTrack')
  })
})
