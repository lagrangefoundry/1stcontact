/**
 * Reconciliation UATs for story-d5de22a5 — "Values-diff closes capture blind
 * spots" — covering the story's **noise closures**: the diagnostics that keyed on
 * DOM *structure* (ancestor walk, one-node-per-text, top-level-child segmentation,
 * key collision) and therefore reported a difference where no pixel differed.
 * Each is now restated geometrically, so the answer is the same on a
 * conventionally-nested reference and a flat, absolutely-positioned L1
 * reproduction.
 *
 * One UAT per acceptance criterion:
 *
 *   AC-773 — a flat, absolutely-positioned render is segmented so the diff reads it
 *   AC-774 — a split text+box control compares against the bearing box
 *   AC-775 — fill / accent rule / gradient attributed to containing boxes, tightest first
 *   AC-776 — a saturated radius is compared as a pill, not a magnitude
 *   AC-777 — a repeated projection at a seen key is evidence, not a second ladder cell
 *   AC-778 — behavioural control facts are excluded from the painted comparison
 *
 * Boundary: the real `EXTRACT_SCRIPT` run under jsdom (layout stubbed per element,
 * computed styles real — the harness BUG-15 / BUG-22 use), then the real
 * `flattenSignals` → `diffManifests` / `diffMultiState` pipeline the `1c` CLI runs.
 * No internal component is mocked; only the browser's layout engine is stubbed,
 * which is the external boundary jsdom does not implement.
 */
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  EXTRACT_SCRIPT,
  flattenSignals,
  diffManifests,
  diffMultiState,
  partitionProbes,
  fieldToElement,
  type RawSignals,
} from '../tools/generate/src/cli'
import type {
  Field,
  MultiStateCapture,
  StateProjection,
  ValueDelta,
  ValueElement,
  ValueManifest,
} from '../tools/generate/src/cli/capture'

// ── jsdom extraction harness (shared with BUG-15 / BUG-22) ────────────────────

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

/** Run the real EXTRACT_SCRIPT over a DOM, stubbing layout via a class→box map. */
function extract(html: string, boxByClass: Record<string, Box>, docH = 4400): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = boxByClass[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => docH })
  // jsdom measures no glyphs, so stub the Range the extractor uses for
  // `renderedTextBox` — its presence is what marks an element a TEXT RUN, and a
  // real capture always has one.
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const node = (this as Range).startContainer as Element
    const b = boxByClass[(node && node.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  return (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
}

/** jsdom does not expand the `border-radius` shorthand — author the longhands. */
const radius = (px: number) =>
  `border-top-left-radius:${px}px;border-top-right-radius:${px}px;` +
  `border-bottom-left-radius:${px}px;border-bottom-right-radius:${px}px`
/** …nor the `border-left` shorthand. */
const accentLeft = (px: number, color: string) =>
  `border-left-width:${px}px;border-left-style:solid;border-left-color:${color}`

const diffSignals = (expected: RawSignals, actual: RawSignals): ValueDelta[] =>
  diffManifests(flattenSignals(expected, 'ref'), flattenSignals(actual, 'repro')).deltas

const on = (deltas: ValueDelta[], text: string, property: string) =>
  deltas.filter((d) => d.text === text && d.property === property)
const props = (deltas: ValueDelta[]) => deltas.map((d) => d.property)

const runOf = (sig: RawSignals, text: string) => sig.bands.flatMap((b) => b.content).find((r) => r.text === text)
const contentTexts = (sig: RawSignals): string[] => sig.bands.flatMap((b) => b.content).map((r) => r.text)

// ── manifest helpers for the pure-diff UATs ───────────────────────────────────

const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#111111', fontFamily: 'sans', fontSizePx: 16, fontWeight: 400, ...over }
}

describe('story-d5de22a5 — values-diff reads both DOM shapes as the same pixels', () => {
  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC773_flat_absolutely_positioned_render_is_segmented_and_moves', () => {
    // A page whose content is a flat tree of absolutely-positioned leaves under a
    // single wrapper — the shape an L1 reproduction renders. Abs children leave no
    // in-flow box, so the wrapper collapses to height 0 and the ≥8px top-level band
    // scan finds nothing. The body-spanning fallback keeps the runs readable.
    type Leaf = { text: string; box: Box }
    const flatL1 = (leaves: Leaf[]): RawSignals => {
      const inner = leaves.map((l, i) => `<p class="l1-${i + 1}" style="position:absolute">${l.text}</p>`).join('')
      const boxes: Record<string, Box> = { 'l1-0': [0, 0, 0, 0] }
      leaves.forEach((l, i) => (boxes[`l1-${i + 1}`] = l.box))
      return extract(
        `<!doctype html><html><body><div class="l1-0" style="position:relative">${inner}</div></body></html>`,
        boxes,
        1600,
      )
    }
    const FULL: Leaf[] = [
      { text: 'Front door heading', box: [20, 100, 600, 48] },
      { text: 'Body copy line', box: [20, 170, 600, 48] },
      { text: 'Caption row', box: [20, 240, 600, 48] },
    ]

    // (1) The collapsed flat tree's runs ARE collected (the manifest was empty
    //     before the fallback existed — every reference element read "missing").
    const flat = flatL1(FULL)
    expect(flat.bands.length).toBeGreaterThan(0)
    expect(contentTexts(flat).sort()).toEqual(['Body copy line', 'Caption row', 'Front door heading'])

    // (2) A complete reproduction pairs every element with none unmatched; a partial
    //     one genuinely misses only the absent runs — and the report MOVES between
    //     the two renders instead of freezing byte-identical.
    const target = flattenSignals(flatL1(FULL), 'target')
    const complete = diffManifests(target, flattenSignals(flatL1(FULL), 'complete'))
    const partial = diffManifests(target, flattenSignals(flatL1([FULL[0]]), 'partial'))
    const missing = (r: { deltas: ValueDelta[] }) =>
      r.deltas.filter((d) => d.property === 'missing').map((d) => d.text).sort()

    expect(complete.matched).toBe(3)
    expect(complete.unmatched).toBe(0)
    expect(missing(complete)).toEqual([])
    expect(partial.matched).toBe(1)
    expect(partial.unmatched).toBe(2)
    expect(missing(partial)).toEqual(['Body copy line', 'Caption row'])
    expect(missing(partial)).not.toEqual(missing(complete))

    // (3) No-regression: a normal multi-section semantic page still yields its real
    //     per-section bands — the fallback never fires for it.
    const semantic = extract(
      '<!doctype html><html><body>' +
        '<section class="s1"><h1 class="t1">Alpha</h1></section>' +
        '<section class="s2"><h1 class="t2">Beta</h1></section>' +
        '</body></html>',
      { s1: [0, 0, 1280, 200], s2: [0, 200, 1280, 200], t1: [20, 40, 600, 48], t2: [20, 240, 600, 48] },
      1600,
    )
    expect(semantic.bands.length).toBe(2)
    expect(contentTexts(semantic).sort()).toEqual(['Alpha', 'Beta'])
  })

  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC774_split_control_resolves_shape_border_and_surface_geometry', () => {
    // The reference represents the control as ONE node — a <button> carrying its
    // label, fill, rounding and 123×50 box together.
    const referencePage = (): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
          `<p class="lede">Stay in the loop.</p>` +
          `<button class="btn" style="background-color:rgb(0,153,102);${radius(8)}">Subscribe</button>` +
          `</div></body></html>`,
        { band: [0, 3800, 1280, 300], lede: [413, 3840, 400, 24], btn: [413, 3900, 123, 50] },
      )

    // The reproduction folds the same control as TWO nodes: a 123-wide label plus a
    // sibling backing box that paints the fill and the rounding.
    const reproductionPage = (opts: { backing?: Box; backingRadiusPx?: number } = {}): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="l1" style="position:relative">` +
          `<div class="l1-band" style="position:absolute;background-color:rgb(255,255,255)"></div>` +
          `<p class="l1-lede" style="position:absolute">Stay in the loop.</p>` +
          `<div class="l1-card" style="position:absolute;background-color:rgb(0,153,102);` +
          `${radius(opts.backingRadiusPx ?? 8)}"></div>` +
          `<p class="l1-label" style="position:absolute">Subscribe</p>` +
          `</div></body></html>`,
        {
          l1: [0, 0, 0, 0],
          'l1-band': [0, 3800, 1280, 300],
          'l1-lede': [413, 3840, 400, 24],
          'l1-card': opts.backing ?? [388, 3875, 173, 100],
          'l1-label': [413, 3900, 123, 24],
        },
      )

    // The capture records WHICH box paints the surface, and whether it is the run's own.
    const refBtn = flattenSignals(referencePage(), 'ref').elements.find((e) => e.text === 'Subscribe')
    const reproLabel = flattenSignals(reproductionPage(), 'repro').elements.find((e) => e.text === 'Subscribe')
    expect(refBtn?.surface?.self, 'the reference button paints its own surface').toBe(true)
    expect(reproLabel?.surface?.self, 'the L1 label is painted by a sibling backing box').toBe(false)
    expect(reproLabel?.surface?.borderRadiusPx, 'the radius lives on the backing box').toBe(8)
    expect(reproLabel?.borderRadiusPx, 'the label itself is square — the phantom source').toBe(0)

    // (a) No phantom shape delta: the radius is correct on the box that bears it.
    const deltas = diffSignals(referencePage(), reproductionPage())
    expect(on(deltas, 'Subscribe', 'shape')).toEqual([])

    // (b) …and the backing box's REAL geometry defect (2× the reference height) is
    //     reported against the reference control's box — the axis the phantom was
    //     standing in front of.
    const size = on(deltas, 'Subscribe', 'size')
    expect(size).toHaveLength(1)
    expect(size[0].expected).toContain('surface')
    expect(size[0].expected).toContain('50')
    expect(size[0].actual).toContain('100')

    // (c) A genuinely square backing box still reports the shape defect.
    const squared = diffSignals(referencePage(), reproductionPage({ backing: [413, 3900, 123, 50], backingRadiusPx: 0 }))
    expect(on(squared, 'Subscribe', 'shape')).toHaveLength(1)
    expect(on(squared, 'Subscribe', 'shape')[0].actual).toContain('radius 0px')
    expect(on(squared, 'Subscribe', 'size'), 'a faithful backing box leaves no surface-geometry delta').toEqual([])

    // (d) A control that paints its own surface on BOTH sides keeps the own-axis
    //     comparison unchanged (self ↔ self — the resolution never fires).
    const chip = (r: number): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="band" style="background-color:rgb(255,255,255)">` +
          `<span class="chip" style="background-color:rgb(219,234,254);${radius(r)}">Coming soon</span>` +
          `</div></body></html>`,
        { band: [0, 100, 1280, 120], chip: [40, 140, 110, 24] },
      )
    expect(on(diffSignals(chip(12), chip(12)), 'Coming soon', 'shape')).toEqual([])
    expect(on(diffSignals(chip(12), chip(0)), 'Coming soon', 'shape')).toHaveLength(1)

    // (e) An ordinary run sitting on its band gains no surface-geometry rows.
    expect(on(deltas, 'Stay in the loop.', 'size')).toEqual([])
    expect(on(deltas, 'Stay in the loop.', 'shape')).toEqual([])

    // (f) A bundle captured before the surface-bearing box existed is inert: the
    //     comparison falls back to the element's own axes and invents nothing.
    const legacyRef = mani('ref', [el('Subscribe', { box: { x: 413, y: 3900, width: 123, height: 50 }, borderRadiusPx: 8 })])
    const legacyAct = mani('act', [el('Subscribe', { box: { x: 413, y: 3900, width: 123, height: 50 }, borderRadiusPx: 8 })])
    const legacy = diffManifests(legacyRef, legacyAct).deltas
    expect(legacy.filter((d) => d.property === 'shape')).toEqual([])
    expect(legacy.filter((d) => d.property === 'size')).toEqual([])
  })

  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC775_surface_treatments_attributed_to_containing_boxes_tightest_first', () => {
    const CARD_FILL = 'rgb(248,245,242)'
    const CARD_HEX = '#f8f5f2'
    const BAND_FILL = 'rgb(255,255,255)'
    const ACCENT = 'rgb(255,185,0)'
    const ACCENT_HEX = '#ffb900'

    // A conventionally-nested reference: band > card (fill + left accent) > run.
    const nested = (): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="band" style="background-color:${BAND_FILL}">` +
          `<div class="card" style="background-color:${CARD_FILL};${accentLeft(4, ACCENT)}">` +
          `<p class="run">Our Work</p></div></div></body></html>`,
        { band: [0, 0, 1280, 400], card: [80, 60, 600, 200], run: [104, 90, 500, 24] },
      )

    // The reproduction paints the band and the card as absolutely-positioned
    // SIBLINGS of the run — no DOM ancestor paints anything, so the ancestor walk
    // reported the body backstop for every run (~60 phantom defects, some reversed).
    const flatSiblings = (): RawSignals =>
      extract(
        `<!doctype html><html><body><div class="l1" style="position:relative">` +
          `<div class="l1-band" style="position:absolute;background-color:${BAND_FILL}"></div>` +
          `<div class="l1-card" style="position:absolute;background-color:${CARD_FILL};${accentLeft(4, ACCENT)}"></div>` +
          `<p class="l1-run" style="position:absolute">Our Work</p></div></body></html>`,
        {
          l1: [0, 0, 0, 0],
          'l1-band': [0, 0, 1280, 400],
          'l1-card': [80, 60, 600, 200],
          'l1-run': [104, 90, 500, 24],
        },
      )

    // The run's fill is the CARD's (not the page backstop), and the accent rule is
    // found on the sibling card.
    const flatRun = runOf(flatSiblings(), 'Our Work')
    expect(flatRun?.surfaceFill, 'the sibling card is the surface behind the run').toBe(CARD_HEX)
    expect(flatRun?.borderLeftWidthPx).toBe(4)
    expect(flatRun?.borderLeftColor).toBe(ACCENT_HEX)

    // The conventionally-nested reference resolves to exactly the same values …
    const nestedRun = runOf(nested(), 'Our Work')
    expect(nestedRun?.surfaceFill).toBe(CARD_HEX)
    expect(nestedRun?.borderLeftWidthPx).toBe(4)
    expect(nestedRun?.borderLeftColor).toBe(ACCENT_HEX)

    // … so no phantom fill / accent / gradient delta is raised on pixels that are
    // already correct.
    const deltas = diffSignals(nested(), flatSiblings())
    expect(on(deltas, 'Our Work', 'surfaceFill')).toEqual([])
    expect(on(deltas, 'Our Work', 'borderLeft')).toEqual([])
    expect(on(deltas, 'Our Work', 'surfaceGradient')).toEqual([])

    // Where surfaces overlap, the TIGHTEST containing box wins over the larger band
    // behind it: a small gradient panel over an OPAQUE band is not lost to the band.
    // Both are absolutely-positioned siblings of the run, so ancestry finds neither
    // — and reaching the opaque band first would stop the walk and return no
    // gradient at all. Only tightest-first containment answers this correctly.
    const panelOverBand = extract(
      `<!doctype html><html><body><div class="l1" style="position:relative">` +
        `<div class="l1-band" style="position:absolute;background-color:${BAND_FILL}"></div>` +
        `<div class="l1-panel" style="position:absolute;` +
        `background-image:linear-gradient(to bottom right, rgb(255,0,0), rgb(0,0,255))"></div>` +
        `<p class="l1-run" style="position:absolute">Panel copy</p></div></body></html>`,
      {
        l1: [0, 0, 0, 0],
        'l1-band': [0, 0, 1280, 400],
        'l1-panel': [80, 60, 600, 200],
        'l1-run': [104, 90, 500, 24],
      },
    )
    const panelRun = runOf(panelOverBand, 'Panel copy')
    expect(panelRun?.surfaceGradientCss, "the panel's gradient is the run's surface").toBeTruthy()
    expect(panelRun?.surfaceGradientCss).toContain('gradient')
    // …and the band, being the opaque box behind the panel, is still the composited
    // solid fill — the two axes resolve over the same tightest-first chain.
    expect(panelRun?.surfaceFill).toBe('#ffffff')
  })

  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC776_saturated_radius_is_compared_as_a_pill_not_a_magnitude', () => {
    /** The saturating sentinel a `rounded-full` utility computes to in a real browser. */
    const ROUNDED_FULL = 33_554_400
    /** The envelope-clamped value our L1 reproduction emits — the identical pill. */
    const CLAMPED = 100_000
    const PILL_BOX = { x: 40, y: 180, width: 110, height: 24 }

    const badge = (radiusPx: number, over: Partial<ValueElement> = {}) =>
      mani('m', [el('Coming soon', { box: PILL_BOX, borderRadiusPx: radiusPx, ...over })])
    const shape = (a: ValueManifest, b: ValueManifest) => diffManifests(a, b).deltas.filter((d) => d.property === 'shape')

    // (1) Two pills with different sentinel radii paint the identical shape.
    expect(shape(badge(ROUNDED_FULL), badge(CLAMPED))).toEqual([])

    // (2) A pill flattened to a square (and to a non-saturating radius) still flags.
    expect(shape(badge(ROUNDED_FULL), badge(0)).length).toBeGreaterThan(0)
    expect(shape(badge(ROUNDED_FULL), badge(4)).length).toBeGreaterThan(0)

    // (3) Two pills differing ONLY in shadow still flag — saturation applies to the
    //     radius alone, and the shadow is an independent treatment.
    expect(shape(badge(ROUNDED_FULL, { boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }), badge(CLAMPED)).length,
    ).toBeGreaterThan(0)

    // (4) Radius drift between two NON-pill shapes reports as before.
    expect(shape(badge(12), badge(4)).length).toBeGreaterThan(0)

    // (5) The pill test applies to whichever box actually PAINTS the surface, so it
    //     holds for a split control's backing box as well as a self-painting chip.
    const selfPill = mani('ref', [
      el('Subscribe', {
        box: PILL_BOX,
        borderRadiusPx: ROUNDED_FULL,
        surface: { self: true, box: PILL_BOX, borderRadiusPx: ROUNDED_FULL, boxShadow: null, border: null },
      }),
    ])
    const backedPill = mani('act', [
      el('Subscribe', {
        box: PILL_BOX,
        borderRadiusPx: 0,
        surface: { self: false, box: PILL_BOX, borderRadiusPx: CLAMPED, boxShadow: null, border: null },
      }),
    ])
    const backedSquare = mani('act', [
      el('Subscribe', {
        box: PILL_BOX,
        borderRadiusPx: 0,
        surface: { self: false, box: PILL_BOX, borderRadiusPx: 0, boxShadow: null, border: null },
      }),
    ])
    expect(shape(selfPill, backedPill), 'the backing box is a pill too — identical pixels').toEqual([])
    expect(shape(selfPill, backedSquare).length, 'a backing box that lost the pill still flags').toBeGreaterThan(0)
  })

  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC777_repeated_projection_at_a_seen_key_is_evidence_not_a_ladder_cell', () => {
    const LADDER = [320, 375, 768, 1024, 1280, 1440]
    const LADDER_H: Record<number, number> = { 320: 640, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

    const projection = (width: number, height: number, elements: ValueElement[]): StateProjection => ({
      engine: 'chromium',
      viewport: { width, height },
      state: 'rest',
      manifest: { source: `${width}x${height}`, elements, sections: [], viewport: { width, height } },
    })
    const capture = (projections: StateProjection[]): MultiStateCapture => ({
      url: 'http://fixture.test/',
      notes: [],
      projections,
    })

    // The reference run, and the two DIFFERENT reproductions of it: the ladder cell
    // (which differs from the reference only in colour) and the height probe's
    // taller render (which differs only in position — a visibly different render).
    const REF_BOX = { x: 24, y: 40, width: 200, height: 29 }
    const refRun = (): ValueElement[] => [el('Only run', { box: REF_BOX, color: '#111111' })]
    const ladderRun = (): ValueElement[] => [el('Only run', { box: REF_BOX, color: '#d40000' })]
    const probeRun = (): ValueElement[] => [el('Only run', { box: { ...REF_BOX, y: 2000 }, color: '#111111' })]

    const refLadder = LADDER.map((w) => projection(w, LADDER_H[w], refRun()))
    const reproLadder = LADDER.map((w) => projection(w, LADDER_H[w], w === 1280 ? ladderRun() : refRun()))
    // The probe re-shoots 1280 at a SECOND viewport height — height is deliberately
    // not part of the (engine, width, state) key.
    const reference = capture([...refLadder, projection(1280, 1000, refRun())])
    const repro = capture([...reproLadder, projection(1280, 1000, probeRun())])
    const referenceNoProbe = capture(refLadder)
    const reproNoProbe = capture(reproLadder)

    // The partition itself: the first projection at a key defines the ladder, later
    // ones are evidence.
    const part = partitionProbes(repro.projections)
    expect(part.ladder.map((p) => p.viewport.width)).toEqual(LADDER)
    expect(part.probes.map((p) => `${p.viewport.width}x${p.viewport.height}`)).toEqual(['1280x1000'])

    const withProbe = diffMultiState(reference, repro)
    const without = diffMultiState(referenceNoProbe, reproNoProbe)

    // A capture carrying a height probe produces the same number of diff cells as
    // one without it — no duplicate cell for the re-shot width.
    expect(withProbe.length).toBe(LADDER.length)
    expect(withProbe.map((c) => c.viewportWidth).sort((a, b) => a - b)).toEqual(LADDER)
    expect(withProbe.filter((c) => c.viewportWidth === 1280)).toHaveLength(1)

    // The re-shot width's cell compares the LADDER reproduction (the colour delta),
    // and carries no delta originating from the probe's taller render.
    const cell = withProbe.find((c) => c.viewportWidth === 1280)!
    expect(props(cell.report!.deltas)).toContain('color')
    expect(props(cell.report!.deltas)).not.toContain('position')

    // Cell count and contents are unchanged from the same capture with the probe
    // removed — the partition applies identically to both sides.
    const shape = (cells: typeof withProbe) =>
      cells
        .map((c) => `${c.viewportWidth}:${c.missing}:${props(c.report?.deltas ?? []).sort().join(',')}`)
        .sort()
    expect(shape(withProbe)).toEqual(shape(without))
  })

  // ───────────────────────────────────────────────────────────────────────────
  it('test_UAT_AC778_behavioural_control_facts_are_excluded_from_the_painted_comparison', () => {
    // A captured control carries behavioural facts no painted axis can hold: its
    // resolved control type and its enclosing form's action. They are what a
    // behavior module needs, not what the page paints.
    const control = (over: Partial<Field> = {}): Field =>
      ({
        a11yRole: 'textbox',
        accessibleName: 'Email address',
        nameSource: 'label',
        box: { x: 100, y: 200, width: 320, height: 48 },
        borderRadiusPx: 6,
        borderWidthPx: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'solid',
        boxShadow: null,
        ...over,
      }) as Field

    const manifestOf = (field: Field): ValueManifest => mani('m', [fieldToElement(field)])
    const deltasFor = (a: Field, b: Field) => diffManifests(manifestOf(a), manifestOf(b)).deltas

    const BEHAVIOURAL_A = { controlType: 'email', formAction: 'https://a.example/subscribe' }
    const BEHAVIOURAL_B = { controlType: 'tel', formAction: 'https://b.example/other' }

    // (1) Manifests identical except for the behavioural facts → no delta at all.
    expect(deltasFor(control(BEHAVIOURAL_A), control(BEHAVIOURAL_B))).toEqual([])
    // (2) …and again where only ONE side records them.
    expect(deltasFor(control(BEHAVIOURAL_A), control())).toEqual([])
    expect(deltasFor(control(), control(BEHAVIOURAL_B))).toEqual([])

    // (3) Their presence or absence never changes any other axis's outcome: a
    //     control with genuine geometry / border / shape differences reports exactly
    //     the same deltas whether the behavioural facts match, differ, or are absent.
    const painted: Partial<Field> = {
      box: { x: 100, y: 200, width: 400, height: 64 },
      borderRadiusPx: 20,
      borderWidthPx: 3,
      borderColor: '#334155',
      borderStyle: 'solid',
    }
    const baseline = deltasFor(control(BEHAVIOURAL_A), control({ ...painted, ...BEHAVIOURAL_A })).map(
      (d) => `${d.property}:${d.expected}→${d.actual}`,
    )
    // The axes the AC names — geometry, border, shape — all report, and report their
    // real values (this is the comparison the behavioural facts must not perturb).
    expect(baseline).toEqual(
      expect.arrayContaining([
        'size:320×48→400×64',
        'shape:radius 6px, shadow no→radius 20px, shadow no',
        'border:1px solid #cbd5e1→3px solid #334155',
      ]),
    )

    for (const other of [BEHAVIOURAL_B, {}]) {
      const withOther = deltasFor(control(BEHAVIOURAL_A), control({ ...painted, ...other })).map(
        (d) => `${d.property}:${d.expected}→${d.actual}`,
      )
      expect(withOther).toEqual(baseline)
    }
  })
})
