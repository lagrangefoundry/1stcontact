/**
 * BUG-14 — the fold rebuilds the **section-band → card → text** hierarchy.
 *
 * The capture attributes the composited section/band/card fill (and the card
 * treatments — a `borderLeft` accent, uniform `border`, `boxShadow`, radius) onto
 * each text *run*, never as a standalone box. BUG-11 emitted one backing box per
 * run + a single dominant page band, which produced a rectangle behind every
 * paragraph and lost the card surfaces. This supersedes that mechanism:
 *
 *   - Full-width content runs with no card treatment define **section bands**;
 *     consecutive same-fill runs group into a band that **tiles full-bleed**
 *     (`x:0`, `width:viewport`) from its top to the next band's top — so a band
 *     covers its whole section, including any cards on it.
 *   - A run that sits on its band (band fill, no treatment) emits **no box** — no
 *     more per-paragraph rectangles.
 *   - A run with a surface distinct from its band folds into a **card** box; a
 *     card's stacked runs coalesce into ONE box (bridged by its full-width body),
 *     grid columns stay separate, and a distinct badge is its own box. The card
 *     box carries the treatments (`borderLeft`, border, shadow, radius) + padding.
 *   - Text geometry (`sampleFidelity`) is untouched; a backing surface behind its
 *     content is not a layout-envelope violation.
 *
 * The UATs drive the real `foldToL1` / `renderL1Document` / `evaluateLayout` entry
 * points over synthetic multi-viewport captures (real components, no mocks) and
 * cross-check against the two retained real captures where present.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, sampleFidelityProbe, evaluateLayout } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** A text run element spanning the required fields, at one width. */
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

type Kid = { kind: string; id?: string; axes?: Record<string, unknown>; geometry?: { keyframes: Array<{ at: number; x: number; y: number; width: number; height?: number }> } }
/** The root box's direct children. */
function childrenOf(doc: ReturnType<typeof foldToL1>): Kid[] {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as unknown as Kid[]
}
const boxesOf = (doc: ReturnType<typeof foldToL1>): Kid[] => childrenOf(doc).filter((n) => n.kind === 'box')
const kf1280 = (b: Kid) => b.geometry!.keyframes.find((k) => k.at === 1280)!

function loadReal(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

const BAND1 = '#e8dfd3'
const BAND2 = '#d9ccba'
const CARD = '#f8f5f2'

describe('BUG-14 — fold rebuilds the section-band → card → text hierarchy', () => {
  it('test_UAT_FC_BUG-14_full_width_runs_become_full_bleed_tiled_section_bands', () => {
    // Two alternating full-width band fills with a card between them. Each band
    // paints full-bleed (x:0, width:viewport) and tiles down to the next band's
    // top, so band-1 covers the card that sits on it.
    const ms = multiFrom((w) => [
      run(w, 'Heading A', { x: 50, y: 100, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Intro A', { x: 50, y: 160, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card copy', { x: 120, y: 260, width: 300, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
      run(w, 'Heading B', { x: 50, y: 500, width: 900, height: 40 }, { surfaceFill: BAND2 }),
      run(w, 'Intro B', { x: 50, y: 560, width: 900, height: 40 }, { surfaceFill: BAND2 }),
    ])
    const doc = foldToL1(ms)

    const bands = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))
    expect(bands.length).toBe(2)
    const b1 = bands.find((b) => b.axes?.surfaceFill === BAND1)!
    const b2 = bands.find((b) => b.axes?.surfaceFill === BAND2)!
    expect(b1).toBeTruthy()
    expect(b2).toBeTruthy()
    // Full-bleed: x:0, width == viewport.
    const k1 = kf1280(b1)
    expect(k1.x).toBe(0)
    expect(k1.width).toBe(1280)
    // Tiling: band-1 starts at its heading (100) and extends to band-2's top (500).
    expect(k1.y).toBe(100)
    expect(k1.height).toBe(400)
    // doc.background is one of the band fills (the base showing through gaps).
    expect([BAND1, BAND2]).toContain(doc.background)
  })

  it('test_UAT_FC_BUG-14_band_paragraphs_emit_no_per_paragraph_boxes', () => {
    // Four paragraphs all sitting on one band fill: exactly ONE full-bleed band box,
    // zero card boxes — no rectangle per paragraph (the BUG-11 regression).
    const ms = multiFrom((w) => [
      run(w, 'Para 1', { x: 50, y: 100, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Para 2', { x: 50, y: 160, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Para 3', { x: 50, y: 220, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Para 4', { x: 50, y: 280, width: 900, height: 40 }, { surfaceFill: BAND1 }),
    ])
    const doc = foldToL1(ms)
    const bands = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('section-band-'))
    const cards = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('card-'))
    expect(bands.length).toBe(1)
    expect(cards.length).toBe(0)
    expect(kf1280(bands[0]).x).toBe(0)
  })

  it('test_UAT_FC_BUG-14_distinct_card_fill_becomes_its_own_box_not_the_band', () => {
    // A run whose fill differs from the band (and is not itself a full-width band
    // fill) folds a card box carrying its own fill — never the band tone.
    const ms = multiFrom((w) => [
      run(w, 'Section heading', { x: 50, y: 80, width: 900, height: 40 }, { surfaceFill: BAND2 }),
      run(w, 'White card line one', { x: 120, y: 200, width: 700, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#50a2ff' } }),
      run(w, 'White card line two', { x: 120, y: 250, width: 700, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#50a2ff' } }),
    ])
    const doc = foldToL1(ms)
    const cards = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('card-'))
    expect(cards.length).toBe(1)
    expect(cards[0].axes?.surfaceFill).toBe(CARD)
    expect(cards[0].axes?.surfaceFill).not.toBe(BAND2)
    // The two stacked card lines coalesced into ONE box, carrying the accent.
    expect((cards[0].axes?.borderLeft as { color?: string })?.color).toBe('#50a2ff')
  })

  it('test_UAT_FC_BUG-14_card_treatments_border_left_shadow_radius_are_carried', () => {
    // A single card run with a left accent + drop shadow + rounded corners folds a
    // card box carrying every treatment onto the box axes (the L1 borderLeft
    // primitive, boxShadow, borderRadiusPx).
    const ms = multiFrom((w) => [
      run(w, 'Band', { x: 50, y: 60, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card', { x: 120, y: 200, width: 300, height: 40 }, {
        surfaceFill: CARD,
        borderLeft: { widthPx: 4, color: '#ffb900' },
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px 0px',
        borderRadiusPx: 12,
      }),
    ])
    const doc = foldToL1(ms)
    const card = boxesOf(doc).find((b) => (b.id ?? '').startsWith('card-'))!
    expect(card).toBeTruthy()
    const a = card.axes as { borderLeft?: { widthPx: number; color: string }; boxShadow?: { blurPx?: number }; borderRadiusPx?: number }
    expect(a.borderLeft).toEqual({ widthPx: 4, color: '#ffb900' })
    expect(a.boxShadow?.blurPx).toBe(12)
    expect(a.borderRadiusPx).toBe(12)
  })

  it('test_UAT_FC_BUG-14_grid_columns_split_but_a_card_body_bridges_its_runs', () => {
    // Three same-fill cards in disjoint x-columns stay THREE cards (a grid), while a
    // separate card whose wide body run bridges a title + badge coalesces into ONE.
    const GRID = '#ece6dd'
    const ms = multiFrom((w) => [
      // 3-column grid — same fill, disjoint x, overlapping y.
      run(w, 'Col1 h', { x: 100, y: 300, width: 200, height: 30 }, { surfaceFill: GRID }),
      run(w, 'Col1 b', { x: 100, y: 340, width: 200, height: 60 }, { surfaceFill: GRID }),
      run(w, 'Col2 h', { x: 400, y: 300, width: 200, height: 30 }, { surfaceFill: GRID }),
      run(w, 'Col2 b', { x: 400, y: 340, width: 200, height: 60 }, { surfaceFill: GRID }),
      run(w, 'Col3 h', { x: 700, y: 300, width: 200, height: 30 }, { surfaceFill: GRID }),
      run(w, 'Col3 b', { x: 700, y: 340, width: 200, height: 60 }, { surfaceFill: GRID }),
      // One card: a narrow title + a wide body that overlaps it in x → one cluster.
      run(w, 'Panel title', { x: 100, y: 600, width: 200, height: 30 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#00d492' } }),
      run(w, 'Panel body spanning wide', { x: 100, y: 640, width: 820, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#00d492' } }),
    ])
    const doc = foldToL1(ms)
    const cards = boxesOf(doc).filter((b) => (b.id ?? '').startsWith('card-'))
    const grid = cards.filter((c) => c.axes?.surfaceFill === GRID)
    const panel = cards.filter((c) => c.axes?.surfaceFill === CARD)
    expect(grid.length).toBe(3)
    expect(panel.length).toBe(1)
  })

  it('test_UAT_FC_BUG-14_sample_fidelity_unchanged_by_the_hierarchy', () => {
    // Rebuilding bands/cards must not move any text geometry — the text-only
    // fidelity measure still reproduces the oracle exactly at every sampled width.
    const ms = multiFrom((w) => [
      run(w, 'Header', { x: 0, y: 0, width: w, height: 50 }),
      run(w, 'Band line', { x: 50, y: 120, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card line', { x: 120, y: 220, width: 200, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
    ])
    const doc = foldToL1(ms)
    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.pass).toBe(true)
    expect(report.maxDelta).toBeLessThanOrEqual(2)
    expect(report.unmatched).toEqual([])
  })

  it('test_UAT_FC_BUG-14_backing_surfaces_not_flagged_as_overlap', () => {
    // Bands + cards paint behind their content; a surface overlapping the content it
    // backs is by design, so evaluateLayout reports no overlap.
    const ms = multiFrom((w) => [
      run(w, 'Band A', { x: 50, y: 40, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Band B', { x: 50, y: 100, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card', { x: 120, y: 220, width: 300, height: 60 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
    ])
    const doc = foldToL1(ms)
    const { findings } = evaluateLayout(doc, 1280)
    expect(findings.filter((f) => f.kind === 'overlap')).toEqual([])
  })

  it('test_UAT_FC_BUG-14_synthesized_surfaces_do_not_mispair_real_box_leaves', () => {
    // Regression for the non-text fidelity pairing (carried over from BUG-11's
    // review hardening, retargeted at the BUG-14 id families). REQ-92 pairs the
    // oracle's `box` samples positionally against the reproduced `box` leaves, but
    // the fold *prepends* synthesized `section-band-*` / `card-*` boxes that have
    // no oracle counterpart (their source elements are text runs, classified
    // `text` by the oracle). If they enter the pairing queue, the k-th oracle box
    // pairs with the k-th band and the gate reports phantom deltas for a document
    // that reproduces its real surface exactly.
    const ms = multiFrom((w) => [
      run(w, 'Band heading', { x: 50, y: 40, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Band body', { x: 50, y: 100, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card copy', { x: 120, y: 200, width: 240, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
      // A text-free painted divider — a genuine captured surface, far from the card.
      { text: '', textless: true, role: 'box', box: { x: 0, y: 900, width: w, height: 4 }, surfaceFill: '#00d492' } as ValueElement,
    ])
    const doc = foldToL1(ms)

    // Synthesized surfaces exist (band + card) alongside exactly one real box leaf.
    const boxes = boxesOf(doc)
    expect(boxes.filter((b) => (b.id ?? '').startsWith('section-band-')).length).toBeGreaterThan(0)
    expect(boxes.filter((b) => (b.id ?? '').startsWith('card-')).length).toBe(1)
    expect(boxes.filter((b) => (b.id ?? '').startsWith('box-')).length).toBe(1)

    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.residuals).toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_BUG-14_only_synthesized_surfaces_are_exempt_from_overlap', () => {
    // The overlap exemption is for the fold's *invented* backing surfaces (bands,
    // section images, cards) sitting behind the runs they back — that is by design.
    // A genuine captured standalone surface (`box-*`) is real painted content, so
    // two of them colliding is still a real envelope violation and must be
    // reported. Exempting every `box` leaf would have hidden that class.
    const ms = multiFrom((w) => [
      run(w, 'Band copy', { x: 50, y: 40, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card copy', { x: 120, y: 200, width: 240, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
      // Two genuine standalone painted surfaces that overlap each other.
      { text: '', textless: true, role: 'separator', a11yRole: 'separator', box: { x: 20, y: 900, width: 200, height: 80 }, surfaceFill: '#00d492' } as ValueElement,
      { text: '', textless: true, role: 'complementary', a11yRole: 'complementary', box: { x: 100, y: 940, width: 200, height: 80 }, surfaceFill: '#0f172b' } as ValueElement,
    ])
    const doc = foldToL1(ms)

    const boxes = boxesOf(doc)
    const real = boxes.filter((b) => (b.id ?? '').startsWith('box-')).map((b) => b.id)
    expect(real.length).toBe(2) // both standalone surfaces folded as real box leaves

    const { findings, leaves } = evaluateLayout(doc, 1280)
    const overlaps = findings.filter((f) => f.kind === 'overlap')
    const idAt = (p: string) => leaves.find((l) => l.path === p)?.id
    const pairs = overlaps.map((f) => f.paths.map(idAt).sort())

    // The two genuine surfaces collide and are reported…
    expect(pairs).toContainEqual(real.slice().sort())
    // …while no synthesized band/card ever appears in an overlap finding.
    for (const f of overlaps) {
      for (const p of f.paths) expect(idAt(p) ?? '').not.toMatch(/^(section-band-|section-bg-|card-)/)
    }
  })

  it('test_UAT_FC_BUG-14_renderer_emits_border_left_for_a_card_accent', () => {
    // The renderer paints the L1 borderLeft primitive as a real `border-left` rule
    // (a coloured card accent), distinct from a full box outline.
    const ms = multiFrom((w) => [
      run(w, 'Band', { x: 50, y: 60, width: 900, height: 40 }, { surfaceFill: BAND1 }),
      run(w, 'Card', { x: 120, y: 200, width: 300, height: 40 }, { surfaceFill: CARD, borderLeft: { widthPx: 4, color: '#ffb900' } }),
    ])
    const doc = foldToL1(ms)
    const { css } = renderL1Document(doc)
    expect(css.toLowerCase()).toContain('border-left: 4px solid #ffb900')
    // A left accent must NOT become a full box outline.
    expect(css.toLowerCase()).not.toContain('border: 4px solid #ffb900')
  })

  it('test_UAT_FC_BUG-14_real_captures_get_bands_and_treated_cards', () => {
    // The two retained real captures: the fold now yields full-bleed section bands
    // and cards with coloured left accents, while text fidelity stays clean. Skips
    // cleanly if the gitignored bundle is absent.
    for (const host of ['gigabytealchemy.ai', 'joyfulculinarycreations.com']) {
      const ms = loadReal(host)
      if (!ms) continue
      const doc = foldToL1(ms)
      expect(doc.background, `${host} doc.background`).toMatch(/^#[0-9a-f]{6}$/i)
      const boxes = boxesOf(doc)
      const bands = boxes.filter((b) => (b.id ?? '').startsWith('section-band-'))
      const cards = boxes.filter((b) => (b.id ?? '').startsWith('card-'))
      expect(bands.length, `${host} section bands`).toBeGreaterThan(0)
      expect(cards.length, `${host} cards`).toBeGreaterThan(0)
      // Every full-bleed band spans from x:0 across the full viewport width.
      for (const b of bands) {
        const k = kf1280(b)
        expect(k.x, `${host} band x`).toBe(0)
        expect(k.width, `${host} band width`).toBe(1280)
      }
      // Fidelity (text geometry) is untouched by the surface hierarchy.
      const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
      expect(report.pass, `${host} sampleFidelity`).toBe(true)
    }
  })

  it('test_UAT_FC_BUG-14_gigabytealchemy_cards_render_white_with_left_accents', () => {
    // The specific gigabytealchemy regression: the Sanctum / XGD cards render on a
    // near-white panel (#f8f5f2), NOT the beige band tone, each with a coloured left
    // accent (orange / blue). Skips cleanly when the gitignored bundle is absent.
    const ms = loadReal('gigabytealchemy.ai')
    if (!ms) return
    const doc = foldToL1(ms)
    const accentCards = boxesOf(doc).filter(
      (b) => (b.id ?? '').startsWith('card-') && b.axes?.surfaceFill === '#f8f5f2' && b.axes?.borderLeft,
    )
    // The two flagship product cards (Sanctum Voice, XGD).
    expect(accentCards.length).toBeGreaterThanOrEqual(2)
    const accentColors = accentCards.map((c) => (c.axes?.borderLeft as { color: string }).color)
    expect(accentColors).toContain('#ffb900') // Sanctum orange
    expect(accentColors).toContain('#50a2ff') // XGD blue
  })
})
