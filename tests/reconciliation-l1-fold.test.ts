/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document with advisory structural hints" (REQ-83 / REQ-79 B2).
 *
 * One UAT per acceptance criterion, proven against the existing capture → fold
 * pipeline (`cmdCapturePage` / `foldToL1` / `captureStructuralHints`) and the L1
 * renderer:
 *
 *   AC-689  capture emits one validated L1 doc spanning the sampled ladder; an
 *           empty ladder folds to an explicit error, never an empty document
 *   AC-690  the raw multi-viewport ladder is retained as the acceptance oracle,
 *           over the same widths the folded document declares
 *   AC-691  each folded node carries a geometry keyframe per sampled width equal
 *           to its captured box; typography axes come from the widest sample
 *   AC-692  fluid-width transitions fold to `interpolate`; reflows fold to `snap`
 *   AC-693  a node present only across a subrange carries a bounded visibility
 *           rule; a node present at every width carries none
 *   AC-694  capture emits an advisory structural-hint sidecar (parent layout,
 *           authored sizing unit, @media breakpoints in ascending order)
 *   AC-695  the folded L1 document renders as a complete reproduction on its own,
 *           with nothing in the render path consuming the hint sidecar
 *   AC-696  the pre-L1 `adopt-values` reproduction command is removed; the
 *           independent `adopt-gaps` sibling is unaffected
 *
 * The fold/render/validator probes run everywhere; the real-browser branch of the
 * hint probe (AC-694) skips cleanly on a runner without Chromium installed.
 */
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { validateL1, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import * as cli from '../tools/generate/src/cli/index'
import {
  captureStructuralHints,
  chromiumAvailable,
  cmdCapturePage,
  HINTS_SCRIPT,
  readHints,
  readL1,
  readMultiState,
  type BrowserDriver,
  type CapturedResponse,
  type MultiStateCapture,
  type RawRun,
  type RawField,
  type RawSignals,
  type StateProjection,
  type StructuralHints,
  type ValueElement,
  type Viewport,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// A complete RawRun with sensible defaults — the fold needs `box`, the rest are
// the required geometry/typography fields the extractor always emits.
function run(overrides: Partial<RawRun> & Pick<RawRun, 'text' | 'box'>): RawRun {
  return {
    role: 'heading',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 700,
    fontStyle: null,
    textDecoration: null,
    textTransform: null,
    fontVariant: null,
    listMarker: null,
    lineHeightPx: 48,
    letterSpacingPx: 0,
    gradientCss: null,
    borderLeftWidthPx: 0,
    borderLeftColor: null,
    paddingLeftPx: 0,
    paddingTopPx: 0,
    paddingRightPx: 0,
    paddingBottomPx: 0,
    textAlign: 'left',
    borderRadiusPx: 0,
    boxShadow: null,
    backdropFilter: null,
    blendMode: null,
    opacity: 1,
    outline: null,
    pseudo: null,
    a11yRole: 'heading',
    arrangement: null,
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...overrides,
  }
}

/** Every leaf kind in a folded document, depth-first (containers/boxes with
 *  children are structure, not leaves). */
function leafKinds(node: L1Node): string[] {
  const kids = 'children' in node ? (node.children ?? []) : []
  if (kids.length === 0) return [node.kind]
  return kids.flatMap(leafKinds)
}

/** A captured text-free element, in the raw shape the extractor emits. */
function rawField(over: Partial<RawField> & Pick<RawField, 'accessibleName' | 'box'>): RawField {
  return {
    a11yRole: 'generic',
    nameSource: null,
    borderRadiusPx: 0,
    boxShadow: null,
    backdropFilter: null,
    blendMode: null,
    opacity: 1,
    outline: null,
    pseudo: null,
    arrangement: null,
    zIndex: 0,
    filter: null,
    textShadow: null,
    maskEdge: null,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    ...over,
  }
}

function signalsFor(width: number): RawSignals {
  return {
    viewport: { width, height: 900 },
    bands: [
      {
        box: { x: 0, y: 0, width, height: 400 },
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: 'Inter',
        textAlign: 'left',
        paddingTopPx: 40,
        paddingBottomPx: 40,
        overlay: null,
        contentAnchorRatio: 0.5,
        content: [
          // A fluid heading: left edge fixed, width tracks the viewport.
          run({ text: 'Fluid Headline', box: { x: 20, y: 120, width: width - 40, height: 60 } }),
        ],
        items: [],
        // AC-689 — the page carries media and a painted panel alongside its runs,
        // so the folded document can hold more than one leaf kind. Without these
        // the "full L1 language" clause is unexercisable by this fixture: a
        // text-only capture can only ever fold to text leaves.
        fields: [
          rawField({
            accessibleName: 'Storefront',
            box: { x: 0, y: 220, width, height: Math.round(width / 1.5) },
            a11yRole: 'img',
            objectFit: 'cover',
            intrinsicAspect: 1.5,
            src: '/img/storefront.jpg',
            alt: 'Storefront',
          }),
          rawField({
            accessibleName: '',
            box: { x: 24, y: 700, width: 240, height: 120 },
            a11yRole: 'generic',
            surfaceFill: '#e5e7eb',
            borderRadiusPx: 8,
          }),
        ],
      },
    ],
    colorUsage: [{ hex: '#111827', usage: 'text', freq: 1 }],
    fontFaces: [],
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: null,
    images: [],
  }
}

/**
 * A flex `<section>` with two repeated percentage-sized children — the shape that
 * exercises every one of AC-694's six sidecar dimensions on the always-run path:
 * ancestry (`parentId`), the parent's computed layout, authored sizing unit per
 * axis, position mode, sibling-repetition count, and ascending `@media`
 * breakpoints. A single parentless node could only ever evidence two of them.
 */
const CANNED_HINTS: StructuralHints = {
  viewport: { width: 1280, height: 900 },
  mediaBreakpoints: [640, 1024],
  nodes: [
    {
      id: 0,
      parentId: null,
      tag: 'section',
      a11yRole: 'generic',
      position: 'relative',
      display: 'flex',
      parentLayout: null,
      widthUnit: 'percent',
      heightUnit: null,
      repeatCount: 1,
      box: { x: 0, y: 0, width: 1280, height: 400 },
    },
    {
      id: 1,
      parentId: 0,
      tag: 'div',
      a11yRole: 'generic',
      position: 'static',
      display: 'block',
      parentLayout: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: '24px',
        gridTemplateColumns: null,
      },
      widthUnit: 'percent',
      heightUnit: 'px',
      repeatCount: 2,
      box: { x: 0, y: 0, width: 620, height: 400 },
    },
    {
      id: 2,
      parentId: 0,
      tag: 'div',
      a11yRole: 'generic',
      position: 'absolute',
      display: 'block',
      parentLayout: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: '24px',
        gridTemplateColumns: null,
      },
      widthUnit: 'percent',
      heightUnit: 'px',
      repeatCount: 2,
      box: { x: 660, y: 0, width: 620, height: 400 },
    },
  ],
}

/** A fake CF-shaped driver: width-varying value signals, canned structural hints. */
class FakeDriver implements BrowserDriver {
  private width = 1280
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.width = viewport.width
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  }
  async query<T>(script: string): Promise<T> {
    if (script === HINTS_SCRIPT) return CANNED_HINTS as T
    return signalsFor(this.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>Fluid Headline</body></html>'
  }
  async close(): Promise<void> {}
}

/** A folded-value leaf at a given width — text nodes fold; text keys the alignment. */
function elt(text: string, box: ValueElement['box'], fontSizePx = 18): ValueElement {
  return { text, role: 'body', color: '#111111', fontFamily: 'Arial', fontSizePx, fontWeight: 400, box }
}

/** A text-free media element — folds to an L1 `image` leaf (AC-689's second kind). */
function mediaElt(box: ValueElement['box'], src = '/img/storefront.jpg'): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '#111111',
    fontFamily: 'Arial',
    fontSizePx: 16,
    fontWeight: 400,
    box,
    textless: true,
    a11yRole: 'img',
    objectFit: 'cover',
    intrinsicAspect: 1.5,
    src,
    alt: 'Storefront',
  }
}

/** A text-free painted panel — folds to an L1 `box` leaf (AC-689's third kind). */
function panelElt(box: ValueElement['box']): ValueElement {
  return {
    text: '',
    role: 'generic',
    color: '#111111',
    fontFamily: 'Arial',
    fontSizePx: 16,
    fontWeight: 400,
    box,
    textless: true,
    a11yRole: 'generic',
    surfaceFill: '#e5e7eb',
    borderRadiusPx: 8,
  }
}

/** A resting projection at one width — the shape `foldToL1` consumes. */
function proj(width: number, elements: ValueElement[]): StateProjection {
  return {
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements, sections: [], viewport: { width, height: 800 } },
  }
}

describe('Reconciliation — story-8acc338d capture → L1 fold + advisory hints', () => {
  const tmpDirs: string[] = []
  const servers: Server[] = []
  afterAll(() => {
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
    for (const s of servers) s.close()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('test_UAT_AC689_capture_emits_one_validated_l1_document', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac689-'))
    tmpDirs.push(cwd)

    const result = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })

    // One L1 reproduction document is written to the bundle, is VALID against the
    // L1 envelope, declares the sampled ladder, and its root is a container.
    const l1Path = path.join(result.bundleDir, 'l1.json')
    expect(existsSync(l1Path)).toBe(true)
    const l1 = readL1(result.bundleDir)
    expect(l1).not.toBeNull()
    expect(validateL1(l1!).ok).toBe(true)
    expect(l1!.widths).toEqual(LADDER)
    expect(l1!.root.kind).toBe('box')

    // The document is emitted in the FULL L1 language, not text alone: this
    // capture carries runs, media AND a painted panel, so the folded document
    // holds leaves of more than one kind. Asserted on the `l1.json` read back
    // from the bundle — the `cmdCapturePage` path, not a direct `foldToL1` call.
    const kinds = new Set(leafKinds(l1!.root))
    expect(kinds.size).toBeGreaterThan(1)
    expect(kinds).toContain('text')
    expect(kinds).toContain('image')
    expect(kinds).toContain('box')

    // If no resting sample can be folded, the fold fails explicitly rather than
    // emitting an empty/invalid document.
    const emptyLadder: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections: [] }
    expect(() => foldToL1(emptyLadder)).toThrow(/empty ladder|no resting projections/i)
  })

  it('test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac690-'))
    tmpDirs.push(cwd)

    const result = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })

    // The raw multi-viewport sample ladder is retained in the bundle alongside
    // the folded document — the fold augments, it does not replace the oracle.
    expect(existsSync(path.join(result.bundleDir, 'multistate.json'))).toBe(true)
    const oracle = readMultiState(result.bundleDir)
    expect(oracle).not.toBeNull()

    // The oracle's sampled widths match the folded document's declared widths.
    const oracleWidths = [...new Set(oracle!.projections.map((p) => p.viewport.width))].sort((a, b) => a - b)
    const l1 = readL1(result.bundleDir)!
    expect(oracleWidths).toEqual(LADDER)
    expect(oracleWidths).toEqual(l1.widths)
  })

  it('test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box', () => {
    // One node captured at three widths with a distinct box and font size per width.
    const boxes: Record<number, ValueElement['box']> = {
      320: { x: 20, y: 100, width: 280, height: 40 },
      768: { x: 40, y: 120, width: 688, height: 48 },
      1280: { x: 60, y: 140, width: 1160, height: 56 },
    }
    const fontByWidth: Record<number, number> = { 320: 24, 768: 32, 1280: 44 }
    // A SECOND run whose typography is identical at every sampled width — the
    // constant-axis case AC-691 owns. (The varying run above is AC-1625's
    // per-width track, proven in its own UAT; here it is only the geometry
    // carrier.)
    const taglineBoxes: Record<number, ValueElement['box']> = {
      320: { x: 20, y: 200, width: 280, height: 24 },
      768: { x: 40, y: 220, width: 688, height: 24 },
      1280: { x: 60, y: 240, width: 1160, height: 24 },
    }
    // A media element and a painted panel — the two leaf kinds whose keyframes
    // pin a height, against the text leaf's, which must not.
    const mediaBoxes: Record<number, ValueElement['box']> = {
      320: { x: 0, y: 300, width: 320, height: 213 },
      768: { x: 0, y: 320, width: 768, height: 512 },
      1280: { x: 0, y: 340, width: 1280, height: 853 },
    }
    const panelBoxes: Record<number, ValueElement['box']> = {
      320: { x: 24, y: 560, width: 272, height: 120 },
      768: { x: 48, y: 880, width: 300, height: 140 },
      1280: { x: 80, y: 1220, width: 360, height: 160 },
    }
    const widths = [320, 768, 1280]
    const multiState: MultiStateCapture = {
      url: 'http://fixture.test/',
      notes: [],
      projections: widths.map((w) =>
        proj(w, [
          elt('Headline', boxes[w]!, fontByWidth[w]!),
          elt('Standing Tagline', taglineBoxes[w]!, 18),
          mediaElt(mediaBoxes[w]!),
          panelElt(panelBoxes[w]!),
        ]),
      ),
    }

    const doc = foldToL1(multiState)
    const leaves = doc.root.kind === 'box' ? doc.root.children ?? [] : []
    const node = leaves.find((n) => n.kind === 'text' && n.text === 'Headline')
    expect(node?.kind).toBe('text')
    if (node?.kind === 'text') {
      const kfs = node.geometry!.keyframes
      // A keyframe at every sampled width, in ascending order.
      expect(kfs.map((k) => k.at)).toEqual(widths)
      // Each keyframe's position and width equal the captured box at that width.
      for (const w of widths) {
        const kf = kfs.find((k) => k.at === w)!
        const box = boxes[w]!
        expect(kf.x).toBe(Math.round(box.x))
        expect(kf.y).toBe(Math.round(box.y))
        expect(kf.width).toBe(Math.round(box.width))
      }
      // A TEXT leaf's keyframes carry NO height: its extent is natural, from
      // flow. Pinning it would freeze the run at the reference's line count, and
      // the content-robustness probe (AC-707) — which grows text and expects the
      // flow to absorb it — would be measuring a ceiling instead of a reflow.
      expect(kfs.every((k) => k.height === undefined)).toBe(true)
      for (const kf of kfs) expect(kf).not.toHaveProperty('height')
    }

    // ── The constant-typography run: axes from the widest sample, no track ─────
    const tagline = leaves.find((n) => n.kind === 'text' && n.text === 'Standing Tagline')
    expect(tagline?.kind).toBe('text')
    if (tagline?.kind === 'text') {
      // An axis identical at every sampled width is taken from the node's widest
      // present sample and stays a plain scalar…
      expect(tagline.axes.fontSizePx).toBe(18)
      // …with NO responsive track emitted for it. (The varying `Headline` above
      // is what a track is for; that is AC-1625's UAT, not this one.)
      expect(tagline.responsive?.fontSizePx).toBeUndefined()
      // Its geometry still carries a keyframe per sampled width, height-free.
      expect(tagline.geometry!.keyframes.map((k) => k.at)).toEqual(widths)
      expect(tagline.geometry!.keyframes.every((k) => k.height === undefined)).toBe(true)
    }

    // ── A box, image or backing-surface leaf additionally PINS its height ──────
    const image = leaves.find((n) => n.kind === 'image')
    expect(image?.kind).toBe('image')
    if (image?.kind === 'image') {
      const kfs = image.geometry!.keyframes
      expect(kfs.map((k) => k.at)).toEqual(widths)
      for (const w of widths) {
        const kf = kfs.find((k) => k.at === w)!
        const box = mediaBoxes[w]!
        expect(kf.x).toBe(Math.round(box.x))
        expect(kf.y).toBe(Math.round(box.y))
        expect(kf.width).toBe(Math.round(box.width))
        expect(kf.height).toBe(Math.round(box.height))
      }
    }

    const panel = leaves.find(
      (n) => n.kind === 'box' && n.geometry?.keyframes[0]?.y === Math.round(panelBoxes[320]!.y),
    )
    expect(panel?.kind).toBe('box')
    if (panel?.kind === 'box') {
      const kfs = panel.geometry!.keyframes
      expect(kfs.map((k) => k.at)).toEqual(widths)
      for (const w of widths) {
        const kf = kfs.find((k) => k.at === w)!
        const box = panelBoxes[w]!
        expect(kf.x).toBe(Math.round(box.x))
        expect(kf.y).toBe(Math.round(box.y))
        expect(kf.width).toBe(Math.round(box.width))
        expect(kf.height).toBe(Math.round(box.height))
      }
    }
  })

  it('test_UAT_AC692_fluid_folds_interpolate_reflow_folds_snap', () => {
    // One node whose width tracks the viewport (fluid), one that jumps to a
    // right-hand column at desktop (a reflow).
    const multiState: MultiStateCapture = {
      url: 'http://fixture.test/',
      notes: [],
      projections: [
        proj(320, [
          elt('Fluid Headline', { x: 20, y: 100, width: 280, height: 40 }),
          elt('Reflow Block', { x: 20, y: 400, width: 280, height: 200 }),
        ]),
        proj(1280, [
          elt('Fluid Headline', { x: 20, y: 100, width: 1240, height: 40 }),
          elt('Reflow Block', { x: 720, y: 200, width: 500, height: 300 }),
        ]),
      ],
    }

    const doc = foldToL1(multiState)
    const leaves = doc.root.kind === 'box' ? doc.root.children ?? [] : []
    const fluid = leaves.find((n) => n.kind === 'text' && n.text === 'Fluid Headline')
    const reflow = leaves.find((n) => n.kind === 'text' && n.text === 'Reflow Block')

    expect(fluid?.kind === 'text' && fluid.geometry?.segments).toEqual(['interpolate'])
    expect(reflow?.kind === 'text' && reflow.geometry?.segments).toEqual(['snap'])
  })

  it('test_UAT_AC693_subrange_node_carries_bounded_visibility_rule', () => {
    // "Everywhere" is present at all six widths; "Wide Only" only from 1024 up.
    const projections = LADDER.map((w) => {
      const els = [elt('Everywhere', { x: 0, y: 0, width: w, height: 40 })]
      if (w >= 1024) els.push(elt('Wide Only', { x: 0, y: 200, width: w, height: 40 }))
      return proj(w, els)
    })

    const doc = foldToL1({ url: 'http://fixture.test/', notes: [], projections })
    const leaves = doc.root.kind === 'box' ? doc.root.children ?? [] : []
    const wide = leaves.find((n) => n.kind === 'text' && n.text === 'Wide Only')
    const every = leaves.find((n) => n.kind === 'text' && n.text === 'Everywhere')

    // Absent below its first present width → a lower-bound visibility rule.
    expect(wide?.kind).toBe('text')
    if (wide?.kind === 'text') {
      expect(wide.visibility).toBeDefined()
      expect(wide.visibility?.fromPx).toBe(1024)
    }
    // Present at every sampled width → no visibility rule.
    expect(every?.kind).toBe('text')
    if (every?.kind === 'text') {
      expect(every.visibility).toBeUndefined()
    }
  })

  it('test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar', async () => {
    // The capture always emits an advisory sidecar: breakpoints in ascending
    // order and per-node authored sizing units.
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac694-'))
    tmpDirs.push(cwd)
    const result = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })
    expect(existsSync(path.join(result.bundleDir, 'hints.json'))).toBe(true)
    const hints = readHints(result.bundleDir)
    expect(hints).not.toBeNull()
    expect(hints!.mediaBreakpoints).toEqual([...hints!.mediaBreakpoints].sort((a, b) => a - b))

    // ── The sidecar's CONTRACT: all six dimensions, on the always-run path ─────
    // Each dimension is asserted here — where every runner reaches it — so the
    // sidecar's shape is proven without a browser. What the engine-gated branch
    // below adds is extraction ACCURACY against real computed styles, not the
    // contract itself.
    expect(hints!.nodes.length).toBeGreaterThan(1)
    // (1) ancestry: a root carries `parentId: null`, a child names its parent,
    //     and every named parent is a node in the same sidecar.
    const ids = new Set(hints!.nodes.map((n) => n.id))
    const roots = hints!.nodes.filter((n) => n.parentId === null)
    const children = hints!.nodes.filter((n) => n.parentId !== null)
    expect(roots.length).toBeGreaterThan(0)
    expect(children.length).toBeGreaterThan(0)
    for (const n of children) expect(ids.has(n.parentId!)).toBe(true)
    // (2) the parent's computed layout, reported for a child of a flex parent…
    const flexChildHint = hints!.nodes.find((n) => n.parentLayout?.display.includes('flex'))
    expect(flexChildHint, 'a node reporting its parent computed layout').toBeDefined()
    expect(flexChildHint!.parentLayout!.justifyContent).toBe('space-between')
    //     …and null exactly where there is no element parent.
    for (const n of roots) expect(n.parentLayout).toBeNull()
    // (3) authored sizing unit, PER AXIS — both are carried, independently.
    expect(hints!.nodes.some((n) => n.widthUnit === 'percent')).toBe(true)
    expect(hints!.nodes.some((n) => n.heightUnit === 'px')).toBe(true)
    // (4) position mode, per node.
    expect(new Set(hints!.nodes.map((n) => n.position))).toEqual(
      new Set(['relative', 'static', 'absolute']),
    )
    // (5) sibling-repetition count — always present and at least 1, and >1 where
    //     siblings really do share a tag+class signature.
    for (const n of hints!.nodes) expect(n.repeatCount).toBeGreaterThanOrEqual(1)
    expect(hints!.nodes.some((n) => n.repeatCount > 1)).toBe(true)
    // (6) ascending @media breakpoints — asserted above, and non-empty here so
    //     the sort check is not vacuously true on an empty list.
    expect(hints!.mediaBreakpoints.length).toBeGreaterThan(0)

    // With a real engine, the same pass reports the parent's computed layout
    // (flex + justify-content) and a percentage-sized child against a real @media
    // breakpoint. Skip cleanly where Chromium is unavailable — this branch proves
    // extraction ACCURACY; the contract above already ran.
    if (!(await chromiumAvailable())) return
    const html = `<!doctype html><html><head><style>
      .row { display: flex; justify-content: space-between; gap: 24px; }
      .col { width: 50%; height: 200px; background: #eee; }
      @media (min-width: 600px) { .row { gap: 40px; } }
    </style></head><body>
      <section class="row"><div class="col">A</div><div class="col">B</div></section>
    </body></html>`
    const server = createServer((_req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    })
    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`

    const real = await captureStructuralHints(url)
    // Real @media breakpoint reported, in ascending order.
    expect(real.mediaBreakpoints).toContain(600)
    expect(real.mediaBreakpoints).toEqual([...real.mediaBreakpoints].sort((a, b) => a - b))
    // Parent computed layout (flex + justify-content) reported for the columns.
    const flexChild = real.nodes.find((n) => n.parentLayout?.display.includes('flex'))
    expect(flexChild).toBeDefined()
    expect(flexChild?.parentLayout?.justifyContent).toBe('space-between')
    // Authored sizing unit (%) reported for a column.
    expect(real.nodes.some((n) => n.widthUnit === 'percent')).toBe(true)
  })

  it('test_UAT_AC695_folded_document_renders_without_hint_sidecar', () => {
    const multiState: MultiStateCapture = {
      url: 'http://fixture.test/',
      notes: [],
      projections: [
        proj(320, [elt('Fluid Headline', { x: 20, y: 100, width: 280, height: 40 })]),
        proj(1280, [elt('Fluid Headline', { x: 20, y: 100, width: 1240, height: 40 })]),
      ],
    }
    const doc = foldToL1(multiState)
    expect(validateL1(doc).ok).toBe(true)

    // The renderer consumes ONLY the folded document — there is no hint sidecar
    // in scope, and the render path never references one. The folded doc alone
    // is a complete, valid reproduction.
    const { html, css } = renderL1Document(doc)
    expect(html).toContain('Fluid Headline')
    expect(html).toContain('<p')
    expect(css.length).toBeGreaterThan(0)
  })

  it('test_UAT_AC696_adopt_values_command_removed', async () => {
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {})

    // (a) `adopt-values` is no longer a valid CLI command — dispatch falls through
    //     to the unknown-command default (exit 1, "Unknown command").
    process.exitCode = 0
    await cli.run(['adopt-values', 'somesite', '--ref', '/tmp/whatever'])
    expect(process.exitCode).toBe(1)
    const msg = stderr.mock.calls.map((c) => String(c[0])).join('\n')
    expect(msg).toContain('Unknown command: adopt-values')

    // (b) no `adopt-values` reproduction symbol survives on the CLI surface.
    const surface = cli as Record<string, unknown>
    for (const sym of ['cmdAdoptValues', 'adoptFlatValues', 'AdoptValuesOptions', 'AdoptChange']) {
      expect(surface[sym], `${sym} should no longer be exported`).toBeUndefined()
    }

    // (c) the independent `adopt-gaps` feature is unaffected: still a RECOGNIZED
    //     command (its own required-flag error, not "Unknown command"), and its
    //     handler symbol remains exported.
    stderr.mockClear()
    process.exitCode = 0
    await cli.run(['adopt-gaps', 'somesite'])
    const gapMsg = stderr.mock.calls.map((c) => String(c[0])).join('\n')
    expect(gapMsg).toContain('adopt-gaps requires --ref')
    expect(gapMsg).not.toContain('Unknown command')
    expect(typeof surface.cmdApplyGapFixes).toBe('function')
  })
})
