/**
 * BUG-11 — the fold reconstructs the **surface a run sits on**, not just the run.
 *
 * The capture composites the card/panel/section fill behind every text run onto
 * that run (`surfaceFill` / `surfaceGradient`) — never as a standalone box. Before
 * this fix the fold emitted a bare text leaf and dropped every surface, so a
 * reproduction had no panel or section backgrounds (`doc.background` unset, node
 * kinds `{box:1(root), text:N}`). Now:
 *
 *   - the dominant solid run-fill becomes the page band (`doc.background`), painted
 *     by the document body;
 *   - each run whose surface *differs* from the band (or carries a gradient) folds a
 *     backing `box` leaf carrying that fill, placed behind the content;
 *   - geometry (`sampleFidelity`) is unchanged — the backing boxes are not text, so
 *     the fidelity measure (text-only) is untouched;
 *   - a backing surface overlapping the content it backs is not a layout-envelope
 *     violation (`evaluateLayout` no longer flags box↔content overlap).
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
  return {
    text,
    role: 'text',
    color: '#111111',
    fontFamily: 'Arial',
    fontSizePx: 18,
    fontWeight: 400,
    box,
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

/** The root box's direct children. */
function childrenOf(doc: ReturnType<typeof foldToL1>): Array<ValueElement & { kind: string; id?: string; axes?: unknown }> {
  return (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as never
}

function loadReal(host: string): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', host, 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

describe('BUG-11 — fold reconstructs run surfaces (fills + doc.background)', () => {
  it('test_UAT_FC_BUG-11_run_surface_fill_emits_backing_box_behind_text', () => {
    // Three runs sit on the band (its composited fill), two on a *different* panel
    // fill. The band dominates, so only the two panel runs get a backing box (the
    // band paints via the body). Each backing box carries the panel fill + the
    // run's geometry.
    const BAND = '#f8f5f2'
    const PANEL = '#e8dfd3'
    const ms = multiFrom((w) => [
      run(w, 'Band A', { x: 20, y: 40, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Band B', { x: 20, y: 100, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Band C', { x: 20, y: 160, width: w - 40, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Card title', { x: 40, y: 300, width: 200, height: 40 }, { surfaceFill: PANEL }),
      run(w, 'Card body', { x: 40, y: 360, width: 200, height: 60 }, { surfaceFill: PANEL }),
    ])
    const doc = foldToL1(ms)

    expect(doc.background).toBe(BAND)
    const boxes = childrenOf(doc).filter((n) => n.kind === 'box')
    const texts = childrenOf(doc).filter((n) => n.kind === 'text')
    expect(texts.length).toBe(5)
    // Exactly the two panel runs get a backing box; the band runs do not.
    expect(boxes.length).toBe(2)
    for (const b of boxes) {
      expect(b.id).toMatch(/^surface-\d+$/)
      expect((b.axes as { surfaceFill?: string }).surfaceFill).toBe(PANEL)
      // The backing box pins the run's geometry (with a height) — a real surface.
      const h = (b as unknown as { geometry: { keyframes: Array<{ height?: number }> } }).geometry.keyframes[0].height
      expect(h).toBeGreaterThan(0)
    }
    // Surfaces are emitted first so every content leaf paints over its surface.
    const kinds = childrenOf(doc).map((n) => n.kind)
    expect(kinds.slice(0, 2)).toEqual(['box', 'box'])
  })

  it('test_UAT_FC_BUG-11_dominant_run_fill_becomes_doc_background', () => {
    // The band is the solid fill the most runs sit on (#f8f5f2 ×3 here). It paints
    // via the body, so runs on it get NO backing box; only the odd panel run does.
    const BAND = '#f8f5f2'
    const PANEL = '#0f172b'
    const ms = multiFrom((w) => [
      run(w, 'One', { x: 10, y: 20, width: 100, height: 30 }, { surfaceFill: BAND }),
      run(w, 'Two', { x: 10, y: 60, width: 100, height: 30 }, { surfaceFill: BAND }),
      run(w, 'Three', { x: 10, y: 100, width: 100, height: 30 }, { surfaceFill: BAND }),
      run(w, 'Panel', { x: 10, y: 200, width: 100, height: 30 }, { surfaceFill: PANEL }),
    ])
    const doc = foldToL1(ms)

    expect(doc.background).toBe(BAND)
    const boxes = childrenOf(doc).filter((n) => n.kind === 'box')
    expect(boxes.length).toBe(1)
    expect((boxes[0].axes as { surfaceFill?: string }).surfaceFill).toBe(PANEL)

    // The rendered page paints the band on the body and the panel fill on its box.
    const { css } = renderL1Document(doc)
    expect(css).toContain(`body { background-color: ${BAND} }`)
    expect(css.toLowerCase()).toContain(`background-color: ${PANEL}`)
  })

  it('test_UAT_FC_BUG-11_surface_gradient_emits_backing_box_even_on_band', () => {
    // A gradient panel is a background-IMAGE the body cannot paint, so a run whose
    // *solid* composite equals the band still gets a backing box for its gradient.
    const BAND = '#ffffff'
    const grad = { angleDeg: 90, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }
    const ms = multiFrom((w) => [
      run(w, 'plain a', { x: 0, y: 0, width: 80, height: 20 }, { surfaceFill: BAND }),
      run(w, 'plain b', { x: 0, y: 30, width: 80, height: 20 }, { surfaceFill: BAND }),
      run(w, 'gradient run', { x: 0, y: 80, width: 80, height: 20 }, { surfaceFill: BAND, surfaceGradient: grad }),
    ])
    const doc = foldToL1(ms)

    expect(doc.background).toBe(BAND)
    const boxes = childrenOf(doc).filter((n) => n.kind === 'box')
    expect(boxes.length).toBe(1)
    const axes = boxes[0].axes as { surfaceFill?: string; surfaceGradient?: { stops: unknown[] } }
    expect(axes.surfaceGradient?.stops.length).toBe(2)
    // The renderer paints the gradient as a background-image layer.
    const { css } = renderL1Document(doc)
    expect(css).toContain('background-image: linear-gradient(')
  })

  it('test_UAT_FC_BUG-11_backing_surface_not_flagged_as_overlap', () => {
    // Two band runs anchor the page background; one panel run (a *different* fill)
    // folds a backing box directly behind it (same geometry). A surface behind the
    // content it backs is by design, not a collision — evaluateLayout reports no
    // overlap.
    const BAND = '#ffffff'
    const ms = multiFrom((w) => [
      run(w, 'Band A', { x: 20, y: 20, width: 300, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Band B', { x: 20, y: 80, width: 300, height: 40 }, { surfaceFill: BAND }),
      run(w, 'Card', { x: 20, y: 200, width: 300, height: 60 }, { surfaceFill: '#dbeafe' }),
    ])
    const doc = foldToL1(ms)
    // Sanity: exactly one backing box (the panel run) sits behind its content.
    expect(childrenOf(doc).filter((n) => n.kind === 'box').length).toBe(1)

    const { findings } = evaluateLayout(doc, 1280)
    expect(findings.filter((f) => f.kind === 'overlap')).toEqual([])
  })

  it('test_UAT_FC_BUG-11_sample_fidelity_unchanged_by_surfaces', () => {
    // Emitting surfaces must not move any text geometry — the text-only fidelity
    // measure still reproduces the oracle exactly at every sampled width.
    const ms = multiFrom((w) => [
      run(w, 'Header', { x: 0, y: 0, width: w, height: 50 }),
      run(w, 'Panel one', { x: 10, y: 120, width: 200, height: 40 }, { surfaceFill: '#e8dfd3' }),
      run(w, 'Panel two', { x: 10, y: 180, width: 200, height: 40 }, { surfaceFill: '#d9ccba' }),
    ])
    const doc = foldToL1(ms)
    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.pass).toBe(true)
    expect(report.maxDelta).toBeLessThanOrEqual(2)
    expect(report.unmatched).toEqual([])
  })

  it('test_UAT_FC_BUG-11_synthesized_surfaces_do_not_mispair_real_box_leaves', () => {
    // Regression for the non-text fidelity pairing. REQ-92 pairs the oracle's
    // `box` samples positionally against the reproduced `box` leaves, but BUG-11
    // *prepends* synthesized `surface-*` boxes that have no oracle counterpart
    // (their source element is a text run, classified `text` by the oracle). If
    // they enter the pairing queue, the k-th oracle box pairs with the k-th
    // surface and the gate reports phantom deltas for a document that reproduces
    // its real surface exactly.
    //
    // The ladder: (a) a run on the dominant band → no backing box; (b) a run on a
    // differing panel fill → one `surface-*` leaf; (c) a text-free painted
    // divider → one `box-*` leaf AND one oracle `box` sample, far from the panel.
    const ms = multiFrom((w) => [
      run(w, 'Band heading', { x: 20, y: 40, width: w - 40, height: 40 }, { surfaceFill: '#f8f5f2' }),
      run(w, 'Band body', { x: 20, y: 100, width: w - 40, height: 40 }, { surfaceFill: '#f8f5f2' }),
      run(w, 'Panel copy', { x: 40, y: 200, width: 240, height: 40 }, { surfaceFill: '#e8dfd3' }),
      {
        text: '',
        textless: true,
        role: 'box',
        box: { x: 0, y: 600, width: w, height: 4 },
        surfaceFill: '#00d492',
      } as ValueElement,
    ])
    const doc = foldToL1(ms)

    // One synthesized surface (the panel run) and one real box leaf (the divider).
    const boxes = childrenOf(doc).filter((n) => n.kind === 'box')
    expect(boxes.filter((b) => b.id?.startsWith('surface-')).length).toBe(1)
    expect(boxes.filter((b) => b.id?.startsWith('box-')).length).toBe(1)

    const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
    expect(report.residuals).toEqual([])
    expect(report.unmatched).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('test_UAT_FC_BUG-11_surface_ids_are_contiguous_after_the_band_filter', () => {
    // Ids are the pairing/debug handle, so they must be dense: band runs whose
    // backing box is filtered out must not burn an index (`surface-1` with no
    // `surface-0`).
    const ms = multiFrom((w) => [
      run(w, 'Band A', { x: 10, y: 20, width: 100, height: 30 }, { surfaceFill: '#f8f5f2' }),
      run(w, 'Band B', { x: 10, y: 60, width: 100, height: 30 }, { surfaceFill: '#f8f5f2' }),
      run(w, 'Panel A', { x: 10, y: 200, width: 100, height: 30 }, { surfaceFill: '#0f172b' }),
      run(w, 'Panel B', { x: 10, y: 240, width: 100, height: 30 }, { surfaceFill: '#0f172b' }),
    ])
    const ids = childrenOf(foldToL1(ms))
      .filter((n) => n.kind === 'box')
      .map((n) => n.id)
    expect(ids).toEqual(['surface-0', 'surface-1'])
  })

  it('test_UAT_FC_BUG-11_real_capture_gets_background_and_surfaces', () => {
    // The two retained real captures: the fold now sets a page band and emits
    // backing surfaces, while text fidelity stays clean. Skips cleanly if the
    // gitignored bundle is absent.
    for (const host of ['gigabytealchemy.ai', 'joyfulculinarycreations.com']) {
      const ms = loadReal(host)
      if (!ms) continue
      const doc = foldToL1(ms)
      expect(doc.background, `${host} doc.background`).toMatch(/^#[0-9a-f]{6}$/i)
      const boxes = childrenOf(doc).filter((n) => n.kind === 'box')
      expect(boxes.length, `${host} backing surfaces`).toBeGreaterThan(0)
      for (const b of boxes) expect(b.id).toMatch(/^surface-\d+$/)
      // Fidelity (geometry) is untouched by the surfaces.
      const report = sampleFidelityProbe(doc, ms, { tolerancePx: 2 })
      expect(report.pass, `${host} sampleFidelity`).toBe(true)
    }
  })
})
