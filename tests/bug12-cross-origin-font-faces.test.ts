/**
 * BUG-12 — captured cross-origin `@font-face` rules must reach the fold.
 *
 * The in-page extractor reads faces from the live CSSOM, but `styleSheet.cssRules`
 * throws a `SecurityError` on any *cross-origin* sheet (Google Fonts' `css2`, most
 * CDN font stylesheets), so `signals.fontFaces` comes back empty even though the
 * face's `.woff2` was intercepted and mirrored. The family→substance handle then
 * dangled: `theme.fonts[*].files` stayed `[]`, so the fold's resource table was
 * starved (`doc.resources: null`), no `@font-face` emitted, and the named face
 * rendered as a serif fallback.
 *
 * These UATs drive the capture pipeline with a fake driver whose CSSOM is blind
 * (`fontFaces: []`) but whose intercepted responses carry the stylesheet *bytes* +
 * the mirrored woff2 — the exact Google-Fonts shape. They prove the byte-parse
 * recovers the family→file mapping and that it flows through to the folded L1
 * document's resource table.
 */
import { describe, expect, it } from 'vitest'
import {
  cmdCapturePage,
  runCapturePipeline,
  type BrowserDriver,
  type CapturedResponse,
  type RawSignals,
} from '../tools/generate/src/cli/capture'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const GSTATIC_CINZEL = 'https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2'
const GOOGLE_CSS = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600&display=swap'

/** A cross-origin Google-Fonts-shaped stylesheet: family + weight + a woff2 src. */
const CINZEL_CSS = `/* latin */
@font-face {
  font-family: 'Cinzel';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(${GSTATIC_CINZEL}) format('woff2');
  unicode-range: U+0000-00FF;
}
`

/** Signals whose CSSOM is blind (`fontFaces: []`) but whose one band paints `family`. */
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
            // A painted box so the fold emits a real text leaf (a geometry-less run
            // is signal-dropped) — the leaf is what makes the family "painted".
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
    fontFaces: [], // ← the cross-origin CSSOM blindness this bug is about
    typeScale: [40],
    spacingScalePx: [40],
    containerMaxWidthPx: 720,
    images: [],
  }
}

/** A fake driver returning fixed signals + a fixed intercepted-response set. */
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

/** The two intercepted responses of a Google-Fonts page: the CSS bytes + the woff2. */
function googleFontResponses(): CapturedResponse[] {
  return [
    { url: GOOGLE_CSS, status: 200, contentType: 'text/css; charset=utf-8', body: new TextEncoder().encode(CINZEL_CSS) },
    { url: GSTATIC_CINZEL, status: 200, contentType: 'font/woff2', body: new Uint8Array([119, 79, 70, 50, 0, 1, 2, 3]) },
  ]
}

describe('BUG-12 — cross-origin @font-face reaches the fold', () => {
  it('test_UAT_FC_BUG-12_cross_origin_face_bytes_populate_theme_files', async () => {
    const result = await runCapturePipeline('http://example.test/', {
      driverFactory: fakeDriver(signalsPainting('Cinzel'), googleFontResponses()),
    })
    // The painted family now carries the mirrored woff2 as its substance, recovered
    // from the stylesheet bytes even though the CSSOM reported no faces.
    const cinzel = result.capture.theme.fonts.find((f) => f.family === 'Cinzel')
    expect(cinzel, 'Cinzel present in theme fonts').toBeDefined()
    expect(cinzel!.files.length).toBeGreaterThan(0)
    // The file is the actual mirrored local asset, not the remote URL.
    expect(cinzel!.files[0]).toMatch(/^assets\/.*\.woff2$/)
  })

  it('test_UAT_FC_BUG-12_unmirrored_face_contributes_no_files', async () => {
    // The CSS references Cinzel, but its woff2 was never intercepted (CDN miss / 404):
    // no mirrored asset ⇒ the family honestly contributes no files, as before.
    const cssOnly: CapturedResponse[] = [
      { url: GOOGLE_CSS, status: 200, contentType: 'text/css', body: new TextEncoder().encode(CINZEL_CSS) },
    ]
    const result = await runCapturePipeline('http://example.test/', {
      driverFactory: fakeDriver(signalsPainting('Cinzel'), cssOnly),
    })
    const cinzel = result.capture.theme.fonts.find((f) => f.family === 'Cinzel')
    expect(cinzel).toBeDefined()
    expect(cinzel!.files).toEqual([])
  })

  it('test_UAT_FC_BUG-12_same_origin_cssom_faces_still_wired', async () => {
    // Union, not replace: a same-origin face the CSSOM *did* read still connects
    // to its mirrored file alongside the byte-recovered cross-origin faces.
    const signals = signalsPainting('Cinzel')
    signals.fontFaces = [{ family: 'Cinzel', srcUrls: [GSTATIC_CINZEL], weight: 600 }]
    const result = await runCapturePipeline('http://example.test/', {
      driverFactory: fakeDriver(signals, googleFontResponses()),
    })
    const cinzel = result.capture.theme.fonts.find((f) => f.family === 'Cinzel')
    expect(cinzel!.files.length).toBe(1) // deduped, not doubled by the union
    expect(cinzel!.files[0]).toMatch(/^assets\/.*\.woff2$/)
  })

  it('test_UAT_FC_BUG-12_capture_folds_face_into_l1_resources', async () => {
    // Full flow: cross-origin @font-face bytes → theme → fold → l1.resources.fonts,
    // so the renderer's @font-face (REQ-90) finally has substance to bind. The fold
    // populates the table only for families a text leaf paints (REQ-90), so this
    // asserts the whole handle→substance chain end-to-end, not just the theme wire.
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug12-'))
    try {
      const res = await cmdCapturePage('http://example.test/', fsReferenceStore(cwd), {
      driverFactory: fakeDriver(signalsPainting('Cinzel'), googleFontResponses()),
      isEngineAvailable: async () => true,
    })
      const fonts = res.l1.resources?.fonts ?? []
      expect(fonts.map((f) => f.family)).toContain('Cinzel')
      const cinzel = fonts.find((f) => f.family === 'Cinzel')!
      expect(cinzel.src).toMatch(/^assets\/.*\.woff2$/)
      expect(cinzel.weight).toBe(600)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
