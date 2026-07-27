/**
 * REQ-99 — L1's typed interaction-state vocabulary (hover / focus).
 *
 * Before this, L1 had no `:hover`, no `:focus-visible`, and no way to express
 * either: every control it painted was visually inert, and a field got whatever
 * focus treatment the user agent happened to supply. That was survivable while a
 * module could paint its own controls; since REQ-96 (L1 is the sole owner of
 * appearance, a behavior module ships zero CSS) an interaction treatment L1
 * cannot express is one that cannot exist — a quality ceiling, at exactly the
 * altitude DOC-16 §4 says the flagship sites must clear.
 *
 * These UATs pin the ticket's acceptance:
 *   1. a node declares `hover` / `focus` as typed values and the renderer emits
 *      the corresponding rules;
 *   2. no raw CSS or selector can enter through these fields;
 *   3. an interactive node cannot end up with no focus indicator;
 *   4. the treatment composes with what the node already declared (a state's
 *      motion does not silently discard an authored transform) and respects a
 *      reduced-motion preference.
 */
import { describe, expect, it } from 'vitest'
import {
  validateL1,
  type L1Document,
  type L1Interaction,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Fragment } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

function doc(root: L1Node): L1Document {
  return { widths: WIDTHS, root }
}

/** The declarations of the last non-media rule for a selector. */
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

const CTA: L1Interaction = {
  transition: { durationMs: 160, easing: 'ease-out' },
  hover: {
    surfaceFill: '#1a1a1e',
    color: '#ffffff',
    motion: { offsetYPx: -2, scale: 1.02 },
  },
  focus: { ring: { widthPx: 2, color: '#fafaf9', offsetPx: 2 } },
}

describe('REQ-99 — typed interaction state on an L1 node', () => {
  it('test_UAT_FC_REQ-99_hover_and_focus_axes_emit_pseudo_class_rules', () => {
    // A node declares hover / focus as typed values; the renderer emits the rules.
    const d = doc({
      kind: 'box',
      axes: { surfaceFill: '#101014', borderRadiusPx: 8 },
      interaction: CTA,
      children: [{ kind: 'text', text: 'Get started', axes: { color: '#e5e5e5' } }],
    })
    const ok = validateL1(d)
    expect(ok.ok).toBe(true)

    const { css } = renderL1Document(d)

    const hover = ruleDecls(css, '.l1-0:hover')
    expect(hover).toContain('background-color: #1a1a1e')
    expect(hover).toContain('color: #ffffff')
    expect(hover).toContain('transform: translate(0px, -2px) scale(1.02)')

    const focus = ruleDecls(css, '.l1-0:focus-visible')
    expect(focus).toContain('outline: 2px solid #fafaf9')
    expect(focus).toContain('outline-offset: 2px')

    // The transition lives on the BASE rule, so it governs the leave as well as
    // the enter, and names only the properties the states actually change.
    const base = ruleDecls(css, '.l1-0')
    expect(base).toContain('transition-duration: 160ms')
    expect(base).toContain('transition-timing-function: ease-out')
    const prop = base.find((decl) => decl.startsWith('transition-property:'))!
    expect(prop).toBeDefined()
    const props = prop.slice('transition-property:'.length).split(',').map((p) => p.trim())
    expect(new Set(props)).toEqual(new Set(['background-color', 'color', 'transform']))
    // Never a blanket `all` — that would animate the geometry the keyframe track owns.
    expect(props).not.toContain('all')
    expect(css).not.toContain('transition: all')
  })

  it('test_UAT_FC_REQ-99_no_raw_css_or_selector_can_enter_through_interaction', () => {
    // Every field is a typed scalar / closed enum, and the objects are strict —
    // so there is no key through which a selector or a CSS string could arrive.
    const hostile = [
      { hover: { surfaceFill: 'red; } body { display: none } .x {' } },
      { hover: { surfaceFill: '#fff', backgroundImageUrl: 'javascript:alert(1)' } },
      { hover: { selector: ':hover' } },
      { hover: { css: 'color: red' } },
      { hover: { motion: { offsetYPx: 'calc(100vw)' } } },
      { transition: { durationMs: 160, easing: 'cubic-bezier(0,0,1,1)' } },
      { focus: { ring: { widthPx: 2, color: 'currentColor' } } },
      { focus: { ring: { widthPx: 0, color: '#fff' } } }, // a ring may not be authored away
      { focus: { ring: { widthPx: -1, color: '#fff' } } },
      { active: { surfaceFill: '#fff' } }, // an undeclared state is not a hole
    ]
    for (const interaction of hostile) {
      const result = validateL1(doc({ kind: 'box', interaction } as unknown as L1Node))
      expect(result.ok, JSON.stringify(interaction)).toBe(false)
    }

    // …and the one hostile value the schema admits (a URL-shaped string) is
    // caught by the envelope, so the state cannot smuggle a fetch either.
    const bad = validateL1(
      doc({ kind: 'box', interaction: { hover: { backgroundImageUrl: 'data:text/html,<script>' } } }),
    )
    expect(bad.ok).toBe(false)
    if (!bad.ok) {
      expect(bad.errors.some((e) => e.path.endsWith('/interaction/hover/backgroundImageUrl'))).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-99_interactive_node_always_has_a_focus_indicator', () => {
    const field: L1Node = { kind: 'control', control: 'email', axes: { color: '#111111' } }
    const controls = { email: { tag: 'input' as const, attrs: { type: 'email', name: 'email' } } }

    // 1. A control that authors no interaction at all still gets a ring — the
    //    emitter strips UA chrome (`appearance: none`), so silence is not safe.
    const bare = renderL1Fragment([field], 'fc', controls)
    expect(ruleDecls(bare.css, '.fc-l1-0:focus-visible')).toEqual([
      'outline: 2px solid currentColor',
      'outline-offset: 2px',
    ])

    // 2. A control that authors a hover but no focus ring still gets one.
    const hovered = renderL1Fragment(
      [{ ...field, interaction: { hover: { surfaceFill: '#f5f5f5' } } }],
      'fc',
      controls,
    )
    expect(hovered.css).toContain('.fc-l1-0:focus-visible { outline: 2px solid currentColor')

    // 3. A control that authors its own ring gets that one instead — taste may
    //    restyle the indicator, never remove it.
    const ringed = renderL1Fragment(
      [{ ...field, interaction: { focus: { ring: { widthPx: 3, color: '#2563eb', offsetPx: 1 } } } }],
      'fc',
      controls,
    )
    const focus = ruleDecls(ringed.css, '.fc-l1-0:focus-visible')
    expect(focus).toContain('outline: 3px solid #2563eb')
    expect(focus).toContain('outline-offset: 1px')
    expect(ringed.css).not.toContain('currentColor')

    // 4. Nothing anywhere may suppress the indicator.
    for (const css of [bare.css, hovered.css, ringed.css]) {
      expect(css).not.toMatch(/outline\s*:\s*(none|0)/)
    }
  })

  it('test_UAT_FC_REQ-99_state_motion_composes_with_the_base_transform', () => {
    // CSS `transform` REPLACES rather than accumulates, so a hover that only
    // wants to nudge must not silently discard the node's authored rotation.
    const d = doc({
      kind: 'box',
      transform: { rotateDeg: 3, scale: 1 },
      interaction: { transition: { durationMs: 200 }, hover: { motion: { offsetYPx: -4 } } },
    })
    expect(validateL1(d).ok).toBe(true)
    const { css } = renderL1Document(d)
    expect(ruleDecls(css, '.l1-0')).toContain('transform: rotate(3deg)')
    expect(ruleDecls(css, '.l1-0:hover')).toContain('transform: translate(0px, -4px) rotate(3deg)')
  })

  it('test_UAT_FC_REQ-99_reduced_motion_drops_movement_but_keeps_the_paint', () => {
    const d = doc({ kind: 'box', interaction: CTA })
    const { css } = renderL1Document(d)

    const reduced = '(prefers-reduced-motion: reduce)'
    expect(mediaDecls(css, reduced, '.l1-0')).toContain('transition-duration: 0ms')
    expect(mediaDecls(css, reduced, '.l1-0:hover')).toContain('transform: none')
    // The colour change survives — a user who asked for no movement still gets
    // the feedback, just without the travel.
    expect(ruleDecls(css, '.l1-0:hover')).toContain('background-color: #1a1a1e')
  })

  it('test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind', () => {
    // Node-level, like transform / mask / padding — so no kind re-derives its own
    // slice (the asymmetry REQ-98 removed from the paint group).
    const kinds: L1Node[] = [
      { kind: 'text', text: 'Docs', interaction: { hover: { textDecoration: 'underline' } } },
      { kind: 'image', src: '/assets/x.png', alt: 'x', interaction: { hover: { opacity: 0.8 } } },
      { kind: 'slot', name: 'form', interaction: { hover: { surfaceFill: '#111111' } } },
      { kind: 'control', control: 'submit', interaction: { hover: { surfaceFill: '#222222' } } },
      { kind: 'box', interaction: { hover: { surfaceFill: '#333333' } } },
      { kind: 'container', layout: 'stack', children: [], interaction: { hover: { surfaceFill: '#444444' } } },
    ]
    const expected = [
      'text-decoration-line: underline',
      'opacity: 0.8',
      'background-color: #111111',
      'background-color: #222222',
      'background-color: #333333',
      'background-color: #444444',
    ]
    kinds.forEach((node, i) => {
      expect(validateL1(doc(node)).ok, node.kind).toBe(true)
      const { css } = renderL1Fragment([node], 'k', { submit: { tag: 'button', text: 'Send' } })
      expect(ruleDecls(css, '.k-l1-0:hover'), node.kind).toContain(expected[i])
    })
  })
})
