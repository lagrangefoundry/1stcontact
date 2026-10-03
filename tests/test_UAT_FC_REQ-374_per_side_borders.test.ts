/**
 * REQ-374 — a border on one side, in the page vocabulary.
 *
 * A pull quote wants a 4px rule on its left side only; a footer wants a 1px
 * divider above it. `border` paints all four sides, and the only per-side axis
 * was `borderLeft` (BUG-14), so "a 1px top border" silently became a box.
 *
 * The surface group now carries `borderTop` / `borderRight` / `borderBottom`
 * beside `borderLeft`. Each is the typed border shape, bounded like `border`;
 * each overrides its own side of the uniform `border` (CSS's own cascade).
 * Email pages honour them as inline `border-<side>`, and the builder is primed
 * with them straight from the schema.
 */
import { describe, expect, it } from 'vitest'
import { emailTargetErrors, validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Email } from '../packages/framework/src/index'
import { builderVocabulary } from '../tools/generate/src/cli/ai/l1-vocabulary-core'

const docWith = (node: L1Node, widths = [320, 1280]): L1Document => ({
  widths,
  root: { kind: 'box', children: [node] },
})

const QUOTE: L1Node = {
  kind: 'text',
  text: 'They answered the phone before it finished ringing.',
  axes: { borderLeft: { widthPx: 4, color: '#c2410c' }, fontSizePx: 22 },
  padding: { leftPx: 20 },
}

/** Every border declaration in a stylesheet, in emission order. */
const borderDecls = (css: string): string[] => css.match(/border(-(top|right|bottom|left))?: [^;}]+/g) ?? []

describe('REQ-374 — per-side borders', () => {
  it('test_UAT_FC_REQ-374_a_pull_quote_paints_a_left_rule_and_no_box', () => {
    const res = validateL1(docWith(QUOTE))
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
    const decls = borderDecls(renderL1Document(docWith(QUOTE)).css)
    expect(decls).toContain('border-left: 4px solid #c2410c')
    expect(decls.filter((d) => d.includes('#c2410c'))).toEqual(['border-left: 4px solid #c2410c'])
  })

  it('test_UAT_FC_REQ-374_each_side_alone_paints_that_side_only', () => {
    for (const [key, side] of [
      ['borderTop', 'top'],
      ['borderRight', 'right'],
      ['borderBottom', 'bottom'],
    ] as const) {
      const node: L1Node = { kind: 'box', axes: { [key]: { widthPx: 1, color: '#123456', style: 'dashed' } } }
      const res = validateL1(docWith(node))
      expect(res.ok, `${key}: ${res.ok ? '' : JSON.stringify(res.errors)}`).toBe(true)
      const mine = borderDecls(renderL1Document(docWith(node)).css).filter((d) => d.includes('#123456'))
      expect(mine, key).toEqual([`border-${side}: 1px dashed #123456`])
    }
  })

  it('test_UAT_FC_REQ-374_a_side_overrides_the_uniform_border_and_keeps_the_rest', () => {
    const node: L1Node = {
      kind: 'container',
      layout: 'stack',
      axes: { border: { widthPx: 1, color: '#dddddd' }, borderTop: { widthPx: 3, color: '#0f766e' } },
      children: [],
    }
    expect(validateL1(docWith(node)).ok).toBe(true)
    const decls = borderDecls(renderL1Document(docWith(node)).css)
    const uniform = decls.indexOf('border: 1px solid #dddddd')
    const top = decls.indexOf('border-top: 3px solid #0f766e')
    expect(uniform).toBeGreaterThanOrEqual(0)
    expect(top).toBeGreaterThan(uniform)
  })

  it('test_UAT_FC_REQ-374_side_widths_are_bounded_and_the_shape_stays_strict', () => {
    const tooWide: L1Node = { kind: 'box', axes: { borderTop: { widthPx: 1e9, color: '#000000' } } }
    const res = validateL1(docWith(tooWide))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.map((e) => e.path)).toContain('/root/children/0/axes/borderTop/widthPx')

    const freeform = { kind: 'box', axes: { borderBottom: { widthPx: 1, color: '#000000', css: 'x' } } }
    expect(validateL1(docWith(freeform as unknown as L1Node)).ok).toBe(false)
    const notHex = { kind: 'box', axes: { borderRight: { widthPx: 1, color: 'red;}' } } }
    expect(validateL1(docWith(notHex as unknown as L1Node)).ok).toBe(false)
    const unknownSide = { kind: 'box', axes: { borderTopLeft: { widthPx: 1, color: '#000000' } } }
    expect(validateL1(docWith(unknownSide as unknown as L1Node)).ok).toBe(false)
  })

  it('test_UAT_FC_REQ-374_a_hover_state_can_paint_a_side_and_is_bounded', () => {
    const tab: L1Node = {
      kind: 'text',
      text: 'Pricing',
      interaction: { hover: { borderBottom: { widthPx: 2, color: '#2563eb' } } },
    }
    expect(validateL1(docWith(tab)).ok).toBe(true)
    expect(renderL1Document(docWith(tab)).css).toMatch(/:hover \{[^}]*border-bottom: 2px solid #2563eb/)

    const wild: L1Node = { ...tab, interaction: { hover: { borderBottom: { widthPx: 1e9, color: '#2563eb' } } } }
    const res = validateL1(docWith(wild))
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.errors.map((e) => e.path)).toContain('/root/children/0/interaction/hover/borderBottom/widthPx')
    }
  })

  it('test_UAT_FC_REQ-374_an_email_page_carries_per_side_borders_inline', () => {
    const footer: L1Node = {
      kind: 'text',
      text: 'You are receiving this because you asked us a question.',
      axes: { borderTop: { widthPx: 1, color: '#e5e7eb' }, borderLeft: { widthPx: 4, color: '#c2410c' } },
    }
    const doc = docWith(footer, [600])
    expect(emailTargetErrors(doc)).toEqual([])
    const html = renderL1Email(doc)
    expect(html).toContain('border-top:1px solid #e5e7eb')
    expect(html).toContain('border-left:4px solid #c2410c')
  })

  it('test_UAT_FC_REQ-374_the_builder_is_primed_with_every_side', () => {
    const vocabulary = builderVocabulary()
    for (const key of ['border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft']) {
      expect(vocabulary).toContain(`\`${key}\` (`)
    }
  })
})
