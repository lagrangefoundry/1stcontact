/**
 * REQ-83 — capture → L1 fold (keyframes + oracle) + structural-hint extractor.
 *
 * The three acceptance probes from the ticket:
 *   - capture_emits_l1  capturing a fixture site (via the CF-shaped fake driver)
 *                       produces a valid L1 doc, retains the 6-sample ladder as the
 *                       oracle (`multistate.json`), and writes the hint sidecar.
 *   - keyframes         a fluid node folds to `interpolate`; a reflow folds to `snap`.
 *   - hints             the hint pass reports parent layout mode + sizing unit +
 *                       real `@media` breakpoints for a fixture (real Chromium; skips
 *                       cleanly where the engine is unavailable).
 *   - adopt_values_gone the pre-L1 `adopt-values` reproduction command (REQ-66) is
 *                       dissolved: it is neither a valid CLI command nor an exported
 *                       symbol (the old manifest→site value-adoption path is gone).
 */
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
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

describe('REQ-83 — capture to L1 fold + structural hints', () => {
  const tmpDirs: string[] = []
  const servers: Server[] = []
  afterAll(() => {
    for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
    for (const s of servers) s.close()
  })

  it('test_UAT_FC_REQ-83_capture_emits_l1', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'req83-'))
    tmpDirs.push(cwd)

    const result = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new FakeDriver(),
      isEngineAvailable: async () => true,
    })

    // The fold is written and is a VALID L1 document.
    const l1Path = path.join(result.bundleDir, 'l1.json')
    expect(existsSync(l1Path)).toBe(true)
    const l1 = readL1(result.bundleDir)!
    expect(validateL1(l1).ok).toBe(true)

    // Its ladder is the 6 sampled widths, and the folded text node carries a
    // keyframe at every width (the whole ladder folded into one document).
    expect(l1.widths).toEqual(LADDER)
    expect(l1.root.kind).toBe('box')
    const leaves = l1.root.kind === 'box' ? l1.root.children ?? [] : []
    const headline = leaves.find((n) => n.kind === 'text' && n.text === 'Fluid Headline')
    expect(headline).toBeDefined()
    if (headline?.kind === 'text') {
      expect(headline.geometry?.keyframes.map((k) => k.at)).toEqual(LADDER)
    }

    // The raw 6-sample ladder is RETAINED as the acceptance oracle.
    const oracle = readMultiState(result.bundleDir)
    expect(oracle).not.toBeNull()
    expect(new Set(oracle!.projections.map((p) => p.viewport.width))).toEqual(new Set(LADDER))

    // The advisory structural-hint sidecar is written.
    expect(existsSync(path.join(result.bundleDir, 'hints.json'))).toBe(true)
    const hints = readHints(result.bundleDir)!
    expect(hints.mediaBreakpoints).toEqual([640, 1024])
    expect(hints.nodes.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-83_keyframes', () => {
    // Two nodes across two sampled widths: one whose width tracks the viewport
    // (fluid), one that jumps to a right-hand column at desktop (reflow).
    const elt = (text: string, box: ValueElement['box']): ValueElement => ({
      text,
      role: 'body',
      color: '#111111',
      fontFamily: 'Arial',
      fontSizePx: 18,
      fontWeight: 400,
      box,
    })
    const proj = (width: number, elements: ValueElement[]): StateProjection => ({
      engine: 'chromium',
      viewport: { width, height: 800 },
      state: 'rest',
      manifest: { source: `t:${width}`, elements, sections: [], viewport: { width, height: 800 } },
    })
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

    // Fluid width across widths → interpolate; a column reflow → snap.
    expect(fluid?.kind === 'text' && fluid.geometry?.segments).toEqual(['interpolate'])
    expect(reflow?.kind === 'text' && reflow.geometry?.segments).toEqual(['snap'])
  })

  it('test_UAT_FC_REQ-83_hints', async () => {
    if (!(await chromiumAvailable())) return // skip cleanly without the engine

    // A fixture with a flex container, a %-width child, and a real @media rule.
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

    const hints = await captureStructuralHints(url)

    // Real @media breakpoint reported.
    expect(hints.mediaBreakpoints).toContain(600)
    // Parent layout mode (flex) reported for the columns.
    const flexChild = hints.nodes.find((n) => n.parentLayout?.display.includes('flex'))
    expect(flexChild).toBeDefined()
    expect(flexChild?.parentLayout?.justifyContent).toBe('space-between')
    // Authored sizing unit (%) reported for a column.
    expect(hints.nodes.some((n) => n.widthUnit === 'percent')).toBe(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('test_UAT_FC_REQ-83_adopt_values_command_removed', async () => {
    // GAP 2: `adopt-values` (REQ-66) was a vestige of the pre-L1 reproduction path
    // (capture bundle → snap flat Type-A axes into a draft's old-model styled
    // objects), superseded by the fully-L1 fold (REQ-86). Its removal is total:
    //
    //  (a) it is no longer a valid CLI command — dispatch falls through to the
    //      unknown-command default (exit 1, "Unknown command"), never a handler;
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {})
    await cli.run(['adopt-values', 'somesite', '--ref', '/tmp/whatever'])
    expect(process.exitCode).toBe(1)
    const msg = stderr.mock.calls.map((c) => String(c[0])).join('\n')
    expect(msg).toContain('Unknown command: adopt-values')

    //  (b) no `adopt-values` symbol survives on the CLI surface — a dangling export
    //      would be a build break, so runtime absence proves the strip left no vestige.
    const surface = cli as Record<string, unknown>
    for (const sym of ['cmdAdoptValues', 'adoptFlatValues', 'AdoptValuesOptions', 'AdoptChange']) {
      expect(surface[sym], `${sym} should no longer be exported`).toBeUndefined()
    }
    // The surviving REQ-74 gap-inversion sibling is untouched.
    expect(typeof surface.cmdApplyGapFixes).toBe('function')
    expect(typeof surface.planGapFixes).toBe('function')
  })
})
