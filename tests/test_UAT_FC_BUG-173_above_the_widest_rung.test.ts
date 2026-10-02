/**
 * BUG-173 — above the widest captured rung, full-bleed surfaces froze while their
 * content kept tracking the viewport, and no probe sampled there.
 *
 * The renderer holds every keyframed box at its widest-rung value above the last
 * breakpoint, while column anchors (REQ-88), relaxed `fit-content` widths and the
 * height response keep following the viewport. So above 1440px a reproduction was
 * a mixture of frozen and live boxes: the band stopped growing and the copy on it
 * walked off its right edge. The off-sample probe excluded those widths on the
 * premise that the geometry there was the top rung's.
 *
 * Part 1 (the alarm): the probe samples above the top rung, the evaluator resolves
 * column-anchored axes as the CSS does, and a full-bleed surface that stops short
 * of the viewport is a finding.
 *
 * Part 2 (the defect): the fold marks a node that was the viewport's width at every
 * rung as a fluid fill, and the renderer lets that fill own the width axis over the
 * keyframe literals — in the CSS, in `sizes`, and in the background-rendition choice.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import {
  evaluateLayout,
  foldToL1,
  offSampleProbe,
  offSampleWidths,
  onSampleProbe,
} from '../tools/generate/src/l1'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const ABOVE = 1920
const HEIGHT = 900

/** The REQ-88 centred column: `max-w-6xl px-6` capped at `max-w-4xl`. */
const origin = (w: number): number => Math.max(0, (w - 1152) / 2) + 24
const extent = (w: number): number => Math.min(896, Math.min(1152, w) - 48)

/**
 * One capture of a page whose copy sits in the centred column over a section
 * background. `bandAt` says how wide the section was MEASURED at each rung: the
 * viewport (full-bleed) or capped (a page that stops growing).
 */
function capture(bandAt: (w: number) => { x: number; width: number }): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => {
    const band = bandAt(width)
    const el = {
      role: 'body',
      color: '#111111',
      fontFamily: 'Inter, sans-serif',
      fontSizePx: 18,
      fontWeight: 400,
      lineHeightPx: 29,
      text: 'Copy that stands on the band',
      box: { x: origin(width), y: 140, width: extent(width), height: 29 },
      renderedTextBox: { x: origin(width), y: 140, width: extent(width), height: 21 },
    } as unknown as ValueElement
    const section = {
      index: 0,
      box: { x: band.x, y: 0, width: band.width, height: 400 },
      backgroundImageUrl: '/assets/hero.jpg',
    }
    return {
      engine: 'chromium',
      viewport: { width, height: HEIGHT },
      state: 'rest',
      manifest: {
        source: `t:${width}x${HEIGHT}`,
        elements: [el],
        sections: [section] as never,
        viewport: { width, height: HEIGHT },
      },
    }
  })
  return { url: 'http://fixture.test/', notes: [], projections }
}

const fullBleed = (w: number): { x: number; width: number } => ({ x: 0, width: w })
/** A page that caps at 1280: full width up to it, centred and flat above it. */
const capped = (w: number): { x: number; width: number } => ({
  x: Math.max(0, (w - 1280) / 2),
  width: Math.min(w, 1280),
})

function allNodes(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (n: L1Node): void => {
    out.push(n)
    const kids = n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []
    for (const c of kids) walk(c)
  }
  walk(doc.root)
  return out
}

const bandOf = (doc: L1Document): L1Node =>
  allNodes(doc).find((n) => 'id' in n && typeof n.id === 'string' && n.id.startsWith('section-bg-'))!

/** The document exactly as the fold emitted it before BUG-173: no viewport-tracking mark. */
function unmarked(doc: L1Document): L1Document {
  const copy = structuredClone(doc)
  for (const n of allNodes(copy)) if ('sizing' in n) delete (n as { sizing?: unknown }).sizing
  return copy
}

/** Every rule body the stylesheet carries for one selector, media blocks included. */
function rulesFor(css: string, selector: string): string[] {
  const out: string[] = []
  const re = new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`, 'g')
  for (const m of css.matchAll(re)) out.push(m[1])
  return out
}

/** The class the renderer gave a node, read off the element carrying its id. */
function classOf(html: string, id: string): string {
  const m = html.match(new RegExp(`<[^>]*id="${id}"[^>]*class="([^"]*)"|<[^>]*class="([^"]*)"[^>]*id="${id}"`))
  const cls = (m?.[1] ?? m?.[2] ?? '').split(/\s+/).find((c) => /^l1-\d+$/.test(c))
  expect(cls, `no l1 class found for ${id}`).toBeTruthy()
  return `.${cls}`
}

describe('BUG-173 Part 1 — the envelope probes sample above the widest rung', () => {
  it('test_UAT_FC_BUG-173_off_sample_samples_one_width_above_the_widest_rung', () => {
    const doc = foldToL1(capture(fullBleed))
    const sampled = offSampleWidths(doc)
    // A third again past the top rung: 1920 on a ladder that ends at 1440.
    expect(sampled).toContain(ABOVE)
    expect(sampled.filter((w) => w > LADDER[LADDER.length - 1])).toEqual([ABOVE])
    // The interior sampling is unchanged, and nothing is sampled below the first rung.
    for (let i = 0; i < LADDER.length - 1; i++) {
      expect(sampled.filter((w) => w > LADDER[i] && w < LADDER[i + 1]).length).toBe(2)
    }
    expect(Math.min(...sampled)).toBeGreaterThan(LADDER[0])
  })

  it('test_UAT_FC_BUG-173_evaluator_tracks_column_anchors_above_the_widest_rung', () => {
    // An evaluator that held every box at the top rung would put the run where it
    // was at 1440 and see nothing wrong. The CSS keeps the anchored left edge on
    // the column, so the model has to as well.
    const doc = unmarked(foldToL1(capture(fullBleed)))
    expect(doc.column, 'the fold fitted the centred column').toBeDefined()
    const runAt = (w: number): number =>
      evaluateLayout(doc, w).leaves.find((l) => l.text === 'Copy that stands on the band')!.box.x
    expect(runAt(1440)).toBeCloseTo(origin(1440), 0)
    expect(runAt(ABOVE)).toBeCloseTo(origin(ABOVE), 0)
    expect(runAt(ABOVE)).toBeGreaterThan(runAt(1440) + 200)
  })

  it('test_UAT_FC_BUG-173_probe_names_a_frozen_full_bleed_surface_and_its_shortfall', () => {
    // The document as the fold emitted it before Part 2: the band's six keyframes
    // trace the identity line, and the renderer freezes the last one.
    const doc = unmarked(foldToL1(capture(fullBleed)))
    const band = bandOf(doc)
    const report = offSampleProbe(doc)
    const above = report.byWidth.filter((w) => w.width === ABOVE)
    expect(above.length).toBeGreaterThan(0)
    for (const sample of above) {
      const named = sample.findings.filter(
        (f) => f.kind === 'escape' && f.detail.includes((band as { id: string }).id),
      )
      expect(named.length, JSON.stringify(sample.findings)).toBe(1)
      // The overhang in px: a 1440px band in a 1920px window stops 480px short.
      expect(named[0].detail).toContain('480px short')
      expect(named[0].width).toBe(ABOVE)
    }
    // At every captured width it spans the window, so it is not a finding there.
    expect(onSampleProbe(doc).pass).toBe(true)
  })
})

describe('BUG-173 Part 2 — a full-bleed node keeps tracking the viewport', () => {
  it('test_UAT_FC_BUG-173_fold_marks_only_nodes_that_were_the_viewport_width_at_every_rung', () => {
    const doc = foldToL1(capture(fullBleed))
    expect((bandOf(doc) as { sizing?: unknown }).sizing).toEqual({ width: { mode: 'fluid' } })
    // The run is narrower than the viewport at every rung, so it is left alone.
    const marked = allNodes(doc).filter((n) => (n as { sizing?: { width?: unknown } }).sizing?.width)
    expect(marked).toEqual([bandOf(doc)])
  })

  it('test_UAT_FC_BUG-173_a_plateaued_surface_keeps_holding_its_captured_width', () => {
    // The original caps at 1280: the reproduction must cap too, not scale where
    // the original did not.
    const doc = foldToL1(capture(capped))
    expect(allNodes(doc).some((n) => (n as { sizing?: { width?: unknown } }).sizing?.width)).toBe(false)
    const { html, css } = renderL1Document(doc)
    const sel = classOf(html, (bandOf(doc) as { id: string }).id)
    const last = css.slice(css.lastIndexOf('@media (min-width: 1440px)'))
    expect(rulesFor(last, sel).join(';')).toContain('width: 1280px')
  })

  it('test_UAT_FC_BUG-173_rendered_full_bleed_surface_has_no_frozen_width', () => {
    const doc = foldToL1(capture(fullBleed))
    const { html, css } = renderL1Document(doc)
    const sel = classOf(html, (bandOf(doc) as { id: string }).id)
    const decls = rulesFor(css, sel).join(';')
    expect(decls).toContain('width: 100%')
    // No keyframe literal overrides the fill at any breakpoint — the held 1440px
    // above the last rung is the frozen band this removes.
    expect(decls).not.toMatch(/(^|;|\s)width:\s*(calc\(|[\d.]+px)/)
    // And the probe that named it is clean above the top rung now.
    const above = offSampleProbe(doc).byWidth.filter((w) => w.width === ABOVE)
    expect(above.flatMap((w) => w.findings)).toEqual([])
  })

  it('test_UAT_FC_BUG-173_at_every_captured_rung_the_box_is_unchanged', () => {
    const marked = foldToL1(capture(fullBleed))
    const before = unmarked(marked)
    for (const w of LADDER) {
      const a = evaluateLayout(before, w, { viewportHeight: HEIGHT }).boxes
      const b = evaluateLayout(marked, w, { viewportHeight: HEIGHT }).boxes
      expect([...b.entries()]).toEqual([...a.entries()])
    }
  })

  it('test_UAT_FC_BUG-173_fill_wins_over_keyframes_for_sizes_and_background_renditions', () => {
    // Keyframes frozen at 300px, sizing fluid: the fill owns the axis, so the
    // picture is chosen for the VIEWPORT, not for the stale literal.
    const widths = [320, 768, 1280]
    const geometry = {
      keyframes: widths.map((at) => ({ at, x: 0, y: 0, width: 300, height: 200 })),
    }
    const manifest = {
      'band.jpg': {
        width: 4000,
        height: 2000,
        renditions: [
          { src: 'assets/d/beef01-320.jpg', width: 320 },
          { src: 'assets/d/beef01-640.jpg', width: 640 },
          { src: 'assets/d/beef01-1280.jpg', width: 1280 },
          { src: 'assets/band.jpg', width: 4000 },
        ],
      },
    }
    const render = (node: L1Node): ReturnType<typeof renderL1Document> => {
      const doc: L1Document = { widths, root: { kind: 'box', children: [node] } }
      const res = validateL1(doc)
      expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
      return renderL1Document(doc, { delivery: manifest })
    }
    const fluid = { width: { mode: 'fluid' as const } }
    const box = (sizing?: typeof fluid): L1Node =>
      ({ kind: 'box', id: 'section-band-0', children: [], geometry, axes: { backgroundImageUrl: '/assets/band.jpg' }, ...(sizing ? { sizing } : {}) }) as L1Node
    // Keyframe-first: a 300px box wants 600px at 2× at every rung — one rule.
    expect(render(box()).css).not.toContain('url("assets/band.jpg")')
    // Fill-first: a 1280px viewport at 2× wants 2560px, which only the source covers.
    expect(render(box(fluid)).css).toContain('url("assets/band.jpg")')

    const image = (sizing?: typeof fluid): L1Node =>
      ({ kind: 'image', id: 'img-0', src: '/assets/band.jpg', alt: 'a band', geometry, ...(sizing ? { sizing } : {}) }) as L1Node
    expect(render(image()).html).toContain('sizes="(max-width: 768px) 300px, (max-width: 1280px) 300px, 300px"')
    expect(render(image(fluid)).html).toContain('sizes="100vw"')
  })
})
