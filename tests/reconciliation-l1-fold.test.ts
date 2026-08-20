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
 *           to its captured box (an image/box leaf pins its height too, a text
 *           leaf's is natural); typography axes come from the widest sample
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
 * The fold/render/validator probes run everywhere. AC-694 is split in two: the
 * sidecar's emission/persistence holds on any runner, while the extractor's own
 * dimensions (ancestry, position mode, sibling repetition, parent layout, authored
 * sizing units, @media breakpoints) can only be read out of a live CSS engine and
 * are gated with `it.skipIf` — so a browserless run REPORTS that gap as a skip
 * rather than passing silently.
 */
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { validateL1, type L1Keyframe, type L1Node } from '../packages/site-schema/src/index'
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
  type RawSignals,
  type StateProjection,
  type StructuralHints,
  type ValueElement,
  type Viewport,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// Probed once, at module scope, so the real-engine hint UAT declares itself
// SKIPPED on a browserless runner instead of returning early and reading green —
// the idiom `capture.test.ts` / `bug25-*` / `bug27-*` already use. A silent
// early return is how AC-694's uncovered dimensions stayed invisible for four
// assessment cycles.
const browserOk = await chromiumAvailable()

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
        fields: [],
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

/** A text-free captured element — the shape media and painted panels arrive in. */
function textless(over: Partial<ValueElement> & { box: ValueElement['box'] }): ValueElement {
  return {
    text: '',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  }
}

/** Every leaf kind in the folded tree, in document order. */
function leafKinds(root: L1Node): string[] {
  const out: string[] = []
  const walk = (n: L1Node): void => {
    const children = n.kind === 'box' || n.kind === 'container' ? (n.children ?? []) : []
    if (children.length === 0) out.push(n.kind)
    children.forEach(walk)
  }
  walk(root)
  return out
}

/** Every text leaf in the folded tree, in document order. */
function textLeaves(root: L1Node): Extract<L1Node, { kind: 'text' }>[] {
  const out: Extract<L1Node, { kind: 'text' }>[] = []
  const walk = (n: L1Node): void => {
    if (n.kind === 'text') out.push(n)
    if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
  }
  walk(root)
  return out
}

/** Every leaf of one kind in the folded tree, in document order. */
function leavesOfKind(root: L1Node, kind: L1Node['kind']): L1Node[] {
  const out: L1Node[] = []
  const walk = (n: L1Node): void => {
    const children = n.kind === 'box' || n.kind === 'container' ? (n.children ?? []) : []
    if (children.length === 0 && n.kind === kind) out.push(n)
    children.forEach(walk)
  }
  walk(root)
  return out
}

/** The keyframe ladder of a geometry-bearing leaf. */
function keyframesOf(node: L1Node): L1Keyframe[] {
  const geo = (node as { geometry?: { keyframes: L1Keyframe[] } }).geometry
  if (!geo) throw new Error(`leaf ${node.kind} carries no geometry`)
  return geo.keyframes
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

    // The document is a FULL-LANGUAGE reproduction, not a text-only one: a
    // capture carrying runs, media and painted panels folds to leaves of more
    // than one kind.
    const mixed = foldToL1({
      url: 'http://fixture.test/',
      notes: [],
      projections: LADDER.map((w) =>
        proj(w, [
          elt('Headline', { x: 20, y: 40, width: w - 40, height: 48 }),
          textless({
            a11yRole: 'img',
            objectFit: 'cover',
            intrinsicAspect: 1.5,
            src: 'https://cdn.example.com/hero.jpg',
            alt: 'Hero',
            box: { x: 0, y: 120, width: w, height: 300 },
          }),
          textless({
            role: 'separator',
            a11yRole: 'separator',
            surfaceFill: '#f0eee9',
            borderRadiusPx: 8,
            box: { x: 40, y: 460, width: w - 80, height: 4 },
          }),
        ]),
      ),
    })
    expect(validateL1(mixed).ok).toBe(true)
    const kinds = new Set(leafKinds(mixed.root))
    expect(kinds.size).toBeGreaterThan(1)
    expect(kinds.has('text')).toBe(true)
    expect(kinds.has('image')).toBe(true)

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
    // An image leaf and a painted box leaf, each with a DIFFERENT captured height
    // at each width — so a keyframe that pinned one height everywhere, or dropped
    // height as the text path does, fails rather than coincidentally agreeing.
    const imgBoxes: Record<number, ValueElement['box']> = {
      320: { x: 0, y: 500, width: 320, height: 180 },
      768: { x: 0, y: 520, width: 768, height: 432 },
      1280: { x: 0, y: 540, width: 1280, height: 720 },
    }
    const panelBoxes: Record<number, ValueElement['box']> = {
      320: { x: 20, y: 800, width: 200, height: 80 },
      768: { x: 30, y: 1000, width: 220, height: 100 },
      1280: { x: 40, y: 1200, width: 240, height: 120 },
    }
    const widths = [320, 768, 1280]
    const multiState: MultiStateCapture = {
      url: 'http://fixture.test/',
      notes: [],
      projections: widths.map((w) =>
        proj(w, [
          elt('Headline', boxes[w]!, fontByWidth[w]!),
          // A second run whose type is IDENTICAL at every sampled width.
          elt('Static Tagline', { x: 20, y: 300, width: w - 40, height: 30 }, 20),
          textless({
            a11yRole: 'img',
            objectFit: 'cover',
            intrinsicAspect: 1.5,
            src: 'https://cdn.example.com/hero.jpg',
            alt: 'Hero',
            box: imgBoxes[w]!,
          }),
          textless({
            role: 'separator',
            a11yRole: 'separator',
            surfaceFill: '#f0eee9',
            borderRadiusPx: 8,
            box: panelBoxes[w]!,
          }),
        ]),
      ),
    }

    const doc = foldToL1(multiState)
    const node = textLeaves(doc.root).find((n) => n.text === 'Headline')
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
      // A TEXT leaf's keyframes carry no height — its extent is natural from
      // flow, unlike a box/image/backing-surface leaf, which pins all four.
      for (const kf of kfs) expect(kf.height).toBeUndefined()
      // Typography axes are taken from the widest present sample (1280 → 44px)…
      expect(node.axes?.fontSizePx).toBe(44)
      // …and because the measured size VARIES across the ladder, that base
      // scalar is layered with its own per-width track carrying the captured
      // value at each width. Without this, a regression that dropped the track
      // entirely would still satisfy the widest-sample assertion above.
      const track = node.responsive?.fontSizePx
      expect(track).toBeDefined()
      expect(track!.keyframes.map((k) => k.at)).toEqual(widths)
      expect(track!.keyframes.map((k) => k.value)).toEqual(widths.map((w) => fontByWidth[w]!))
    }

    // An axis holding ONE value at every sampled width stays a plain scalar with
    // no track — the track is emitted on measured variance, not by default.
    const tagline = textLeaves(doc.root).find((n) => n.text === 'Static Tagline')
    expect(tagline?.kind).toBe('text')
    if (tagline?.kind === 'text') {
      expect(tagline.axes?.fontSizePx).toBe(20)
      expect(tagline.responsive?.fontSizePx).toBeUndefined()
    }

    // The positive half of the height rule. A text leaf's extent is natural from
    // flow (asserted undefined above); an IMAGE or BOX leaf has no such source,
    // so every one of its keyframes pins all four sides — the captured height
    // included, at each width it was measured.
    const measured: Array<[L1Node['kind'], Record<number, ValueElement['box']>]> = [
      ['image', imgBoxes],
      ['box', panelBoxes],
    ]
    for (const [kind, expected] of measured) {
      const found = leavesOfKind(doc.root, kind)
      expect(found).toHaveLength(1)
      const kfs = keyframesOf(found[0])
      expect(kfs.map((k) => k.at)).toEqual(widths)
      for (const w of widths) {
        const kf = kfs.find((k) => k.at === w)!
        const box = expected[w]!
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

  it('test_UAT_AC694_capture_writes_the_advisory_hint_sidecar_into_the_bundle', async () => {
    // The sidecar half that holds without a browser: the capture pass ALWAYS
    // emits `hints.json` alongside the fold, and it round-trips through
    // `readHints`. The *content* of the sidecar is the extractor's, and is
    // asserted against a real engine in the sibling UAT below — a driver seam
    // cannot prove an extractor that only runs in page scope.
    const cwd = mkdtempSync(path.join(tmpdir(), 'ac694-'))
    tmpDirs.push(cwd)
    const result = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })
    expect(existsSync(path.join(result.bundleDir, 'hints.json'))).toBe(true)
    // Persisted losslessly: what the page returned is what the bundle holds, so
    // a later reader sees every dimension the extractor reported.
    expect(readHints(result.bundleDir)).toEqual(CANNED_HINTS)
    // Retained as its OWN sidecar, not merged into the folded document — the
    // hints are advisory and nothing in the render path consumes them (AC-695).
    expect(readL1(result.bundleDir)).not.toHaveProperty('hints')
  })

  it.skipIf(!browserOk)(
    'test_UAT_AC694_structural_hints_report_ancestry_layout_units_and_breakpoints',
    async () => {
      // Every dimension the Criterion names, read out of a REAL engine — the
      // sidecar's whole reason to exist is the relationships the painted-geometry
      // fold deliberately omits, and only a live CSS engine resolves them.
      //
      // The fixture is built so each dimension has a discriminator: a flex row
      // (gap overridden by a real @media rule, so a reported gap proves the
      // COMPUTED value not the base rule), two identical columns (repetition), a
      // positioned child (position mode), and a sibling grid (template columns,
      // and a parent whose non-flex layout must null the flex-only axes).
      const html = `<!doctype html><html><head><style>
      .row { display: flex; flex-direction: row; justify-content: space-between; gap: 24px; position: relative; }
      .col { width: 50%; height: 200px; background: #eee; }
      .pinned { position: absolute; top: 10px; left: 10px; width: 80px; height: 40px; background: #ccc; }
      .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
      .cell { height: 100px; background: #ddd; }
      @media (min-width: 600px) { .row { gap: 40px; } }
      @media (max-width: 1200px) { .grid { gap: 20px; } }
    </style></head><body>
      <section class="row"><div class="col">A</div><div class="col">B</div><div class="pinned">P</div></section>
      <section class="grid"><div class="cell">C</div><div class="cell">D</div></section>
    </body></html>`
      const server = createServer((_req, res) => {
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.end(html)
      })
      servers.push(server)
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`

      // Default viewport is 1280 wide, so `min-width: 600px` applies and
      // `max-width: 1200px` does not — the gaps below are the discriminator.
      const real = await captureStructuralHints(url)

      // ── the page's real @media breakpoints, ascending ──────────────────────
      expect(real.mediaBreakpoints).toContain(600)
      expect(real.mediaBreakpoints).toContain(1200)
      expect(real.mediaBreakpoints).toEqual([...real.mediaBreakpoints].sort((a, b) => a - b))

      // ── authored sizing unit per axis (the token, not the resolved px) ─────
      // `width: 50%` survives as `percent` even though the engine resolves it to
      // px; `width: 80px` / `height: 100px` stay `px`. Both halves, so the unit
      // is read from the matched rule rather than reported as a constant.
      const cols = real.nodes.filter((n) => n.tag === 'div' && n.widthUnit === 'percent')
      expect(cols).toHaveLength(2)
      const pinned = real.nodes.find((n) => n.position === 'absolute')
      expect(pinned).toBeDefined()
      expect(pinned!.widthUnit).toBe('px')
      const cells = real.nodes.filter((n) => n.tag === 'div' && n.heightUnit === 'px' && n.widthUnit === null)
      expect(cells).toHaveLength(2)

      // ── position mode ─────────────────────────────────────────────────────
      // Three distinct modes on one page: the row is `relative`, its pinned
      // child `absolute`, and the ordinary columns `static`.
      const row = real.nodes.find((n) => n.tag === 'section' && n.display.includes('flex'))
      expect(row).toBeDefined()
      expect(row!.position).toBe('relative')
      for (const col of cols) expect(col.position).toBe('static')

      // ── ancestry: parentId chains the columns up to the section, then body ──
      const byId = new Map(real.nodes.map((n) => [n.id, n]))
      for (const col of cols) expect(col.parentId).toBe(row!.id)
      const bodyNode = byId.get(row!.parentId!)
      expect(bodyNode?.tag).toBe('body')
      expect(bodyNode?.parentId).toBeNull() // the walk's root — the chain terminates

      // ── sibling-repetition count ──────────────────────────────────────────
      // Two columns share a tag+class signature → 2 each; the positioned child
      // sits beside them with a different signature → 1. Reporting the parent's
      // child count instead would say 3 for all three.
      for (const col of cols) expect(col.repeatCount).toBe(2)
      expect(pinned!.repeatCount).toBe(1)
      for (const cell of cells) expect(cell.repeatCount).toBe(2)

      // ── the parent's computed layout ──────────────────────────────────────
      // Flex: mode, direction, distribution, and the gap the @media rule won.
      const colLayout = cols[0].parentLayout!
      expect(colLayout.display).toContain('flex')
      expect(colLayout.flexDirection).toBe('row')
      expect(colLayout.justifyContent).toBe('space-between')
      expect(colLayout.gap).toBe('40px') // the computed value, not the 24px base
      expect(colLayout.gridTemplateColumns).toBeNull() // flex-only axes, nulled

      // Grid: template columns resolved to real tracks in the authored 1fr:2fr
      // ratio, and the gap the un-matched max-width rule did NOT change.
      const cellLayout = cells[0].parentLayout!
      expect(cellLayout.display).toContain('grid')
      expect(cellLayout.gap).toBe('16px')
      expect(cellLayout.flexDirection).toBeNull() // grid parent — no flex direction
      const tracks = cellLayout.gridTemplateColumns!.split(/\s+/).map(parseFloat)
      expect(tracks).toHaveLength(2)
      expect(tracks[1] / tracks[0]).toBeCloseTo(2, 1)

      // A node whose parent is NOT a flex/grid container reports the parent's
      // display with every distribution axis null — the axes are conditional on
      // the container mode, not always-present.
      expect(row!.parentLayout!.display).toBe('block')
      expect(row!.parentLayout!.justifyContent).toBeNull()
      expect(row!.parentLayout!.gap).toBeNull()
    },
    180000,
  )

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
