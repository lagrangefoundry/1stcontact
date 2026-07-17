import { describe, expect, it } from 'vitest'
import {
  buildResponsiveTable,
  classifyResponsiveTable,
  formatClassifiedTable,
  type LabelledProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-61 Phase 2 — the change classifier.
 *
 * Over the N-way table, each changed node is one of three reproduction moves:
 * value-step (per-breakpoint value override), presence-flip (per-breakpoint
 * visibility), or layout-swap (module-internal row→stack / nav→hamburger). Pure —
 * manifests authored in-memory, no browser.
 */

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'body', color: '#111111', fontFamily: 'Inter', fontSizePx: 16, fontWeight: 400, ...over }
}

const SIZES = [
  { name: 'mobile', width: 375 },
  { name: 'tablet', width: 768 },
  { name: 'desktop', width: 1280 },
]

function proj(elements: ValueElement[], width: number): LabelledProjection {
  const manifest: ValueManifest = { source: `ref@${width}`, elements, sections: [], viewport: { width, height: 800 }, engine: 'chromium', state: 'rest' }
  return { size: SIZES.find((s) => s.width === width)!, manifest }
}

function classify(rows: { m: ValueElement[]; t: ValueElement[]; d: ValueElement[] }) {
  const table = buildResponsiveTable([proj(rows.m, 375), proj(rows.t, 768), proj(rows.d, 1280)])
  return classifyResponsiveTable(table)
}

describe('REQ-61 Phase 2 — classify labels each changed node by reproduction move', () => {
  it('test_UAT_FC_REQ-61_classify_font_step_is_value_step', () => {
    const c = classify({
      m: [el('Title', { role: 'heading', fontSizePx: 28 })],
      t: [el('Title', { role: 'heading', fontSizePx: 40 })],
      d: [el('Title', { role: 'heading', fontSizePx: 48 })],
    })
    expect(c.classifications).toHaveLength(1)
    expect(c.classifications[0].kind).toBe('value-step')
    expect(c.classifications[0].signals).toContain('fontSizePx')
  })

  it('test_UAT_FC_REQ-61_classify_departed_node_is_presence_flip', () => {
    const c = classify({
      m: [el('Nav')],
      t: [el('Nav'), el('Sidebar promo', { role: 'promo' })],
      d: [el('Nav'), el('Sidebar promo', { role: 'promo' })],
    })
    const promo = c.classifications.find((x) => x.row.label === 'Sidebar promo')!
    expect(promo.kind).toBe('presence-flip')
    expect(promo.signals).toContain('presence')
  })

  it('test_UAT_FC_REQ-61_classify_row_to_stack_is_layout_swap', () => {
    // Same node present everywhere, arrangement flips row (desktop) → stack (mobile).
    const c = classify({
      m: [el('Feature card', { arrangement: 'stack' })],
      t: [el('Feature card', { arrangement: 'row' })],
      d: [el('Feature card', { arrangement: 'row' })],
    })
    expect(c.classifications[0].kind).toBe('layout-swap')
    expect(c.classifications[0].signals).toContain('arrangement')
  })

  it('test_UAT_FC_REQ-61_classify_presence_dominates_value_change', () => {
    // A node that both departs AND differs in font where present is a presence-flip:
    // per-breakpoint visibility is the dominant move.
    const c = classify({
      m: [el('CTA', { fontSizePx: 14 })],
      t: [el('CTA', { fontSizePx: 18 })],
      d: [], // gone on desktop
    })
    const cta = c.classifications.find((x) => x.row.label === 'CTA')!
    expect(cta.kind).toBe('presence-flip')
  })

  it('test_UAT_FC_REQ-61_classify_steady_site_reports_clean', () => {
    const c = classify({
      m: [el('© 2026')],
      t: [el('© 2026')],
      d: [el('© 2026')],
    })
    expect(c.classifications).toHaveLength(0)
    expect(formatClassifiedTable(c)).toMatch(/holds steady/)
  })

  it('test_UAT_FC_REQ-61_classify_formatter_groups_by_kind', () => {
    const c = classify({
      m: [el('Title', { fontSizePx: 28 }), el('Card', { arrangement: 'stack' })],
      t: [el('Title', { fontSizePx: 48 }), el('Card', { arrangement: 'row' }), el('Extra', { role: 'promo' })],
      d: [el('Title', { fontSizePx: 48 }), el('Card', { arrangement: 'row' }), el('Extra', { role: 'promo' })],
    })
    const out = formatClassifiedTable(c)
    // Structural moves are grouped and ordered ahead of value steps.
    expect(out).toMatch(/presence-flip \(1\)/)
    expect(out).toMatch(/layout-swap \(1\)/)
    expect(out).toMatch(/value-step \(1\)/)
    expect(out.indexOf('presence-flip')).toBeLessThan(out.indexOf('value-step'))
  })
})
