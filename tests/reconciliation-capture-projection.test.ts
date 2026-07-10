import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  createEngineDriver,
  engineAvailable,
  readMultiState,
  RESPONSIVE_VIEWPORTS,
  runMultiStateCapture,
  writeMultiState,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type ContentRun,
  type Field,
  type PageDiagnostics,
  type RawSignals,
  type RenderEngine,
  type Viewport,
} from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UATs for story-8f33f14c — the REQ-47 / REQ-48 enrichment of the
 * rendered-only reference capture ([[DOC-13]]): the per-element geometry / shape /
 * a11y projection and text-free `fields[]` (AC-567), the additional rendered axes
 * z-order / treatments / media / transform / motion / font-load / viewport
 * (AC-568), the fonts-ready + reduced-motion timing preconditions (AC-569), and
 * the `engines × viewports × interaction-states` multi-state orchestration
 * persisted with noted gaps (AC-570). One UAT per acceptance criterion, asserting
 * against the existing implementation at its external boundaries: the
 * `1c capture page` command (`cmdCapturePage`), the multi-state loop
 * (`runMultiStateCapture`), and the persisted `multistate.json` (`writeMultiState`
 * / `readMultiState`).
 *
 * The geometry / axis / precondition tests drive a REAL headless Chromium (via the
 * Playwright driver) against committed golden fixtures served from an ephemeral
 * loopback HTTP server, so every rendered value (a11y role, box, filter, clip
 * mask, decomposed transform, resolved web font) is read out of the live rendered
 * DOM — no third-party site is contacted. The multi-state note / legacy paths use
 * fake drivers, to prove the matrix is honest about the axes it did and did not
 * actually shoot.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
}

/** Serve a directory over 127.0.0.1:0 (ephemeral); returns its origin + closer. */
async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** Every content run in a capture: band content + flattened item content. */
const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])

/** Every text-free field across all captured sections. */
const allFields = (c: Capture): Field[] => c.sections.flatMap((s) => s.fields)

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── shared golden captures (capture each fixture once, assert against it) ──────
let server: { origin: string; close: () => Promise<void> }
let cwd: string
let structural: Capture // req47-structural.html — geometry / a11y / fields
let axes: Capture // req48-axes.html — z-order / treatments / media / transform / motion / font

beforeAll(async () => {
  server = await serveDir(FIXTURES)
  if (browserOk) {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac-capture-proj-'))
    structural = (await cmdCapturePage(`${server.origin}/req47-structural.html`, { cwd })).capture
    axes = (await cmdCapturePage(`${server.origin}/req48-axes.html`, { cwd })).capture
  }
}, 240000)

afterAll(async () => {
  await server?.close()
  if (cwd) rmSync(cwd, { recursive: true, force: true })
})

describe('1c capture page — per-element projection & multi-state (story-8f33f14c / REQ-47 / REQ-48)', () => {
  // AC-567 — per-element geometry, shape and a11y are captured for every rendered
  // element, and text-free elements are captured as fields paired on a11yRole.
  itB('test_UAT_AC567_per_element_geometry_shape_a11y_and_text_free_fields', () => {
    const runs = allRuns(structural)
    const heading = runs.find((r) => r.text === 'Intentional Software')
    expect(heading, 'hero heading run present').toBeDefined()
    // The projection descends from the section to every rendered content run: each
    // carries its own painted box, shape (radius/shadow), and a11y role.
    expect(heading?.box?.width).toBeGreaterThan(0)
    expect(heading?.box?.height).toBeGreaterThan(0)
    expect(typeof heading?.borderRadiusPx).toBe('number')
    expect(heading && 'boxShadow' in heading).toBe(true)
    expect(heading?.a11yRole).toBe('heading')

    // Arrangement is derived from geometry, never `flex-direction`: the tagline is
    // stacked below the heading ('stack'); the Subscribe button sits right-of the
    // email input ('row').
    const tagline = runs.find((r) => r.text.startsWith('Tools for clarity'))
    expect(tagline?.arrangement).toBe('stack')
    const button = runs.find((r) => r.text === 'Subscribe')
    expect(button?.arrangement).toBe('row')

    // Text-free elements become per-section fields, each with box + accessibleName
    // + nameSource. The placeholder input's name renders INSIDE the box
    // (nameSource 'placeholder'); the labelled input's name renders OUTSIDE it
    // (nameSource 'label').
    const fields = allFields(structural)
    const placeholderInput = fields.find((f) => f.accessibleName === 'Your email address')
    expect(placeholderInput, 'placeholder-labelled input captured as a field').toBeDefined()
    expect(placeholderInput?.a11yRole).toBe('textbox')
    expect(placeholderInput?.nameSource).toBe('placeholder')
    expect(placeholderInput?.box?.width).toBeGreaterThan(0)

    const labelledInput = fields.find((f) => f.accessibleName === 'Full name')
    expect(labelledInput, 'label-associated input captured as a field').toBeDefined()
    expect(labelledInput?.nameSource).toBe('label')

    // The divider (no text join key) is present as a field, not dropped…
    expect(fields.some((f) => f.a11yRole === 'separator')).toBe(true)
    // …and capture descends into the montage so its <img> children are fields too.
    expect(fields.filter((f) => f.a11yRole === 'img').length).toBeGreaterThanOrEqual(2)
  })

  // AC-568 — additional rendered axes projected per element: z-order, treatments,
  // media, decomposed transform, declared motion, font-load, viewport.
  itB('test_UAT_AC568_additional_rendered_axes_projected_per_element', () => {
    const title = allRuns(axes).find((r) => r.text === 'Layered Hero')
    expect(title, 'layered hero title present').toBeDefined()
    // z-index: the title is stacked ABOVE the scrim — effective paint order 10.
    expect(title?.zIndex).toBe(10)
    // text-shadow glow is painted → present (non-null); the web font resolved so
    // the run is not flagged as a fallback (fontLoaded is only persisted when it
    // is false — an absent flag is the "intended face loaded" signal).
    expect(title?.textShadow).toBeTruthy()
    expect(title?.fontFamily).toBe('GoldHead')
    expect(title?.fontLoaded).not.toBe(false)

    const fields = allFields(axes)
    // media: object-fit + intrinsic aspect on the cover photo.
    const cover = fields.find((f) => f.accessibleName === 'Cover photo')
    expect(cover?.objectFit).toBe('cover')
    expect(cover?.intrinsicAspect as number).toBeGreaterThan(0)
    // treatments: a filter halo and a masked/clipped edge, each present where painted.
    const blurred = fields.find((f) => f.accessibleName === 'Blurred mark')
    expect(blurred?.filter).toBeTruthy()
    expect(blurred?.filter).toContain('blur')
    const avatar = fields.find((f) => f.accessibleName === 'Round avatar')
    expect(avatar?.maskEdge).toBeTruthy()
    // decomposed transform: rotation surfaced in degrees, uniform scale ~1
    // (translation is folded into box, so it needs no field). The fixture rotates
    // this layer 6deg (computed `matrix(0.994522, 0.104528, …)`), so a faithful
    // decomposition must surface ~6.
    // NOTE (reconciliation): this assertion is faithful to AC-568 ("rotation
    // surfaced") but currently FAILS against the code — a real regression, not a
    // test bug. `extract.ts` `transformOf` builds its matrix regex inside a
    // template literal with single backslashes (`/matrix\(([^)]+)\)/`), which
    // collapses to `/matrix(([^)]+))/`; the capture group then keeps the leading
    // `(`, so `parseFloat("(0.994522")` is NaN and `transformOf` always returns
    // `{rotate:0, scale:1}`. The sibling `rgba`/`gradient` regexes correctly use
    // `\\(`. Do NOT weaken this to `>= 0` — that would certify the bug. The fix is
    // one character in `extract.ts` (single → double backslash).
    const tilted = fields.find((f) => f.accessibleName === 'Tilted layer')
    expect(tilted?.transformRotateDeg as number).toBeGreaterThanOrEqual(5)
    expect(tilted?.transformRotateDeg as number).toBeLessThanOrEqual(7)
    expect(tilted?.transformScale).toBe(1)

    // declared motion: the control declares BOTH a hover transition and an
    // entrance animation.
    const button = allRuns(axes).find((r) => r.text === 'Subscribe')
    expect(button?.motion).toBe('both')

    // the projection is tagged with the viewport it was shot at.
    expect(typeof axes.viewport.width).toBe('number')
    expect(axes.viewport.width).toBeGreaterThan(0)
  })

  // AC-569 — fonts-ready and reduced-motion preconditions yield a deterministic
  // projection (the intended web font resolved, and the frame is frozen).
  itB('test_UAT_AC569_fonts_ready_and_reduced_motion_preconditions', async () => {
    // The web-font heading records the intended painted face + metrics and is not
    // flagged as a fallback — never the fallback metrics of a pre-load (FOUT)
    // frame. (fontLoaded is persisted only when false; absent = intended face
    // resolved after the fonts-ready wait.)
    const title = allRuns(axes).find((r) => r.text === 'Layered Hero')
    expect(title?.fontFamily).toBe('GoldHead')
    expect(title?.fontLoaded).not.toBe(false)
    expect(title?.fontSizePx).toBe(56)

    // Re-capturing the animated page yields an identical projection: reduced-motion
    // froze the entrance animation to its end state and the fonts-ready wait
    // removed the FOUT race, so the sections read identically frame-to-frame.
    const reCwd = mkdtempSync(path.join(tmpdir(), 'ac569-repeat-'))
    try {
      const again = (await cmdCapturePage(`${server.origin}/req48-axes.html`, { cwd: reCwd })).capture
      expect(JSON.stringify(again.sections)).toBe(JSON.stringify(axes.sections))
    } finally {
      rmSync(reCwd, { recursive: true, force: true })
    }
  }, 120000)

  // AC-570 — capture runs across the engines × viewports × interaction-states
  // matrix, provenance-tagged, persisted to multistate.json with noted gaps.
  it('test_UAT_AC570_multistate_matrix_across_viewports_engines_states_with_notes', async () => {
    // The responsive viewport ladder is the full {320,375,768,1024,1280,1440}.
    expect(RESPONSIVE_VIEWPORTS.map((v) => v.width)).toEqual([320, 375, 768, 1024, 1280, 1440])

    // Part 1 (real Chromium, two ladder viewports, rest+hover) — every
    // {engine, viewport, state} cell is emitted, provenance-tagged, and the hover
    // state is really actuated on the already-open page (no re-navigation).
    if (await engineAvailable('chromium')) {
      const server2 = await serveDir(FIXTURES)
      try {
        const ladder: Viewport[] = [
          { width: 375, height: 800 },
          { width: 1280, height: 800 },
        ]
        const matrix = await runMultiStateCapture(`${server2.origin}/req47-structural.html`, {
          engines: ['chromium'],
          viewports: ladder,
          states: ['rest', 'hover'],
          driverFactoryFor: createEngineDriver,
          isEngineAvailable: engineAvailable,
        })
        // 1 engine × 2 viewports × 2 states = 4 provenance-tagged cells, no gaps.
        expect(matrix.projections).toHaveLength(4)
        expect(matrix.notes).toEqual([])
        const keys = matrix.projections.map((p) => `${p.engine}:${p.viewport.width}:${p.state}`).sort()
        expect(keys).toEqual([
          'chromium:1280:hover',
          'chromium:1280:rest',
          'chromium:375:hover',
          'chromium:375:rest',
        ])
        // Each cell carries its full provenance on the manifest too.
        for (const p of matrix.projections) {
          expect(p.manifest.engine).toBe(p.engine)
          expect(p.manifest.viewport?.width).toBe(p.viewport.width)
          expect(p.manifest.state).toBe(p.state)
        }

        // It round-trips through multistate.json in the bundle.
        const bundleDir = mkdtempSync(path.join(tmpdir(), 'ac570-bundle-'))
        try {
          writeMultiState(bundleDir, matrix)
          const readBack = readMultiState(bundleDir)
          expect(readBack).not.toBeNull()
          expect(JSON.stringify(readBack)).toBe(JSON.stringify(matrix))
        } finally {
          rmSync(bundleDir, { recursive: true, force: true })
        }
      } finally {
        await server2.close()
      }
    }

    // Part 2 (fake drivers) — an unavailable engine is skipped and NOTED (never
    // silently absent), and a non-actuating driver is held to `rest` with the
    // dropped hover cell NOTED (never an unactuated frame posing as hover).
    const gappy = await runMultiStateCapture('http://x.test/', {
      engines: ['chromium', 'webkit'],
      viewports: [{ width: 1280, height: 800 }],
      states: ['rest', 'hover'],
      driverFactoryFor: () => async () => new FakeDriver(false),
      isEngineAvailable: async (e: RenderEngine) => e === 'chromium',
    })
    // webkit unavailable → no webkit cells; only chromium projected.
    expect(gappy.projections.every((p) => p.engine === 'chromium')).toBe(true)
    expect(gappy.notes.some((n) => /webkit/.test(n) && /unavailable/.test(n))).toBe(true)
    // non-actuating driver → only the rest cell, and the skipped hover is noted.
    expect(gappy.projections.map((p) => p.state)).toEqual(['rest'])
    expect(gappy.notes.some((n) => /cannot actuate/.test(n) && /hover/.test(n))).toBe(true)

    // Part 3 — a bundle written before multi-state capture (no multistate.json)
    // reads back as null, not an error.
    const legacyDir = mkdtempSync(path.join(tmpdir(), 'ac570-legacy-'))
    try {
      expect(readMultiState(legacyDir)).toBeNull()
    } finally {
      rmSync(legacyDir, { recursive: true, force: true })
    }
  }, 120000)
})

// ── a minimal non-actuating fake driver for the matrix note/legacy paths ──────
function box(x: number, y: number, width: number, height: number) {
  return { x, y, width, height }
}

/**
 * A bare {@link BrowserDriver} that returns canned signals and — when constructed
 * with `actuates=false` — reports it cannot actuate interaction states, so the
 * multi-state loop honestly holds it to `rest` and notes the skipped states.
 */
class FakeDriver implements BrowserDriver {
  constructor(private readonly actuates = true) {}
  private viewport: Viewport = { width: 1280, height: 800 }
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.viewport = viewport
  }
  async actuate(): Promise<void> {}
  canActuate(): boolean {
    return this.actuates
  }
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  }
  async query<T = unknown>(): Promise<T> {
    const signals: RawSignals = {
      viewport: { width: this.viewport.width, height: this.viewport.height },
      bands: [
        {
          box: box(0, 0, this.viewport.width, 200),
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          colorScheme: 'light',
          fontFamily: 'sans',
          textAlign: 'left',
          paddingTopPx: 0,
          paddingBottomPx: 0,
          overlay: null,
          contentAnchorRatio: 0.5,
          content: [
            {
              role: 'heading',
              text: 'Buy now',
              color: '#000000',
              fontFamily: 'sans',
              fontSizePx: 32,
              fontWeight: 700,
              lineHeightPx: 40,
              letterSpacingPx: 0,
              gradientCss: null,
              borderLeftWidthPx: 0,
              borderLeftColor: null,
              paddingLeftPx: 0,
              box: box(0, 0, 200, 40),
              borderRadiusPx: 0,
              boxShadow: null,
              a11yRole: 'heading',
              arrangement: null,
              zIndex: 0,
              filter: null,
              textShadow: null,
              maskEdge: null,
              transformRotateDeg: 0,
              transformScale: 1,
              motion: null,
            },
          ],
          items: [],
          fields: [],
        },
      ],
      colorUsage: [],
      fontFaces: [],
      typeScale: [32],
      spacingScalePx: [],
      containerMaxWidthPx: null,
      images: [],
    }
    return signals as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics(): PageDiagnostics {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html></html>'
  }
  async close(): Promise<void> {}
}
