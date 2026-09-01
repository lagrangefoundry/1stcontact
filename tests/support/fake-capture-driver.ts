import { HINTS_SCRIPT } from '../../tools/generate/src/cli/capture/hints'
import type { StructuralHints } from '../../tools/generate/src/cli/capture/hints'
import type { RawRun, RawSignals } from '../../tools/generate/src/cli/capture/extract'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../../tools/generate/src/cli/capture/types'

/**
 * A fake {@link BrowserDriver} — the ONE thing REQ-155's capture UATs are
 * allowed to fake, and the reason is that it is a genuine external boundary: a
 * browser reached over a wire protocol, not a component we own.
 *
 * WHY IT IS SHARED RATHER THAN COPIED. REQ-155 AC3 claims a bundle captured
 * locally and one captured in the cloud are equivalent member-for-member. That
 * claim is only checkable if the two runs differ in EXACTLY ONE thing — the
 * store — so the driver on both sides has to be the same object, not two fakes
 * that agree by inspection. The node suite and the workerd suite therefore
 * import this module rather than each declaring a `FakeDriver`.
 *
 * IT IS DELIBERATELY DETERMINISTIC. Real capture is not (see the ticket's
 * non-determinism section: `capturedAt`, what the live site served, font-load
 * timing, per-engine ladder differences, PNG encoder differences). Holding those
 * still is what turns "equivalent modulo known non-determinism" into an
 * assertion rather than an aspiration — the residual non-determinism the
 * pipeline still has is asserted separately, on its own terms.
 */

export function run(overrides: Partial<RawRun> & Pick<RawRun, 'text' | 'box'>): RawRun {
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

export function signalsFor(width: number): RawSignals {
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

export const CANNED_HINTS: StructuralHints = {
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
export class FakeCaptureDriver implements BrowserDriver {
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
