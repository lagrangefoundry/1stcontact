import { describe, expect, it, afterEach } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  captureLadderScreenshots,
  writeLadderScreenshots,
  readLadderScreenshotPath,
  ladderScreenshotPath,
  type BrowserDriver,
  type CapturedResponse,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-61 — per-viewport reference screenshots.
 *
 * The multi-state pass records per-width manifests but no images, so `1c diff`
 * only ever had one desktop screenshot to compare against. This pass shoots the
 * ladder into `screenshot-<width>.png` sibling files, giving the size-aware pixel
 * diff a same-width reference. Driven by a fake BrowserDriver — no real browser.
 */

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47]

/** A fake driver that records the viewport it was sized to and encodes the width
 * into its screenshot bytes, so a test can prove each shot was taken at its width. */
class WidthEncodingDriver implements BrowserDriver {
  navigatedTo: Viewport[] = []
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.navigatedTo.push(viewport)
  }
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    const w = viewport?.width ?? 0
    return new Uint8Array([...PNG_SIG, (w >> 8) & 0xff, w & 0xff])
  }
  async query<T = unknown>(): Promise<T> {
    return null as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return ''
  }
  async close(): Promise<void> {}
}

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

const LADDER: Viewport[] = [
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]

describe('REQ-61 — captureLadderScreenshots shoots one full-page screenshot per width', () => {
  it('test_UAT_FC_REQ-61_captureLadderScreenshots_shoots_each_width', async () => {
    const driver = new WidthEncodingDriver()
    const shots = await captureLadderScreenshots('http://fixture.test/', {
      viewports: LADDER,
      driverFactory: async () => driver,
    })
    // One shot per ladder rung, in order, each sized to its width.
    expect(shots.map((s) => s.viewport.width)).toEqual([375, 768, 1280])
    expect(driver.navigatedTo.map((v) => v.width)).toEqual([375, 768, 1280])
    // The bytes were produced at that width (the driver encodes width into them),
    // proving the screenshot was taken sized, not at a single default.
    for (const shot of shots) {
      const encoded = (shot.bytes[4] << 8) | shot.bytes[5]
      expect(encoded).toBe(shot.viewport.width)
    }
  })
})

describe('REQ-61 — ladder screenshots round-trip through the bundle', () => {
  it('test_UAT_FC_REQ-61_ladder_screenshots_roundtrip_to_bundle', async () => {
    const bundle = mkdtempSync(path.join(tmpdir(), 'req61-shots-'))
    dirs.push(bundle)
    const driver = new WidthEncodingDriver()
    const shots = await captureLadderScreenshots('http://fixture.test/', {
      viewports: LADDER,
      driverFactory: async () => driver,
    })
    const written = writeLadderScreenshots(bundle, shots)
    // A file per width, named screenshot-<width>.png.
    expect(written).toContain(ladderScreenshotPath(bundle, 768))
    expect(existsSync(ladderScreenshotPath(bundle, 768))).toBe(true)
    // The resolver returns the path for a width present in the bundle…
    expect(readLadderScreenshotPath(bundle, 1280)).toBe(ladderScreenshotPath(bundle, 1280))
    // …and null for a width the ladder never shot (so the pixel diff fails loudly).
    expect(readLadderScreenshotPath(bundle, 999)).toBeNull()
    // The persisted bytes match what was shot (width encoded in the PNG stand-in).
    const bytes = readFileSync(ladderScreenshotPath(bundle, 375))
    expect((bytes[4] << 8) | bytes[5]).toBe(375)
  })
})
