/**
 * STORY-244827df — a capture records the page **as painted**.
 *
 * A capture is the single source of truth for everything downstream: the fold
 * that builds a reproduction, the values comparison that scores it, and the
 * acceptance gate that grades it are all readers of one recorded value set. A
 * fact the capture does not record cannot be reproduced, compared or graded by
 * any of them — it is lost, silently, at the source. These UATs pin the
 * *recording contract* itself: what a capture must observe and persist.
 *
 * Each test drives a real entry point — `cmdCapturePage` / `runCapturePipeline` /
 * `reextractFromBundle` — against a committed fixture served over an ephemeral
 * loopback server. No third-party site is contacted, and nothing internal is
 * mocked: the only injected seam is the `BrowserDriver` (the true external
 * boundary), used where a fixed intercepted-response set is the fact under test.
 *
 * Real-browser tests guard on {@link chromiumAvailable} and skip cleanly on a
 * runner without the engine, as the rest of this suite does.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  flattenCapture,
  HEIGHT_PROBE_VIEWPORTS,
  partitionProbes,
  readMultiState,
  reextractFromBundle,
  RESPONSIVE_VIEWPORTS,
  rewriteMirroredRefs,
  runCapturePipeline,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type MultiStateCapture,
  type RawSignals,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const XORIGIN_BUNDLE = path.join(FIXTURES, 'bundle-xorigin-font')

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── ephemeral loopback file server (the fixtures' origin) ─────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
}

const mimeFor = (file: string): string => MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream'

interface Origin {
  origin: string
  close: () => Promise<void>
}

async function listen(server: Server): Promise<Origin> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** Serve a fixture directory as-is. */
function serveDir(dir: string): Promise<Origin> {
  return listen(
    createServer((req, res) => {
      const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
      const file = path.join(dir, rel || 'index.html')
      if (!file.startsWith(dir) || !existsSync(file)) {
        res.statusCode = 404
        res.end()
        return
      }
      res.setHeader('content-type', mimeFor(file))
      res.end(readFileSync(file))
    }),
  )
}

/**
 * Serve a written bundle VERBATIM: `rendered.html` at `/`, mirrored assets by
 * basename, and — unlike {@link reextractFromBundle} — **no** rewriting of the
 * absolute subresource references inside the stored markup. This is the control
 * for AC-743: the bundle's own bytes are all present, but nothing points the
 * browser at them, so the cross-origin face cannot load.
 */
function serveBundleVerbatim(bundleDir: string): Promise<Origin> {
  return listen(
    createServer((req, res) => {
      const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0])
      const base = reqPath.split('/').filter(Boolean).pop() ?? ''
      const file =
        reqPath === '/' || reqPath === '/index.html'
          ? path.join(bundleDir, 'rendered.html')
          : existsSync(path.join(bundleDir, 'assets', base))
            ? path.join(bundleDir, 'assets', base)
            : path.join(bundleDir, base)
      if (!existsSync(file)) {
        res.statusCode = 404
        res.end()
        return
      }
      res.setHeader('content-type', mimeFor(file))
      res.end(readFileSync(file))
    }),
  )
}

// ── shared helpers ────────────────────────────────────────────────────────────

const tmpDirs: string[] = []
function scratch(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true })
})

/** Capture a fixture page through the real `1c capture page` orchestrator. */
async function captureFixture(page: string, prefix: string): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  try {
    return (await cmdCapturePage(`${server.origin}/${page}`, { cwd: scratch(prefix) })).capture
  } finally {
    await server.close()
  }
}

/** Capture a fixture page and keep the whole written bundle. */
async function captureBundle(page: string, prefix: string): Promise<{ bundleDir: string; capture: Capture }> {
  const server = await serveDir(FIXTURES)
  try {
    const res = await cmdCapturePage(`${server.origin}/${page}`, { cwd: scratch(prefix) })
    return { bundleDir: res.bundleDir, capture: res.capture }
  } finally {
    await server.close()
  }
}

const elementsOf = (capture: Capture): ValueElement[] => flattenCapture(capture).elements
const runNamed = (capture: Capture, text: string): ValueElement | undefined =>
  elementsOf(capture).find((e) => e.text.trim() === text)
/** The leading family NAME of a declared stack (`Cinzel, serif` → `Cinzel`). */
const leadName = (stack: string): string => stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '')

// ═════════════════════════════════════════════════════════════════════════════
// AC-740 — a cross-origin-declared family reaches the bundle as mirrored files
// ═════════════════════════════════════════════════════════════════════════════

const GSTATIC_CINZEL = 'https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2'
const GOOGLE_CSS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600&display=swap'
const CINZEL_CSS = `@font-face {
  font-family: 'Cinzel';
  font-style: normal;
  font-weight: 600;
  src: url(${GSTATIC_CINZEL}) format('woff2');
}
`

/** Signals whose CSSOM is blind (`fontFaces: []`) — a cross-origin sheet throws
 *  `SecurityError` on `cssRules` — but whose one band paints `family`. */
function signalsPainting(family: string): RawSignals {
  return {
    viewport: { width: 800, height: 600 },
    bands: [
      {
        box: { x: 0, y: 0, width: 800, height: 300 },
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        colorScheme: 'light',
        fontFamily: family,
        textAlign: 'center',
        paddingTopPx: 40,
        paddingBottomPx: 40,
        content: [
          {
            role: 'heading',
            text: 'Front Door Heading',
            color: '#111827',
            fontFamily: family,
            fontSizePx: 40,
            fontWeight: 600,
            box: { x: 40, y: 100, width: 720, height: 48 },
          },
        ],
        items: [],
      },
    ],
    colorUsage: [
      { hex: '#111827', usage: 'text', freq: 1 },
      { hex: '#ffffff', usage: 'background', freq: 1 },
    ],
    fontFaces: [],
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: 720,
    images: [],
  } as unknown as RawSignals
}

/** The driver seam — the one true external boundary — returning fixed signals
 *  and a fixed intercepted-response set. */
function fakeDriver(signals: RawSignals, responses: CapturedResponse[]): () => Promise<BrowserDriver> {
  class FakeDriver implements BrowserDriver {
    async navigate(): Promise<void> {}
    async screenshot(): Promise<Uint8Array> {
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    }
    async query<T>(): Promise<T> {
      return signals as T
    }
    responses(): CapturedResponse[] {
      return responses
    }
    diagnostics() {
      return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
    }
    async content(): Promise<string> {
      return '<html><body>Front Door Heading</body></html>'
    }
    async close(): Promise<void> {}
  }
  return async () => new FakeDriver()
}

const crossOriginResponses = (): CapturedResponse[] => [
  { url: GOOGLE_CSS, status: 200, contentType: 'text/css; charset=utf-8', body: new TextEncoder().encode(CINZEL_CSS) },
  { url: GSTATIC_CINZEL, status: 200, contentType: 'font/woff2', body: new Uint8Array([119, 79, 70, 50, 0, 1, 2, 3]) },
]

describe('AC-740 — a cross-origin-declared font family reaches the bundle as mirrored face files', () => {
  it('test_UAT_AC740_cross_origin_family_records_mirrored_face_files_present_in_the_bundle', async () => {
    // The hosted-font case: the family's @font-face rules are served by another
    // origin, so `styleSheet.cssRules` throws and the live CSSOM reports NO faces.
    // The face's bytes were still intercepted and mirrored, and that is what the
    // bundle must record the family against.
    const res = await cmdCapturePage('http://example.test/', {
      cwd: scratch('ac740-'),
      driverFactory: fakeDriver(signalsPainting('Cinzel'), crossOriginResponses()),
      isEngineAvailable: async () => true,
    })
    const cinzel = res.capture.theme.fonts.find((f) => leadName(f.family) === 'Cinzel')
    expect(cinzel, 'the painted family is recorded in the bundle theme').toBeDefined()
    expect(cinzel!.files.length, 'its mirrored face file(s) are named').toBeGreaterThan(0)
    // Not a dangling handle: every named path is a file the bundle actually holds.
    for (const rel of cinzel!.files) {
      expect(rel).toMatch(/^assets\/.*\.woff2$/)
      expect(existsSync(path.join(res.bundleDir, rel)), `${rel} present among the bundle's mirrored assets`).toBe(true)
    }

    // Negative control — the stylesheet declares the face but its file was never
    // retrieved (a CDN miss). The capture must not invent a handle it does not hold.
    const unmirrored = await runCapturePipeline('http://example.test/', {
      driverFactory: fakeDriver(signalsPainting('Cinzel'), [crossOriginResponses()[0]]),
    })
    expect(unmirrored.capture.theme.fonts.find((f) => leadName(f.family) === 'Cinzel')!.files).toEqual([])

    // Union control — a face the same-origin CSSOM DID read is combined with the
    // byte-recovered cross-origin faces, not replaced by them, and not doubled.
    const bothSources = signalsPainting('Cinzel')
    bothSources.fontFaces = [{ family: 'Cinzel', srcUrls: [GSTATIC_CINZEL], weight: 600 }]
    const union = await runCapturePipeline('http://example.test/', {
      driverFactory: fakeDriver(bothSources, crossOriginResponses()),
    })
    const unionFiles = union.capture.theme.fonts.find((f) => leadName(f.family) === 'Cinzel')!.files
    expect(unionFiles, 'the two sources are unioned, with no duplicate entry').toHaveLength(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-741 / AC-742 — the full declared stack, and measurement after the real
// faces have loaded (including content revealed only after the page settles)
// ═════════════════════════════════════════════════════════════════════════════

// The suite title carries no AC id: each test's own name is the sole link to
// its criterion, so a block covering two ACs cannot shadow the second one.
describe('fonts as painted', () => {
  let capture: Capture
  let missingFace: Capture
  let missingFaceMs = 0

  beforeAll(async () => {
    if (!browserOk) return
    capture = await captureFixture('ac742-webfont.html', 'ac742-web-')
    const started = Date.now()
    missingFace = await captureFixture('ac742-missing-font.html', 'ac742-miss-')
    missingFaceMs = Date.now() - started
  }, 300000)

  itB('test_UAT_AC741_run_records_the_full_stack_while_the_face_join_uses_the_leading_name', () => {
    // A run replays the stack it was painted with, fallbacks included: an
    // unmatched family name is still valid CSS (it resolves to no font), so a
    // reproduction handed only the leading token has nothing to fall back to.
    const hero = runNamed(capture, 'Gigabyte Alchemy')
    expect(hero, 'the hero run is captured').toBeDefined()
    expect(hero!.fontFamily, 'every name in the declared stack, in order').toBe('Alchemy, serif')
    expect(hero!.fontFamily.split(',').length).toBeGreaterThan(1)

    // Where a single family NAME is required rather than a stack — joining the
    // family to its mirrored face files — the LEADING name is what both sides
    // meet on, so a family declared as a stack still resolves its files.
    const painted = capture.theme.fonts.find((f) => leadName(f.family) === 'Alchemy')
    expect(painted, 'the painted family has a theme entry').toBeDefined()
    expect(painted!.files.length, 'the stack-to-name join reached its mirrored face').toBeGreaterThan(0)
    // …and the join held: the run was not measured against a substitute face.
    expect(hero!.fontLoaded).not.toBe(false)
  })

  itB('test_UAT_AC742_no_visible_run_is_measured_against_a_fallback_face', () => {
    // Every declared face resolves on this fixture, so NO visible run may report
    // one as unresolved — including the heading the capture only reveals by
    // scrolling, whose face is first needed after the initial fonts-ready await.
    const fellBack = elementsOf(capture)
      .filter((e) => e.fontLoaded === false)
      .map((e) => e.text)
    expect(fellBack, 'no run reports a substitute face').toEqual([])
    const below = runNamed(capture, 'Deep Below Fold Heading')
    expect(below, 'the below-fold heading is captured at all').toBeDefined()
    expect(below!.fontLoaded).not.toBe(false)

    // The metrics were taken against the intended face, not the system fallback:
    // the same text at the same size and weight in the fallback the face would
    // degrade to occupies a DIFFERENT glyph extent.
    const painted = elementsOf(capture).find((e) => e.text.trim() === 'Gigabyte Alchemy' && e.fontFamily !== 'serif')
    const fallbackControl = elementsOf(capture).find(
      (e) => e.text.trim() === 'Gigabyte Alchemy' && e.fontFamily === 'serif',
    )
    expect(fallbackControl, 'the fallback control run is captured').toBeDefined()
    expect(painted!.renderedTextBox, 'the painted run carries a glyph extent').toBeTruthy()
    expect(
      painted!.renderedTextBox!.height,
      'measured against the web face, not the fallback the control renders in',
    ).not.toBe(fallbackControl!.renderedTextBox!.height)

    // A face that genuinely never resolves is reported honestly — and cannot
    // stall the capture waiting for bytes that will never arrive.
    const stranded = runNamed(missingFace, 'Unretrievable Face')
    expect(stranded, 'the capture completed and recorded the run').toBeDefined()
    expect(stranded!.fontLoaded, 'the unresolvable face is reported as not loaded').toBe(false)
    expect(missingFaceMs, 'the capture completed in its normal time, not a stall').toBeLessThan(120000)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-743 — re-extracting a written bundle offline reproduces the font facts
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-743 — a written bundle is self-contained', () => {
  let offline: Capture
  let verbatim: Capture

  beforeAll(async () => {
    if (!browserOk) return
    // The fixture bundle's @font-face src is a non-resolving `.invalid` host, so
    // the face can ONLY load from the bundle's own mirrored copy.
    offline = (await reextractFromBundle(XORIGIN_BUNDLE)).capture
    const server = await serveBundleVerbatim(XORIGIN_BUNDLE)
    try {
      verbatim = (await cmdCapturePage(`${server.origin}/`, { cwd: scratch('ac743-raw-') })).capture
    } finally {
      await server.close()
    }
  }, 300000)

  itB('test_UAT_AC743_offline_reextraction_reproduces_the_painted_font_facts', () => {
    const hero = runNamed(offline, 'Gigabyte Alchemy')
    expect(hero, 're-extraction reaches the run with the live site unreachable').toBeDefined()
    // A reference by its original ABSOLUTE address resolves to the bundle's own
    // mirrored copy, so the intended face loads and the run reports it as such.
    expect(hero!.fontLoaded, 'the mirrored face resolved offline').not.toBe(false)
    expect(hero!.fontFamily, 'the same family stack as the live capture').toBe('Alchemy, serif')
    expect(hero!.renderedTextBox, 'glyph metrics are recorded, not skipped').toBeTruthy()

    // The control that proves the resolution is what did it: served the SAME
    // bundle bytes with its references left pointing at the dead origin, the very
    // same run falls back.
    const unresolved = runNamed(verbatim, 'Gigabyte Alchemy')
    expect(unresolved, 'the control capture reaches the same run').toBeDefined()
    expect(unresolved!.fontLoaded, 'without local resolution the face cannot load').toBe(false)

    // Bounded by what actually mirrored: a reference with no mirrored counterpart
    // is left exactly as authored and fails as it would have.
    const mirrored = new Set(readdirSync(path.join(XORIGIN_BUNDLE, 'assets')))
    expect(rewriteMirroredRefs('url(https://fonts.gstatic.invalid/s/alchemy/v1/alchemy.ttf)', mirrored)).toBe(
      'url(/alchemy.ttf)',
    )
    expect(rewriteMirroredRefs('url(https://cdn.example.com/not-mirrored.woff2)', mirrored)).toBe(
      'url(https://cdn.example.com/not-mirrored.woff2)',
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-744 — the surface is resolved from the boxes that CONTAIN the run
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-744 — surface attribution is geometric, tightest box first', () => {
  let capture: Capture

  beforeAll(async () => {
    if (!browserOk) return
    capture = await captureFixture('req88-sibling-surface.html', 'ac744-')
  }, 300000)

  itB('test_UAT_AC744_surface_is_attributed_to_the_containing_box_not_the_dom_ancestor', () => {
    // The card is painted by an absolutely-positioned SIBLING of the text it sits
    // behind — the shape a flat reproduction emits. A `parentElement` walk skips
    // it entirely and reports the page backstop in its place.
    const sibling = runNamed(capture, 'Sibling painted surface')
    expect(sibling, 'the sibling-painted run is captured').toBeDefined()
    expect(sibling!.surfaceFill, "the containing box's fill, not the page backstop").toBe('#ffffff')
    expect(sibling!.surfaceFill).not.toBe('#e8dfd3')
    expect(sibling!.borderLeft, 'the accent painted by that same box is found').toEqual({
      widthPx: 4,
      color: '#ffb900',
    })

    // On a conventionally nested page — where the painting box IS an ancestor —
    // the recorded values are unchanged, so the geometric resolution cannot
    // silently re-baseline every captured reference.
    const nested = runNamed(capture, 'Nested painted surface')
    expect(nested, 'the conventionally nested run is captured').toBeDefined()
    expect(nested!.surfaceFill).toBe('#d9ccba')
    expect(nested!.borderLeft).toEqual({ widthPx: 4, color: '#00d492' })

    // Tightest-area first: each run reports its OWN card, never the shared body
    // fill both of them sit over.
    expect(sibling!.surfaceFill).not.toBe(nested!.surfaceFill)
    expect([sibling!.surfaceFill, nested!.surfaceFill]).not.toContain('#e8dfd3')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-745 — which box PAINTS the surface, and what shape that box is
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-745 — the surface-bearing box is recorded with its own shape', () => {
  let capture: Capture

  beforeAll(async () => {
    if (!browserOk) return
    capture = await captureFixture('ac745-surface-bearer.html', 'ac745-')
  }, 300000)

  itB('test_UAT_AC745_run_records_the_bearing_box_its_rect_radius_shadow_and_border', () => {
    // A control represented conventionally: ONE element carries the label and the
    // rounded fill, so the bearing box is the run's own element.
    const conventional = runNamed(capture, 'Nested control')
    expect(conventional, 'the conventional control is captured').toBeDefined()
    expect(conventional!.surface, 'a bearing box is recorded').toBeTruthy()
    expect(conventional!.surface!.self, "flagged as the run's own element").toBe(true)
    expect(conventional!.surface!.box).toEqual({ x: 40, y: 40, width: 160, height: 50 })
    expect(conventional!.surface!.borderRadiusPx).toBe(8)
    expect(conventional!.surface!.boxShadow, 'the shadow it paints').toBeTruthy()
    expect(conventional!.surface!.border).toEqual({ widthPx: 2, color: '#006644', style: 'solid' })

    // The same control represented flat: a label plus a SEPARATE backing box. The
    // label's own shape reads square, so the bearing box is the only place the
    // control's real rect and rounding can be read from.
    const split = runNamed(capture, 'Split control')
    expect(split, 'the split control label is captured').toBeDefined()
    expect(split!.surface, 'a bearing box is recorded').toBeTruthy()
    expect(split!.surface!.self, "flagged as NOT the run's own element").toBe(false)
    expect(split!.surface!.box, "the backing box's rect, not the label's").toEqual({
      x: 40,
      y: 160,
      width: 164,
      height: 54,
    })
    expect(split!.surface!.borderRadiusPx, "the backing box's radius").toBe(12)
    expect(split!.borderRadiusPx, 'the label itself is square').toBe(0)

    // Nothing paints behind an unbacked run, so no bearing box may be invented.
    const unbacked = runNamed(capture, 'Unbacked run')
    expect(unbacked, 'the unbacked run is captured').toBeDefined()
    expect(unbacked!.surface, 'no bearing box where nothing paints').toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-746 — the rect of the element that BEARS a left accent rule
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-746 — an accent rule carries its bearing rect across the ladder', () => {
  let multi: MultiStateCapture

  beforeAll(async () => {
    if (!browserOk) return
    const { bundleDir } = await captureBundle('ac746-accent-bearer.html', 'ac746-')
    multi = readMultiState(bundleDir)!
  }, 300000)

  itB('test_UAT_AC746_wrapper_borne_accent_records_the_bearing_rect_at_every_sampled_width', () => {
    expect(multi, 'the multi-viewport value set was persisted and read back').toBeTruthy()
    const ladderWidths = RESPONSIVE_VIEWPORTS.map((v) => v.width)
    const sampled = partitionProbes(multi.projections).ladder
    expect(sampled.map((p) => p.viewport.width)).toEqual(ladderWidths)

    for (const projection of sampled) {
      const at = `@${projection.viewport.width}`
      const elements = projection.manifest.elements
      const wrapped = elements.find((e) => e.text.trim() === 'Wrapper painted accent')
      expect(wrapped, `the wrapper-borne run is present ${at}`).toBeDefined()
      // The rule's width and colour…
      expect(wrapped!.borderLeft, `accent width + colour ${at}`).toEqual({ widthPx: 6, color: '#00d492' })
      // …plus the rect of the WRAPPER that paints it. A border paints inside its
      // own border box, so without this a reproduction can only draw the rule on
      // the run — indented by the wrapper's padding and over the first glyph.
      expect(wrapped!.accentBox, `the bearing rect is readable ${at}`).toBeTruthy()
      expect(wrapped!.accentBox!.x, `the bearer's left edge ${at}`).toBe(40)
      expect(
        wrapped!.accentBox!.x,
        `the bearer's rect is not the run's inset box ${at}`,
      ).not.toBe(wrapped!.box!.x)
      expect(wrapped!.accentBox!.width).toBeGreaterThan(wrapped!.box!.width)

      // Control: where the run's OWN box paints the accent, the rule is recorded
      // with no separate bearing rect — the rect is the run's own.
      const self = elements.find((e) => e.text.trim() === 'Self painted accent')
      expect(self, `the self-painted run is present ${at}`).toBeDefined()
      expect(self!.borderLeft, `the rule is still recorded ${at}`).toEqual({ widthPx: 4, color: '#ffb900' })
      expect(self!.accentBox ?? null, `no separate bearing rect ${at}`).toBeNull()
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-747 / AC-748 — section rects, and translucent veils
// ═════════════════════════════════════════════════════════════════════════════

// Suite title carries no AC id — see the note on `fonts as painted` above.
describe('section geometry and scrims', () => {
  let manifest: ValueManifest
  let capture: Capture

  beforeAll(async () => {
    if (!browserOk) return
    capture = await captureFixture('ac748-scrim.html', 'ac748-')
    manifest = flattenCapture(capture)
  }, 300000)

  itB('test_UAT_AC747_every_section_records_its_own_rect_whether_or_not_it_paints_an_image', () => {
    // The fixture mixes image-backed and plain sections.
    expect(manifest.sections.length, 'every authored section is captured').toBe(4)
    const bottoms: number[] = []
    for (const section of manifest.sections) {
      const at = `section ${section.index}`
      expect(section.box, `${at} records a rect`).toBeTruthy()
      expect(section.box!.width, `${at} has non-zero width`).toBeGreaterThan(0)
      expect(section.box!.height, `${at} has non-zero height`).toBeGreaterThan(0)
      bottoms.push(section.box!.y + section.box!.height)
    }
    // The rects match the rendered bounds: the sections tile the document in
    // order, each starting where the previous ended.
    for (let i = 1; i < manifest.sections.length; i++) {
      expect(manifest.sections[i].box!.y, 'section rects abut their predecessor').toBe(bottoms[i - 1])
    }
    // The image handle stays independently gated: only the image-backed sections
    // carry one, and a plain section records a rect alone.
    const withImage = manifest.sections.filter((s) => s.backgroundImageUrl !== undefined).map((s) => s.index)
    expect(withImage, 'only the image-backed sections carry an image handle').toEqual([0, 2])
    for (const section of manifest.sections) {
      if (!withImage.includes(section.index)) expect(section.backgroundImageUrl).toBeUndefined()
    }
  })

  itB('test_UAT_AC748_a_translucent_veil_is_recorded_as_a_colour_with_its_opacity', () => {
    // A veil is a colour carrying its OWN alpha (not element opacity). Both
    // veiled sections are authored in a modern colour syntax the engine accepts:
    // section 0 in `color-mix(in oklab, …)`, section 2 in `oklch(… / …)`.
    const veils: Array<[number, number]> = [
      [0, 0.3],
      [2, 0.45],
    ]
    for (const [index, alpha] of veils) {
      const section = manifest.sections.find((s) => s.index === index)!
      expect(section.overlay, `section ${index} records a veil`).toBeTruthy()
      expect(section.overlay!.opacity, `section ${index} keeps the authored alpha`).toBeCloseTo(alpha, 2)
      // Recorded as a colour, resolved through the browser colour probe rather
      // than dropped for being in a syntax a regex could not read.
      expect(section.overlay!.color, `section ${index} records a colour`).toMatch(/^#[0-9a-f]{6}$/)
    }

    // Negative controls — an opaque fill is not a veil, and a section with
    // neither image nor veil records none.
    expect(manifest.sections.find((s) => s.index === 1)!.overlay, 'an opaque band records no veil').toBeNull()
    expect(manifest.sections.find((s) => s.index === 3)!.overlay, 'a bare section records no veil').toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-749 — per-run geometry where an element holds several runs
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-749 — each run of a multi-run element gets its own geometry', () => {
  let capture: Capture

  beforeAll(async () => {
    if (!browserOk) return
    capture = await captureFixture('bug25-multiline.html', 'ac749-')
  }, 300000)

  itB('test_UAT_AC749_each_run_of_a_wrapped_heading_records_its_own_box_and_glyph_extent', () => {
    // The hero heading is ONE element whose text is split across two lines, so it
    // is captured as two runs. Handing both the shared parent box leaves a fold
    // that positions runs absolutely nothing to separate them by — it printed one
    // on top of the other — and makes each run measure the PAIR's line count.
    const first = runNamed(capture, 'Dreaming of healthier meals')
    const second = runNamed(capture, 'on your dinner table?')
    expect(first, 'the first line is captured as its own run').toBeDefined()
    expect(second, 'the second line is captured as its own run').toBeDefined()

    expect(second!.box!.y, 'each run sits at its own vertical position').toBeGreaterThan(first!.box!.y)
    expect(second!.renderedTextBox!.y, 'each glyph extent is measured from its own line').toBeGreaterThan(
      first!.renderedTextBox!.y,
    )
    expect(first!.renderedTextBox!.width, 'the two lines have different glyph extents').not.toBe(
      second!.renderedTextBox!.width,
    )

    // No two runs share an identical glyph extent unless the text genuinely
    // occupies the same rect.
    const extents = elementsOf(capture)
      .filter((e) => e.renderedTextBox)
      .map((e) => JSON.stringify(e.renderedTextBox))
    expect(new Set(extents).size, 'no run borrows another run’s glyph extent').toBe(extents.length)

    // Control: an element holding exactly ONE run is unchanged — it still records
    // the element's own box (full container width) and its own glyph extent.
    const single = runNamed(capture, 'Single line heading')
    expect(single, 'the single-line heading is captured').toBeDefined()
    expect(single!.box!.width, "the element's own box spans its container").toBe(1240)
    expect(single!.renderedTextBox!.width, 'its glyph extent is the tighter painted text').toBeLessThan(
      single!.box!.width,
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-750 — behavioural facts no painted axis can hold
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-750 — a control records its authored type and its form endpoint', () => {
  let elements: ValueElement[]
  let origin = ''

  beforeAll(async () => {
    if (!browserOk) return
    const server = await serveDir(FIXTURES)
    origin = server.origin
    try {
      const res = await cmdCapturePage(`${server.origin}/ac750-form-controls.html`, { cwd: scratch('ac750-') })
      elements = elementsOf(res.capture)
    } finally {
      await server.close()
    }
  }, 300000)

  itB('test_UAT_AC750_each_control_records_its_authored_type_and_its_forms_endpoint', () => {
    const byName = (name: string): ValueElement => {
      const found = elements.find((e) => e.accessibleName === name)
      expect(found, `control "${name}" is captured`).toBeDefined()
      return found!
    }

    // The a11y role flattens every single-line control to `textbox`; the authored
    // type is what separates them, and no painted value can carry it.
    const inForm: Array<[string, string]> = [
      ['Your email address', 'email'],
      ['Your full name', 'text'], // no `type` attribute — defaults to plain text
      ['Your message', 'textarea'], // a multi-line control names itself
    ]
    for (const [name, controlType] of inForm) {
      const control = byName(name)
      expect(control.a11yRole, `${name} is a control`).toBe('textbox')
      expect(control.controlType, `${name} records its own authored type`).toBe(controlType)
      // …and the enclosing form's endpoint, resolved to an absolute address.
      expect(control.formAction, `${name} records the form's endpoint`).toBe(`${origin}/subscribe`)
    }
    expect(new Set(inForm.map(([name]) => byName(name).controlType)).size, 'the three types are distinct').toBe(3)

    // A control with no enclosing form records no endpoint — never a fabricated one.
    const loose = byName('Search the site')
    expect(loose.controlType, 'it still records its own authored type').toBe('search')
    expect(loose.formAction ?? null, 'no enclosing form ⇒ no endpoint').toBeNull()

    // A form declaring an EMPTY endpoint records none, not the empty string and
    // not the page's own address.
    const emptyAction = byName('Your phone number')
    expect(emptyAction.controlType).toBe('tel')
    expect(emptyAction.formAction ?? null, 'an empty action ⇒ no endpoint').toBeNull()

    // A non-control element records no control type at all.
    const image = byName('Site logo')
    expect(image.a11yRole).toBe('img')
    expect(image.controlType ?? null, 'a non-control has no authored control type').toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-751 — the viewport-height probe
// ═════════════════════════════════════════════════════════════════════════════

describe('AC-751 — a height probe re-samples a ladder width at a second height', () => {
  let multi: MultiStateCapture
  let bundleFiles: string[] = []

  beforeAll(async () => {
    if (!browserOk) return
    const { bundleDir } = await captureBundle('uniform.html', 'ac751-')
    multi = readMultiState(bundleDir)!
    bundleFiles = readdirSync(bundleDir)
  }, 300000)

  itB('test_UAT_AC751_a_height_probe_is_persisted_without_extending_the_width_ladder', () => {
    expect(multi, 'the multi-viewport value set was persisted').toBeTruthy()
    const ladderWidths = RESPONSIVE_VIEWPORTS.map((v) => v.width)
    const { ladder, probes } = partitionProbes(multi.projections)

    // The ladder is untouched: the same widths, in the same order, as a capture
    // taken without any probe.
    expect(ladder.map((p) => p.viewport.width), 'the sampled widths are exactly the ladder').toEqual(ladderWidths)

    // The probe is an ADDITIONAL projection at an already-sampled width…
    expect(probes.length, 'a probe projection is recorded').toBe(HEIGHT_PROBE_VIEWPORTS.length)
    for (const probe of probes) {
      expect(ladderWidths, "the probe's width is already on the ladder").toContain(probe.viewport.width)
      // …distinguishable from the ladder sample it re-shoots by its HEIGHT, which
      // is what makes height response a finite difference rather than a guess.
      const reshot = ladder.find((p) => p.viewport.width === probe.viewport.width)!
      expect(probe.viewport.height, 'the probe re-shoots that width at a second height').not.toBe(
        reshot.viewport.height,
      )
      expect(probe.manifest.viewport!.height, 'and the projection records that height').toBe(probe.viewport.height)
    }

    // The screenshots per width are exactly the ladder's — a probe adds one
    // projection and nothing else.
    const shotWidths = bundleFiles
      .map((f) => /^screenshot-(\d+)\.png$/.exec(f))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b)
    expect(shotWidths, 'one reference screenshot per ladder width, and no more').toEqual(
      [...ladderWidths].sort((a, b) => a - b),
    )
  })
})
