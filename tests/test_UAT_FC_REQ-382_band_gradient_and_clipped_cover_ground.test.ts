/**
 * REQ-382 — two fold residuals on hearingzone510.com, a Zyro page.
 *
 * - **issue 1** — a gradient painted by a full-width bar (the sticky "Learn to
 *   train your brain to hear better." strip) was folded onto a card the size of
 *   the text run standing on it. It now takes the captured surface rect.
 * - **issue 2** — a cover-fit hero photograph that overhangs its backdrop was
 *   cropped by SHRINKING its box, which under `object-fit: cover` rescales it. It
 *   now keeps its captured box inside a clipping container at the backdrop's box.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'

const LADDER = [375, 1280]

function multiFrom(elementsAt: (w: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `req382:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function walk(doc: L1Document): Array<{ node: L1Node; ancestors: L1Node[] }> {
  const out: Array<{ node: L1Node; ancestors: L1Node[] }> = []
  const visit = (node: L1Node, ancestors: L1Node[]): void => {
    out.push({ node, ancestors })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((child) => visit(child, [...ancestors, node]))
  }
  visit(doc.root, [])
  return out
}

type Kf = { at: number; x: number; y: number; width: number; height?: number }
const kfAt = (node: L1Node, at: number): Kf | undefined =>
  (node as { geometry?: { keyframes: Kf[] } }).geometry?.keyframes.find((k) => k.at === at)

const GRADIENT = { angleDeg: 0, stops: [{ color: '#f2b374' }, { color: '#f0dac4' }] }

/** The sticky bar: a 40px full-width gradient strip, one centred run on it. */
function stickyBar(over: (w: number) => Partial<ValueElement> = () => ({})) {
  return multiFrom((w) => [
    {
      text: 'Learn to train your brain to hear better.',
      role: 'paragraph',
      color: '#1d1e20',
      fontFamily: 'Montserrat',
      fontSizePx: 18,
      fontWeight: 400,
      lineHeightPx: 23.4,
      box: { x: w / 2 - 176.2, y: 7.6, width: 352.41, height: 23.4 },
      surfaceFill: null,
      surfaceGradient: GRADIENT,
      surface: { self: false, box: { x: 0, y: 0, width: w, height: 40 }, borderRadiusPx: 0, boxShadow: null, border: null },
      ...over(w),
    } as ValueElement,
  ])
}

describe('REQ-382 issue 1 — a full-width bar gradient is painted across the bar', () => {
  it('test_UAT_FC_REQ-382_a_band_wide_gradient_takes_the_captured_surface_rect', () => {
    const doc = foldToL1(stickyBar())
    expect(validateL1(doc).ok).toBe(true)
    const painters = walk(doc).filter((n) => (n.node as { axes?: { surfaceGradient?: unknown } }).axes?.surfaceGradient)
    expect(painters, 'one surface paints the gradient').toHaveLength(1)
    const bar = painters[0].node
    expect(JSON.stringify((bar as { axes: { surfaceGradient: unknown } }).axes.surfaceGradient)).toContain('#f2b374')
    for (const w of LADDER) {
      const kf = kfAt(bar, w)!
      expect(kf.x, `x at ${w}`).toBe(0)
      expect(kf.width, `width at ${w}`).toBe(w)
      expect(kf.height, `height at ${w} — the bar, not the 23.4px run`).toBe(40)
    }
  })

  it('test_UAT_FC_REQ-382_a_gradient_row_with_its_own_accent_rule_keeps_its_run_box', () => {
    // The run's own element bears a treatment (an accent rule), which must never be
    // stretched across the band — the REQ-88 rule stands for such a row.
    const doc = foldToL1(
      stickyBar(() => ({ borderLeft: { widthPx: 4, color: '#1d1e20', style: 'solid' } as ValueElement['borderLeft'] })),
    )
    const painters = walk(doc).filter((n) => (n.node as { axes?: { surfaceGradient?: unknown } }).axes?.surfaceGradient)
    expect(painters).toHaveLength(1)
    expect(kfAt(painters[0].node, 1280)!.width).toBeLessThan(1280)
  })
})

/** The hearingzone hero: a 1168.56px cover photograph under a 1157px veil. */
function hero() {
  return multiFrom((w) => [
    {
      text: 'Hear what matters.',
      role: 'heading',
      color: '#ffffff',
      fontFamily: 'Prata',
      fontSizePx: 48,
      fontWeight: 400,
      lineHeightPx: 62.4,
      box: { x: 28, y: 884, width: w - 56, height: 62.4 },
      surfaceFill: '#1d1e20',
      surface: { self: false, box: { x: 0, y: 40, width: w, height: 1157 }, borderRadiusPx: 0, boxShadow: null, border: null },
      zIndex: 3,
    } as ValueElement,
    {
      text: 'black and white bed linen',
      textless: true,
      role: 'img',
      a11yRole: 'img',
      objectFit: 'cover',
      intrinsicAspect: 1.4,
      src: 'https://assets.example.test/hero.png',
      alt: 'black and white bed linen',
      box: { x: 0, y: 40, width: w, height: 1168.56 },
      zIndex: 0,
      color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0,
    },
    {
      text: '(generic)',
      textless: true,
      role: 'generic',
      a11yRole: 'generic',
      surfaceFill: '#1d1e20',
      opacity: 0.45,
      box: { x: 0, y: 40, width: w, height: 1157 },
      zIndex: 2,
      color: '', fontFamily: '', fontSizePx: 0, fontWeight: 0,
    },
  ])
}

describe('REQ-382 issue 2 — a cover photograph overhanging its backdrop is clipped, not resized', () => {
  it('test_UAT_FC_REQ-382_the_ground_keeps_its_captured_box_inside_a_clip_at_the_backdrop', () => {
    const doc = foldToL1(hero())
    expect(validateL1(doc).ok).toBe(true)
    const nodes = walk(doc)
    const photo = nodes.find((n) => n.node.kind === 'image')!
    const veil = nodes.find((n) => n.node.kind === 'box' && n.node.axes?.opacity === 0.45)!
    const clip = photo.ancestors[photo.ancestors.length - 1]
    expect(clip.kind === 'container' && clip.clip, 'the photo stands in a clipping container').toBe(true)
    for (const at of LADDER) {
      // The photograph's own height, so `object-fit: cover` paints it at the reference's scale…
      expect(kfAt(photo.node, at)!.height, `photo height at ${at}`).toBe(1168.56)
      // …cropped where the backdrop ends.
      expect(kfAt(clip, at)!.height, `clip height at ${at}`).toBe(kfAt(veil.node, at)!.height)
    }
  })

  it('test_UAT_FC_REQ-382_a_ground_inside_its_backdrop_gets_no_clip', () => {
    const fitted = multiFrom((w) =>
      hero().projections.find((p) => p.viewport.width === w)!.manifest.elements.map((el) =>
        el.textless && el.role === 'img' ? { ...el, box: { x: 0, y: 40, width: w, height: 1157 } } : el,
      ),
    )
    const nodes = walk(foldToL1(fitted))
    const photo = nodes.find((n) => n.node.kind === 'image')!
    expect(photo.ancestors.some((a) => a.kind === 'container' && a.clip)).toBe(false)
    expect(kfAt(photo.node, 1280)!.height).toBe(1157)
  })
})
