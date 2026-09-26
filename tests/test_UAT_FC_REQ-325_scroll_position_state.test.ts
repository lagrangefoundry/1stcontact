/**
 * REQ-325 — **scroll POSITION as a driver**, in two separable axes.
 *
 * REQ-100 gave L1 one motion primitive and it is a *trigger*: `reveal` fires once
 * as a node crosses the fold, settles, and is spent. Everything an editorial page
 * wants to do with the reader's descent needs a *driver* instead — the state of an
 * element as a continuous function of scroll position. The request that filed this
 * had a specific composition in hand (a full-bleed hero locking at the top of the
 * viewport while the masthead scrolls up behind it, releasing when its section has
 * gone by) and named the two capabilities that compose it:
 *
 *   `sticky`      — hold the node against the viewport for the length of its
 *                   parent's box. CSS sticky semantics, with CSS's own release
 *                   boundary, plus a width gate because a pin is a desktop
 *                   affordance.
 *   `scrollTrack` — `opacity` / `translateYPct` / `scale` across a named view
 *                   range, keyframed over progress 0..1 rather than over time.
 *
 * The observation points are the emitter and the envelope, which is where REQ-100's
 * suite makes its own: what a browser DOES with `position: sticky` and
 * `animation-timeline: view()` is the browser's contract, and no headless run adds
 * evidence about it. What is ours to prove is that a typed value bag compiles to
 * exactly those declarations, that nothing an author writes reaches CSS as a
 * string, and that every degradation path lands on the settled design rather than
 * on a blank page.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_ENVELOPE,
  L1_STRUCTURAL_RULES,
  emailTargetErrors,
  l1ScrollTrackSchema,
  l1StickySchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1ScrollRange,
} from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Fragment } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/**
 * The declarations of the last rule matching a selector among the UNGATED,
 * non-media rules — the node's own base rule.
 *
 * Both cuts matter here. `@media` is where a width-gated pin lands, and
 * `@supports` is where every scroll-track declaration lands; a helper that read
 * either would report the gated form as though it were unconditional, which is
 * the one thing these tests exist to tell apart.
 */
function baseDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0].split('@supports')[0]
  const esc = selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
  const rules = [...head.matchAll(new RegExp(`${esc}\\s*\\{([^}]*)\\}`, 'g'))]
  if (!rules.length) return []
  return rules[rules.length - 1][1]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
}

/** The body of a named media block, wherever it sits (gated or not). */
function mediaBlock(css: string, media: string): string {
  const blocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\s*\}/g)]
  return blocks.find((b) => b[1].trim() === media)?.[2] ?? ''
}

/** The body of the `@supports` block the scroll-track mechanism is gated on. */
function supportsBlock(css: string): string {
  const at = css.indexOf('@supports (animation-timeline: view())')
  return at === -1 ? '' : css.slice(at)
}

/** The body of a named `@keyframes` block. */
function keyframesBlock(css: string, name: string): string {
  const m = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css)
  return m ? m[1] : ''
}

const NO_REDUCED = 'not (prefers-reduced-motion: reduce)'

/** The hero of the composition the request described: a pinned full-bleed image. */
function hero(extra: Record<string, unknown>): L1Node {
  return { kind: 'image', src: '/hero.jpg', alt: 'The hero', ...extra } as L1Node
}

/** A section box deep enough to hold a pin through — a pin's parent must be. */
function section(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children } as L1Node
}

describe('REQ-325 — the pin', () => {
  /**
   * AC1 — a node declares `sticky` as typed values and the renderer emits CSS
   * sticky positioning, **overriding the placement the node would otherwise
   * take**.
   *
   * The override is the load-bearing half. Every in-flow box already emits
   * `position: relative` (it is what makes it the containing block for anything
   * pinned inside it), so a pin that merely added a declaration would lose to it
   * and the node would not move. The two land in one declaration list with the pin
   * last, so the emitters compose without either knowing about the other.
   */
  it('test_UAT_FC_REQ-325_sticky_pins_the_node_at_its_offset', () => {
    const d = doc(section([hero({ sticky: { topPx: 72 } })]))
    expect(validateL1(d).ok).toBe(true)

    const decls = baseDecls(renderL1Document(d).css, '.l1-1')
    expect(decls).toContain('position: sticky')
    expect(decls).toContain('top: 72px')

    // A box's own `position: relative` is emitted earlier in the same list, so the
    // pin has to be the last word on the property or it does nothing at all.
    const box = doc(section([{ kind: 'box', sticky: { topPx: 0 }, children: [] } as L1Node]))
    const boxDecls = baseDecls(renderL1Document(box).css, '.l1-1')
    expect(boxDecls).toContain('position: relative')
    expect(boxDecls.filter((x) => x.startsWith('position:')).at(-1)).toBe('position: sticky')

    // An absent offset means zero, not "no offset": `position: sticky` with
    // `top: auto` sticks to nothing, so the declaration is never left out.
    expect(baseDecls(renderL1Document(doc(section([hero({ sticky: {} })]))).css, '.l1-1')).toContain(
      'top: 0px',
    )
  })

  /**
   * AC2 — `sticky.fromPx` confines the pin to a width band, leaving the node in
   * ordinary flow below it.
   *
   * A pin is a desktop affordance: a full-bleed hero held on a 320px screen owns
   * the entire viewport for the length of its section. The alternative to this
   * field is authoring the subtree twice under paired `visibility` gates, which is
   * the duplicate-subtree anti-pattern `responsiveLayout` was added to remove — so
   * the gate belongs on the axis.
   */
  it('test_UAT_FC_REQ-325_sticky_fromPx_confines_the_pin_to_a_width_band', () => {
    const d = doc(section([hero({ sticky: { topPx: 24, fromPx: 900 } })]))
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    // Below the gate: no pin anywhere in the node's unconditional rule.
    expect(baseDecls(css, '.l1-1')).not.toContain('position: sticky')

    // At and above it: the pin, with its offset.
    const block = mediaBlock(css, '(min-width: 900px)')
    expect(block).toContain('.l1-1 { position: sticky; top: 24px }')

    // A breakpoint, not a ladder rung: it need not be one of the document's own
    // captured widths, exactly as `visibility.fromPx` need not be.
    expect(WIDTHS).not.toContain(900)
  })

  /**
   * AC3 — a pin and an **absolute** geometry track are refused as a pair, by name.
   *
   * They are two placements for one box and two owners of `top`: an absolutely
   * placed node has already left the flow, and its keyframe track writes the very
   * property the pin needs. Resolving that silently would be the renderer choosing
   * a placement the author did not. An in-flow track composes freely, because its
   * offsets are margins — which is what makes the refusal a rule about placement
   * rather than a ban on using geometry with a pin.
   */
  it('test_UAT_FC_REQ-325_a_pin_requires_flow_placement', () => {
    const keyframes = [{ at: 320, x: 0, y: 0, width: 320, height: 400 }]
    const pinned = doc(section([hero({ sticky: { topPx: 0 }, geometry: { keyframes } })]))
    const result = validateL1(pinned)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.map((e) => e.message)).toContain(L1_STRUCTURAL_RULES.stickyIsInFlow)

    // An in-flow track is the compatible half, and the pin still overrides the
    // `position: relative` that track emits.
    const inFlow = doc(
      section([hero({ sticky: { topPx: 8 }, geometry: { place: 'flow', keyframes } })]),
    )
    expect(validateL1(inFlow).ok).toBe(true)
    const decls = baseDecls(renderL1Document(inFlow).css, '.l1-1')
    expect(decls.filter((x) => x.startsWith('position:')).at(-1)).toBe('position: sticky')
    expect(decls).toContain('top: 8px')
  })
})

describe('REQ-325 — properties that track scroll progress', () => {
  const track = {
    stops: [
      { at: 0, opacity: 0.2, translateYPct: 12, scale: 0.95 },
      { at: 0.5, opacity: 1 },
      { at: 1, opacity: 1, translateYPct: 0, scale: 1 },
    ],
  }

  /**
   * AC4 — a `scrollTrack` compiles to a renderer-named `@keyframes` block plus one
   * animation running on the browser's own **view-progress timeline**.
   *
   * No script. REQ-100 needed an IntersectionObserver because a one-shot entrance
   * is an event; a continuous function of scroll position is something CSS itself
   * drives, so the substrate gains the capability without gaining a scroll
   * listener to vet, to budget, or to keep from janking.
   *
   * `at` is progress, not a viewport width — the one `at` in L1 that is not a rung
   * of the width ladder — so the stops become percentages of the range.
   */
  it('test_UAT_FC_REQ-325_scroll_track_compiles_to_a_view_timeline_animation', () => {
    const d = doc(section([hero({ scrollTrack: track })]))
    expect(validateL1(d).ok).toBe(true)
    const css = renderL1Document(d).css

    // The stops, in order, as percentages of the range. The independent
    // `translate` / `scale` properties (not `transform`), so a node's own static
    // transform still composes rather than being replaced.
    const block = keyframesBlock(css, 'l1-1-sc')
    expect(block).toContain('0% { opacity: 0.2; translate: 0 12%; scale: 0.95 }')
    expect(block).toContain('50% { opacity: 1 }')
    expect(block).toContain('100% { opacity: 1; translate: 0 0%; scale: 1 }')

    // The animation that runs it, and the name it names: generated from the node's
    // own class, so no instance string ever reaches a CSS identifier.
    const gated = supportsBlock(css)
    expect(gated).toContain('animation-name: l1-1-sc')
    expect(gated).toContain('animation-timeline: view()')
    // `auto` is what means "the whole timeline" for a progress-driven animation; a
    // time would be meaningless, since the progress is the reader's not the clock's.
    expect(gated).toContain('animation-duration: auto')
    expect(gated).toContain('animation-timing-function: linear')
    // Both ends held, so a track never snaps back to the design at its boundary.
    expect(gated).toContain('animation-fill-mode: both')

    // The keyframes ride at the top level, before the rule that names them: an
    // unreferenced block is inert, and a browser that never enters the gate below
    // never runs one.
    expect(css.indexOf('@keyframes l1-1-sc')).toBeLessThan(css.indexOf('@supports'))
  })

  /**
   * AC4 (continued) — a **mounted behaviour module's** own track travels whole.
   *
   * REQ-93 mounts a module's subtree as a fragment, and because these are
   * node-level axis groups (REQ-105) a node inside one carries them like any
   * other. A fragment's CSS is emitted separately from the page's, so the
   * `@keyframes` block has to travel WITH the rule that names it or the mounted
   * node would reference a block the page never received — an animation naming
   * nothing, which is a node frozen at its authored state with no error anywhere
   * to say why.
   *
   * The name is drawn from the fragment's own prefixed class counter, which is
   * what keeps two instances of one module on a page from animating against each
   * other's block.
   */
  it('test_UAT_FC_REQ-325_a_mounted_fragment_carries_its_own_keyframes', () => {
    const node = { kind: 'image', src: '/slide.jpg', alt: 'A slide', scrollTrack: track } as L1Node
    const { css } = renderL1Fragment([node], 'cf', {})

    // The block, named for the fragment's own class — and the rule that names it.
    expect(keyframesBlock(css, 'cf-l1-0-sc')).toContain('0% { opacity: 0.2; translate: 0 12%; scale: 0.95 }')
    expect(supportsBlock(css)).toContain('animation-name: cf-l1-0-sc')
    // Together, and in that order: the block before the rule that references it.
    expect(css.indexOf('@keyframes cf-l1-0-sc')).toBeLessThan(css.indexOf('animation-name'))

    // A second mount under a different prefix names a different block, so two
    // instances of one module cannot drive each other's animation.
    const second = renderL1Fragment([node], 'cg', {})
    expect(second.css).toContain('@keyframes cg-l1-0-sc')
    expect(second.css).not.toContain('cf-l1-0-sc')

    // A fragment with no track emits no keyframes at all, so the mechanism costs
    // an untracked module nothing.
    const bare = renderL1Fragment(
      [{ kind: 'image', src: '/slide.jpg', alt: 'A slide' } as L1Node],
      'cf',
      {},
    )
    expect(bare.css).not.toContain('@keyframes')
  })

  /**
   * AC5 — `range` names the span the stops are measured across, as a closed set of
   * four.
   *
   * The general form of "start and end condition" is a small coordinate language
   * (this edge of me against that edge of the viewport), and every composition that
   * asks for one means one of these four. `cover` — any part of the node visible,
   * from arrival to departure — is the range the request described longhand, so it
   * is the default.
   */
  it('test_UAT_FC_REQ-325_each_range_names_its_span', () => {
    const expected: Record<L1ScrollRange, string> = {
      cover: 'animation-range: cover 0% cover 100%',
      contain: 'animation-range: contain 0% contain 100%',
      enter: 'animation-range: entry 0% entry 100%',
      exit: 'animation-range: exit 0% exit 100%',
    }
    for (const [range, decl] of Object.entries(expected)) {
      const d = doc(section([hero({ scrollTrack: { ...track, range } })]))
      expect(validateL1(d).ok).toBe(true)
      expect(supportsBlock(renderL1Document(d).css)).toContain(decl)
    }
    // Absent → `cover`, so a track that names no range is the whole visible life
    // of the node rather than an unstated choice.
    expect(supportsBlock(renderL1Document(doc(section([hero({ scrollTrack: track })]))).css)).toContain(
      expected.cover,
    )
  })

  /**
   * AC6 — every degradation path lands on the **settled design**, never on a blank
   * page.
   *
   * This is REQ-100's load-bearing property restated for a mechanism with no
   * script to return early from, and here the two halves are one construction: the
   * animation declarations are emitted inside a feature query AND inside
   * `not (prefers-reduced-motion: reduce)`. A browser with no view-progress
   * timeline matches the first gate and never sees them; a visitor who asked their
   * platform for no motion fails the second. Both get the node's own authored
   * opacity, offset and scale — nothing is hidden in CSS waiting for something
   * else to bring it back, which is how a scroll library turns a missing feature
   * into an empty page.
   *
   * The same gate is what keeps the L1 round-trip honest: the capture driver
   * emulates reduced motion, so a scroll-tracked page captures settled.
   */
  it('test_UAT_FC_REQ-325_a_browser_without_the_feature_gets_the_settled_page', () => {
    const d = doc(section([hero({ scrollTrack: track, axes: { opacity: 0.8 } })]))
    const css = renderL1Document(d).css

    // Nothing unconditional. Every animation declaration is inside the gate, so
    // the ungated stylesheet is the design and only the design.
    const ungated = css.split('@supports')[0]
    expect(ungated).not.toContain('animation')
    expect(baseDecls(css, '.l1-1')).toContain('opacity: 0.8')

    // And the gate is BOTH conditions, nested — not one of them with the other
    // bolted on as a rule that undoes it. A cancelled scroll animation is not the
    // same pixels as an absent one: `animation-fill-mode: both` would still be
    // holding the first stop.
    const gated = supportsBlock(css)
    expect(gated).toContain(`@media ${NO_REDUCED}`)
    expect(mediaBlock(gated, NO_REDUCED)).toContain('animation-name: l1-1-sc')

    // No pre-state anywhere. The first stop's values exist only inside the
    // `@keyframes` block, which is an at-rule nothing references until the gate is
    // entered — no style RULE outside the gate applies them, so the node is never
    // authored dark in CSS on the expectation that something will light it up.
    expect(baseDecls(css, '.l1-1')).not.toContain('opacity: 0.2')
    expect(ungated.replace(/@keyframes[\s\S]*?\n\}/g, '')).not.toContain('opacity: 0.2')
  })

  /**
   * AC6 (continued) — the two channels where a scroll track cannot work are
   * emitted without one, rather than shipped as a trap.
   *
   * The edit render is settled by construction (REQ-116) and a track's first stop
   * is not the settled state — the same reason that channel emits no `reveal`. A
   * dialog panel is `position: fixed` (REQ-212) and so never advances a
   * view-progress timeline: its animation would hold the first stop forever, which
   * for a fading track is a panel that opens onto nothing.
   */
  it('test_UAT_FC_REQ-325_no_track_where_it_could_not_run', () => {
    const d = doc(section([hero({ scrollTrack: track })]))
    const edit = renderL1Document(d, { edit: true }).css
    expect(edit).not.toContain('@keyframes')
    expect(edit).not.toContain('animation-timeline')

    const panel = doc(
      section([
        {
          kind: 'box',
          id: 'panel',
          dialog: { placement: 'center' },
          scrollTrack: track,
          children: [],
        } as L1Node,
      ]),
    )
    expect(validateL1(panel).ok).toBe(true)
    const panelCss = renderL1Document(panel).css
    expect(panelCss).not.toContain('@keyframes')
    expect(panelCss).not.toContain('animation-timeline')
  })

  /**
   * AC7 — the envelope: a track outside what L1 admits is refused whole, and each
   * refusal names itself.
   *
   * The two numeric bounds are the SAME constants the static transform axis is
   * held to, because they are the same two quantities (a share of the node's own
   * box, a uniform scale) with a different driver; a second set of numbers for
   * them would be a second answer to one question.
   */
  it('test_UAT_FC_REQ-325_the_envelope_refuses_a_malformed_track', () => {
    const refuse = (scrollTrack: unknown, rule?: string): void => {
      const result = validateL1(doc(section([hero({ scrollTrack })])))
      expect(result.ok).toBe(false)
      if (!result.ok && rule) expect(result.errors.map((e) => e.message)).toContain(rule)
    }

    // Read start to finish, so the stops ascend strictly.
    refuse(
      { stops: [{ at: 0.6, opacity: 0 }, { at: 0.2, opacity: 1 }] },
      `${L1_STRUCTURAL_RULES.ascendingScrollStops} (got 0.2 after 0.6)`,
    )
    // A stop naming no property moves nothing and interpolates nothing.
    refuse({ stops: [{ at: 0 }, { at: 1, opacity: 1 }] }, L1_STRUCTURAL_RULES.scrollStopMoves)
    // The shared bounds, at the edge of each.
    refuse({
      stops: [
        { at: 0, scale: L1_ENVELOPE.transformScale.max + 1 },
        { at: 1, scale: 1 },
      ],
    })
    refuse({
      stops: [
        { at: 0, translateYPct: L1_ENVELOPE.translatePct.max + 1 },
        { at: 1, translateYPct: 0 },
      ],
    })
    // A single stop is a constant, not a track.
    refuse({ stops: [{ at: 0, opacity: 1 }] })
    // Progress is 0..1, and the shape says so.
    refuse({ stops: [{ at: 0, opacity: 1 }, { at: 1.5, opacity: 0 }] })

    // And the closed shape: no freeform key on either axis is a place to smuggle a
    // CSS declaration, a selector or a timeline of one's own.
    expect(l1ScrollTrackSchema.safeParse({ stops: [], easing: 'ease' }).success).toBe(false)
    expect(
      l1ScrollTrackSchema.safeParse({
        stops: [
          { at: 0, opacity: 1, filter: 'blur(4px)' },
          { at: 1, opacity: 0 },
        ],
      }).success,
    ).toBe(false)
    expect(l1StickySchema.safeParse({ topPx: 0, position: 'fixed' }).success).toBe(false)
    expect(l1ScrollTrackSchema.safeParse({ range: 'parallax', stops: track.stops }).success).toBe(
      false,
    )
  })

  /**
   * AC8 — a node has **one motion driver**.
   *
   * `reveal` is a transition to the settled state; `scrollTrack` is an animation
   * over a scroll range. A CSS animation overrides a transition on the same
   * property, so a node carrying both would have its entrance silently discarded —
   * with nothing in either feature's own output to say so. Refused as a pair
   * rather than resolved by precedence.
   */
  it('test_UAT_FC_REQ-325_one_motion_driver_per_node', () => {
    const both = doc(section([hero({ reveal: { yPx: 24 }, scrollTrack: track })]))
    const result = validateL1(both)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.map((e) => e.message)).toContain(L1_STRUCTURAL_RULES.oneMotionDriver)

    // A COMPOSED entrance (REQ-326 — two or more behaviours with their own
    // timings) is refused on the same terms, because the reason is the cascade
    // and not the arity: an animation beats a transition however many transitions
    // there are, so the whole composition would be the half that disappears.
    const composed = doc(
      section([
        hero({
          reveal: [
            { yPx: 24, durationMs: 200 },
            { fromOpacity: 0, durationMs: 800 },
          ],
          scrollTrack: track,
        }),
      ]),
    )
    const composedResult = validateL1(composed)
    expect(composedResult.ok).toBe(false)
    if (composedResult.ok) return
    expect(composedResult.errors.map((e) => e.message)).toContain(
      L1_STRUCTURAL_RULES.oneMotionDriver,
    )

    // Either alone is ordinary, in either entrance spelling.
    expect(validateL1(doc(section([hero({ reveal: { yPx: 24 } })]))).ok).toBe(true)
    expect(
      validateL1(
        doc(
          section([
            hero({
              reveal: [
                { yPx: 24, durationMs: 200 },
                { fromOpacity: 0, durationMs: 800 },
              ],
            }),
          ]),
        ),
      ).ok,
    ).toBe(true)
    expect(validateL1(doc(section([hero({ scrollTrack: track })]))).ok).toBe(true)
  })

  /**
   * AC9 — neither axis reaches an email page, and the refusal names it.
   *
   * A message is read in a panel the client scrolls, not a document the page
   * controls: `position: sticky` is unsupported across the field and a
   * scroll-progress timeline is an animation, of which a message has none. Both
   * would be silently dropped by the email emitter, and a silently dropped axis is
   * an author's composition quietly not happening — so they are listed among the
   * refused node axes rather than left to fall through.
   */
  it('test_UAT_FC_REQ-325_an_email_page_carries_neither_axis', () => {
    const paths = (node: Record<string, unknown>): string[] =>
      emailTargetErrors({
        widths: [600],
        root: { kind: 'box', children: [{ kind: 'text', text: 'Hello', ...node }] },
      } as L1Document).map((e) => e.path)

    expect(paths({ sticky: { topPx: 0 } })).toContain('/root/children/0/sticky')
    expect(paths({ scrollTrack: track })).toContain('/root/children/0/scrollTrack')
    expect(paths({})).toEqual([])
  })
})
