import { afterAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdNew,
  cmdShot,
  createPlaywrightDriver,
  editAssetAdd,
  VIEWPORTS,
  type BrowserDriver,
  type CapturedResponse,
  type Viewport,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-13 — `1c shot`, the page screenshot primitive ([[DOC-13]] §6):
 * the AI's *eyes*. The `--url` and viewport tests drive a fake {@link
 * BrowserDriver} (proving the CF-shaped seam is swappable and the viewport
 * mapping is deterministic without a browser). The draft-assets fidelity test
 * drives a REAL headless Chromium against our own rendered+served draft — the
 * only faithful way to prove the missing-asset bug is fixed: `/assets/` images
 * must actually paint when the page is served over loopback.
 */

const FIXTURE_PNG = fileURLToPath(new URL('./fixtures/capture/logo.png', import.meta.url))
const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10]

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req13-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/**
 * A fake driver that records what it was asked to do and returns a valid PNG
 * whose width is encoded in the pixel dimensions field — enough to assert the
 * seam wiring and viewport mapping without launching a browser.
 */
class FakeDriver implements BrowserDriver {
  navigatedUrl?: string
  shotViewport?: Viewport
  async navigate(url: string): Promise<void> {
    this.navigatedUrl = url
  }
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    this.shotViewport = viewport
    const w = viewport?.width ?? 0
    return new Uint8Array([...PNG_SIG, (w >> 8) & 0xff, w & 0xff])
  }
  async query<T = unknown>(): Promise<T> {
    return null as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  async content(): Promise<string> {
    return ''
  }
  async close(): Promise<void> {}
}

/** Create a site whose header logo is an `<img src="/assets/logo.png">`. */
function siteWithImageLogo(cwd: string, slug: string): void {
  cmdNew(slug, { cwd })
  // Register a real PNG under the draft's assets/ so render copies it through.
  const staged = path.join(cwd, 'logo.png')
  copyFileSync(FIXTURE_PNG, staged)
  editAssetAdd(slug, staged, { cwd, as: 'logo.png' })
  // Point the header logo at the served absolute path — the exact shape that
  // used to render blank when the page couldn't reach its own assets.
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules[0].content.logo = { id: 'logo.png', src: '/assets/logo.png', alt: 'Logo' }
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe('1c shot — page screenshot primitive (REQ-13)', () => {
  itB('test_UAT_FC_REQ-13_shot_draft_assets_load', async () => {
    const cwd = freshCwd()
    siteWithImageLogo(cwd, 'acme')
    const out = path.join(cwd, 'draft-shot.png')

    // Wrap the real Playwright driver so we can assert, on the served page, that
    // every referenced image actually painted (naturalWidth > 0) — not the
    // blank-screenshot bug where `/assets/` couldn't resolve.
    let imagesPainted = false
    const factory = async (): Promise<BrowserDriver> => {
      const real = await createPlaywrightDriver()
      return {
        async navigate(url: string) {
          await real.navigate(url)
          imagesPainted = await real.query<boolean>(
            'document.images.length > 0 && Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0)',
          )
        },
        screenshot: (vp?: Viewport) => real.screenshot(vp),
        query: <T>(s: string) => real.query<T>(s),
        responses: () => real.responses(),
        content: () => real.content(),
        close: () => real.close(),
      }
    }

    const res = await cmdShot({ cwd, slug: 'acme', source: 'draft', viewport: 'desktop', out, driverFactory: factory })

    // The served draft reached its own `/assets/logo.png` and painted it.
    expect(imagesPainted).toBe(true)
    // A genuine, non-blank PNG landed at the requested path.
    expect(existsSync(res.outFile)).toBe(true)
    const png = readFileSync(res.outFile)
    expect([...png.subarray(0, 8)]).toEqual(PNG_SIG)
    // Full-page shot width == the desktop preset (IHDR width, bytes 16–20 BE).
    expect(png.readUInt32BE(16)).toBe(VIEWPORTS.desktop.width)
  }, 120000)

  it('test_UAT_FC_REQ-13_shot_url', async () => {
    const cwd = freshCwd()
    const out = path.join(cwd, 'url-shot.png')
    let fake!: FakeDriver
    const res = await cmdShot({
      url: 'http://fixture.test/page',
      out,
      driverFactory: async () => {
        fake = new FakeDriver()
        return fake
      },
    })

    // `--url` drives the driver at exactly the requested URL and writes a PNG.
    expect(fake.navigatedUrl).toBe('http://fixture.test/page')
    expect(res.url).toBe('http://fixture.test/page')
    expect(res.outFile).toBe(path.resolve(out))
    expect(existsSync(out)).toBe(true)
    expect([...readFileSync(out).subarray(0, 8)]).toEqual(PNG_SIG)
  })

  it('test_UAT_FC_REQ-13_deterministic_viewport', async () => {
    const cwd = freshCwd()
    // Each named viewport maps to fixed dimensions, stably across invocations.
    for (const name of ['mobile', 'tablet', 'desktop'] as const) {
      const runs: Viewport[] = []
      for (let i = 0; i < 2; i++) {
        let fake!: FakeDriver
        const res = await cmdShot({
          url: 'http://fixture.test/page',
          out: path.join(cwd, `${name}-${i}.png`),
          viewport: name,
          driverFactory: async () => {
            fake = new FakeDriver()
            return fake
          },
        })
        expect(res.viewport).toEqual(VIEWPORTS[name])
        expect(fake.shotViewport).toEqual(VIEWPORTS[name])
        runs.push(fake.shotViewport!)
      }
      // Deterministic: the two runs handed the driver identical dimensions.
      expect(runs[0]).toEqual(runs[1])
    }
    // Presets are distinct widths (mobile < tablet < desktop).
    expect(VIEWPORTS.mobile.width).toBeLessThan(VIEWPORTS.tablet.width)
    expect(VIEWPORTS.tablet.width).toBeLessThan(VIEWPORTS.desktop.width)
  })
})
