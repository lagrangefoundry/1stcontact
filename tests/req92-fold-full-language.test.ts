/**
 * REQ-92 — rebuild `foldToL1` toward the full L1 language, signalling residuals.
 *
 * This increment lands two pieces of that rebuild:
 *   1. **textShadow folding** — the one currently-dropped, language-supported,
 *      *paint-only* text pixel-mover. It moves pixels without perturbing the
 *      leaf's captured box (unlike transform/mask, which shift the post-transform
 *      geometry the fold already pins), so folding it is idempotency-safe.
 *   2. **Signal-not-drop (BUG-6 / B2)** — text-free elements (images, form fields,
 *      pure-surface panels) and geometry-less runs are no longer silently
 *      `continue`d past; with a `residuals` out-collector each becomes a typed
 *      {@link FoldResidual} naming the folder-power gap.
 *
 * Deferred to later increments (they need image-`src` / structure plumbing and a
 * geometry model that avoids double-applying the transform the capture box already
 * bakes in): `image` / `box` / `container` leaves.
 */
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, type FoldResidual } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** A text {@link ValueElement} at one width; width-tracking box unless overridden. */
function textEl(width: number, overrides: Partial<ValueElement> & Pick<ValueElement, 'text'>): ValueElement {
  return {
    role: 'heading',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 700,
    box: { x: 20, y: 100, width: width - 40, height: 60 },
    ...overrides,
  }
}

/** Build a resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFromLadder(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

describe('REQ-92 — fold populates more of the L1 language + signals residuals', () => {
  it('test_UAT_FC_REQ-92_text_shadow_folded_and_rendered', () => {
    // A heading painted with a computed glow (colour-first, Chrome's form).
    const doc = foldToL1(
      multiFromLadder((w) => [textEl(w, { text: 'Glow Heading', textShadow: 'rgb(0, 0, 0) 0px 2px 6px' })]),
    )
    expect(validateL1(doc).ok).toBe(true)
    const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
    const leaf = leaves.find((n) => n.kind === 'text' && n.text === 'Glow Heading')
    expect(leaf?.kind === 'text' && leaf.axes?.textShadow).toEqual({
      offsetXPx: 0,
      offsetYPx: 2,
      blurPx: 6,
      color: '#000000',
    })
    // Strong observation: the folded shadow actually paints CSS through the renderer.
    const { css } = renderL1Document(doc)
    expect(css).toMatch(/text-shadow:\s*0px 2px 6px #000000/)
  })

  it('test_UAT_FC_REQ-92_text_shadow_parse_tolerates_colour_last_and_none', () => {
    // Colour-last ordering and an alpha rgba() both fold; `none` folds to nothing.
    const doc = foldToL1(
      multiFromLadder((w) => [
        textEl(w, { text: 'Colour Last', box: { x: 20, y: 100, width: w - 40, height: 60 }, textShadow: '1px 1px 4px rgba(10, 20, 30, 0.5)' }),
        textEl(w, { text: 'No Shadow', box: { x: 20, y: 200, width: w - 40, height: 60 }, textShadow: 'none' }),
      ]),
    )
    const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
    const last = leaves.find((n) => n.kind === 'text' && n.text === 'Colour Last')
    const none = leaves.find((n) => n.kind === 'text' && n.text === 'No Shadow')
    expect(last?.kind === 'text' && last.axes?.textShadow).toEqual({ offsetXPx: 1, offsetYPx: 1, blurPx: 4, color: '#0a141e' })
    expect(none?.kind === 'text' && none.axes?.textShadow).toBeUndefined()
  })

  it('test_UAT_FC_REQ-92_textless_elements_signalled_not_dropped', () => {
    // A textless media element (an <img>: object-fit + intrinsic aspect) and a
    // textless form control alongside one real heading.
    const residuals: FoldResidual[] = []
    const doc = foldToL1(
      multiFromLadder((w) => [
        textEl(w, { text: 'Real Heading' }),
        {
          text: '',
          role: 'image',
          color: '#000000',
          fontFamily: 'Inter',
          fontSizePx: 0,
          fontWeight: 400,
          textless: true,
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          box: { x: 0, y: 300, width: w, height: 200 },
        },
        {
          text: '',
          role: 'field',
          color: '#000000',
          fontFamily: 'Inter',
          fontSizePx: 16,
          fontWeight: 400,
          textless: true,
          a11yRole: 'textbox',
          accessibleName: 'Email',
          box: { x: 20, y: 520, width: 240, height: 40 },
        },
      ]),
      { residuals },
    )

    // No text-free element is faked into a text leaf — the only text leaf is the
    // real run. (REQ-93: the control does gain a node, but a `slot` seam, never a
    // synthesized `<input>`; the invariant under test is unchanged.)
    const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
    expect(leaves.map((n) => (n.kind === 'text' ? n.text : n.kind))).toEqual(['Real Heading', 'slot'])

    // …and the image, which still has no L1 leaf, is SIGNALLED as a typed residual
    // rather than silently dropped (B2).
    const image = residuals.find((r) => r.kind === 'image')
    expect(image).toBeDefined()
    expect(image?.capturedAxes).toEqual(expect.arrayContaining(['objectFit', 'intrinsicAspect']))
    expect(image?.widths).toEqual(LADDER)
  })

  it('test_UAT_FC_REQ-92_drop_stays_silent_without_the_collector', () => {
    // Backward-compatible: omit the collector and the text-free element is still
    // dropped, no throw, a valid document — the residual channel is opt-in.
    const doc = foldToL1(
      multiFromLadder((w) => [
        textEl(w, { text: 'Only Heading' }),
        {
          text: '',
          role: 'image',
          color: '#000000',
          fontFamily: 'Inter',
          fontSizePx: 0,
          fontWeight: 400,
          textless: true,
          objectFit: 'cover',
          box: { x: 0, y: 300, width: w, height: 200 },
        },
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)
    const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
    expect(leaves).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-92_geometryless_text_run_signalled', () => {
    // A run present at every width but never carrying a box → no keyframes, so no
    // leaf; it must surface as a geometry residual, not vanish.
    const residuals: FoldResidual[] = []
    foldToL1(
      multiFromLadder(() => [
        {
          text: 'Ghost Run',
          role: 'body',
          color: '#111111',
          fontFamily: 'Inter',
          fontSizePx: 18,
          fontWeight: 400,
          // no `box`
        },
      ]),
      { residuals },
    )
    const ghost = residuals.find((r) => r.kind === 'text')
    expect(ghost).toBeDefined()
    expect(ghost?.reason).toMatch(/geometry/i)
    expect(ghost?.widths).toEqual(LADDER)
  })

  it('test_UAT_FC_REQ-92_covered_pixel_mover_not_a_residual', () => {
    // Acceptance: the residual list is EMPTY for captured pixel-movers the
    // language now covers. A text-shadowed heading is fully expressed → no residual.
    const residuals: FoldResidual[] = []
    foldToL1(
      multiFromLadder((w) => [textEl(w, { text: 'Covered', textShadow: 'rgb(0,0,0) 0px 2px 6px' })]),
      { residuals },
    )
    expect(residuals).toEqual([])
  })

  it('test_UAT_FC_REQ-92_text_shadow_fold_is_idempotent', () => {
    // Folding the same capture twice yields the identical shadow axis — the
    // idempotency B1 measures, at the axis level for the newly-folded pixel-mover.
    const build = () =>
      foldToL1(multiFromLadder((w) => [textEl(w, { text: 'Stable', textShadow: 'rgb(4, 8, 12) 0px 3px 9px' })]))
    const a = build()
    const b = build()
    const shadowOf = (doc: ReturnType<typeof foldToL1>) => {
      const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
      const leaf = leaves.find((n) => n.kind === 'text')
      return leaf?.kind === 'text' ? leaf.axes?.textShadow : undefined
    }
    expect(shadowOf(a)).toEqual({ offsetXPx: 0, offsetYPx: 3, blurPx: 9, color: '#04080c' })
    expect(shadowOf(a)).toEqual(shadowOf(b))
  })
})
