/**
 * REQ-332 — four residuals measured on the joyfulculinarycreations.com
 * reproduction, each a different layer of the same pipeline.
 *
 *  1. FOLD — a full-bleed section band that arrives as a capture `field` was
 *     named `box-N`, the one name the geometry envelope reads as "ordinary
 *     painted content". So the exemption written for a backing surface never
 *     matched it (1172 `overlap` findings: every band colliding with its own
 *     copy), and no run could name it as what it sits on (0 `escape` findings,
 *     because nothing was being checked). Over-asserted and un-asserted at once.
 *
 *  2. L1 — there was no way to say "cut my children off at my own edge". A
 *     carousel lays its slides out beyond the box the reader sees, so the
 *     reproduction was 1699.75px wide where the reference is 1280, for slides
 *     both sides place at identical coordinates.
 *
 *  3. CAPTURE — the `(font file → weight, style)` pairing was destroyed before
 *     the fold saw it: faces were flattened to a bare `string[]` of paths, and
 *     the weights came from the RUNS the page painted. Seven descriptor-free
 *     `@font-face` rules, all claiming `(normal, 400)`, with Karla's italic file
 *     declared as a second normal face beside the real one.
 *
 *  4. L1 — the `filter` axis was an unordered object, and CSS filter functions
 *     do not commute. A captured `brightness contrast saturate` chain was served
 *     `saturate brightness contrast`, and the comparator — which reduced the
 *     whole axis to present/absent — could not see it.
 *
 * Every test drives a real entry point: `foldToL1`, `evaluateLayout` /
 * `deriveSurfaceBacking`, `renderL1Document`, `validateL1`, `buildTheme` /
 * `fontResourcesFromTheme`, `diffManifests`. No browser and no mocks.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1, deriveSurfaceBacking, evaluateLayout } from '../tools/generate/src'
import { foldFilter } from '../tools/generate/src/l1/fold'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import {
  diffManifests,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { buildTheme, fontResourcesFromTheme } from '../tools/generate/src/cli/capture/theme'
import type { RawSignals } from '../tools/generate/src/cli/capture/extract'
import type { ThemeFontFace } from '../tools/generate/src/cli/capture/types'

const LADDER = [320, 768, 1280]

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1000 },
    state: 'rest',
    manifest: {
      source: `req332:${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 1000 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A text-free element painting only a fill — a captured band backdrop. */
function fill(box: ValueElement['box'], surfaceFill: string, over: Partial<ValueElement> = {}): ValueElement {
  return {
    text: '(generic)',
    role: 'generic',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'generic',
    surfaceFill,
    box,
    ...over,
  }
}

/** A styled text run. */
function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return {
    text,
    role: 'body',
    color: '#ffffff',
    fontFamily: 'Arial',
    fontSizePx: 20,
    fontWeight: 400,
    lineHeightPx: 28,
    box,
    ...over,
  }
}

/** Every node in a folded document, with its path, depth-first. */
function walk(doc: L1Document): Array<{ node: L1Node; path: string }> {
  const out: Array<{ node: L1Node; path: string }> = []
  const visit = (node: L1Node, path: string): void => {
    out.push({ node, path })
    const kids = node.kind === 'container' ? node.children : node.kind === 'box' ? (node.children ?? []) : []
    kids.forEach((child, i) => visit(child, `${path}.${i}`))
  }
  visit(doc.root, '0')
  return out
}

// ── Issue 1 — a captured band backdrop is a backing surface ──────────────────

describe('REQ-332 issue 1 — a full-bleed captured fill is named for what it is', () => {
  /** A hero: a full-bleed black band with two runs standing on it. */
  const heroCapture = (): MultiStateCapture =>
    multiFrom((w) => [
      fill({ x: 0, y: 0, width: w, height: 400 }, '#000000'),
      run('Dreaming of healthier meals', { x: 40, y: 120, width: w - 80, height: 40 }),
      run('Learn More', { x: 40, y: 200, width: 160, height: 40 }),
    ])

  it('test_UAT_FC_REQ-332_a_captured_band_with_copy_on_it_is_named_a_backdrop', () => {
    const doc = foldToL1(heroCapture())
    const ids = walk(doc)
      .map((n) => n.node.id)
      .filter((id): id is string => id !== undefined)
    expect(ids.some((id) => id.startsWith('backdrop-'))).toBe(true)
    // And it is NOT named the way ordinary painted content is: `box-*` is what
    // the overlap scan treats as a real collider.
    const backdrop = walk(doc).find((n) => n.node.id?.startsWith('backdrop-'))!
    expect(backdrop.node.kind).toBe('box')
    expect((backdrop.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill).toBe('#000000')
  })

  it('test_UAT_FC_REQ-332_a_full_bleed_fill_backing_nothing_stays_an_ordinary_box', () => {
    // WHY THE TEST IS CONTAINMENT AND NOT SIZE. A 4px divider spanning the page
    // is full-bleed and is painted behind the content, but nothing stands on it.
    // Calling it a backing surface would exempt a decorative rule from ever
    // being reported as colliding with anything.
    const doc = foldToL1(
      multiFrom((w) => [
        fill({ x: 0, y: 500, width: w, height: 4 }, '#dddddd'),
        run('Below the rule', { x: 40, y: 600, width: w - 80, height: 40 }),
      ]),
    )
    const divider = walk(doc).find(
      (n) => (n.node as { axes?: { surfaceFill?: string } }).axes?.surfaceFill === '#dddddd',
    )!
    expect(divider.node.id?.startsWith('backdrop-')).toBe(false)
    expect(divider.node.id).toMatch(/^box-\d+$/)
  })

  it('test_UAT_FC_REQ-332_a_captured_backdrop_is_exempt_from_the_overlap_scan', () => {
    // The defect verbatim: `box overlaps Dreaming of healthier meals`, a band
    // reported as colliding with the copy it was painted for, at every sample.
    const doc = foldToL1(heroCapture())
    const backdrop = walk(doc).find((n) => n.node.id?.startsWith('backdrop-'))!
    const findings = evaluateLayout(doc, 1280).findings
    const overlaps = findings.filter((f) => f.kind === 'overlap' && f.paths.includes(backdrop.path))
    expect(overlaps, 'a band painting behind its own copy is not a collision').toEqual([])
  })

  it('test_UAT_FC_REQ-332_a_run_can_name_a_captured_backdrop_as_what_it_stands_on', () => {
    // The other half of the same defect: with nothing treating `box-N` as a
    // backing surface, no run was recorded as sitting on one — so the
    // containment probe never asked whether the band still covers its copy.
    const doc = foldToL1(heroCapture())
    const backdrop = walk(doc).find((n) => n.node.id?.startsWith('backdrop-'))!
    const backing = deriveSurfaceBacking(doc)
    const named = [...backing.values()].flat()
    expect(named, 'the band is attributable as a backing surface').toContain(backdrop.path)
  })
})

// ── Issue 2 — L1 can clip ────────────────────────────────────────────────────

/** A minimal document whose container clips one child that reaches past its edge. */
function clippingDoc(clip: true | undefined): L1Document {
  return {
    widths: [1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'container',
          layout: 'stack',
          ...(clip ? { clip } : {}),
          geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 1280, height: 200 }] },
          children: [
            {
              kind: 'text',
              text: 'off-screen slide',
              geometry: { keyframes: [{ at: 1280, x: 1027, y: 20, width: 673, height: 60 }] },
              axes: { color: '#111111', fontSizePx: 16 },
            },
          ],
        },
      ],
    },
  } as L1Document
}

describe('REQ-332 issue 2 — a node can declare that it cuts its children off', () => {
  it('test_UAT_FC_REQ-332_the_envelope_accepts_a_clipping_node', () => {
    // `l1ContainerSchema` is `.strict()`, so before the axis existed a document
    // that said `clip` was rejected as carrying an unknown key.
    const result = validateL1(clippingDoc(true))
    expect(result.ok ? [] : result.errors).toEqual([])
  })

  it('test_UAT_FC_REQ-332_the_renderer_emits_overflow_hidden_only_when_declared', () => {
    expect(renderL1Document(clippingDoc(true)).css).toContain('overflow: hidden')
    // And nowhere else: the paint-in-full default is what every document written
    // before this axis existed means.
    expect(renderL1Document(clippingDoc(undefined)).css).not.toContain('overflow: hidden')
  })

  it('test_UAT_FC_REQ-332_a_clipped_leaf_no_longer_reports_a_horizontal_overflow', () => {
    // Wrong before: `leaf right edge 1700px exceeds viewport 1280px`, ten of
    // them across the sample ladder, for a slide the reference never showed.
    const unclipped = evaluateLayout(clippingDoc(undefined), 1280).findings
    expect(unclipped.some((f) => f.kind === 'clip' && f.detail.includes('exceeds viewport'))).toBe(true)
    const clipped = evaluateLayout(clippingDoc(true), 1280).findings
    expect(clipped.filter((f) => f.kind === 'clip' && f.detail.includes('exceeds viewport'))).toEqual([])
  })

  it('test_UAT_FC_REQ-332_a_partly_clipped_leaf_is_measured_at_its_visible_extent', () => {
    // Not dropped, not whole: the painted extent is the intersection, which is
    // what every probe downstream has to read for its answer to be about pixels.
    const doc = clippingDoc(true)
    const container = (doc.root as { children: L1Node[] }).children[0] as {
      children: Array<{ geometry: { keyframes: Array<{ x: number; width: number }> } }>
    }
    container.children[0].geometry.keyframes[0].x = 1000
    const leaves = evaluateLayout(doc, 1280).leaves.filter((l) => l.kind === 'text')
    expect(leaves).toHaveLength(1)
    expect(leaves[0].box.x).toBe(1000)
    expect(leaves[0].box.x + leaves[0].box.width).toBe(1280)
  })

  it('test_UAT_FC_REQ-332_the_fold_wraps_elements_a_clipping_ancestor_cuts_off', () => {
    // Two carousel slides laid out either side of the visible one, both cut off
    // by the same ancestor — the shape that made the reproduction 420px wider
    // than its own viewport.
    const clip = { id: 7, x: 0, y: 300, width: 1280, height: 200 }
    const doc = foldToL1(
      multiFrom((w) => [
        run('visible slide', { x: 300, y: 320, width: 673, height: 160 }, { clip: { ...clip, width: w } }),
        run('slide to the left', { x: -419, y: 320, width: 673, height: 160 }, { clip: { ...clip, width: w } }),
        run('slide to the right', { x: 1027, y: 320, width: 673, height: 160 }, { clip: { ...clip, width: w } }),
      ]),
    )
    const clippers = walk(doc).filter((n) => n.node.clip === true)
    expect(clippers, 'one clipping container for one clipping ancestor').toHaveLength(1)
    const region = clippers[0].node as { children: L1Node[] }
    expect(region.children).toHaveLength(3)
    // And the reproduction stops at the viewport, which is the number the defect
    // was measured as: 1699.75 against the reference's 1280.
    const overflow = evaluateLayout(doc, 1280).findings.filter(
      (f) => f.kind === 'clip' && f.detail.includes('exceeds viewport'),
    )
    expect(overflow).toEqual([])
  })

  it('test_UAT_FC_REQ-332_a_clip_that_cuts_nothing_off_restructures_nothing', () => {
    // A page-builder site declares `overflow: hidden` on dozens of wrappers that
    // never actually clip anything. Building a container for each would
    // restructure documents with no clipping defect, for no pixel.
    const clip = { id: 3, x: 0, y: 0, width: 1280, height: 400 }
    const doc = foldToL1(
      multiFrom((w) => [
        run('well inside', { x: 40, y: 40, width: Math.min(400, w - 80), height: 40 }, { clip: { ...clip, width: w } }),
      ]),
    )
    expect(walk(doc).filter((n) => n.node.clip === true)).toEqual([])
  })
})

// ── Issue 3 — the font table keeps its descriptors ───────────────────────────

/** Signals whose one run paints `family`, so `buildTheme` records that family. */
function signalsPainting(family: string): RawSignals {
  return {
    bands: [
      {
        content: [
          {
            text: 'Sample copy',
            role: 'body',
            fontFamily: family,
            fontWeight: 400,
            fontSizePx: 16,
            lineHeightPx: 24,
            borderRadiusPx: 0,
            box: { x: 0, y: 0, width: 400, height: 24 },
          },
        ],
        items: [],
      },
    ],
    colorUsage: [],
    typeScale: [],
    spacingScalePx: [],
  } as unknown as RawSignals
}

describe('REQ-332 issue 3 — one captured face becomes one declared face', () => {
  const LATO: ThemeFontFace[] = [
    { src: 'assets/lato-300.woff2', weight: 300, style: 'normal' },
    { src: 'assets/lato-400.woff2', weight: 400, style: 'normal' },
    { src: 'assets/lato-700.woff2', weight: 700, style: 'normal' },
  ]

  it('test_UAT_FC_REQ-332_every_captured_face_keeps_its_own_weight', () => {
    // Wrong before: `weight = f.weights.length === 1 ? f.weights[0] : undefined`
    // over the cross product of files and PAINTED weights — so three Lato files
    // became three identical `(normal, 400)` faces, two of them unreachable.
    const theme = buildTheme(signalsPainting('Lato, sans-serif'), new Map([['Lato', LATO]]))
    const faces = fontResourcesFromTheme(theme.fonts)
    expect(faces.map((f) => f.weight)).toEqual([300, 400, 700])
    expect(new Set(faces.map((f) => f.src)).size).toBe(3)
  })

  it('test_UAT_FC_REQ-332_an_italic_face_is_not_declared_as_the_normal_one', () => {
    // `font-style` was never read at capture, so the reference's italic Karla
    // file arrived as a second normal face beside the real one and only one of
    // them could ever win.
    const karla: ThemeFontFace[] = [
      { src: 'assets/karla-italic.woff2', weight: [200, 800], style: 'italic' },
      { src: 'assets/karla-normal.woff2', weight: [200, 800], style: 'normal' },
    ]
    const theme = buildTheme(signalsPainting('Karla, sans-serif'), new Map([['Karla', karla]]))
    const faces = fontResourcesFromTheme(theme.fonts)
    expect(faces.find((f) => f.src.includes('italic'))?.style).toBe('italic')
    expect(faces.find((f) => f.src.includes('normal'))?.style).toBe('normal')
  })

  it('test_UAT_FC_REQ-332_a_variable_face_declares_its_whole_weight_range', () => {
    // A variable font is one file answering every weight between two bounds.
    // Pinned to a single number the browser synthesises the rest, which is a
    // different set of glyphs from the ones the reference painted.
    const doc: L1Document = {
      widths: [1280],
      resources: { fonts: [{ family: 'Karla', src: '/assets/karla.woff2', weight: [200, 800] }] },
      root: {
        kind: 'box',
        children: [
          {
            kind: 'text',
            text: 'Variable',
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 200 }] },
            axes: { color: '#111111', fontFamily: 'Karla', fontSizePx: 20 },
          },
        ],
      },
    } as L1Document
    const checked = validateL1(doc)
    expect(checked.ok ? [] : checked.errors).toEqual([])
    expect(renderL1Document(doc).css).toContain('font-weight: 200 800')
  })

  it('test_UAT_FC_REQ-332_a_weight_range_is_envelope_checked_at_both_ends', () => {
    const docWith = (weight: number | [number, number]): L1Document =>
      ({
        widths: [1280],
        resources: { fonts: [{ family: 'Karla', src: '/assets/karla.woff2', weight }] },
        root: { kind: 'box', children: [] },
      }) as unknown as L1Document
    const errorsOf = (weight: number | [number, number]): string[] => {
      const r = validateL1(docWith(weight))
      return r.ok ? [] : r.errors.map((e) => `${e.path} ${e.message}`)
    }
    expect(errorsOf([200, 5000]).join(' ')).toContain('/resources/fonts/0/weight')
    // And it must ascend: `font-weight: 800 200` is invalid CSS, so the browser
    // drops the whole descriptor and the face's weight coverage with it.
    expect(errorsOf([800, 200]).join(' ')).toContain('ascend')
    expect(errorsOf([200, 800])).toEqual([])
  })
})

// ── Issue 4 — the filter chain keeps its order ───────────────────────────────

describe('REQ-332 issue 4 — a filter chain composes in the order it was captured', () => {
  const SCRIM = 'brightness(0.67) contrast(0.88) saturate(1.06) blur(0px) hue-rotate(0deg)'

  it('test_UAT_FC_REQ-332_the_fold_records_a_non_canonical_filter_order', () => {
    const folded = foldFilter(SCRIM)
    expect(folded).toBeDefined()
    // The values, unchanged — and the sequence they were written in, which the
    // axis could not previously hold at all.
    expect(folded!.brightness).toBeCloseTo(0.67, 4)
    expect(folded!.order).toEqual(['brightness', 'contrast', 'saturate'])
  })

  it('test_UAT_FC_REQ-332_a_canonical_chain_declares_no_order', () => {
    // A chain the emitter would produce anyway needs no declaration; omitting it
    // keeps every already-canonical document byte-identical.
    expect(foldFilter('grayscale(0.5) saturate(1.2)')?.order).toBeUndefined()
  })

  it('test_UAT_FC_REQ-332_the_renderer_emits_the_declared_order', () => {
    const docWith = (filter: Record<string, unknown>): L1Document =>
      ({
        widths: [1280],
        root: { kind: 'box', axes: { filter } },
      }) as unknown as L1Document
    const declared = renderL1Document(
      docWith({ saturate: 1.06, brightness: 0.67, contrast: 0.88, order: ['brightness', 'contrast', 'saturate'] }),
    ).css
    expect(declared).toContain('filter: brightness(0.67) contrast(0.88) saturate(1.06)')
    // Undeclared, the renderer's own fixed order still applies — which is what
    // the defect produced, and what every pre-REQ-332 document means.
    const undeclared = renderL1Document(docWith({ saturate: 1.06, brightness: 0.67, contrast: 0.88 })).css
    expect(undeclared).toContain('filter: saturate(1.06) brightness(0.67) contrast(0.88)')
  })

  it('test_UAT_FC_REQ-332_a_partial_order_never_silently_drops_paint', () => {
    const doc = {
      widths: [1280],
      root: { kind: 'box', axes: { filter: { saturate: 1.06, brightness: 0.67, order: ['brightness'] } } },
    } as unknown as L1Document
    const css = renderL1Document(doc).css
    expect(css).toContain('filter: brightness(0.67) saturate(1.06)')
  })

  it('test_UAT_FC_REQ-332_a_reordered_chain_is_a_delta_rather_than_invisible', () => {
    // The comparator reduced `filter` to present/absent, so a reordered chain
    // scored `present` on both sides — an `instrument-no-axis` shadow of the
    // same gap, which would have let this residual survive every future round.
    const box = { x: 0, y: 0, width: 400, height: 200 }
    const side = (filter: string): ValueManifest => ({
      source: 't',
      elements: [
        fill(box, '#000000', { filter }),
        run('Scrim caption', { x: 20, y: 20, width: 360, height: 28 }),
      ],
      sections: [],
      viewport: { width: 1280, height: 900 },
    })
    const report = diffManifests(
      side('brightness(0.67) contrast(0.88) saturate(1.06)'),
      side('saturate(1.06) brightness(0.67) contrast(0.88)'),
    )
    const filterDeltas = report.deltas.filter((d) => d.property === 'filter')
    expect(filterDeltas.length).toBeGreaterThan(0)
    expect(filterDeltas[0].expected).toContain('brightness(0.67) contrast(0.88) saturate(1.06)')
    // And an identical chain is still no delta.
    const same = diffManifests(side('brightness(0.67) contrast(0.88)'), side('brightness(0.67) contrast(0.88)'))
    expect(same.deltas.filter((d) => d.property === 'filter')).toEqual([])
  })
})
