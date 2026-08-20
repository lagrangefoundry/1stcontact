/**
 * BUG-16 — captured webfonts must actually load before the value set is measured.
 *
 * Symptom: a run's `fontLoaded` came back `false` (e.g. gigabytealchemy's
 * "Gigabyte Alchemy" / Cinzel@600) and its box metrics were measured against a
 * FALLBACK face, poisoning `font-family` AND the glyph-derived geometry. Per
 * `local = value-render(target)`, a value set captured with fallback fonts
 * reproduces the wrong thing.
 *
 * Two causes, two fixes, verified here:
 *
 *  1. Offline re-extraction (the reproduced cause). `rendered.html` references
 *     cross-origin webfonts (Google Fonts) by their live ABSOLUTE URL
 *     (`https://fonts.gstatic.com/…/X.woff2`). Those never reach the loopback
 *     server, so offline the mirrored face is never served and the @font-face
 *     fails — the run is measured against a fallback. `reextractFromBundle` now
 *     rewrites every absolute URL whose basename we mirrored to a loopback-relative
 *     `/<basename>`, making re-extraction truly self-contained (DOC-13 §9). The
 *     regression fixture uses a non-resolving `.invalid` src, so the ONLY way the
 *     face can load is via the served mirror — deterministic, no network.
 *
 *  2. Live-capture FOUT (the ticket's stated cause). The driver now re-establishes
 *     a web-font barrier (force-load each visible run's exact face + await
 *     `document.fonts.ready`) AFTER `settlePage` reveals below-fold content, and
 *     the `fontLoaded` check probes the ACTUAL painted face (real weight + the
 *     run's text), not a bare `<size> "family"` that implies weight 400.
 *
 * The real-browser UATs drive a REAL headless Chromium against committed fixtures
 * served from an ephemeral loopback server (no third-party site). A pure-function
 * UAT pins the rewrite, and a browser-independent guard pins that EXTRACT_SCRIPT
 * stayed synchronous (jsdom callers `win.eval()` it and use the result directly —
 * an async IIFE would break them).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import {
  chromiumAvailable,
  cmdCapturePage,
  EXTRACT_SCRIPT,
  reextractFromBundle,
  rewriteMirroredRefs,
  type Capture,
  type ContentRun,
  type RawSignals,
} from '../tools/generate/src/cli/capture'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const XORIGIN_BUNDLE = path.join(FIXTURES, 'bundle-xorigin-font')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
}

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

/** Every content run in a capture (band content + flattened item content). */
const allRuns = (c: Capture): ContentRun[] =>
  c.sections.flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])

const runByText = (c: Capture, text: string): ContentRun | undefined =>
  allRuns(c).find((r) => (r.text ?? '').trim() === text)

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

describe('BUG-16 — captured webfonts load before measurement', () => {
  // ── 1. Offline re-extraction serves the mirrored cross-origin face ──────────
  itB('test_UAT_AC1314_reextract_serves_mirrored_crossorigin_webfont', async () => {
    // The fixture's @font-face src is a non-resolving `.invalid` host, so the face
    // can ONLY load from the mirrored /alchemy.ttf the rewrite points it at. If the
    // rewrite were absent the face would fail and the run would read
    // `fontLoaded:false` (measured against the serif fallback).
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug16-re-'))
    try {
      const res = await reextractFromBundle(XORIGIN_BUNDLE, { cwd })
      const hero = runByText(res.capture, 'Gigabyte Alchemy')
      expect(hero, 'hero heading run re-extracted').toBeDefined()
      // BUG-16 — the run carries the FULL declared stack, not just its first
      // token: dropping the fallbacks leaves a reproduction with nothing to fall
      // back to when the primary face resolves to no font.
      expect(hero!.fontFamily).toBe('Alchemy, serif')
      // `fontLoaded` is recorded sparsely — only `false` is stored — so a resolved
      // face is "never false". The mirror loaded ⇒ not false.
      expect(hero!.fontLoaded).not.toBe(false)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  }, 120000)

  // ── 2. The rewrite itself (pure, browser-independent) ───────────────────────
  it('test_UAT_AC1314_rewrite_maps_mirrored_absolute_urls', () => {
    const mirrored = new Set(['alchemy.ttf', 'css2', '8vIJ7ww63mVu7gt79mT7PkRXMw.woff2'])
    // A mirrored cross-origin font URL is rewritten to its loopback basename.
    expect(rewriteMirroredRefs('src:url(https://fonts.gstatic.invalid/s/x/alchemy.ttf)', mirrored)).toBe(
      'src:url(/alchemy.ttf)',
    )
    // Google Fonts' stylesheet link (query string + `&amp;`) → /css2.
    expect(
      rewriteMirroredRefs('<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&amp;display=swap">', mirrored),
    ).toBe('<link href="/css2">')
    // A gstatic woff2 basename is rewritten wherever it appears.
    expect(
      rewriteMirroredRefs('url(https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2)', mirrored),
    ).toBe('url(/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2)')
    // A URL we did NOT mirror is left exactly as-is (fails as before — honest).
    expect(rewriteMirroredRefs('url(https://cdn.example.com/other.woff2)', mirrored)).toBe(
      'url(https://cdn.example.com/other.woff2)',
    )
  })

  // ── 3. Live capture: a resolvable webfont is never recorded as a fallback ────
  itB('test_UAT_AC1314_live_capture_webfont_not_fallback', async () => {
    // webfont.html declares the face only at weight 600 (the Cinzel@600 shape) and
    // places a second heading far below the fold, so the post-settle barrier is
    // exercised. Every declared face resolves locally, so no visible run may report
    // a fallback.
    const server = await serveDir(FIXTURES)
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug16-live-'))
    try {
      const { capture } = await cmdCapturePage(`${server.origin}/webfont.html`, { cwd })
      const hero = runByText(capture, 'Gigabyte Alchemy')
      const deep = runByText(capture, 'Deep Below Fold Heading')
      expect(hero?.fontFamily).toBe('Alchemy, serif')
      expect(deep?.fontFamily).toBe('Alchemy, serif')
      const fellBack = allRuns(capture).filter((r) => r.fontLoaded === false).map((r) => r.text)
      expect(fellBack).toEqual([])
    } finally {
      await server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  }, 120000)

  // ── 3b. The fontLoaded probe asks the RIGHT question (browser-free) ─────────

  /**
   * Mechanism (c) says the load check is built from the full shorthand — style +
   * the run's **real numeric weight** + size — and is passed the run's own text,
   * rather than a bare size-and-family that implies weight 400/normal. That claim
   * is about the query the probe issues, so it can be proved by supplying the
   * `document.fonts` API the probe calls and recording what it was asked. Only the
   * FontFaceSet is supplied (jsdom has none); the probe itself is the shipped code.
   *
   * This is the engine-independent half of (c): the browser UATs above prove the
   * end-to-end outcome, this proves the mechanism that produces it, and it runs
   * where no Chromium is provisioned.
   */
  it('test_UAT_AC1314_font_probe_asks_for_the_real_weight_style_and_the_runs_own_text', () => {
    const asked: Array<{ shorthand: string; text?: string }> = []
    const dom = new JSDOM(
      '<!doctype html><html><body><section class="band">' +
        '<h1 class="hero" style="font-family: Alchemy, serif; font-weight: 700; font-size: 56px; font-style: italic">Gigabyte Alchemy</h1>' +
        '<p class="plain" style="font-family: serif; font-weight: 400; font-size: 18px">Generic face</p>' +
        '</section></body></html>',
      { runScripts: 'dangerously', pretendToBeVisual: true },
    )
    const boxes: Record<string, [number, number, number, number]> = {
      band: [0, 0, 1280, 400],
      hero: [20, 40, 1240, 64],
      plain: [20, 140, 1240, 24],
    }
    dom.window.Element.prototype.getBoundingClientRect = function () {
      const b = boxes[(this as Element).className || '']
      const [x, y, w, h] = b ?? [0, 0, 0, 0]
      return { x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} } as unknown as DOMRect
    }
    Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
    Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 1600 })
    // The FontFaceSet the probe queries: record every question, and answer "not
    // loaded" so the honest-reporting half is exercised too.
    Object.defineProperty(dom.window.document, 'fonts', {
      configurable: true,
      value: {
        check(shorthand: string, text?: string) {
          asked.push({ shorthand, text })
          return false
        },
      },
    })
    const signals = (dom.window as unknown as { eval(s: string): unknown }).eval(EXTRACT_SCRIPT) as RawSignals
    const runs = signals.bands.flatMap((b) => b.content)

    // The named face was probed with the FULL shorthand — italic, the real 700,
    // and the run's size — not a bare `56px "Alchemy"` implying 400/normal.
    const query = asked.find((a) => a.shorthand.includes('Alchemy'))
    expect(query, `the named face was probed; asked: ${JSON.stringify(asked)}`).toBeDefined()
    expect(query!.shorthand).toContain('italic')
    expect(query!.shorthand).toContain('700')
    expect(query!.shorthand).toContain('56px')
    expect(query!.shorthand).not.toMatch(/\b400\b/)
    // …and it was passed the run's own text, so a subsetted webfont is judged only
    // on the glyphs it actually renders.
    expect(query!.text).toBe('Gigabyte Alchemy')

    // A generic keyword needs no load and is never probed at all.
    expect(asked.some((a) => a.shorthand.includes('serif"'))).toBe(false)

    // The FontFaceSet said "not loaded", so the run reports it honestly rather
    // than assuming true — the false-`true` this mechanism exists to prevent.
    const hero = runs.find((r) => r.text.trim() === 'Gigabyte Alchemy')
    expect(hero?.fontLoaded).toBe(false)
    // The generic-face run is not dragged down with it.
    expect(runs.find((r) => r.text.trim() === 'Generic face')?.fontLoaded).not.toBe(false)
  })

  // ── 4. EXTRACT_SCRIPT stays synchronous (jsdom contract) ────────────────────
  it('test_UAT_AC1314_extract_script_stays_synchronous', () => {
    // The font barrier lives in the DRIVER, never inside EXTRACT_SCRIPT, because
    // jsdom callers `win.eval(EXTRACT_SCRIPT)` and consume the result directly — an
    // async IIFE would hand them a Promise and break them. Pin the contract.
    expect(() => new Function(`return ${EXTRACT_SCRIPT}`)).not.toThrow()
    expect(EXTRACT_SCRIPT.trimStart().startsWith('(async')).toBe(false)
    expect(EXTRACT_SCRIPT.trimStart().startsWith('(()')).toBe(true)
  })

  // ── 5. The FULL declared stack round-trips into the reproduction's CSS ───────
  itB('test_UAT_AC1314_full_font_stack_reaches_rendered_css', async () => {
    // Capturing only the primary family drops every fallback. An unmatched family
    // name is still valid CSS — it just resolves to no font — so a reproduction
    // emitting the lone first token has nothing left to fall back to and silently
    // paints the document default (this rendered gigabytealchemy.ai in serif:
    // Tailwind's stack led with `ui-sans-serif`, which the render engine did not
    // resolve). The stack must survive capture → fold → render intact.
    const server = await serveDir(FIXTURES)
    const cwd = mkdtempSync(path.join(tmpdir(), 'bug16-stack-'))
    try {
      const { capture } = await cmdCapturePage(`${server.origin}/webfont.html`, { cwd })
      const hero = runByText(capture, 'Gigabyte Alchemy')
      expect(hero?.fontFamily).toBe('Alchemy, serif')
      // The primary token is still recoverable — @font-face matching keys on it.
      expect(hero?.fontFamily.split(',')[0].trim()).toBe('Alchemy')
      // …and a fallback genuinely survives, which is the whole point.
      expect(hero!.fontFamily.split(',').length).toBeGreaterThan(1)
    } finally {
      await server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  }, 120000)
})
