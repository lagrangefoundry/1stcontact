import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  buildResponsiveTable,
  cmdResponsiveDiff,
  formatResponsiveTable,
  writeMultiState,
  VIEWPORTS,
  type LabelledProjection,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-61 — `1c responsive-diff`, the N-way per-node table.
 *
 * A standalone analysis of ONE site across sizes: the persisted ladder's per-width
 * manifests are lined up node-by-node so a font step, a reflow, or a component
 * that departs on mobile reads left-to-right. Pure/offline — manifests are
 * authored in-memory (and written to a bundle for the command path); no browser.
 */

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    ...over,
  }
}

function manifest(elements: ValueElement[], width: number): ValueManifest {
  return { source: `ref@${width}`, elements, sections: [], viewport: { width, height: 800 }, engine: 'chromium', state: 'rest' }
}

const SIZES = [
  { name: 'mobile', width: 375 },
  { name: 'tablet', width: 768 },
  { name: 'desktop', width: 1280 },
]

function projection(elements: ValueElement[], width: number): LabelledProjection {
  return { size: SIZES.find((s) => s.width === width)!, manifest: manifest(elements, width) }
}

describe('REQ-61 — buildResponsiveTable lines up the same node across sizes', () => {
  it('test_UAT_FC_REQ-61_responsive_table_flags_font_step', () => {
    // A heading present at every size but stepping 48→40→32 across widths.
    const table = buildResponsiveTable([
      projection([el('Welcome', { role: 'heading', fontSizePx: 32 })], 375),
      projection([el('Welcome', { role: 'heading', fontSizePx: 40 })], 768),
      projection([el('Welcome', { role: 'heading', fontSizePx: 48 })], 1280),
    ])
    const row = table.rows.find((r) => r.label === 'Welcome')!
    expect(row.changed).toBe(true)
    expect(row.presenceFlips).toBe(false)
    // The trajectory is captured left-to-right, one cell per size.
    expect(row.cells.map((c) => c.element?.fontSizePx)).toEqual([32, 40, 48])
    expect(row.cells.every((c) => c.present)).toBe(true)
  })

  it('test_UAT_FC_REQ-61_responsive_table_detects_presence_flip', () => {
    // A promo banner present on tablet + desktop, gone on mobile (display:none →
    // absent from the mobile manifest). That is the presence flip the table exists
    // to surface.
    const table = buildResponsiveTable([
      projection([el('Menu')], 375),
      projection([el('Menu'), el('Limited offer', { role: 'promo' })], 768),
      projection([el('Menu'), el('Limited offer', { role: 'promo' })], 1280),
    ])
    const promo = table.rows.find((r) => r.label === 'Limited offer')!
    expect(promo.presenceFlips).toBe(true)
    expect(promo.changed).toBe(true)
    expect(promo.cells.map((c) => c.present)).toEqual([false, true, true])
    // The always-present nav item holds steady.
    const menu = table.rows.find((r) => r.label === 'Menu')!
    expect(menu.presenceFlips).toBe(false)
    expect(menu.changed).toBe(false)
  })

  it('test_UAT_FC_REQ-61_responsive_table_steady_node_not_flagged', () => {
    const table = buildResponsiveTable([
      projection([el('© 2026')], 375),
      projection([el('© 2026')], 768),
      projection([el('© 2026')], 1280),
    ])
    const row = table.rows[0]
    expect(row.changed).toBe(false)
    // The formatter collapses steady nodes to a count, not per-row noise.
    expect(formatResponsiveTable(table)).toMatch(/1 node\(s\) hold steady/)
  })
})

describe('REQ-61 — cmdResponsiveDiff reads the persisted ladder', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-61_responsive_diff_reads_multistate_bundle', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'req61-rd-'))
    dirs.push(dir)
    const projections: StateProjection[] = [375, 768, 1280].map((w) => ({
      engine: 'chromium' as const,
      viewport: VIEWPORTS[w === 375 ? 'mobile' : w === 768 ? 'tablet' : 'desktop'],
      state: 'rest' as const,
      manifest: manifest([el('Hero', { role: 'heading', fontSizePx: w === 375 ? 28 : 48 })], w),
    }))
    const matrix: MultiStateCapture = { url: 'ref', projections, notes: [] }
    writeMultiState(dir, matrix)

    const table = cmdResponsiveDiff({ refBundleDir: dir })
    // Three columns, default mobile/tablet/desktop, in order.
    expect(table.sizes.map((s) => s.name)).toEqual(['mobile', 'tablet', 'desktop'])
    const hero = table.rows.find((r) => r.label === 'Hero')!
    expect(hero.cells.map((c) => c.element?.fontSizePx)).toEqual([28, 48, 48])
    expect(hero.changed).toBe(true)
  })

  it('test_UAT_FC_REQ-61_responsive_diff_terminal_fails_on_stale_reference', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'req61-rd-stale-'))
    dirs.push(empty)
    expect(() => cmdResponsiveDiff({ refBundleDir: empty })).toThrow(/multistate\.json/)
  })

  it('test_UAT_FC_REQ-61_responsive_diff_fails_when_width_absent', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'req61-rd-partial-'))
    dirs.push(dir)
    // Ladder only has mobile — the default desktop column cannot be built.
    const matrix: MultiStateCapture = {
      url: 'ref',
      projections: [{ engine: 'chromium', viewport: VIEWPORTS.mobile, state: 'rest', manifest: manifest([el('x')], 375) }],
      notes: [],
    }
    writeMultiState(dir, matrix)
    expect(() => cmdResponsiveDiff({ refBundleDir: dir })).toThrow(new RegExp(`no projection at width ${VIEWPORTS.tablet.width}px`))
  })
})
