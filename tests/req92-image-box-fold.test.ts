/**
 * REQ-92 (headline) — `foldToL1` folds text-free **image** and **surface (box)**
 * elements into real L1 leaves, not residuals.
 *
 *   - Images (`<img>`) → `l1ImageSchema` leaves: `src` (plumbed from the capture),
 *     `alt`, `axes` (objectFit / borderRadius / opacity / blend / border / shadow),
 *     a per-width geometry keyframe track, `visibility`, and a stable `id`.
 *   - Standalone painted surfaces → `l1BoxSchema` leaves (surfaceFill / gradient /
 *     border / radius / opacity / backdropBlur / blend + geometry + id).
 *   - Form controls (inputs, buttons) stay `foldResiduals` — a behavior-module seam
 *     (DOC-25/26), never a faked `<input>`.
 *   - `sampleFidelityProbe` pairs image/box leaves too, so the gate measures them;
 *     idempotency holds on the enriched fold at every sampled width.
 *
 * Co-designed against the two real captures: joyfulculinarycreations (image-dense)
 * and gigabytealchemy (form controls, no standalone surfaces).
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, sampleFidelityProbe, evaluateLayout, type FoldResidual } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/**
 * A real capture bundle, or null when it is absent (`storage/references` is
 * gitignored — the bundle only exists after a local `1c capture page`) or stale
 * (captured before REQ-92's `src` plumbing, so its `<img>` elements carry no
 * src). The two real-capture UATs skip cleanly in that case — the same
 * skip-without-the-engine convention the REQ-83 hint UAT uses — while the
 * synthetic UATs below always run and fully exercise image/box emission.
 */
function loadFreshBundle(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  if (!existsSync(p)) return null
  const ms = JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture
  const hasSrcImage = ms.projections.some((proj) =>
    proj.manifest.elements.some((e) => (e as ValueElement).a11yRole === 'img' && (e as ValueElement).src),
  )
  return hasSrcImage ? ms : null
}

function childrenOf(doc: ReturnType<typeof foldToL1>): ValueElement[] & { kind?: string }[] {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as never
}

/** A textless element at one width, spanning all its fields. */
function textless(width: number, over: Partial<ValueElement>): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    box: { x: 0, y: 200, width, height: 300 },
    ...over,
  }
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

describe('REQ-92 — image + surface (box) leaves fold into the L1 tree', () => {
  it('test_UAT_FC_REQ-92_real_capture_images_become_leaves', () => {
    // joyfulculinarycreations has textless <img> elements — they must fold to
    // valid image leaves carrying src + alt + geometry, no longer residuals.
    const ms = loadFreshBundle('joyfulculinarycreations.com')
    if (!ms) return // no fresh capture available — skip cleanly (see loadFreshBundle)
    const residuals: FoldResidual[] = []
    const doc = foldToL1(ms, { residuals })
    expect(validateL1(doc).ok).toBe(true)

    const images = childrenOf(doc).filter((n) => (n as { kind: string }).kind === 'image') as unknown as Array<{
      src: string
      alt: string
      id?: string
      geometry?: { keyframes: unknown[] }
    }>
    expect(images.length).toBeGreaterThan(0)
    for (const img of images) {
      expect(img.src).toBeTruthy()
      expect(typeof img.alt).toBe('string')
      expect(img.id).toMatch(/^image-\d+$/)
      expect(img.geometry?.keyframes.length).toBeGreaterThan(0)
    }
    // No image is left as a residual (they all became leaves).
    expect(residuals.filter((r) => r.kind === 'image')).toEqual([])
  })

  it('test_UAT_FC_REQ-92_real_capture_image_leaves_reproduce_oracle', () => {
    // The gate now measures image/box leaves: every image leaf's evaluated box
    // must match the oracle within tolerance at all six widths (non-text residuals
    // and non-text unmatched both empty). Decoupled from any text-only drift.
    const ms = loadFreshBundle('joyfulculinarycreations.com')
    if (!ms) return // no fresh capture available — skip cleanly
    const doc = foldToL1(ms)
    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    const nonTextResiduals = report.residuals.filter((r) => /^\(/.test(r.text))
    const nonTextUnmatched = report.unmatched.filter((r) => /^\(/.test(r.text))
    expect(nonTextResiduals).toEqual([])
    expect(nonTextUnmatched).toEqual([])
  })

  it('test_UAT_FC_REQ-92_form_controls_stay_residuals', () => {
    // gigabytealchemy has only textless form controls (textboxes) — they must NOT
    // be faked into leaves; they remain typed field residuals (behavior seam).
    // This holds for the stale bundle too (controls never needed the src plumbing),
    // so read it directly rather than gating on a fresh capture.
    const p = path.join(process.cwd(), 'storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')
    if (!existsSync(p)) return
    const ms = JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture
    const residuals: FoldResidual[] = []
    const doc = foldToL1(ms, { residuals })
    // No <img> in this capture — no image leaf may be faked.
    const images = childrenOf(doc).filter((n) => (n as { kind: string }).kind === 'image')
    expect(images).toEqual([])
    // Text-run surfaces fold to painted `box` leaves. A form control must NOT be
    // among them — every box is a reconstructed surface, never a faked control,
    // and the controls remain typed field residuals.
    //
    // REQ-88 replaced BUG-11's per-run `surface-*` backing box with the section-band
    // → card reconstruction, so the ids that express "this box is a surface" are now
    // `section-band-*` / `card-*`. The property under test is unchanged; only the
    // vocabulary for it moved, and this expectation had not followed.
    const boxes = childrenOf(doc).filter((n) => (n as { kind: string }).kind === 'box')
    for (const b of boxes) expect((b as { id?: string }).id).toMatch(/^(section-band|section-bg|card|surface)-\d+$/)
    expect(residuals.filter((r) => r.kind === 'field').length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-92_image_fold_is_idempotent', () => {
    // Fold + analytic value-render are pure: refolding the same capture and
    // re-evaluating both yield identical image leaves at every sampled width.
    const ms = loadFreshBundle('joyfulculinarycreations.com')
    if (!ms) return // no fresh capture available — skip cleanly
    const a = foldToL1(ms)
    const b = foldToL1(ms)
    expect(JSON.stringify(b)).toEqual(JSON.stringify(a))
    for (const width of LADDER) {
      const first = evaluateLayout(a, width).leaves.filter((l) => l.kind === 'image')
      const second = evaluateLayout(a, width).leaves.filter((l) => l.kind === 'image')
      expect(second).toEqual(first)
      expect(first.length).toBeGreaterThan(0)
    }
  })

  it('test_UAT_FC_REQ-92_image_axes_folded_and_rendered', () => {
    // A synthetic <img> with fit + rounding + opacity + a border + a drop shadow:
    // every axis folds to the typed L1 image-axis subset and paints through the
    // renderer's safe sink (a real <img> with escaped src).
    const doc = foldToL1(
      multiFrom((w) => [
        textless(w, {
          role: 'img',
          a11yRole: 'img',
          objectFit: 'cover',
          intrinsicAspect: 1.5,
          src: 'https://cdn.example.com/photo.jpg',
          alt: 'A photo',
          accessibleName: 'A photo',
          borderRadiusPx: 12,
          opacity: 0.9,
          border: { widthPx: 2, color: '#112233', style: 'solid' },
          boxShadow: 'rgba(0, 0, 0, 0.4) 0px 4px 12px 1px',
          box: { x: 10, y: 200, width: w - 20, height: 300 },
        }),
      ]),
    )
    const img = childrenOf(doc).find((n) => (n as { kind: string }).kind === 'image') as unknown as {
      src: string
      alt: string
      axes: Record<string, unknown>
    }
    expect(img).toBeDefined()
    expect(img.axes).toEqual({
      objectFit: 'cover',
      borderRadiusPx: 12,
      opacity: 0.9,
      border: { widthPx: 2, color: '#112233', style: 'solid' },
      boxShadow: { offsetXPx: 0, offsetYPx: 4, blurPx: 12, spreadPx: 1, color: '#000000' },
    })
    const { css, html } = renderL1Document(doc)
    expect(html).toContain('<img')
    expect(html).toContain('https://cdn.example.com/photo.jpg')
    expect(css).toMatch(/object-fit:\s*cover/)
  })

  it('test_UAT_FC_REQ-92_surface_box_leaf_from_standalone_panel', () => {
    // A textless standalone painted surface (a divider: fill + rounding + border,
    // no control role, no media) folds to a box leaf that the gate pairs.
    const ms = multiFrom((w) => [
      textless(w, {
        role: 'separator',
        a11yRole: 'separator',
        surfaceFill: '#f0eee9',
        borderRadiusPx: 8,
        border: { widthPx: 1, color: '#d8d2c8', style: 'solid' },
        box: { x: 40, y: 500, width: w - 80, height: 4 },
      }),
    ])
    const residuals: FoldResidual[] = []
    const doc = foldToL1(ms, { residuals })
    const box = childrenOf(doc).find((n) => (n as { kind: string }).kind === 'box') as unknown as {
      id?: string
      axes: Record<string, unknown>
    }
    expect(box).toBeDefined()
    expect(box.id).toMatch(/^box-\d+$/)
    expect(box.axes).toEqual({
      surfaceFill: '#f0eee9',
      borderRadiusPx: 8,
      border: { widthPx: 1, color: '#d8d2c8', style: 'solid' },
    })
    expect(residuals).toEqual([]) // expressed, not a residual
    // The gate measures it and it reproduces the oracle.
    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.residuals.filter((r) => /^\(box\)/.test(r.text))).toEqual([])
  })

  it('test_UAT_FC_REQ-92_snap_reflow_reproduces_at_the_breakpoint_width', () => {
    // Finding 2 — a card that reflows from a full-width stack (≤375, w=279) to a
    // narrow 3-up column (≥768, w=171): the 375→768 segment folds to `snap`. At
    // the EXACT breakpoint width 768 the evaluator must resolve to the 768 keyframe
    // (the reflowed narrow box), not hold the wider 375 box — a closed upper bound
    // held the pre-reflow box and cascaded the whole page below it (the 1616px FAIL).
    const card = (width: number): ValueElement => {
      const wide = width <= 375
      return {
        text: 'Card',
        role: 'body',
        color: '#111827',
        fontFamily: 'Inter',
        fontSizePx: 18,
        fontWeight: 500,
        box: wide
          ? { x: 48, y: 1800 + width, width: 279, height: 120 }
          : { x: 48, y: 1831, width: 171, height: 120 },
      }
    }
    const cap = multiFrom((w) => [card(w)])
    const doc = foldToL1(cap)

    // The fold classified the 375→768 transition as a reflow (snap), not fluid.
    const leaf = childrenOf(doc).find((n) => (n as { kind: string; text?: string }).text === 'Card') as unknown as {
      geometry: { keyframes: Array<{ at: number }>; segments: string[] }
    }
    const segIdx = leaf.geometry.keyframes.findIndex((k) => k.at === 375)
    expect(leaf.geometry.segments[segIdx]).toBe('snap')

    // At the exact breakpoint the evaluated box is the 768 keyframe (w=171), not 279.
    const at768 = evaluateLayout(doc, 768).leaves.find((l) => l.text === 'Card')!
    expect(Math.round(at768.box.width)).toBe(171)

    // The whole ladder reproduces the oracle — no phantom 768 cascade.
    const report = sampleFidelityProbe(doc, cap, { tolerancePx: 2 })
    expect(report.pass).toBe(true)
    expect(report.maxDelta).toBeLessThanOrEqual(2)
  })

  it('test_UAT_FC_REQ-92_media_without_src_is_a_residual_not_a_broken_leaf', () => {
    // A media element the capture could not resolve a src for cannot become a
    // valid image leaf — it is signalled, never emitted as a src-less <img>.
    const residuals: FoldResidual[] = []
    const doc = foldToL1(
      multiFrom((w) => [
        textless(w, { role: 'img', a11yRole: 'img', objectFit: 'cover', intrinsicAspect: 1, src: null, box: { x: 0, y: 200, width: w, height: 300 } }),
      ]),
      { residuals },
    )
    expect(childrenOf(doc)).toEqual([]) // no faked leaf
    const r = residuals.find((r) => r.kind === 'image')
    expect(r?.reason).toMatch(/src/i)
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw', () => {
    // A `data:` lazy-load placeholder is the standard pattern on exactly the kind
    // of site this pipeline targets. The envelope rightly refuses it (DOC-2), so
    // the fold must *signal* it as a folder-power gap — never hand it to
    // validateL1, which would throw and burn the whole capture/gate run (which
    // happens after the browser work) over one image.
    const residuals: FoldResidual[] = []
    let doc!: ReturnType<typeof foldToL1>
    expect(() => {
      doc = foldToL1(
        multiFrom((w) => [
          textless(w, {
            role: 'img',
            a11yRole: 'img',
            src: 'data:image/svg+xml,<svg/>',
            box: { x: 0, y: 200, width: w, height: 300 },
          }),
        ]),
        { residuals },
      )
    }).not.toThrow()

    expect(childrenOf(doc)).toEqual([]) // no leaf carrying an unrepresentable src
    expect(validateL1(doc).ok).toBe(true)
    const r = residuals.find((r) => r.kind === 'image')
    expect(r?.reason).toMatch(/not an allowed URL/i)
    expect(r?.widths).toEqual(LADDER)
  })

  it('test_UAT_FC_REQ-92_paren_bearing_media_src_is_a_residual_not_a_throw', () => {
    // Same class, different trigger: an `https:` URL carrying raw parentheses is
    // refused because the value is emitted into a CSS `url(…)` context. Signal it.
    const residuals: FoldResidual[] = []
    let doc!: ReturnType<typeof foldToL1>
    expect(() => {
      doc = foldToL1(
        multiFrom((w) => [
          textless(w, {
            role: 'img',
            a11yRole: 'img',
            src: 'https://cdn.example.com/logo(1).png',
            box: { x: 0, y: 200, width: w, height: 300 },
          }),
        ]),
        { residuals },
      )
    }).not.toThrow()

    expect(childrenOf(doc)).toEqual([])
    expect(validateL1(doc).ok).toBe(true)
    expect(residuals.find((r) => r.kind === 'image')?.reason).toMatch(/not an allowed URL/i)
  })

  it('test_UAT_FC_REQ-92_safe_media_src_still_folds_alongside_an_unsafe_one', () => {
    // The guard is surgical: an envelope-safe sibling in the same capture still
    // becomes a real image leaf. One bad src degrades one element, not the page.
    const residuals: FoldResidual[] = []
    const doc = foldToL1(
      multiFrom((w) => [
        textless(w, {
          role: 'img',
          a11yRole: 'img',
          src: 'data:image/gif;base64,R0lGOD',
          box: { x: 0, y: 200, width: w, height: 300 },
        }),
        textless(w, {
          text: '',
          role: 'img',
          a11yRole: 'img',
          accessibleName: 'Team',
          src: 'https://cdn.example.com/team.jpg',
          alt: 'Team',
          box: { x: 0, y: 600, width: w, height: 200 },
        }),
      ]),
      { residuals },
    )
    const images = childrenOf(doc).filter((n) => (n as { kind: string }).kind === 'image') as unknown as Array<{
      src: string
    }>
    expect(images.map((i) => i.src)).toEqual(['https://cdn.example.com/team.jpg'])
    expect(residuals.filter((r) => r.kind === 'image').length).toBe(1)
    expect(validateL1(doc).ok).toBe(true)
  })
})
