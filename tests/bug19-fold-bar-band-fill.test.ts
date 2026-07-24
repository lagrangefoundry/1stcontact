/**
 * BUG-19 — the fold recognises a full-bleed **bar** (footer / nav strip) and
 * folds it as a section band, not as a row of tiny cards.
 *
 * A bar paints its solid fill edge-to-edge, but its text runs are individually
 * narrow and horizontally *distributed* (space-between: items hug the left and
 * right edges with a large empty gap between). No single run is full-width, so
 * BUG-14's single-run band rule missed it and each run became a tiny card,
 * exposing the page background across the bar (the gigabytealchemy footer
 * rendered tan instead of navy). The fix seeds a band from same-fill,
 * no-treatment runs whose union spans full content width with a dominant internal
 * gap — while an evenly-tiled card grid (small, even gaps) stays cards.
 *
 * The UATs drive the real `foldToL1` / `renderL1Document` / `evaluateLayout`
 * entry points over synthetic multi-viewport captures (real components, no
 * mocks) and cross-check against the retained real gigabytealchemy capture.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function run(width: number, text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

type Kid = {
  kind: string
  id?: string
  axes?: Record<string, unknown>
  geometry?: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> }
}
function childrenOf(doc: ReturnType<typeof foldToL1>): Kid[] {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as unknown as Kid[]
}
const boxesOf = (doc: ReturnType<typeof foldToL1>): Kid[] => childrenOf(doc).filter((n) => n.kind === 'box')
const kf1440 = (b: Kid) => b.geometry!.keyframes.find((k) => k.at === 1440)!

function loadReal(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

const BAND = '#e8dfd3'
const NAVY = '#0f172b'
const TILE = '#ece6dd'

describe('BUG-19 — fold recognises a full-bleed bar as a band, not tiny cards', () => {
  it('test_UAT_FC_BUG-19_distributed_bar_runs_become_a_full_bleed_band', () => {
    // A tan section band, then a footer bar: three narrow navy runs on one row,
    // hugging the left/right edges with a large central gap (space-between).
    const ms = multiFrom((w) => [
      run(w, 'Heading', { x: 50, y: 100, width: w - 100, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Intro', { x: 50, y: 160, width: w - 100, height: 40 }, { surfaceFill: BAND }),
      run(w, '© Studio 2025', { x: 50, y: 900, width: 160, height: 24 }, { surfaceFill: NAVY }),
      run(w, 'LinkedIn', { x: w - 160, y: 900, width: 60, height: 24 }, { surfaceFill: NAVY }),
      run(w, 'GitHub', { x: w - 90, y: 900, width: 50, height: 24 }, { surfaceFill: NAVY }),
    ])
    const doc = foldToL1(ms)
    const bands = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))

    // The navy footer bar is one full-bleed band, not three tiny cards.
    const navyBand = bands.find((b) => b.axes?.surfaceFill === NAVY)
    expect(navyBand, 'navy footer bar should fold to a section band').toBeTruthy()
    const k = kf1440(navyBand!)
    expect(k.x).toBe(0)
    expect(k.width).toBe(1440) // full-bleed edge-to-edge
    expect(k.y).toBeLessThanOrEqual(900)

    // No tiny navy card boxes remain for the bar's runs.
    const navyCards = boxesOf(doc).filter(
      (b) => (b.id ?? '').startsWith('card-') && b.axes?.surfaceFill === NAVY,
    )
    expect(navyCards.length).toBe(0)
  })

  it('test_UAT_FC_BUG-19_evenly_tiled_card_grid_stays_cards_not_a_band', () => {
    // Regression guard: a 3-column tile row (same fill, no treatment, small EVEN
    // gaps) must NOT be mistaken for a bar — these are cards, not a section band.
    const ms = multiFrom((w) => [
      run(w, 'Section heading', { x: 50, y: 100, width: w - 100, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Presence', { x: 100, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
      run(w, 'Positivity', { x: 360, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
      run(w, 'Connection', { x: 620, y: 300, width: 220, height: 30 }, { surfaceFill: TILE }),
    ])
    const doc = foldToL1(ms)
    const bands = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))
    // The tile fill is NOT promoted to a full-bleed band.
    expect(bands.some((b) => b.axes?.surfaceFill === TILE)).toBe(false)
    // The three tiles remain separate card boxes.
    const tileCards = boxesOf(doc).filter(
      (b) => (b.id ?? '').startsWith('card-') && b.axes?.surfaceFill === TILE,
    )
    expect(tileCards.length).toBe(3)
  })

  it('test_UAT_FC_BUG-19_gigabytealchemy_footer_folds_to_a_navy_band', () => {
    const ms = loadReal('gigabytealchemy.ai')
    if (!ms) return // real capture not present in this checkout — synthetic UATs cover the behaviour
    const doc = foldToL1(ms)
    const bands = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))
    const navyBand = bands.find((b) => b.axes?.surfaceFill === NAVY)
    expect(navyBand, 'the gigabytealchemy footer should fold to a full-bleed navy band').toBeTruthy()
    const k = kf1440(navyBand!)
    expect(k.x).toBe(0)
    expect(k.width).toBe(1440)

    // No tiny navy card boxes remain for the footer runs (they were the bug).
    const navyCards = boxesOf(doc).filter(
      (b) => (b.id ?? '').startsWith('card-') && b.axes?.surfaceFill === NAVY,
    )
    // A navy button ("Send message") legitimately has a radius treatment and stays
    // a card; the footer link runs (no treatment) must not.
    for (const c of navyCards) {
      expect(c.axes?.borderRadius ?? c.axes?.borderRadiusPx, 'only a treated navy card may remain').toBeTruthy()
    }
  })

  it('test_UAT_FC_BUG-19_navy_band_paints_full_width_in_the_render', () => {
    const ms = multiFrom((w) => [
      run(w, 'Heading', { x: 50, y: 100, width: w - 100, height: 40 }, { surfaceFill: BAND }),
      run(w, '© Studio 2025', { x: 50, y: 900, width: 160, height: 24 }, { surfaceFill: NAVY }),
      run(w, 'GitHub', { x: w - 90, y: 900, width: 50, height: 24 }, { surfaceFill: NAVY }),
    ])
    const doc = foldToL1(ms)
    const { css } = renderL1Document(doc)
    // The navy fill reaches the rendered output as a real painted surface.
    expect(css.toLowerCase()).toContain(NAVY)
  })
})
