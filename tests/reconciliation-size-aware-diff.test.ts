import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdCapturePage,
  cmdDiff,
  cmdValuesDiff,
  ladderScreenshotPath,
  RESPONSIVE_VIEWPORTS,
  run,
  VIEWPORTS,
  writeMultiState,
  writeRasterPng,
  type BrowserDriver,
  type CapturedResponse,
  type MultiStateCapture,
  type Raster,
  type RawSignals,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-16f2793c — size-aware diffing.
 *
 * Both fidelity commands gain an optional `--size mobile|tablet|desktop` selector
 * that compares a reproduction against the reference *at that viewport width*:
 *   • `values-diff --size` reads the reference from the persisted ladder
 *     (`multistate.json`) at the width and diffs a same-width comparison.
 *   • `diff --size` (pixel) pairs the reproduction shot against the bundle's
 *     same-width reference screenshot (`screenshot-<width>.png`).
 *   • Missing reference data fails loud with re-capture guidance rather than
 *     silently falling back to a desktop comparison.
 *   • Capture persists one per-width reference screenshot per ladder rung, keeping
 *     the value matrix free of image bytes.
 *
 * These are pure/offline: the reference ladder is authored in-memory, the actual
 * side is injected as a manifest or a pre-shot PNG, and capture is driven through
 * a fake BrowserDriver — no real browser is launched.
 */

// ── shared temp-dir plumbing ─────────────────────────────────────────────────

const tmpDirs: string[] = []
function tmp(prefix = 'ac-recon-'): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Write an actual-side manifest to a temp file and return its path. */
function writeManifest(m: ValueManifest): string {
  const file = path.join(tmp(), 'actual.json')
  writeFileSync(file, JSON.stringify(m))
  return file
}

/** A body element carrying a box, so a width delta reads as a `size` delta. */
function elWithBox(text: string, width: number): ValueElement {
  return {
    role: 'body',
    text,
    color: '#000000',
    fontFamily: 'sans',
    fontSizePx: 18,
    fontWeight: 400,
    box: { x: 0, y: 0, width, height: 40 },
  }
}

/** A reference manifest whose `source` encodes the width the diff selected. */
function refManifestAtWidth(width: number, wordmarkWidth: number): ValueManifest {
  return {
    source: `ref@chromium:${width}:rest`,
    elements: [elWithBox('Wordmark', wordmarkWidth)],
    sections: [],
  }
}

/** A ladder bundle carrying one rest/chromium projection per (width → wordmark-width). */
function ladderBundle(rungs: Array<{ viewport: Viewport; wordmarkWidth: number }>): string {
  const dir = tmp('ac-ladder-')
  const projections: StateProjection[] = rungs.map(({ viewport, wordmarkWidth }) => ({
    engine: 'chromium',
    viewport,
    state: 'rest',
    manifest: refManifestAtWidth(viewport.width, wordmarkWidth),
  }))
  const matrix: MultiStateCapture = { url: 'ref', projections, notes: [] }
  writeMultiState(dir, matrix)
  return dir
}

/** A flat solid-grey raster of the given size. */
function solid(w: number, h: number, g: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(g)
  return { data, width: w, height: h, channels: 3 }
}

// ── AC-639 — values-diff --size compares at the selected viewport width ───────

describe('story-16f2793c — values-diff --size compares at the selected width', () => {
  it('test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width', async () => {
    // A wordmark fixed at 256px in the reproduction: it matches the reference at
    // the desktop rung (256px) but the reference reflows to 75px on mobile. The
    // mobile diff must read the reference's mobile-width value and flag the delta;
    // the desktop diff must read the desktop-width value and report it clean.
    const dir = ladderBundle([
      { viewport: VIEWPORTS.mobile, wordmarkWidth: 75 },
      { viewport: VIEWPORTS.desktop, wordmarkWidth: 256 },
    ])
    const actual = writeManifest({ source: 'draft:x', elements: [elWithBox('Wordmark', 256)], sections: [] })

    const mobile = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'mobile' })
    const desktop = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'desktop' })

    // The reference values came from the ladder at the selected width…
    expect(mobile.expectedSource).toBe(`ref@chromium:${VIEWPORTS.mobile.width}:rest`)
    expect(desktop.expectedSource).toBe(`ref@chromium:${VIEWPORTS.desktop.width}:rest`)
    // …so the %-vs-fixed reflow flags at mobile (75 ⇄ 256)…
    expect(mobile.deltas.some((d) => d.text.includes('Wordmark') && d.property === 'size')).toBe(true)
    // …while the identical run at desktop reports the same node clean (256 ⇄ 256).
    expect(
      desktop.deltas.some((d) => d.text.includes('Wordmark') && (d.property === 'size' || d.property === 'position')),
    ).toBe(false)
  })
})

// ── AC-640 — omitting --size preserves the single-width (desktop) path ────────

describe('story-16f2793c — omitting --size keeps the single-width default path', () => {
  it('test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands', async () => {
    // values-diff without --size compares against the bundle's single default
    // capture (capture.json) — no ladder read is required, so a bundle carrying
    // only capture.json (no multistate.json) still succeeds.
    const vdBundle = tmp('ac-vd-default-')
    writeFileSync(
      path.join(vdBundle, 'capture.json'),
      JSON.stringify({
        url: 'http://ref.test/',
        host: 'ref.test',
        path: '/',
        capturedAt: '2020-01-01T00:00:00.000Z',
        viewport: { width: 1280, height: 800 },
        theme: {},
        sections: [],
        assets: [],
      }),
    )
    const actualManifest = writeManifest({ source: 'draft:x', elements: [], sections: [] })
    const report = await cmdValuesDiff({ refBundleDir: vdBundle, actualManifestPath: actualManifest })
    expect(report.expectedSource).toBe('ref.test/')
    expect(report.deltas.length).toBe(0)
    // The default path read the single-width capture, not a ladder — the bundle has none.
    expect(existsSync(path.join(vdBundle, 'multistate.json'))).toBe(false)

    // pixel diff without --size compares against screenshot.full.png (the desktop
    // full-page shot) — no per-width screenshot required.
    const pxBundle = tmp('ac-px-default-')
    await writeRasterPng(solid(64, 64, 200), path.join(pxBundle, 'screenshot.full.png'))
    const work = tmp('ac-px-work-')
    const actualPng = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 200), actualPng)
    const pxReport = await cmdDiff({ ref: pxBundle, actualImagePath: actualPng, out: path.join(work, 'out') })
    expect(pxReport.ref).toBe(path.join(pxBundle, 'screenshot.full.png'))
    expect(pxReport.meanDiff).toBeCloseTo(0, 5)
  })
})

// ── AC-641 — values-diff --size with no persisted ladder fails loud ───────────

describe('story-16f2793c — values-diff --size fails loud with no ladder', () => {
  it('test_UAT_AC641_values_diff_size_fails_loudly_when_bundle_has_no_ladder', async () => {
    // A bundle predating multi-viewport capture has no multistate.json. --size must
    // halt with a re-capture instruction rather than silently compare against desktop.
    const empty = tmp('ac-noladder-')
    const actual = writeManifest({ source: 'draft:x', elements: [], sections: [] })
    const out = path.join(tmp('ac-noladder-out-'), 'report.json')
    await expect(
      cmdValuesDiff({ refBundleDir: empty, actualManifestPath: actual, size: 'tablet', out }),
    ).rejects.toThrow(/multistate\.json[\s\S]*re-capture/i)
    // No report was written — the command produced no diff output.
    expect(existsSync(out)).toBe(false)
  })
})

// ── AC-642 — values-diff --size at an uncaptured width names available widths ──

describe('story-16f2793c — values-diff --size names the widths the ladder carries', () => {
  it('test_UAT_AC642_values_diff_size_fails_loudly_and_names_available_widths', async () => {
    // A ladder that only ever reached mobile cannot answer a desktop diff. The error
    // must name both the requested width and the widths the ladder does carry.
    const dir = ladderBundle([{ viewport: VIEWPORTS.mobile, wordmarkWidth: 75 }])
    const actual = writeManifest({ source: 'draft:x', elements: [], sections: [] })
    await expect(
      cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'desktop' }),
    ).rejects.toThrow(
      new RegExp(`no projection at width ${VIEWPORTS.desktop.width}px[\\s\\S]*${VIEWPORTS.mobile.width}`),
    )
  })
})

// ── AC-643 — pixel diff --size pairs against the same-width screenshot ─────────

describe('story-16f2793c — pixel diff --size pairs against the same-width reference', () => {
  it('test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference', async () => {
    // The bundle carries a per-width tablet screenshot (grey 10) plus the legacy
    // desktop full-page shot (grey 200). A tablet reproduction (grey 10) must diff
    // against the tablet reference, so the desktop-only difference cannot contaminate.
    const bundle = tmp('ac-px-select-')
    await writeRasterPng(solid(64, 64, 10), ladderScreenshotPath(bundle, VIEWPORTS.tablet.width))
    await writeRasterPng(solid(64, 64, 200), path.join(bundle, 'screenshot.full.png'))

    const work = tmp('ac-px-select-work-')
    const actual = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 10), actual)

    const report = await cmdDiff({
      ref: bundle,
      actualImagePath: actual,
      size: 'tablet',
      out: path.join(work, 'out'),
    })
    // The reference used is the tablet per-width screenshot, not screenshot.full.png.
    expect(report.ref).toBe(ladderScreenshotPath(bundle, VIEWPORTS.tablet.width))
    // grey-10 actual ⇄ grey-10 tablet ref → clean; a desktop fallback (grey 200)
    // would have produced a mean of ~190.
    expect(report.meanDiff).toBeCloseTo(0, 5)
  })
})

// ── AC-644 — pixel diff --size fails loud without a same-width screenshot ──────

describe('story-16f2793c — pixel diff --size fails loud without a same-width shot', () => {
  it('test_UAT_AC644_pixel_diff_size_fails_loudly_without_same_width_reference', async () => {
    // A bundle with only the desktop shot (predates per-viewport screenshots) must
    // NOT silently diff a mobile render against desktop — it fails naming the missing
    // same-width screenshot and re-capture as the remedy, and writes no diff output.
    const bundle = tmp('ac-px-stale-')
    await writeRasterPng(solid(64, 64, 200), path.join(bundle, 'screenshot.full.png'))
    const work = tmp('ac-px-stale-work-')
    const actual = path.join(work, 'actual.png')
    await writeRasterPng(solid(64, 64, 10), actual)
    const out = path.join(work, 'out')

    await expect(cmdDiff({ ref: bundle, actualImagePath: actual, size: 'mobile', out })).rejects.toThrow(
      new RegExp(`screenshot-${VIEWPORTS.mobile.width}\\.png[\\s\\S]*re-capture`, 'i'),
    )
    // No diff artifacts were written.
    expect(existsSync(path.join(out, 'regions.json'))).toBe(false)
  })
})

// ── AC-645 — an unrecognized --size value is rejected naming the vocabulary ────

describe('story-16f2793c — an invalid --size is rejected with the accepted names', () => {
  it('test_UAT_AC645_invalid_size_rejected_naming_accepted_vocabulary', async () => {
    // Both diff commands reject a --size outside {mobile,tablet,desktop}: the error
    // names the rejected value and the accepted vocabulary, and no report is written.
    for (const command of ['values-diff', 'diff']) {
      const refDir = tmp('ac-invalid-ref-')
      const out = path.join(tmp('ac-invalid-out-'), 'report.json')
      const argv = [command, 'site', '--ref', refDir, '--size', 'phone', '--out', out]
      await expect(run(argv)).rejects.toThrow(/phone/)
      await expect(run(argv)).rejects.toThrow(/mobile\|tablet\|desktop/)
      // The command produced no diff report.
      expect(existsSync(out)).toBe(false)
    }
  })
})

// ── AC-647 — capture persists a per-width screenshot; matrix stays byte-free ───

/** RawSignals for a single-band fake page (mirrors the capture seam fixture). */
const FAKE_SIGNALS: RawSignals = {
  viewport: { width: 800, height: 600 },
  bands: [
    {
      box: { x: 0, y: 0, width: 800, height: 300 },
      backgroundColor: '#101820',
      backgroundImage: 'none',
      colorScheme: 'dark',
      fontFamily: 'Inter',
      textAlign: 'center',
      paddingTopPx: 40,
      paddingBottomPx: 40,
      content: [
        { role: 'heading', text: 'Fake Hero', color: '#ffffff', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 700 },
      ],
      items: [],
    },
  ],
  colorUsage: [
    { hex: '#ffffff', usage: 'text', freq: 1 },
    { hex: '#101820', usage: 'background', freq: 1 },
  ],
  fontFaces: [],
  typeScale: [40],
  spacingScalePx: [40],
  containerMaxWidthPx: 720,
  images: [],
}

/** A fake driver whose screenshot bytes carry an ASCII marker, so a test can prove
 *  the image bytes land in the per-width PNG siblings and never in the JSON matrix. */
class MarkerScreenshotDriver implements BrowserDriver {
  async navigate(): Promise<void> {}
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    return new TextEncoder().encode(`IMGBYTES:${viewport?.width ?? 'full'}`)
  }
  async query<T>(): Promise<T> {
    return FAKE_SIGNALS as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>Fake Hero</body></html>'
  }
  async close(): Promise<void> {}
}

describe('story-16f2793c — capture persists per-width reference screenshots', () => {
  it('test_UAT_AC647_capture_persists_per_width_screenshot_and_matrix_has_no_image_bytes', async () => {
    const cwd = tmp('ac-capture-')
    const res = await cmdCapturePage('http://fixture.test/', {
      cwd,
      driverFactory: async () => new MarkerScreenshotDriver(),
      isEngineAvailable: async () => true,
    })
    const bundleDir = res.bundleDir

    // The default desktop shot is present…
    expect(existsSync(path.join(bundleDir, 'screenshot.full.png'))).toBe(true)
    // …alongside one distinct per-width reference screenshot for each ladder rung.
    for (const vp of RESPONSIVE_VIEWPORTS) {
      expect(existsSync(ladderScreenshotPath(bundleDir, vp.width)), `screenshot-${vp.width}.png present`).toBe(true)
    }

    // The persisted value matrix carries no embedded image bytes…
    const matrix = readFileSync(path.join(bundleDir, 'multistate.json'), 'utf8')
    expect(matrix).not.toContain('IMGBYTES')
    // …the image bytes live in the per-width PNG siblings instead.
    const shotBytes = readFileSync(ladderScreenshotPath(bundleDir, RESPONSIVE_VIEWPORTS[0].width))
    expect(new TextDecoder().decode(shotBytes)).toContain('IMGBYTES')
  })
})
