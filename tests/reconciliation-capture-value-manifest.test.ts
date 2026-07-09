import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdCapturePage,
  readCapture,
  type Capture,
  type ContentRun,
} from '../tools/generate/src/cli/capture'

/**
 * Reconciliation UATs for story-8f33f14c — the REQ-31 / REQ-35 extension of the
 * rendered-only reference capture ([[DOC-13]]): the per-element computed value
 * manifest (AC-522), the section-level scrim + content vertical-anchor (AC-523),
 * and the `colorInferred` sentinel with the "all added fields optional" invariant
 * (AC-524). One UAT per acceptance criterion, asserting against the existing
 * implementation at its external boundaries — the `1c capture page` command
 * (`cmdCapturePage`) and the persisted `capture.json` essence (`readCapture`).
 *
 * The fidelity tests drive a REAL headless Chromium (via the Playwright driver)
 * against committed golden fixtures served from an ephemeral loopback HTTP server,
 * so every computed value (gradient sweep, left-bar, line-height, scrim opacity,
 * content anchor, inferred colour) is read out of the rendered DOM — never a
 * third-party site is contacted.
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
    if (!file.startsWith(dir)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    try {
      res.end(readFileSync(file))
    } catch {
      res.statusCode = 404
      res.end()
    }
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

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── shared golden captures (capture each fixture once, assert against it) ──────
let server: { origin: string; close: () => Promise<void> }
let cwd: string
let manifest: Capture // value-manifest.html — gradient/left-bar/anchor/scrim
let inferred: Capture // req35-inferred.html — transparent vs solid colour runs

beforeAll(async () => {
  server = await serveDir(FIXTURES)
  if (browserOk) {
    cwd = mkdtempSync(path.join(tmpdir(), 'ac-capture-vm-'))
    manifest = (await cmdCapturePage(`${server.origin}/value-manifest.html`, { cwd })).capture
    inferred = (await cmdCapturePage(`${server.origin}/req35-inferred.html`, { cwd })).capture
  }
}, 180000)

afterAll(async () => {
  await server?.close()
  if (cwd) rmSync(cwd, { recursive: true, force: true })
})

describe('1c capture page — per-element value manifest (story-8f33f14c / REQ-31 / REQ-35)', () => {
  // AC-522 — content runs record computed per-element style values.
  itB('test_UAT_AC522_content_runs_record_computed_per_element_values', () => {
    const runs = allRuns(manifest)
    const wm = runs.find((r) => r.text === 'Gigabyte Alchemy')
    const callout = runs.find((r) => r.text.includes('emerald left bar'))
    expect(wm, 'wordmark run present').toBeDefined()
    expect(callout, 'callout run present').toBeDefined()

    // The clipped horizontal text-fill gradient resolves to a concrete sweep
    // angle (90° horizontal — mechanically distinguishable from a 180° vertical)
    // with its stops flattened to hex.
    expect(wm?.gradient?.angleDeg).toBe(90)
    expect(wm?.gradient?.stops).toEqual(['#f6c453', '#d98c30'])
    // Explicit computed line-height and letter-spacing are read out in px.
    expect(wm?.lineHeightPx).toBe(80)
    expect(wm?.letterSpacingPx).toBe(1)

    // The callout's left accent bar is captured with its painted width + colour…
    expect(callout?.borderLeft?.widthPx).toBe(4)
    expect(callout?.borderLeft?.color).toBe('#34d399')
    // …and its computed left indent, line-height, and letter-spacing in px.
    expect(callout?.paddingLeftPx).toBe(24)
    expect(callout?.lineHeightPx).toBe(28)
    expect(callout?.letterSpacingPx).toBe(0.5)
  })

  // AC-523 — per-band scrim overlay and content vertical anchor are captured.
  itB('test_UAT_AC523_section_scrim_overlay_and_content_anchor_captured', () => {
    // (1) The separate translucent full-bleed overlay div (rgba(2,6,23,0.45))
    // over the hero image is recorded as the section-level scrim on
    // background.overlay — a layer the band's own background could never reveal.
    const hero = manifest.sections[0]
    expect(hero.background.kind).toBe('image')
    expect(hero.background.overlay?.color).toBe('#020617')
    expect(hero.background.overlay?.opacity).toBeCloseTo(0.45, 2)
    // (2) The content, pushed to the bottom of the 600px hero, yields a low
    // anchor (>0.6) measured purely from geometry (flex justify-end), not from a
    // padding/flex class.
    expect(hero.layout.contentAnchorRatio).not.toBeNull()
    expect(hero.layout.contentAnchorRatio as number).toBeGreaterThan(0.6)

    // A band that paints no text has a null content anchor.
    const textless = manifest.sections.find((s) => s.content.length === 0 && s.items.length === 0)
    expect(textless, 'textless divider section present').toBeDefined()
    expect(textless?.layout.contentAnchorRatio).toBeNull()
  })

  // AC-524 — unresolvable run colour is flagged colorInferred; new fields optional.
  itB('test_UAT_AC524_unresolvable_colour_flagged_and_new_fields_optional', () => {
    // Part 1 — an unresolvable (transparent) run colour falls back to the
    // #000000/#ffffff sentinel and is flagged low-confidence; a solid, genuinely
    // painted run is not flagged.
    const runs = allRuns(inferred)
    const ghost = runs.find((r) => r.text.includes('Transparent inferred'))
    const solid = runs.find((r) => r.text.includes('Solid confident'))
    expect(ghost, 'ghost run present').toBeDefined()
    expect(solid, 'solid run present').toBeDefined()
    expect(['#000000', '#ffffff']).toContain(ghost?.color)
    expect(ghost?.colorInferred).toBe(true)
    expect(solid?.colorInferred).toBeFalsy()

    // Part 2 — a pre-REQ-31/REQ-35 bundle that omits every added field still
    // parses, and each omitted field reads back as undefined (all are optional).
    const legacyRoot = mkdtempSync(path.join(tmpdir(), 'ac524-legacy-'))
    try {
      const bundleDir = path.join(legacyRoot, 'storage', 'references', 'legacy.test', 'index')
      mkdirSync(bundleDir, { recursive: true })
      const legacy = {
        url: 'http://legacy.test/',
        host: 'legacy.test',
        path: '/',
        capturedAt: '2020-01-01T00:00:00.000Z',
        viewport: { width: 1280, height: 720 },
        theme: {
          colors: [{ hex: '#1a73e8', usage: 'accent', freq: 1 }],
          fonts: [],
          typeScale: [16],
          spacingScalePx: [],
          containerMaxWidthPx: null,
        },
        sections: [
          {
            box: { x: 0, y: 0, width: 1280, height: 200 },
            screenshot: { x: 0, y: 0, width: 1280, height: 200 },
            // background WITHOUT an overlay scrim (pre-REQ-31/35).
            background: { kind: 'color', color: '#ffffff' },
            // layout WITHOUT contentAnchorRatio (pre-REQ-31).
            layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null },
            // a content run WITHOUT any added per-element field (pre-REQ-31/35).
            content: [{ role: 'heading', text: 'Legacy headline', color: '#0f172a', fontFamily: 'Inter', fontSizePx: 32, fontWeight: 700 }],
            items: [],
          },
        ],
        assets: [],
      }
      writeFileSync(path.join(bundleDir, 'capture.json'), JSON.stringify(legacy, null, 2))

      // It loads without error and the core essence survives…
      const parsed = readCapture(bundleDir)
      const run = parsed.sections[0].content[0]
      expect(run.text).toBe('Legacy headline')
      expect(run.color).toBe('#0f172a')
      // …while every added per-element / section field is simply absent.
      expect(run.colorInferred).toBeUndefined()
      expect(run.lineHeightPx).toBeUndefined()
      expect(run.letterSpacingPx).toBeUndefined()
      expect(run.gradient).toBeUndefined()
      expect(run.borderLeft).toBeUndefined()
      expect(run.paddingLeftPx).toBeUndefined()
      expect(parsed.sections[0].background.overlay).toBeUndefined()
      expect(parsed.sections[0].layout.contentAnchorRatio).toBeUndefined()
    } finally {
      rmSync(legacyRoot, { recursive: true, force: true })
    }
  })
})
