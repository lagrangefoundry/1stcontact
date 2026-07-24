/**
 * BUG-18 — responsive flat text axes (per-width font-size keyframing).
 *
 * The fold took a text run's axes from the widest present cell only, so
 * `fontSizePx` (and the other numeric type axes) was a single desktop value
 * applied at every width — headings rendered at desktop size on mobile (e.g.
 * "Gigabyte Alchemy" 36→72, section headings 30→36). This adds a responsive
 * scalar-axis track that:
 *
 *   - the FOLD emits per captured width for an axis that varies across the ladder,
 *     while leaving a genuinely static axis single-valued (no track bloat);
 *   - the RENDERER emits as media-queried CSS exactly like geometry (base rule =
 *     smallest-width keyframe, per-breakpoint overrides — fluid `calc()` by
 *     default), through the safe numeric sink (no raw CSS);
 *   - the envelope validator ACCEPTS (typed, bounded, keyframes at document
 *     widths) and REJECTS out-of-range values / off-ladder widths;
 *   - the round-trip expectation resolves per viewport, so the gate compares the
 *     size the browser actually renders at each width — not the desktop value.
 *
 * All probes are deterministic (fold + validator + emitter + analytic evaluator);
 * no browser required.
 */
import { describe, expect, it } from 'vitest'
import {
  validateL1,
  type L1Document,
  type L1Node,
  type L1Text,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import {
  foldToL1,
  evalScalarTrack,
  expectedTextManifest,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** A text run element at one width, with per-width font metrics. */
function run(
  text: string,
  box: NonNullable<ValueElement['box']>,
  over: Partial<ValueElement> = {},
): ValueElement {
  return {
    text,
    role: 'heading',
    color: '#111827',
    fontFamily: 'Poppins',
    fontSizePx: 40,
    fontWeight: 700,
    box,
    ...over,
  }
}

/** A multi-viewport capture whose elements are produced per width. */
function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 1200 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The size the target scales "Gigabyte Alchemy" to at each captured width. */
const HEADING_SIZE: Record<number, number> = { 320: 36, 375: 36, 768: 48, 1024: 60, 1280: 66, 1440: 72 }

/** All text leaves in document order. */
function textLeaves(doc: L1Document): L1Text[] {
  const out: L1Text[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
  }
  walk(doc.root)
  return out
}

describe('BUG-18 responsive text axes — fold', () => {
  it('test_UAT_FC_BUG-18_fold_keyframes_font_size_that_varies', () => {
    const doc = foldToL1(
      multiFrom((w) => [
        run('Gigabyte Alchemy', { x: 20, y: 40, width: w - 40, height: 80 }, { fontSizePx: HEADING_SIZE[w] }),
      ]),
    )
    const heading = textLeaves(doc).find((n) => n.text === 'Gigabyte Alchemy')
    expect(heading).toBeDefined()
    // A per-width font-size track keyed at every captured width.
    const track = heading!.responsive?.fontSizePx
    expect(track).toBeDefined()
    expect(track!.keyframes.map((k) => k.at)).toEqual(LADDER)
    expect(track!.keyframes.map((k) => k.value)).toEqual(LADDER.map((w) => HEADING_SIZE[w]))
    // The scalar axis stays the representative (widest) value for non-responsive consumers.
    expect(heading!.axes?.fontSizePx).toBe(72)
    // The whole document is a valid L1 envelope.
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_BUG-18_fold_leaves_static_axis_single_valued', () => {
    // A run whose font-size is constant across the ladder gets NO track (no bloat).
    const doc = foldToL1(
      multiFrom((w) => [run('Static Tagline', { x: 20, y: 200, width: w - 40, height: 30 }, { fontSizePx: 20 })]),
    )
    const tagline = textLeaves(doc).find((n) => n.text === 'Static Tagline')
    expect(tagline).toBeDefined()
    expect(tagline!.responsive).toBeUndefined()
    expect(tagline!.axes?.fontSizePx).toBe(20)
  })
})

describe('BUG-18 responsive text axes — renderer', () => {
  const WIDTHS = [320, 1440]
  const responsiveHeading: L1Text = {
    kind: 'text',
    text: 'Gigabyte Alchemy',
    axes: { fontSizePx: 72, color: '#111827' },
    responsive: { fontSizePx: { keyframes: [{ at: 320, value: 36 }, { at: 1440, value: 72 }] } },
  }
  const docWith = (node: L1Node): L1Document => ({ widths: WIDTHS, root: { kind: 'box', children: [node] } })

  it('test_UAT_FC_BUG-18_render_emits_per_width_font_size', () => {
    const res = validateL1(docWith(responsiveHeading))
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
    const { css } = renderL1Document(docWith(responsiveHeading))
    // Base rule carries the MOBILE size (smallest-width keyframe), not desktop.
    expect(css).toMatch(/font-size: 36px/)
    // The widest breakpoint holds the desktop size.
    expect(css).toMatch(/@media \(min-width: 1440px\) \{[^}]*font-size: 72px/)
    // Between captured widths the type scales fluidly (a calc, not a static jump).
    expect(css).toMatch(/font-size: calc\(36px/)
    // The static desktop size is NOT emitted in the base (non-media) rule — the
    // track owns the axis, so no `font-size: 72px` outside a media block.
    const base = css.split('@media')[0]
    expect(base).not.toMatch(/font-size: 72px/)
  })
})

describe('BUG-18 responsive text axes — analytic evaluator (acceptance)', () => {
  const track = { keyframes: LADDER.map((w) => ({ at: w, value: HEADING_SIZE[w] })) }

  it('test_UAT_FC_BUG-18_mobile_font_size_is_not_desktop', () => {
    // The acceptance: at mobile widths the heading is the mobile size, not 72.
    expect(evalScalarTrack(track, 320)).toBe(36)
    expect(evalScalarTrack(track, 375)).toBe(36)
    // At desktop it reaches the full size.
    expect(evalScalarTrack(track, 1440)).toBe(72)
    // Below the ladder holds the base; above holds the final.
    expect(evalScalarTrack(track, 200)).toBe(36)
    expect(evalScalarTrack(track, 2000)).toBe(72)
    // Interior sampled widths hit their keyframe exactly (fluid, but exact at samples).
    expect(evalScalarTrack(track, 768)).toBe(48)
    expect(evalScalarTrack(track, 1024)).toBe(60)
  })

  it('test_UAT_FC_BUG-18_expected_manifest_is_width_aware', () => {
    // The round-trip expectation must NOT expect desktop size at mobile — else the
    // gate would flag a phantom delta once the renderer scales type down.
    const doc = foldToL1(
      multiFrom((w) => [
        run('Gigabyte Alchemy', { x: 20, y: 40, width: w - 40, height: 80 }, { fontSizePx: HEADING_SIZE[w] }),
      ]),
    )
    const atMobile = expectedTextManifest(doc, { width: 320, height: 900 })
    const atDesktop = expectedTextManifest(doc, { width: 1440, height: 900 })
    const mobileHeading = atMobile.elements.find((e) => e.text === 'Gigabyte Alchemy')
    const desktopHeading = atDesktop.elements.find((e) => e.text === 'Gigabyte Alchemy')
    expect(mobileHeading?.fontSizePx).toBe(36)
    expect(desktopHeading?.fontSizePx).toBe(72)
  })
})

describe('BUG-18 responsive text axes — validator envelope', () => {
  const WIDTHS = [320, 1440]
  const docWith = (node: L1Node): L1Document => ({ widths: WIDTHS, root: { kind: 'box', children: [node] } })

  it('test_UAT_FC_BUG-18_robustness_rejects_out_of_range_and_off_ladder', () => {
    // A keyframe font-size beyond the legible range is rejected.
    const tooBig = validateL1(
      docWith({
        kind: 'text',
        text: 'x',
        responsive: { fontSizePx: { keyframes: [{ at: 320, value: 36 }, { at: 1440, value: 9999 }] } },
      } as unknown as L1Node),
    )
    expect(tooBig.ok).toBe(false)

    // A keyframe width that is not one of the document widths is rejected.
    const offLadder = validateL1(
      docWith({
        kind: 'text',
        text: 'x',
        responsive: { fontSizePx: { keyframes: [{ at: 320, value: 36 }, { at: 999, value: 72 }] } },
      } as unknown as L1Node),
    )
    expect(offLadder.ok).toBe(false)

    // A freeform key on the track object is rejected (no raw-CSS hole).
    const freeform = validateL1(
      docWith({
        kind: 'text',
        text: 'x',
        responsive: { fontSizePx: { keyframes: [{ at: 320, value: 36 }], evil: 'x' } },
      } as unknown as L1Node),
    )
    expect(freeform.ok).toBe(false)
  })
})
