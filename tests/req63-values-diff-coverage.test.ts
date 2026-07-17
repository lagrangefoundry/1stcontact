import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  diffManifests,
  EXTRACT_SCRIPT,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-63 — the coverage audit that closes the values-diff's remaining
 * BLIND SPOTS: whole render-affecting CSS axes a visible difference could slip
 * through because nothing captured or compared them. Each new axis is additive
 * (an optional field), so it can only *reduce* false negatives — a matching or
 * absent axis must never fabricate a delta (the second assertion in each block).
 *
 * The comparator UATs drive `diffManifests` directly (pure, browser-free — the
 * same engine the CLI runs); one extraction UAT runs the real EXTRACT_SCRIPT
 * under jsdom to prove the new axes are read from computed styles end to end.
 */

// ── fixture builders ─────────────────────────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
/** A text-free image element (pairs on a11yRole + order). */
function imgEl(over: Partial<ValueElement> = {}): ValueElement {
  return {
    role: 'img',
    text: '(img)',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    box: box(0, 0, 200, 200),
    ...over,
  }
}
function mani(source: string, elements: ValueElement[]): ValueManifest {
  return { source, elements, sections: [] }
}
const hasDelta = (deltas: { text: string; property: string }[], textSub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(textSub) && d.property === property)
const hasProp = (deltas: { property: string }[], property: string): boolean =>
  deltas.some((d) => d.property === property)

// ── typography treatment axes (whole properties, previously blind) ───────────

describe('REQ-63 values-diff — typography treatment axes are compared', () => {
  it('test_UAT_FC_REQ-63_font_style_italic_delta', () => {
    // The poster child: a heading rendered italic vs roman was invisible — no
    // colour, size, weight, or box field moves.
    const d = diffManifests(
      mani('ref', [el('Heading', { fontStyle: 'italic' })]),
      mani('a', [el('Heading', { fontStyle: null })]),
    )
    expect(hasDelta(d.deltas, 'Heading', 'fontStyle')).toBe(true)
    // Matching italic → no delta (only reduces false negatives).
    const same = diffManifests(
      mani('ref', [el('Heading', { fontStyle: 'italic' })]),
      mani('a', [el('Heading', { fontStyle: 'italic' })]),
    )
    expect(hasProp(same.deltas, 'fontStyle')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_text_decoration_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Link', { textDecoration: 'underline' })]),
      mani('a', [el('Link', { textDecoration: null })]),
    )
    expect(hasDelta(d.deltas, 'Link', 'textDecoration')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_text_transform_delta', () => {
    // A CSS `text-transform: uppercase` vs no transform — the rendered casing the
    // verbatim-text compare can't always separate from a hardcoded literal.
    const d = diffManifests(
      mani('ref', [el('Label', { textTransform: 'uppercase' })]),
      mani('a', [el('Label', { textTransform: null })]),
    )
    expect(hasDelta(d.deltas, 'Label', 'textTransform')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_font_variant_small_caps_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Brand', { fontVariant: 'small-caps' })]),
      mani('a', [el('Brand', { fontVariant: null })]),
    )
    expect(hasDelta(d.deltas, 'Brand', 'fontVariant')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_list_marker_delta', () => {
    // A bullet (disc) vs a suppressed marker (none) — the marker glyph is not a
    // text node, so nothing compared it before.
    const d = diffManifests(
      mani('ref', [el('Item', { role: 'listitem', listMarker: 'disc' })]),
      mani('a', [el('Item', { role: 'listitem', listMarker: null })]),
    )
    expect(hasDelta(d.deltas, 'Item', 'listMarker')).toBe(true)
  })
})

// ── effects (per element) ─────────────────────────────────────────────────────

describe('REQ-63 values-diff — effects axes are compared', () => {
  it('test_UAT_FC_REQ-63_backdrop_filter_presence_delta', () => {
    // A frosted-glass panel (backdrop-filter: blur) present in the reference,
    // absent in the repro — a pixel-obvious treatment no other field holds.
    const d = diffManifests(
      mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]),
      mani('a', [el('Panel', { backdropFilter: null })]),
    )
    expect(hasDelta(d.deltas, 'Panel', 'backdropFilter')).toBe(true)
    const same = diffManifests(
      mani('ref', [el('Panel', { backdropFilter: 'blur(12px)' })]),
      mani('a', [el('Panel', { backdropFilter: 'blur(4px)' })]),
    )
    // Presence-compared (value strings drift): both present → no delta.
    expect(hasProp(same.deltas, 'backdropFilter')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_blend_mode_value_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Overlay', { blendMode: 'multiply' })]),
      mani('a', [el('Overlay', { blendMode: 'screen' })]),
    )
    expect(hasDelta(d.deltas, 'Overlay', 'blendMode')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_opacity_partial_delta', () => {
    // A ghosted (opacity 0.5) element vs a solid one — a tonal defect no colour
    // field holds; a 0.5 vs 0.5 re-render is not a delta.
    const d = diffManifests(
      mani('ref', [el('Ghost', { opacity: 0.5 })]),
      mani('a', [el('Ghost', { opacity: 1 })]),
    )
    expect(hasDelta(d.deltas, 'Ghost', 'opacity')).toBe(true)
    const same = diffManifests(
      mani('ref', [el('Ghost', { opacity: 0.5 })]),
      mani('a', [el('Ghost', { opacity: 0.5 })]),
    )
    expect(hasProp(same.deltas, 'opacity')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_outline_presence_delta', () => {
    const d = diffManifests(
      mani('ref', [el('Field', { outline: '2px solid #3b82f6' })]),
      mani('a', [el('Field', { outline: null })]),
    )
    expect(hasDelta(d.deltas, 'Field', 'outline')).toBe(true)
  })

  it('test_UAT_FC_REQ-63_pseudo_content_value_delta', () => {
    // An injected ::before icon present in the reference, absent in the repro.
    const d = diffManifests(
      mani('ref', [el('Chip', { pseudo: 'before' })]),
      mani('a', [el('Chip', { pseudo: null })]),
    )
    expect(hasDelta(d.deltas, 'Chip', 'pseudo')).toBe(true)
  })
})

// ── border cluster ───────────────────────────────────────────────────────────

describe('REQ-63 values-diff — border line style + media crop', () => {
  it('test_UAT_FC_REQ-63_border_style_dashed_vs_solid_delta', () => {
    // Same width + colour, different line style — a dashed rule vs a solid one
    // was invisible: only width + colour were compared.
    const d = diffManifests(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'dashed' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    expect(hasDelta(d.deltas, 'Card', 'border')).toBe(true)
    // A reference that never captured a style (pre-REQ-63) must not fabricate a
    // style delta against a repro that did.
    const legacy = diffManifests(
      mani('ref', [el('Card', { border: { widthPx: 1, color: '#334155' } })]),
      mani('a', [el('Card', { border: { widthPx: 1, color: '#334155', style: 'solid' } })]),
    )
    expect(hasProp(legacy.deltas, 'border')).toBe(false)
  })

  it('test_UAT_FC_REQ-63_object_position_crop_delta', () => {
    // Same box + object-fit, different crop anchor (top vs centre) reframes the
    // photo — a media fact no size or fit field holds.
    const d = diffManifests(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: '50% 50%' })]),
    )
    expect(hasProp(d.deltas, 'objectPosition')).toBe(true)
    const same = diffManifests(
      mani('ref', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
      mani('a', [imgEl({ objectFit: 'cover', objectPosition: 'top' })]),
    )
    expect(hasProp(same.deltas, 'objectPosition')).toBe(false)
  })
})

// ── extraction: the real EXTRACT_SCRIPT reads the new axes from computed styles ─

describe('REQ-63 in-page extraction (EXTRACT_SCRIPT under jsdom)', () => {
  it('test_UAT_FC_REQ-63_extract_reads_typography_and_effects', () => {
    const html = `<!doctype html><html><body>
      <section style="background:#ffffff">
        <h1 style="font-style:italic;text-decoration:underline;text-transform:uppercase;font-variant:small-caps;opacity:0.6;mix-blend-mode:multiply;border:2px dashed #334155">Styled Heading</h1>
      </section></body></html>`
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
    const win = dom.window as unknown as { eval(s: string): unknown }
    const R = (x: number, y: number, w: number, h: number) =>
      ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} })
    dom.window.Element.prototype.getBoundingClientRect = function () {
      return R(64, 48, 600, 60) as unknown as DOMRect
    }
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })

    const signals = win.eval(EXTRACT_SCRIPT) as RawSignals
    const run = signals.bands.flatMap((b) => b.content).find((r) => r.text === 'Styled Heading')!
    expect(run, 'heading captured').toBeDefined()
    // Typography treatment axes — each read from computed styles (was blind).
    expect(run.fontStyle).toBe('italic')
    expect(run.textDecoration).toBe('underline')
    expect(run.textTransform).toBe('uppercase')
    expect(run.fontVariant).toBe('small-caps')
    // Effects — partial opacity + blend mode.
    expect(run.opacity).toBeCloseTo(0.6, 2)
    expect(run.blendMode).toBe('multiply')
    // Box border on a TEXT RUN (was fields-only) with its line style.
    expect(run.borderWidthPx).toBe(2)
    expect(run.borderStyle).toBe('dashed')
  })
})
