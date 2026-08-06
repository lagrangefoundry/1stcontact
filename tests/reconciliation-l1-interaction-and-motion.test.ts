/**
 * Reconciliation UATs — story-d2b5cb1c "L1 interaction state and scroll motion:
 * typed hover, focus and entrance axes with a renderer-owned safety floor".
 *
 *   AC-819  hover / focus deltas, one transition governing enter AND leave over
 *           exactly the properties the states change
 *   AC-820  typed values only — a selector, a style string, a raw curve, an
 *           unsafe URL, an unknown state or an out-of-range duration is refused
 *   AC-821  the focus-indicator floor: it cannot be authored away, and it is
 *           never animated
 *   AC-822  a state's motion ADDS to the node's authored placement
 *   AC-823  reduced motion: the paint without the travel, settled at the
 *           node's OWN opacity
 *   AC-824  an entrance names only where a node comes FROM; it settles at the
 *           design and never restates it
 *   AC-825  motion fails visible, and the driver is fixed and site-independent
 *   AC-826  a reader who jumps past a band still finds it settled
 *   AC-827  a container's stagger spaces its revealing children
 *   AC-828  entrance and interaction compose; neither cancels the other
 *
 * Every probe is engine-free except the two that must observe the *page*: the
 * schema, the envelope and the emitter are pure, and where a browser is needed
 * the only thing stubbed is the browser itself (layout + IntersectionObserver),
 * never anything this project owns. Pre-entrance appearance is observed by
 * asking a real selector engine whether the gated rule matches the node, rather
 * than by reading the stylesheet back as a string.
 *
 * ── KNOWN DIVERGENCE (AC-820) ────────────────────────────────────────────────
 * AC-820 requires that a refused interaction/entrance declaration be reported
 * with "the offending field path and why it was refused". Ten of its sixteen
 * refusal classes do exactly that. Six do not: the ones caught by the *shape*
 * check rather than the envelope — an unrecognised key (`selector`, `css`,
 * `keyframes`), an undefined state name (`active`), and a raw timing function on
 * either axis. `l1NodeSchema` is a plain `z.union` of the six node kinds, and a
 * Zod union failure collapses to ONE issue at the union's own path, so all six
 * report `/root` — "Invalid input", naming neither the field nor the reason.
 *
 * The information is not missing, only discarded: parsing the same value against
 * `l1BoxSchema` directly yields `interaction/hover` — `Unrecognized key:
 * "selector"`, `interaction` — `Unrecognized key: "active"`, and
 * `interaction/transition/easing` — `Invalid option: expected one of "linear" |
 * … | "ease-in-out"`. The union is discriminated by `kind` in fact but not in
 * type; declaring it as `z.discriminatedUnion('kind', …)` would route to the one
 * matching branch and surface that branch's issues verbatim.
 *
 * The assertion below is left as the AC specifies. It is deliberately no
 * stricter: an unrecognised *key* is reported against its enclosing object with
 * the key named in the message, which satisfies "names the offending field path
 * and why", and the test accepts that form.
 */
import { describe, expect, it } from 'vitest'
import {
  l1FocusRingSchema,
  l1InteractionSchema,
  l1RevealSchema,
  validateL1,
  type L1Document,
  type L1Interaction,
  type L1Node,
} from '../packages/site-schema/src/index'
import {
  L1_REVEAL_SCRIPT,
  renderL1Document,
  renderL1Fragment,
} from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]
const REDUCED = '(prefers-reduced-motion: reduce)'

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/** Split a rule body into its trimmed declarations. */
function decls(body: string): string[] {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
}

function escapeSelector(selector: string): string {
  return selector.replace(/[.:*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * EVERY declaration the stylesheet gives a selector outside a media query,
 * concatenated in source order. A selector can legitimately carry more than one
 * rule — a control's focus floor and its authored focus paint are two — so
 * taking only the last would silently drop half the answer.
 */
function allDecls(css: string, selector: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) => decls(r[1]))
}

/** Every declaration for a selector inside the named media query. */
function mediaDecls(css: string, media: string, selector: string): string[] {
  const blocks = [...css.matchAll(/@media ([^{]+)\{([\s\S]*?)\n\}/g)]
  const block = blocks.find((b) => b[1].trim() === media)
  if (!block) return []
  const rules = [...block[2].matchAll(new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`, 'g'))]
  return rules.flatMap((r) => decls(r[1]))
}

/** The value of a longhand on a rule, e.g. `transition-property` → its list. */
function longhand(list: string[], prop: string): string | undefined {
  const found = list.find((d) => d.startsWith(`${prop}:`))
  return found?.slice(prop.length + 1).trim()
}

/** A comma-list longhand, split into its per-property entries. */
function longhandList(list: string[], prop: string): string[] {
  const v = longhand(list, prop)
  return v === undefined ? [] : v.split(',').map((s) => s.trim())
}

/**
 * Every selector the renderer gates on the motion marker — i.e. every rule that
 * can present a node in its pre-entrance appearance.
 */
function preStateSelectors(css: string): string[] {
  return [...new Set([...css.matchAll(/(html\[data-l1-motion\][^\n{}]*?)\s*\{/g)].map((m) => m[1]))]
}

/**
 * Is this element *currently* presented in its pre-entrance appearance? Answered
 * by a real selector engine against the live document, so the marker attribute,
 * the `:not(.l1-in)` gate and the class list all count — the same three things
 * the browser consults.
 */
function inPreEntrance(el: Element, css: string): boolean {
  return preStateSelectors(css).some((s) => el.matches(s))
}

/** Every selector in the stylesheet whose body hides or displaces something. */
function hidingSelectors(css: string): string[] {
  return [...css.matchAll(/([^\n{}]+)\{([^}]*)\}/g)]
    .filter(([, , body]) => /opacity:\s*0(\s|;|$)/.test(body) || /translate:\s*0\s+-?\d/.test(body))
    .map(([, selector]) => selector.trim())
}

const CTA: L1Interaction = {
  transition: { durationMs: 160, easing: 'ease-out' },
  hover: { surfaceFill: '#1a1a1e', color: '#ffffff', motion: { offsetYPx: -2, scale: 1.02 } },
  focus: { ring: { widthPx: 2, color: '#fafaf9', offsetPx: 2 } },
}

/** A module-bound control, the one kind a keyboard can reach. */
const EMAIL_CONTROLS = { email: { tag: 'input' as const, attrs: { type: 'email', name: 'email' } } }
const emailField = (interaction?: L1Interaction): L1Node =>
  ({
    kind: 'control',
    control: 'email',
    axes: { color: '#111111' },
    ...(interaction ? { interaction } : {}),
  }) as L1Node

describe('story-d2b5cb1c — L1 interaction state and scroll motion', () => {
  /**
   * AC-819 — the declared values land on pointer-over and on keyboard focus, one
   * transition on the SETTLED rule governs both directions, and it names exactly
   * the properties the states change (never a blanket `all`, which would drag the
   * responsive geometry track into the animation).
   */
  it('test_UAT_AC819_hover_and_focus_deltas_transition_in_both_directions', () => {
    const d = doc({
      kind: 'box',
      axes: { surfaceFill: '#101014', borderRadiusPx: 8 },
      interaction: {
        transition: { durationMs: 160, easing: 'ease-out' },
        hover: { surfaceFill: '#1a1a1e', color: '#ffffff' },
        focus: { surfaceFill: '#26262c' },
      },
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)
    const { css } = renderL1Document(d)

    // The declared values, presented on pointer-over and on keyboard focus.
    expect(allDecls(css, '.l1-0:hover')).toEqual(
      expect.arrayContaining(['background-color: #1a1a1e', 'color: #ffffff']),
    )
    expect(allDecls(css, '.l1-0:focus-visible')).toContain('background-color: #26262c')

    // The base paint is what the node returns to — the states are deltas on a
    // settled rule that still carries the authored fill.
    const base = allDecls(css, '.l1-0')
    expect(base).toContain('background-color: #101014')

    // ONE transition, on the settled rule, so it governs the leave as well as
    // the enter. Declaring it inside a state would make un-hovering instant.
    expect(longhand(base, 'transition-duration')).toBe('160ms')
    expect(longhand(base, 'transition-timing-function')).toBe('ease-out')
    expect(allDecls(css, '.l1-0:hover').some((x) => x.startsWith('transition'))).toBe(false)
    expect(allDecls(css, '.l1-0:focus-visible').some((x) => x.startsWith('transition'))).toBe(false)

    // Exactly the properties the states change — nothing else, and never `all`.
    expect(new Set(longhandList(base, 'transition-property'))).toEqual(
      new Set(['background-color', 'color']),
    )
    expect(css).not.toMatch(/transition(-property)?:\s*all/)

    // A node whose only hover delta is a fill animates the fill and nothing else.
    const fillOnly = renderL1Document(
      doc({
        kind: 'box',
        axes: { surfaceFill: '#101014' },
        interaction: { transition: { durationMs: 120 }, hover: { surfaceFill: '#1a1a1e' } },
      } as L1Node),
    )
    expect(longhandList(allDecls(fillOnly.css, '.l1-0'), 'transition-property')).toEqual([
      'background-color',
    ])

    // No declared duration → the change is presented immediately, with no
    // animation applied at all.
    const instant = renderL1Document(
      doc({
        kind: 'box',
        axes: { surfaceFill: '#101014' },
        interaction: { hover: { surfaceFill: '#1a1a1e' } },
      } as L1Node),
    )
    expect(allDecls(instant.css, '.l1-0:hover')).toContain('background-color: #1a1a1e')
    expect(instant.css).not.toContain('transition')
  })

  /**
   * AC-820 — both axes admit typed values only. Each hostile definition carries
   * exactly one refusal, and the reported error must name the offending field
   * path and why it was refused.
   */
  it('test_UAT_AC820_interaction_and_entrance_admit_typed_values_only', () => {
    /**
     * `at` is the path the error must be reported at — the offending field
     * itself where the value is wrong, or its enclosing object where the *key*
     * is the offence. `names` is the token the report must carry so the reason
     * is legible: the rejected key, the constraint, or the closed set.
     */
    const refusals: { why: string; root: unknown; at: string; names: string }[] = [
      {
        why: 'a pseudo-class name smuggled in as a key',
        root: { kind: 'box', interaction: { hover: { selector: ':hover' } } },
        at: '/root/interaction/hover',
        names: 'selector',
      },
      {
        why: 'a raw style declaration smuggled in as a key',
        root: { kind: 'box', interaction: { hover: { css: 'color: red' } } },
        at: '/root/interaction/hover',
        names: 'css',
      },
      {
        why: 'a colour expressed as CSS text rather than a hex literal',
        root: { kind: 'box', interaction: { hover: { surfaceFill: 'rgba(0, 0, 0, .5)' } } },
        at: '/root/interaction/hover/surfaceFill',
        names: 'hex color',
      },
      {
        why: 'a style string smuggled in as a colour value',
        root: {
          kind: 'box',
          interaction: { hover: { surfaceFill: 'red; } body { display: none } .x {' } },
        },
        at: '/root/interaction/hover/surfaceFill',
        names: 'hex color',
      },
      {
        why: 'a hand-written cubic-bezier on an interaction transition',
        root: {
          kind: 'box',
          interaction: { transition: { durationMs: 160, easing: 'cubic-bezier(0, 0, 1, 1)' } },
        },
        at: '/root/interaction/transition/easing',
        names: 'ease-in-out',
      },
      {
        why: 'a hand-written timing function on an entrance',
        root: { kind: 'box', reveal: { easing: 'steps(4, end)' } },
        at: '/root/reveal/easing',
        names: 'ease-in-out',
      },
      {
        why: 'a keyframe string smuggled onto an entrance',
        root: { kind: 'box', reveal: { keyframes: '@keyframes x { from { opacity: 0 } }' } },
        at: '/root/reveal',
        names: 'keyframes',
      },
      {
        why: 'an off-allowlist background URL that opens only on pointer-over',
        root: { kind: 'box', interaction: { hover: { backgroundImageUrl: 'javascript:alert(1)' } } },
        at: '/root/interaction/hover/backgroundImageUrl',
        names: 'not an allowed URL',
      },
      {
        why: 'an off-allowlist background URL that opens only on keyboard focus',
        root: {
          kind: 'box',
          interaction: { focus: { backgroundImageUrl: 'data:text/html,<script>alert(1)</script>' } },
        },
        at: '/root/interaction/focus/backgroundImageUrl',
        names: 'not an allowed URL',
      },
      {
        why: 'a state name the vocabulary does not define',
        root: { kind: 'box', interaction: { active: { surfaceFill: '#ffffff' } } },
        at: '/root/interaction',
        names: 'active',
      },
      {
        why: 'an interaction transition duration outside the permitted range',
        root: { kind: 'box', interaction: { transition: { durationMs: 999_999 } } },
        at: '/root/interaction/transition/durationMs',
        names: 'out of range',
      },
      {
        why: 'an entrance duration outside the permitted range',
        root: { kind: 'box', reveal: { yPx: 24, durationMs: 999_999 } },
        at: '/root/reveal/durationMs',
        names: 'out of range',
      },
      {
        why: 'an entrance delay outside the permitted range',
        root: { kind: 'box', reveal: { yPx: 24, delayMs: 999_999 } },
        at: '/root/reveal/delayMs',
        names: 'out of range',
      },
      {
        why: 'a stagger interval outside the permitted range',
        root: { kind: 'container', layout: 'row', staggerMs: 999_999, children: [] },
        at: '/root/staggerMs',
        names: 'out of range',
      },
      {
        why: 'a zero-width focus ring',
        root: { kind: 'box', interaction: { focus: { ring: { widthPx: 0, color: '#ffffff' } } } },
        at: '/root/interaction/focus/ring/widthPx',
        names: '0',
      },
      {
        why: 'a negative-width focus ring',
        root: { kind: 'box', interaction: { focus: { ring: { widthPx: -2, color: '#ffffff' } } } },
        at: '/root/interaction/focus/ring/widthPx',
        names: '0',
      },
    ]

    for (const { why, root, at, names } of refusals) {
      const result = validateL1({ widths: WIDTHS, root })
      // Every one is refused outright — nothing is smuggled through.
      expect(result.ok, why).toBe(false)
      if (result.ok) continue
      // …and the report names the offending field path AND why it was refused.
      const reported = result.errors.map((e) => `${e.path} — ${e.message}`).join('\n')
      expect
        .soft(
          result.errors.some(
            (e) => e.path === at && `${e.path} ${e.message}`.toLowerCase().includes(names.toLowerCase()),
          ),
          `${why}: expected an error at '${at}' naming '${names}', got:\n${reported}`,
        )
        .toBe(true)
    }

    // The well-formed equivalent — every axis in vocabulary and in range —
    // validates and renders.
    const wellFormed = doc({
      kind: 'container',
      layout: 'stack',
      staggerMs: 80,
      children: [
        {
          kind: 'box',
          axes: { surfaceFill: '#101014', backgroundImageUrl: '/assets/card.png' },
          reveal: { yPx: 24, fromOpacity: 0, durationMs: 600, delayMs: 40, easing: 'ease-out' },
          interaction: CTA,
        },
        { kind: 'text', text: '</style><script>alert(1)</script>', axes: { color: '#fafaf9' } },
      ],
    } as L1Node)
    expect(validateL1(wellFormed).ok).toBe(true)
    const { html, css } = renderL1Document(wellFormed)
    expect(html).toContain('l1-rv')

    // No instance-supplied string reaches the page as raw style, markup or
    // script: the copy is escaped in the markup and appears nowhere in the CSS,
    // and the only script on the page is the renderer's own fixed driver.
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;/style&gt;&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(css).not.toContain('alert(1)')
    expect(css).not.toContain('<script')
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html).toContain(`<script>${L1_REVEAL_SCRIPT}</script>`)
  })

  /**
   * AC-821 — the focus-indicator floor. The emitter neutralises the user agent's
   * own chrome, so silence is what would actually strip the indicator; the floor
   * is what stops that. Taste may restyle the ring, never remove it.
   */
  it('test_UAT_AC821_every_focusable_control_keeps_a_visible_focus_indicator', () => {
    const unauthored: [string, L1Node][] = [
      ['no interaction at all', emailField()],
      ['a hover state and nothing else', emailField({ hover: { surfaceFill: '#f5f5f5' } })],
      ['a focus state with no ring of its own', emailField({ focus: { surfaceFill: '#f0f0f0' } })],
    ]
    for (const [why, node] of unauthored) {
      const { css } = renderL1Fragment([node], 'fc', EMAIL_CONTROLS)
      const focus = allDecls(css, '.fc-l1-0:focus-visible')
      // The supplied indicator takes the node's OWN colour, so it stays visible
      // on a light or a dark surface without the substrate assuming a palette.
      expect(focus, why).toContain('outline: 2px solid currentColor')
      expect(focus, why).toContain('outline-offset: 2px')
      expect(css, why).not.toMatch(/outline\s*:\s*(none|0)\b/)
    }

    // An authored indicator REPLACES the supplied one.
    const ringed = renderL1Fragment(
      [emailField({ focus: { ring: { widthPx: 3, color: '#2563eb', offsetPx: 1, style: 'dashed' } } })],
      'fc',
      EMAIL_CONTROLS,
    )
    const authored = allDecls(ringed.css, '.fc-l1-0:focus-visible')
    expect(authored).toContain('outline: 3px dashed #2563eb')
    expect(authored).toContain('outline-offset: 1px')
    expect(ringed.css).not.toContain('currentColor')
    expect(ringed.css).not.toMatch(/outline\s*:\s*(none|0)\b/)

    // The indicator is never animated: it is present the instant focus arrives,
    // because an indicator that fades in is one that is briefly absent.
    const animated = renderL1Fragment(
      [
        emailField({
          transition: { durationMs: 120, easing: 'ease-out' },
          focus: { surfaceFill: '#f0f0f0', ring: { widthPx: 3, color: '#2563eb' } },
        }),
      ],
      'fc',
      EMAIL_CONTROLS,
    )
    const animatedProps = longhandList(allDecls(animated.css, '.fc-l1-0'), 'transition-property')
    expect(animatedProps).toContain('background-color')
    expect(animatedProps).not.toContain('outline')
    expect(animatedProps).not.toContain('outline-offset')
    expect(allDecls(animated.css, '.fc-l1-0:focus-visible')).toContain('outline: 3px solid #2563eb')

    // No site definition can express the indicator's removal. A zero-width ring
    // fails validation with a message that explains the constraint…
    const zero = validateL1(
      doc({ kind: 'box', interaction: { focus: { ring: { widthPx: 0, color: '#ffffff' } } } } as L1Node),
    )
    expect(zero.ok).toBe(false)
    if (!zero.ok) {
      const named = zero.errors.filter((e) => e.path === '/root/interaction/focus/ring/widthPx')
      expect(named.length).toBeGreaterThan(0)
      expect(named.map((e) => e.message).join(' | ')).toMatch(
        />0|greater than 0|too small|may not be authored away/i,
      )
    }
    // …a sub-pixel ring is out of envelope for the same reason…
    expect(
      validateL1(
        doc({
          kind: 'box',
          interaction: { focus: { ring: { widthPx: 0.4, color: '#ffffff' } } },
        } as L1Node),
      ).ok,
    ).toBe(false)
    // …and the vocabulary offers no `none` variant, at any level.
    expect(l1FocusRingSchema.safeParse({ widthPx: 'none', color: '#ffffff' }).success).toBe(false)
    expect(l1FocusRingSchema.safeParse({ width: 'none' }).success).toBe(false)
    expect(l1InteractionSchema.safeParse({ focus: { ring: 'none' } }).success).toBe(false)
    expect(l1InteractionSchema.safeParse({ focus: { ring: null } }).success).toBe(false)
    expect(l1InteractionSchema.safeParse({ focus: { outline: 'none' } }).success).toBe(false)
  })

  /**
   * AC-822 — CSS `transform` REPLACES rather than accumulates, so a state that
   * only wants to nudge would silently discard the node's authored rotation and
   * scale unless the two are merged. They are.
   */
  it('test_UAT_AC822_state_motion_adds_to_the_authored_placement', () => {
    const nudge = doc({
      kind: 'box',
      axes: { surfaceFill: '#101014' },
      transform: { rotateDeg: 3, scale: 1.05 },
      interaction: { transition: { durationMs: 200 }, hover: { motion: { offsetYPx: -4 } } },
    } as L1Node)
    expect(validateL1(nudge).ok).toBe(true)
    const { css } = renderL1Document(nudge)

    // Settled: exactly what the node authored.
    expect(allDecls(css, '.l1-0')).toContain('transform: rotate(3deg) scale(1.05)')
    // Hovered: the state's offset AND the authored rotation and scale.
    const hovered = longhand(allDecls(css, '.l1-0:hover'), 'transform')!
    expect(hovered).toContain('translate(0px, -4px)')
    expect(hovered).toContain('rotate(3deg)')
    expect(hovered).toContain('scale(1.05)')

    // Where the state restates an axis the node already declares, the STATE's
    // value is presented while active, and the authored value is restored after.
    const restated = renderL1Document(
      doc({
        kind: 'box',
        transform: { rotateDeg: 3, scale: 1.05 },
        interaction: {
          transition: { durationMs: 200 },
          hover: { motion: { offsetYPx: -4, scale: 1.2 } },
        },
      } as L1Node),
    )
    const restatedHover = longhand(allDecls(restated.css, '.l1-0:hover'), 'transform')!
    expect(restatedHover).toContain('scale(1.2)')
    expect(restatedHover).not.toContain('scale(1.05)')
    expect(restatedHover).toContain('rotate(3deg)')
    expect(allDecls(restated.css, '.l1-0')).toContain('transform: rotate(3deg) scale(1.05)')
  })

  /**
   * AC-823 — under a reduced-motion preference the reader gets the paint without
   * the travel, and a revealing node settles at its OWN authored opacity: the
   * preference restores the design, it does not brighten it.
   */
  it('test_UAT_AC823_reduced_motion_keeps_the_paint_and_drops_the_travel', () => {
    const dimmed = doc({
      kind: 'container',
      layout: 'stack',
      children: [
        {
          kind: 'box',
          axes: { surfaceFill: '#131316', opacity: 0.6 },
          reveal: { yPx: 24, fromOpacity: 0, durationMs: 600 },
          interaction: CTA,
        },
      ],
    } as L1Node)
    expect(validateL1(dimmed).ok).toBe(true)
    const { css } = renderL1Document(dimmed)
    const pre = 'html[data-l1-motion] .l1-1:not(.l1-in)'

    // The paint change survives — feedback without movement.
    expect(allDecls(css, '.l1-1:hover')).toEqual(
      expect.arrayContaining(['background-color: #1a1a1e', 'color: #ffffff']),
    )
    // …but the movement collapses back to the node's authored placement (none
    // here), and the change is presented immediately.
    expect(mediaDecls(css, REDUCED, '.l1-1:hover')).toContain('transform: none')
    expect(mediaDecls(css, REDUCED, '.l1-1')).toContain('transition-duration: 0ms')

    // The revealing node is settled at ITS OWN opacity — 0.6, not 1.
    const settled = mediaDecls(css, REDUCED, pre)
    expect(settled).toContain('opacity: 0.6')
    expect(settled).toContain('translate: none')
    expect(settled).not.toContain('opacity: 1')

    // The published page honours the preference itself: the driver declines to
    // set the marker at all, before it is ever set.
    expect(L1_REVEAL_SCRIPT).toContain('prefers-reduced-motion: reduce')
    expect(L1_REVEAL_SCRIPT.indexOf('prefers-reduced-motion')).toBeLessThan(
      L1_REVEAL_SCRIPT.indexOf('setAttribute'),
    )

    // No field in the site definition can suppress any of it.
    for (const override of [
      { respectReducedMotion: false },
      { force: true },
      { ignoreReducedMotion: true },
      { reducedMotion: 'off' },
    ]) {
      expect(l1RevealSchema.safeParse({ yPx: 24, ...override }).success).toBe(false)
      expect(l1InteractionSchema.safeParse({ hover: { surfaceFill: '#ffffff' }, ...override }).success).toBe(
        false,
      )
    }
  })

  /**
   * AC-824 — an entrance names only where the node comes FROM. Settling needs no
   * second rule (the gate simply stops matching), so a reveal can never restate
   * or drift from the design.
   */
  it('test_UAT_AC824_entrance_names_only_where_a_node_comes_from', () => {
    const d = doc({
      kind: 'container',
      layout: 'stack',
      children: [
        // 1. offset + from-opacity, with its own duration and curve.
        {
          kind: 'text',
          text: 'Rises and fades',
          axes: { color: '#fafaf9' },
          reveal: { yPx: 24, fromOpacity: 0.1, durationMs: 640, easing: 'ease-in-out' },
        },
        // 2. authored at partial settled opacity, entrance left on defaults.
        { kind: 'box', axes: { surfaceFill: '#131316', opacity: 0.6 }, reveal: { yPx: 16 } },
        // 3. opacity-only entrance — no positional movement at all.
        { kind: 'box', axes: { surfaceFill: '#101014' }, reveal: { fromOpacity: 0 } },
      ],
    } as L1Node)
    expect(validateL1(d).ok).toBe(true)
    const { html, css } = renderL1Document(d)

    // 1 — presented at its declared from-values until it first enters view, and
    //     arriving over the declared duration and curve.
    const preOne = allDecls(css, 'html[data-l1-motion] .l1-1:not(.l1-in)')
    expect(preOne).toContain('opacity: 0.1')
    expect(preOne).toContain('translate: 0 24px')
    const baseOne = allDecls(css, '.l1-1')
    expect(longhandList(baseOne, 'transition-property')).toEqual(['opacity', 'translate'])
    expect(longhand(baseOne, 'transition-duration')).toBe('640ms')
    expect(longhand(baseOne, 'transition-timing-function')).toBe('ease-in-out')

    // 2 — an entrance declaring no from-opacity starts fully transparent, and no
    //     duration or curve takes the substrate's default rather than requiring
    //     the author to restate one.
    const preTwo = allDecls(css, 'html[data-l1-motion] .l1-2:not(.l1-in)')
    expect(preTwo).toContain('opacity: 0')
    expect(preTwo).toContain('translate: 0 16px')
    const baseTwo = allDecls(css, '.l1-2')
    expect(longhand(baseTwo, 'transition-duration')).toBe('600ms')
    expect(longhand(baseTwo, 'transition-timing-function')).toBe('ease-out')
    // The settled presentation is the node's OWN authored opacity, stated once,
    // by the node — the entrance never restates it.
    expect(baseTwo).toContain('opacity: 0.6')
    expect(mediaDecls(css, REDUCED, 'html[data-l1-motion] .l1-2:not(.l1-in)')).toContain('opacity: 0.6')

    // 3 — an entrance with no vertical offset animates opacity alone, with NO
    //     positional movement applied.
    const preThree = allDecls(css, 'html[data-l1-motion] .l1-3:not(.l1-in)')
    expect(preThree).toEqual(['opacity: 0'])
    expect(longhandList(allDecls(css, '.l1-3'), 'transition-property')).toEqual(['opacity'])

    // Settling adds no rule of its own: the gate stops matching and the node's
    // own authored paint resumes.
    expect(css).not.toContain('.l1-in .')
    expect(css).not.toMatch(/\.l1-in\s*\{/)

    // Every revealing node carries the fixed observer handle the author never names.
    expect(html.match(/class="[^"]*\bl1-rv\b[^"]*"/g)).toHaveLength(3)
  })

  /**
   * AC-825 — the load-bearing safety property. The pre-state is gated on a marker
   * the driver sets only once motion is genuinely going to run, so every way the
   * motion can fail leaves the page settled rather than blank.
   */
  it('test_UAT_AC825_motion_fails_visible_and_the_driver_is_site_independent', async () => {
    const { JSDOM } = await import('jsdom')
    const page = doc({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'Band one', reveal: { yPx: 24, fromOpacity: 0 } },
        { kind: 'text', text: 'Band two', reveal: { yPx: 24, fromOpacity: 0 } },
      ],
    } as L1Node)
    const { html, css } = renderL1Document(page)

    // Every rule that hides or displaces anything is behind the marker. If one
    // were not, a reader whose motion never runs would lose that content.
    const hiding = hidingSelectors(css)
    expect(hiding.length).toBeGreaterThan(0)
    for (const selector of hiding) expect(selector.startsWith('html[data-l1-motion]')).toBe(true)

    /** Evaluate the published page under a hostile environment. */
    const evaluate = (
      label: string,
      beforeParse: ((win: Record<string, unknown>) => void) | undefined,
      runScripts: 'dangerously' | undefined,
    ): void => {
      const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
        ...(runScripts ? { runScripts } : {}),
        ...(beforeParse ? { beforeParse } : {}),
      })
      const { document: d } = dom.window
      // The marker never arrives, so no pre-state rule can match…
      expect(d.documentElement.hasAttribute('data-l1-motion'), label).toBe(false)
      const nodes = [...d.querySelectorAll('.l1-rv')]
      expect(nodes, label).toHaveLength(2)
      // …and every revealing node is therefore presented settled and visible.
      for (const node of nodes) expect(inPreEntrance(node, css), label).toBe(false)
      dom.window.close()
    }

    // 1. Scripting not executed at all.
    evaluate('scripting disabled', undefined, undefined)
    // 2. No viewport-observation support in the user agent.
    evaluate(
      'no IntersectionObserver',
      (win) => {
        delete (win as unknown as Record<string, unknown>).IntersectionObserver
        ;(win as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false })
      },
      'dangerously',
    )
    // 3. An error raised during setup.
    evaluate(
      'error during setup',
      (win) => {
        const w = win as unknown as Record<string, unknown>
        w.IntersectionObserver = class {
          observe() {}
          unobserve() {}
          disconnect() {}
        }
        w.matchMedia = () => {
          throw new Error('boom')
        }
      },
      'dangerously',
    )
    // 4. A reduced-motion preference.
    evaluate(
      'reduced motion',
      (win) => {
        const w = win as unknown as Record<string, unknown>
        w.IntersectionObserver = class {
          observe() {}
          unobserve() {}
          disconnect() {}
        }
        w.matchMedia = () => ({ matches: true })
      },
      'dangerously',
    )

    // The driver is a fixed, site-independent asset: byte-identical across two
    // different sites' pages, carrying no value from either definition.
    const alpha = renderL1Document(
      doc({ kind: 'text', text: 'Alpha Roofing', reveal: { yPx: 47, durationMs: 7370 } } as L1Node),
    )
    const beta = renderL1Document(
      doc({ kind: 'text', text: 'Beta Dental', reveal: { yPx: 29, durationMs: 313 } } as L1Node),
    )
    expect(alpha.js).toBe(beta.js)
    expect(alpha.js).toBe(L1_REVEAL_SCRIPT)
    // No copy and no axis value from either definition reaches the driver.
    for (const value of ['Alpha', 'Roofing', '7370', '47', 'Beta', 'Dental', '313', '29']) {
      expect(L1_REVEAL_SCRIPT, value).not.toContain(value)
    }

    // ONE driver for every revealing node on the page, not one per node.
    expect(L1_REVEAL_SCRIPT.match(/new IntersectionObserver/g)).toHaveLength(1)
    expect(html.match(/<script>/g)).toHaveLength(1)
    let observers = 0
    const observed: Element[] = []
    const live = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
      runScripts: 'dangerously',
      beforeParse(win) {
        const w = win as unknown as Record<string, unknown>
        w.IntersectionObserver = class {
          constructor() {
            observers += 1
          }
          observe(el: Element) {
            observed.push(el)
          }
          unobserve() {}
          disconnect() {}
        }
        w.matchMedia = () => ({ matches: false })
      },
    })
    const liveDoc = live.window.document
    if (liveDoc.readyState === 'loading') {
      await new Promise<void>((r) => liveDoc.addEventListener('DOMContentLoaded', () => r()))
    }
    expect(observers).toBe(1)
    expect(observed).toHaveLength(2)
    live.window.close()

    // A page whose nodes declare no entrance carries no motion script whatsoever.
    const still = renderL1Document(doc({ kind: 'text', text: 'No motion here' } as L1Node))
    expect(still.js).toBeUndefined()
    expect(still.html).not.toContain('<script')
    expect(still.css).not.toContain('data-l1-motion')
  })

  /**
   * AC-826 — a reader who arrives below a band without passing through it
   * progressively still finds that band settled.
   *
   * A node that goes from below the viewport to above it in one jump holds an
   * intersection ratio of 0 throughout, so no entry is ever delivered for it and
   * no clause inside the callback can settle it. Only the observer's ROOT
   * geometry can, which is why the browser is modelled here rather than
   * hand-fired: the stub computes intersection from the rootMargin the driver
   * actually passes, exactly as a real user agent would.
   */
  it('test_UAT_AC826_bands_jumped_over_are_settled_not_left_blank', async () => {
    const { JSDOM } = await import('jsdom')
    const BANDS = 10
    const BAND_PX = 400
    const VIEWPORT_PX = 800
    const DOC_PX = BANDS * BAND_PX

    const page = doc({
      kind: 'container',
      layout: 'stack',
      children: Array.from({ length: BANDS }, (_, i) => ({
        kind: 'text',
        text: `Band ${i}`,
        axes: { color: '#fafaf9' },
        reveal: { yPx: 24, fromOpacity: 0 },
      })),
    } as L1Node)
    const { html, css } = renderL1Document(page)

    let scrollY = 0
    const targets: Element[] = []
    let fire: (entries: unknown[]) => void = () => {}
    let rootMargin = ''
    const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
      runScripts: 'dangerously',
      beforeParse(win) {
        const w = win as unknown as Record<string, unknown>
        w.matchMedia = () => ({ matches: false })
        w.IntersectionObserver = class {
          constructor(cb: (e: unknown[]) => void, opts?: { rootMargin?: string }) {
            fire = cb
            rootMargin = opts?.rootMargin ?? ''
          }
          observe(el: Element) {
            targets.push(el)
          }
          unobserve(el: Element) {
            const i = targets.indexOf(el)
            if (i >= 0) targets.splice(i, 1)
          }
          disconnect() {}
        }
      },
    })
    const d = dom.window.document
    if (d.readyState === 'loading') {
      await new Promise<void>((r) => d.addEventListener('DOMContentLoaded', () => r()))
    }
    const bands = [...d.querySelectorAll('.l1-rv')]
    expect(bands).toHaveLength(BANDS)

    // ── The browser, modelled from the rootMargin the driver actually declared ──
    const [top, , bottom] = rootMargin.split(/\s+/)
    const rootTop = -Number.parseFloat(top)
    const rootBottom = bottom.endsWith('%')
      ? VIEWPORT_PX + (Number.parseFloat(bottom) / 100) * VIEWPORT_PX
      : VIEWPORT_PX + Number.parseFloat(bottom)
    /** A band's rect in viewport coordinates at the current scroll position. */
    const rectOf = (i: number) => ({ top: i * BAND_PX - scrollY, bottom: (i + 1) * BAND_PX - scrollY })
    const intersects = (i: number): boolean => {
      const r = rectOf(i)
      return r.bottom > rootTop && r.top < rootBottom
    }
    const partiallyVisible = (i: number): boolean => {
      const r = rectOf(i)
      return r.bottom > 0 && r.top < VIEWPORT_PX
    }
    let previous = bands.map((_, i) => intersects(i))
    /** Jump the scroll position and deliver entries for every CHANGED band. */
    const scrollTo = (y: number): void => {
      scrollY = y
      const now = bands.map((_, i) => intersects(i))
      const entries = bands
        .map((target, i) => ({ target, i }))
        .filter(({ target, i }) => now[i] !== previous[i] && targets.includes(target))
        .map(({ target, i }) => ({ target, isIntersecting: now[i] }))
      previous = now
      if (entries.length) fire(entries)
    }

    // ── Page load at the top ─────────────────────────────────────────────────
    fire(
      bands
        .map((target, i) => ({ target, isIntersecting: intersects(i) }))
        .filter((e) => e.isIntersecting),
    )
    expect(inPreEntrance(bands[0], css)).toBe(false)
    expect(inPreEntrance(bands[1], css)).toBe(false)
    for (let i = 2; i < BANDS; i++) expect(inPreEntrance(bands[i], css), `band ${i}`).toBe(true)

    // Bands 2–6 are about to be jumped clean over: not partially visible before
    // the jump, and not partially visible after it. They never occupy a frame in
    // which any part of them is in view.
    const jumpedOver = [2, 3, 4, 5, 6]
    for (const i of jumpedOver) expect(partiallyVisible(i), `band ${i} before`).toBe(false)

    // ── One jump, no intermediate positions (an anchor link / restored scroll) ─
    const ARRIVAL = 2800
    scrollTo(ARRIVAL)
    for (const i of jumpedOver) expect(partiallyVisible(i), `band ${i} after`).toBe(false)

    // Every band above the arrival point is settled and visible when scrolled
    // back to — none is left blank while occupying space.
    for (let i = 0; i <= 8; i++) expect(inPreEntrance(bands[i], css), `band ${i}`).toBe(false)

    // A band still below the arrival point stays in its pre-entrance appearance…
    expect(inPreEntrance(bands[9], css)).toBe(true)
    // …and enters normally as the reader scrolls down to it.
    scrollTo(DOC_PX - VIEWPORT_PX)
    expect(inPreEntrance(bands[9], css)).toBe(false)

    // Every band settled exactly once: a settled band is unobserved, so the
    // entrance never replays on the way back up.
    expect(targets).toHaveLength(0)
    dom.window.close()
  })

  /**
   * AC-827 — a container's stagger spaces its revealing children by position. A
   * row of peers that all land at once reads mechanical; the stagger is what
   * makes it read as choreography.
   */
  it('test_UAT_AC827_container_stagger_spaces_revealing_children_by_position', () => {
    const INTERVAL = 80
    const OWN_DELAY = 25
    const card = (t: string, delayMs?: number): L1Node =>
      ({
        kind: 'text',
        text: t,
        reveal: { yPx: 16, durationMs: 500, ...(delayMs === undefined ? {} : { delayMs }) },
      }) as L1Node
    const staggered = doc({
      kind: 'container',
      layout: 'row',
      staggerMs: INTERVAL,
      children: [
        card('Capability'),
        // A decorative spacer: it reveals nothing, so it consumes no slot.
        { kind: 'box', sizing: { width: { mode: 'fixed', px: 8 } } },
        card('User story'),
        card('Acceptance criteria'),
        card('Verification', OWN_DELAY),
      ],
    } as L1Node)
    expect(validateL1(staggered).ok).toBe(true)

    const { css } = renderL1Document(staggered)
    /** A node's presented entrance delay — an omitted longhand is CSS's 0ms. */
    const delayOf = (n: number): number => {
      const v = longhand(allDecls(css, `.l1-${n}`), 'transition-delay')
      return v === undefined ? 0 : Number.parseFloat(v)
    }

    // Children are nodes 1..5 (0 is the container); node 2 is the spacer. Each
    // revealing child's delay is its index among the REVEALING children times
    // the interval, plus its own declared delay.
    expect(delayOf(1)).toBe(0 * INTERVAL)
    expect(delayOf(3)).toBe(1 * INTERVAL)
    expect(delayOf(4)).toBe(2 * INTERVAL)
    expect(delayOf(5)).toBe(3 * INTERVAL + OWN_DELAY)

    // The non-revealing spacer shifts no sibling: had it bought a slot, the two
    // cards after it would each be one interval further out.
    expect(delayOf(3)).not.toBe(2 * INTERVAL)
    expect(allDecls(css, '.l1-2').some((x) => x.startsWith('transition'))).toBe(false)

    // Removing the stagger leaves each child with only its own declared delay.
    const unstaggered = renderL1Document(
      doc({
        kind: 'container',
        layout: 'row',
        children: [
          card('Capability'),
          { kind: 'box', sizing: { width: { mode: 'fixed', px: 8 } } },
          card('User story'),
          card('Acceptance criteria'),
          card('Verification', OWN_DELAY),
        ],
      } as L1Node),
    )
    const plainDelay = (n: number): number => {
      const v = longhand(allDecls(unstaggered.css, `.l1-${n}`), 'transition-delay')
      return v === undefined ? 0 : Number.parseFloat(v)
    }
    expect([plainDelay(1), plainDelay(3), plainDelay(4), plainDelay(5)]).toEqual([0, 0, 0, OWN_DELAY])
  })

  /**
   * AC-828 — the two features compose. A rule carries only one
   * `transition-property`, so emitting them independently would leave whichever
   * ran second silently cancelling the first — a revealing button losing its
   * hover feedback, invisible to either feature's own tests.
   */
  it('test_UAT_AC828_entrance_and_interaction_keep_both_behaviours', () => {
    const both = doc({
      kind: 'box',
      axes: { surfaceFill: '#fafaf9', borderRadiusPx: 6 },
      reveal: { yPx: 24, fromOpacity: 0, durationMs: 600, easing: 'ease-out', delayMs: 120 },
      interaction: {
        transition: { durationMs: 160, easing: 'ease-out' },
        hover: { surfaceFill: '#ffffff', motion: { offsetYPx: -2 } },
        focus: { ring: { widthPx: 2, color: '#2563eb' } },
      },
    } as L1Node)
    expect(validateL1(both).ok).toBe(true)
    const { css } = renderL1Document(both)
    const base = allDecls(css, '.l1-0')

    // It presents its pre-entrance appearance before arriving…
    const pre = allDecls(css, 'html[data-l1-motion] .l1-0:not(.l1-in)')
    expect(pre).toContain('opacity: 0')
    expect(pre).toContain('translate: 0 24px')
    // …and still responds to pointer and keyboard once settled.
    expect(allDecls(css, '.l1-0:hover')).toContain('background-color: #ffffff')
    expect(allDecls(css, '.l1-0:focus-visible')).toContain('outline: 2px solid #2563eb')

    // BOTH behaviours are present in ONE animation description on the node,
    // each property keeping its own duration and delay.
    const props = longhandList(base, 'transition-property')
    const durations = longhandList(base, 'transition-duration')
    const delays = longhandList(base, 'transition-delay')
    expect(props).toEqual(expect.arrayContaining(['background-color', 'transform', 'opacity', 'translate']))
    expect(durations).toHaveLength(props.length)
    expect(delays).toHaveLength(props.length)
    expect(durations[props.indexOf('background-color')]).toBe('160ms')
    expect(durations[props.indexOf('transform')]).toBe('160ms')
    expect(durations[props.indexOf('opacity')]).toBe('600ms')
    expect(durations[props.indexOf('translate')]).toBe('600ms')
    expect(delays[props.indexOf('background-color')]).toBe('0ms')
    expect(delays[props.indexOf('opacity')]).toBe('120ms')

    // The two movements do not overwrite one another: the entrance travels on
    // `translate` while the state's motion travels on `transform`, so a node
    // lifting on hover after arriving is presented at the combined position.
    expect(longhand(allDecls(css, '.l1-0:hover'), 'transform')).toBe('translate(0px, -2px)')
    expect(pre.some((x) => x.startsWith('transform'))).toBe(false)

    // A node declaring interaction and NO entrance is presented exactly as it
    // was before entrance motion existed: no observer handle, no gated
    // pre-state, no motion driver, and the plain scalar transition form.
    const interactionOnly = renderL1Document(
      doc({
        kind: 'box',
        axes: { surfaceFill: '#fafaf9', borderRadiusPx: 6 },
        interaction: {
          transition: { durationMs: 160, easing: 'ease-out' },
          hover: { surfaceFill: '#ffffff', motion: { offsetYPx: -2 } },
          focus: { ring: { widthPx: 2, color: '#2563eb' } },
        },
      } as L1Node),
    )
    expect(interactionOnly.js).toBeUndefined()
    expect(interactionOnly.html).not.toContain('<script')
    expect(interactionOnly.html).not.toContain('l1-rv')
    expect(interactionOnly.css).not.toContain('data-l1-motion')
    // No `translate` PROPERTY — the hover's own `transform: translate(…)` is the
    // pre-existing interaction behaviour and is expected to be there.
    expect(interactionOnly.css).not.toMatch(/(^|[\s;{])translate:/)
    const soloBase = allDecls(interactionOnly.css, '.l1-0')
    expect(new Set(longhandList(soloBase, 'transition-property'))).toEqual(
      new Set(['background-color', 'transform']),
    )
    expect(longhand(soloBase, 'transition-duration')).toBe('160ms')
    expect(longhand(soloBase, 'transition-timing-function')).toBe('ease-out')
    expect(longhand(soloBase, 'transition-delay')).toBeUndefined()
  })
})
