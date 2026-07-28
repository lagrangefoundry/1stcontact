/**
 * REQ-100 — L1's typed scroll-entrance vocabulary (reveal / stagger).
 *
 * Before this, L1 had no motion of any kind: no transition, no animation, no
 * notion of entering the viewport. Every page it rendered arrived fully formed,
 * which DOC-17 names as the single biggest "alive vs template" tell.
 *
 * The axes here are the ones the xgd.dev build actually demanded once sections
 * 2–5 existed to scroll past (REQ-95), and no more:
 *
 *   `reveal.yPx` / `reveal.fromOpacity`  — every band heading in §2 The problem,
 *       §3 How it works, §4 The contract, §5 Evidence: a rise and a fade.
 *   `reveal.durationMs` / `reveal.easing` — the same timing vocabulary REQ-99
 *       already established for interaction, deliberately reused rather than
 *       re-minted.
 *   `container.staggerMs`                — §3's four `how-steps` cards, §2's
 *       three `problem-items`, §4's two `contract-panels`: rows of peers that
 *       read mechanical when they all land at once.
 *   `reveal.delayMs`                     — the hero, where a duplicate subtree
 *       put two nodes in a stagger count the reader only ever saw one of. (That
 *       particular duplicate is gone since REQ-104 gave `layout` a per-width
 *       track; the hatch remains for what a positional index cannot express.)
 *
 * There is no `xPx` and no entry scale: sections 2–5 did not ask for either.
 *
 * These UATs pin the ticket's acceptance:
 *   1. a node declares reveal as typed values and the renderer emits the
 *      pre-state, the observer handle, and the transition;
 *   2. no raw CSS, keyframe string, selector, or per-site script can enter;
 *   3. the page renders SETTLED when the script does not run — the mechanism
 *      fails visible, never blank;
 *   4. `prefers-reduced-motion` is honoured by the renderer, not the author;
 *   5. a container's stagger delays successive revealing children;
 *   6. entrance composes with REQ-99 interaction instead of cancelling it.
 */
import { describe, expect, it } from 'vitest'
import {
  validateL1,
  l1RevealSchema,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document, L1_REVEAL_SCRIPT } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/** The declarations of the last non-media rule matching a selector. */
function ruleDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0]
  const esc = selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
  const rules = [...head.matchAll(new RegExp(`${esc}\\s*\\{([^}]*)\\}`, 'g'))]
  if (!rules.length) return []
  return rules[rules.length - 1][1]
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
}

/** Every rule body for a selector inside the named media query. */
function mediaDecls(css: string, media: string, selector: string): string[] {
  const esc = selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
  const blocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\}/g)]
  const block = blocks.find((b) => b[1].trim() === media)
  if (!block) return []
  const rules = [...block[2].matchAll(new RegExp(`${esc}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) =>
    r[1]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  )
}

const REDUCED = '(prefers-reduced-motion: reduce)'
/** The gated pre-state selector the renderer emits for node N. */
const pre = (n: number) => `html[data-l1-motion] .l1-${n}:not(.l1-in)`

/** A band heading of the shape §2–§5 each open with. */
function heading(text: string, reveal: Record<string, unknown> | undefined): L1Node {
  return {
    kind: 'text',
    text,
    axes: { color: '#fafaf9', fontSizePx: 48 },
    ...(reveal ? { reveal } : {}),
  } as L1Node
}

describe('REQ-100 — typed scroll entrance on an L1 node', () => {
  /**
   * AC1 — the axes exist, are typed, and compile to a pre-state the renderer
   * owns. §2–§5 each open with an eyebrow/heading/body block that rises and
   * fades; this is that block.
   */
  it('test_UAT_FC_REQ-100_reveal_axes_emit_pre_state_and_transition', () => {
    const d = doc({
      kind: 'container',
      layout: 'stack',
      children: [heading('Code got cheap. Confidence didn’t.', {
        yPx: 24,
        fromOpacity: 0,
        durationMs: 600,
        easing: 'ease-out',
      })],
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)

    const { html, css } = renderL1Document(d)

    // The observer's handle is a fixed class the author never names, carried
    // alongside the node's own generated class.
    expect(html).toContain('class="l1-1 l1-rv"')

    // The pre-state: where the node comes FROM. Gated on the marker (see AC3).
    const preDecls = ruleDecls(css, pre(1))
    expect(preDecls).toContain('opacity: 0')
    expect(preDecls).toContain('translate: 0 24px')

    // Settling needs no second rule — `:not(.l1-in)` stops matching, so the
    // node's own authored paint resumes. Nothing restates the design.
    expect(css).not.toContain('.l1-in .')

    const base = ruleDecls(css, '.l1-1')
    expect(base).toContain('transition-property: opacity, translate')
    expect(base).toContain('transition-duration: 600ms')
    expect(base).toContain('transition-timing-function: ease-out')
  })

  /**
   * AC2 — the substrate gained entrance motion without gaining a way to smuggle
   * CSS, a selector, a keyframe, or a script. Everything is a typed scalar or a
   * closed enum, and the object is strict.
   */
  it('test_UAT_FC_REQ-100_no_raw_css_selector_or_script_can_enter', () => {
    // A freeform key is rejected outright — there is no passthrough.
    for (const hostile of [
      { css: 'animation: spin 1s infinite' },
      { keyframes: '@keyframes x { from { opacity: 0 } }' },
      { selector: '.evil:hover' },
      { onScroll: 'alert(1)' },
      { yPx: 24, extra: 'anything' },
    ]) {
      expect(l1RevealSchema.safeParse(hostile).success).toBe(false)
    }

    // Easing is the REQ-99 closed enum, not a raw timing function.
    expect(l1RevealSchema.safeParse({ easing: 'ease-out' }).success).toBe(true)
    expect(l1RevealSchema.safeParse({ easing: 'cubic-bezier(.17,.67,.83,.67)' }).success).toBe(false)
    expect(l1RevealSchema.safeParse({ easing: 'steps(4, end)' }).success).toBe(false)

    // Numeric axes are numbers, never strings that could carry a CSS payload.
    expect(l1RevealSchema.safeParse({ yPx: '24px; animation: x' }).success).toBe(false)
    expect(l1RevealSchema.safeParse({ durationMs: '600ms' }).success).toBe(false)
    // Opacity is bounded to a real 0..1 fade.
    expect(l1RevealSchema.safeParse({ fromOpacity: 4 }).success).toBe(false)

    // The envelope bounds the time a reader can be made to wait for content.
    const stalled = doc(heading('x', { durationMs: 999_999 }))
    expect(validateL1(stalled).ok).toBe(false)
    const stalledDelay = doc(heading('x', { delayMs: 999_999 }))
    expect(validateL1(stalledDelay).ok).toBe(false)
  })

  /**
   * AC3 — the load-bearing safety property: **the mechanism fails visible.**
   *
   * The pre-state is gated on a `data-l1-motion` marker that only the renderer's
   * script sets. No JS, no IntersectionObserver, or a thrown error → the marker
   * never appears, the rule never matches, and the reader gets the whole page.
   * Hiding in CSS and revealing in JS is how a scroll library turns a broken
   * script into a blank page; this cannot do that.
   */
  it('test_UAT_FC_REQ-100_page_renders_settled_when_the_script_does_not_run', () => {
    const d = doc({
      kind: 'container',
      layout: 'stack',
      children: [heading('Every change leaves proof behind.', { yPx: 24, fromOpacity: 0 })],
    } as L1Node)
    const { html, css } = renderL1Document(d)

    // EVERY rule that hides anything is behind the marker. If one were not, a
    // no-JS reader would lose that content permanently.
    const hidingRules = [...css.matchAll(/([^\n{}]+)\{([^}]*opacity:\s*0[^}]*)\}/g)].map((m) =>
      m[1].trim(),
    )
    expect(hidingRules.length).toBeGreaterThan(0)
    for (const selector of hidingRules) {
      expect(selector.startsWith('html[data-l1-motion]')).toBe(true)
    }

    // The script guards on IntersectionObserver and returns BEFORE the marker is
    // set — the order is what makes the guard meaningful.
    const guard = L1_REVEAL_SCRIPT.indexOf("'IntersectionObserver' in window")
    const marker = L1_REVEAL_SCRIPT.indexOf('setAttribute')
    expect(guard).toBeGreaterThanOrEqual(0)
    expect(guard).toBeLessThan(marker)

    // Exactly one observer, emitted once, at the top of the body so the marker
    // lands before the content beneath it paints.
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html.startsWith('<script>')).toBe(true)
    expect(L1_REVEAL_SCRIPT.match(/new IntersectionObserver/g)).toHaveLength(1)
  })

  /**
   * AC2 (cont.) — "no per-site JS". The script is a renderer-owned constant: it
   * is byte-identical across documents, carries no instance value, and is absent
   * entirely from a page that reveals nothing.
   */
  it('test_UAT_FC_REQ-100_the_observer_script_is_renderer_owned_not_per_site', () => {
    const a = renderL1Document(doc(heading('Alpha site', { yPx: 24 })))
    const b = renderL1Document(
      doc(heading('Beta site — totally different copy', { yPx: 8, durationMs: 200 })),
    )
    expect(a.js).toBe(L1_REVEAL_SCRIPT)
    expect(b.js).toBe(L1_REVEAL_SCRIPT)
    expect(a.js).toBe(b.js)

    // No instance data reaches the script — not copy, not an axis value.
    expect(L1_REVEAL_SCRIPT).not.toContain('Alpha')
    expect(L1_REVEAL_SCRIPT).not.toContain('Beta')
    expect(L1_REVEAL_SCRIPT).not.toContain('24')

    // A motionless page ships no script at all.
    const still = renderL1Document(doc(heading('No motion here', undefined)))
    expect(still.js).toBeUndefined()
    expect(still.html).not.toContain('<script>')
  })

  /**
   * AC3 — reduced motion is honoured by the RENDERER, not by the author. There
   * is no axis an author can set to opt out of respecting it, and two
   * independent mechanisms enforce it.
   */
  it('test_UAT_FC_REQ-100_reduced_motion_is_honoured_by_the_renderer', () => {
    // A deliberately-dimmed node: the fallback must restore the DESIGN (0.6),
    // not brighten it to 1.
    const dimmed: L1Node = {
      kind: 'box',
      axes: { surfaceFill: '#131316', opacity: 0.6 },
      reveal: { yPx: 24, fromOpacity: 0, durationMs: 600 },
    } as L1Node
    const { css } = renderL1Document(doc(dimmed))

    const reduced = mediaDecls(css, REDUCED, pre(0))
    expect(reduced).toContain('opacity: 0.6')
    expect(reduced).toContain('translate: none')
    expect(mediaDecls(css, REDUCED, '.l1-0')).toContain('transition-duration: 0ms')

    // And the script declines to set the marker at all, so the pre-state never
    // matches in the first place. Belt and braces on the same obligation.
    expect(L1_REVEAL_SCRIPT).toContain('prefers-reduced-motion: reduce')
    const check = L1_REVEAL_SCRIPT.indexOf('prefers-reduced-motion')
    expect(check).toBeLessThan(L1_REVEAL_SCRIPT.indexOf('setAttribute'))

    // The author has no vocabulary to override any of it.
    expect(l1RevealSchema.safeParse({ respectReducedMotion: false }).success).toBe(false)
    expect(l1RevealSchema.safeParse({ force: true }).success).toBe(false)
  })

  /**
   * AC2 — the observer is *executed*, not merely inspected. The script is the
   * one piece of this feature that string assertions cannot vouch for, so it is
   * run against a real DOM with a stubbed IntersectionObserver.
   *
   * The `rootMargin` is asserted as GEOMETRY rather than as a string, because
   * the xgd.dev page found the gap it closes and also found the wrong fix for
   * it. Jumping to the foot of the page (End, an anchor, a reload restoring a
   * mid-page scroll position) left every band in between laid out, occupying
   * space, and invisible.
   *
   * The obvious repair — settle anything whose `boundingClientRect.bottom < 0`
   * inside the callback — is untestable-by-stub in the worst way: hand-firing
   * such an entry passes, while a real browser never sends one. A node that goes
   * from below the viewport to above it in one jump holds an intersection ratio
   * of 0 throughout, so no entry is delivered and no callback clause can run.
   * (Measured: 7 entries delivered on that jump, none with a negative bottom, 16
   * bands left dark.) Only widening the ROOT turns those nodes into genuine
   * intersections, so only the root's geometry is worth pinning.
   */
  it('test_UAT_FC_REQ-100_observer_settles_entering_and_already_passed_nodes', async () => {
    const { JSDOM } = await import('jsdom')
    const d = doc({
      kind: 'container',
      layout: 'stack',
      staggerMs: 80,
      children: [heading('a', { yPx: 20 }), heading('b', { yPx: 20 }), heading('c', { yPx: 20 })],
    } as L1Node)
    const { html } = renderL1Document(d)

    const observed: Element[] = []
    let fire: (entries: unknown[]) => void = () => {}
    let rootMargin = ''
    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
      runScripts: 'dangerously',
      beforeParse(win) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(win as any).IntersectionObserver = class {
          constructor(cb: (e: unknown[]) => void, opts?: { rootMargin?: string }) {
            fire = cb
            rootMargin = opts?.rootMargin ?? ''
          }
          observe(el: Element) {
            observed.push(el)
          }
          unobserve(el: Element) {
            const i = observed.indexOf(el)
            if (i >= 0) observed.splice(i, 1)
          }
          disconnect() {}
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(win as any).matchMedia = () => ({ matches: false })
      },
    })
    const { document: docu } = dom.window

    // The marker is set synchronously, during parse — that is what stops the
    // settled page painting first and then snapping back to the pre-state.
    expect(docu.documentElement.hasAttribute('data-l1-motion')).toBe(true)

    // Observation itself waits for DOMContentLoaded, so the whole tree is
    // present before anything is observed.
    if (docu.readyState === 'loading') {
      await new Promise<void>((r) => docu.addEventListener('DOMContentLoaded', () => r()))
    }
    expect(observed).toHaveLength(3)

    // ── The root's geometry, which is what makes a passed node settle ────────
    const [top, right, bottom, left] = rootMargin.split(/\s+/)
    expect(right).toBe('0px')
    expect(left).toBe('0px')
    // Bottom SHRINKS the root, so a node reveals after clearing the fold rather
    // than the instant it grazes it.
    expect(bottom.startsWith('-')).toBe(true)
    // Top EXPANDS it past any real document, so everything above the viewport is
    // still inside the root. 100_000px is taller than any page we will render;
    // a viewport-relative value (even '100%') would only cover a one-screen jump.
    expect(top.endsWith('px')).toBe(true)
    expect(Number.parseFloat(top)).toBeGreaterThan(100_000)

    // Concretely: a reader who jumped 3,000px past a node leaves it 3,000px above
    // the viewport — still within the expanded root, so the browser reports it as
    // intersecting and the callback below settles it.
    expect(Number.parseFloat(top)).toBeGreaterThan(3_000)

    // ── The callback: intersecting settles and unobserves; nothing else does ──
    const nodes = [...docu.querySelectorAll('.l1-rv')]
    fire([{ target: nodes[0], isIntersecting: true, boundingClientRect: { bottom: 400 } }])
    expect(nodes[0].classList.contains('l1-in')).toBe(true)

    // Still below the fold: untouched.
    fire([{ target: nodes[1], isIntersecting: false, boundingClientRect: { bottom: 2000 } }])
    expect(nodes[1].classList.contains('l1-in')).toBe(false)

    // A node above the viewport arrives as a genuine intersection (that is what
    // the expanded root buys), not as a special case the callback has to detect.
    fire([{ target: nodes[2], isIntersecting: true, boundingClientRect: { bottom: -120 } }])
    expect(nodes[2].classList.contains('l1-in')).toBe(true)

    // A settled node is unobserved — the entrance runs once, never on the way back.
    expect(observed).toHaveLength(1)
    expect(observed[0]).toBe(nodes[1])
    dom.window.close()
  })

  /**
   * AC1 — §3's four `how-steps` cards. A row of peers that all land at once
   * reads mechanical; the stagger is what makes it read as choreography.
   *
   * Only revealing children take a slot, so a decorative spacer between two
   * cards cannot silently buy itself one and desynchronise everything after it.
   */
  it('test_UAT_FC_REQ-100_container_stagger_delays_successive_children', () => {
    const card = (t: string): L1Node =>
      ({ kind: 'text', text: t, reveal: { yPx: 16, durationMs: 500 } }) as L1Node
    const d = doc({
      kind: 'container',
      layout: 'row',
      staggerMs: 80,
      children: [
        card('Capability'),
        // A non-revealing spacer: must NOT consume a stagger slot.
        { kind: 'box', sizing: { width: { mode: 'fixed', px: 8 } } },
        card('User story'),
        card('Acceptance criteria'),
        // The per-node escape hatch: its own delay ADDS to its stagger share.
        { kind: 'text', text: 'Verification', reveal: { yPx: 16, durationMs: 500, delayMs: 25 } },
      ],
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)

    const { css } = renderL1Document(d)
    const delayOf = (n: number) =>
      ruleDecls(css, `.l1-${n}`).find((x) => x.startsWith('transition-delay'))

    // Children are nodes 1..5 (0 is the container); node 2 is the spacer.
    expect(delayOf(1)).toBeUndefined() // index 0 → 0ms → initial value, omitted
    expect(delayOf(3)).toBe('transition-delay: 80ms') // index 1, spacer skipped
    expect(delayOf(4)).toBe('transition-delay: 160ms') // index 2
    expect(delayOf(5)).toBe('transition-delay: 265ms') // index 3 → 240 + own 25

    // Stagger is a statement about a set of peers, so it lives on the container
    // and the envelope bounds it like every other duration.
    const runaway = doc({
      kind: 'container',
      layout: 'row',
      staggerMs: 999_999,
      children: [card('x')],
    } as L1Node)
    expect(validateL1(runaway).ok).toBe(false)
  })

  /**
   * AC1 — entrance COMPOSES with REQ-99 interaction rather than cancelling it.
   *
   * A CSS rule carries only one `transition-property`, so emitting the two
   * features independently would mean whichever ran second silently killed the
   * first: §5's revealing CTA would lose its hover feedback, with nothing to
   * show for it in either feature's own tests. Entrance also uses the
   * independent `translate` property while a hover's motion uses `transform`, so
   * the two movements compose instead of overwriting each other.
   */
  it('test_UAT_FC_REQ-100_reveal_composes_with_interaction_state', () => {
    const cta: L1Node = {
      kind: 'box',
      axes: { surfaceFill: '#fafaf9', borderRadiusPx: 6 },
      reveal: { yPx: 24, fromOpacity: 0, durationMs: 600, easing: 'ease-out' },
      interaction: {
        transition: { durationMs: 160, easing: 'ease-out' },
        hover: { surfaceFill: '#ffffff', motion: { offsetYPx: -2 } },
      },
    } as L1Node
    const { css } = renderL1Document(doc(cta))

    const base = ruleDecls(css, '.l1-0')
    const props = base.find((d) => d.startsWith('transition-property:'))!
    // BOTH features survive: the hover's paint + transform, and the entrance.
    expect(props).toContain('background-color')
    expect(props).toContain('transform')
    expect(props).toContain('opacity')
    expect(props).toContain('translate')

    // Each keeps its OWN timing — the list form, in the one case that needs it.
    const order = props.slice('transition-property:'.length).split(',').map((s) => s.trim())
    const durations = base
      .find((d) => d.startsWith('transition-duration:'))!
      .slice('transition-duration:'.length)
      .split(',')
      .map((s) => s.trim())
    expect(durations).toHaveLength(order.length)
    expect(durations[order.indexOf('background-color')]).toBe('160ms')
    expect(durations[order.indexOf('opacity')]).toBe('600ms')

    // The hover still lands: entrance did not consume the pseudo-class.
    expect(ruleDecls(css, '.l1-0:hover')).toContain('background-color: #ffffff')
    // Entrance moves `translate`; hover moves `transform`. Disjoint by design.
    expect(ruleDecls(css, pre(0))).toContain('translate: 0 24px')
    expect(ruleDecls(css, '.l1-0:hover')).toContain('transform: translate(0px, -2px)')
  })
})
