import { afterAll, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  chromiumAvailable,
  cmdNew,
  cmdPublish,
  cmdShot,
  createPlaywrightDriver,
  editAssetAdd,
  VIEWPORTS,
  type BrowserDriver,
  type CapturedResponse,
  type Viewport,
  type ViewportName,
} from '../tools/generate/src/cli'
import { distDir } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-3ae5b34e — `1c shot`, the page screenshot
 * primitive (REQ-13, [[DOC-13]] §6): the AI's *eyes* over its own rendered
 * output or any URL. One UAT per acceptance criterion (AC-469 … AC-474).
 *
 * These prove behavior that ALREADY EXISTS: the ACs are the spec, the code is
 * evidence of current state. Every deterministic assertion drives an injected
 * fake {@link BrowserDriver} (no real browser); only the asset-fidelity AC
 * (AC-469) drives a real headless Chromium, since painting `/assets/` images is
 * the only faithful proof the served-page seam fixed the blank-screenshot bug.
 */

const FIXTURE_PNG = fileURLToPath(new URL('./fixtures/capture/logo.png', import.meta.url))
const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10]

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'story3ae-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/**
 * A fake driver that records what it was asked to do and returns a valid PNG
 * whose viewport width is encoded in the pixel-dimensions field — enough to
 * assert seam wiring, viewport mapping, and channel/URL routing without a
 * browser.
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

/** Factory that returns a fresh FakeDriver and hands it back for inspection. */
function fakeFactory(): { factory: () => Promise<BrowserDriver>; last: () => FakeDriver } {
  let fake!: FakeDriver
  return {
    factory: async () => {
      fake = new FakeDriver()
      return fake
    },
    last: () => fake,
  }
}

/** Create a site whose header logo is an `<img src="/assets/logo.png">`. */
function siteWithImageLogo(cwd: string, slug: string): void {
  cmdNew(slug, { cwd })
  const staged = path.join(cwd, 'logo.png')
  copyFileSync(FIXTURE_PNG, staged)
  editAssetAdd(slug, staged, { cwd, as: 'logo.png' })
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.modules[0].content.logo = { id: 'logo.png', src: '/assets/logo.png', alt: 'Logo' }
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe('story-3ae5b34e — 1c shot page screenshot primitive', () => {
  // AC-469 (acceptance_criterion-900c206c): slug shot renders → serves over
  // loopback → screenshots the served page → non-blank PNG with `/assets/`
  // images actually painted. Requires a real browser to prove the paint.
  itB(
    'test_UAT_AC469_slug_shot_serves_and_paints_assets',
    async () => {
      const cwd = freshCwd()
      siteWithImageLogo(cwd, 'acme')
      const out = path.join(cwd, 'draft-shot.png')

      // Wrap the real driver so we can assert, on the served page, that every
      // referenced image actually painted (naturalWidth > 0) — not the
      // blank-screenshot bug where `/assets/` could not resolve.
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

      const res = await cmdShot({
        cwd,
        slug: 'acme',
        source: 'draft',
        viewport: 'desktop',
        out,
        driverFactory: factory,
      })

      // The page that was shot was the loopback-served page (not a file path) —
      // which is exactly what lets `/assets/` resolve over HTTP.
      expect(res.url).toMatch(/^http:\/\/localhost:\d+\//)
      // The served draft reached its own `/assets/logo.png` and painted it.
      expect(imagesPainted).toBe(true)
      // A genuine, non-blank PNG landed at the requested path.
      expect(existsSync(res.outFile)).toBe(true)
      const png = readFileSync(res.outFile)
      expect(png.byteLength).toBeGreaterThan(0)
      expect([...png.subarray(0, 8)]).toEqual(PNG_SIG)
      // Full-page shot width == the desktop preset (IHDR width, bytes 16–20 BE).
      expect(png.readUInt32BE(16)).toBe(VIEWPORTS.desktop.width)
    },
    120000,
  )

  // AC-470 (acceptance_criterion-4e6b9a45): `--url` screenshots the given URL
  // directly (no render/serve) and writes a PNG; the result URL == the input.
  it('test_UAT_AC470_url_shot_screenshots_arbitrary_url', async () => {
    const cwd = freshCwd()
    const out = path.join(cwd, 'url-shot.png')
    const { factory, last } = fakeFactory()

    const res = await cmdShot({ url: 'http://fixture.test/page', out, driverFactory: factory })

    // Drove the driver at exactly the requested URL — no render/serve step.
    expect(last().navigatedUrl).toBe('http://fixture.test/page')
    expect(res.url).toBe('http://fixture.test/page')
    // A PNG with non-zero bytes landed at the returned output path.
    expect(res.outFile).toBe(path.resolve(out))
    expect(existsSync(res.outFile)).toBe(true)
    const png = readFileSync(res.outFile)
    expect(png.byteLength).toBeGreaterThan(0)
    expect([...png.subarray(0, 8)]).toEqual(PNG_SIG)
  })

  // AC-471 (acceptance_criterion-73840e02): named viewport presets map to fixed,
  // deterministic widths; default is desktop; an unknown name errors.
  it('test_UAT_AC471_viewport_presets_are_deterministic_default_desktop', async () => {
    const cwd = freshCwd()

    // Each preset maps to its fixed width, stably across repeated invocations.
    const expected: Record<ViewportName, number> = { mobile: 375, tablet: 768, desktop: 1280 }
    for (const name of ['mobile', 'tablet', 'desktop'] as const) {
      const runs: Viewport[] = []
      for (let i = 0; i < 2; i++) {
        const { factory, last } = fakeFactory()
        const res = await cmdShot({
          url: 'http://fixture.test/page',
          out: path.join(cwd, `${name}-${i}.png`),
          viewport: name,
          driverFactory: factory,
        })
        expect(res.viewport.width).toBe(expected[name])
        expect(res.viewport).toEqual(VIEWPORTS[name])
        expect(last().shotViewport).toEqual(VIEWPORTS[name])
        runs.push(last().shotViewport!)
      }
      // Deterministic: both runs handed the driver identical dimensions.
      expect(runs[0]).toEqual(runs[1])
    }

    // Omitting --viewport uses the desktop preset.
    {
      const { factory } = fakeFactory()
      const res = await cmdShot({
        url: 'http://fixture.test/page',
        out: path.join(cwd, 'default.png'),
        driverFactory: factory,
      })
      expect(res.viewport).toEqual(VIEWPORTS.desktop)
      expect(res.viewport.width).toBe(1280)
    }

    // Presets are distinct, ordered widths.
    expect(VIEWPORTS.mobile.width).toBeLessThan(VIEWPORTS.tablet.width)
    expect(VIEWPORTS.tablet.width).toBeLessThan(VIEWPORTS.desktop.width)

    // An unrecognized viewport name fails, naming the allowed values.
    const { factory } = fakeFactory()
    await expect(
      cmdShot({
        url: 'http://fixture.test/page',
        out: path.join(cwd, 'nope.png'),
        viewport: 'huge' as ViewportName,
        driverFactory: factory,
      }),
    ).rejects.toThrow(/mobile.*tablet.*desktop/i)
  })

  // AC-472 (acceptance_criterion-5eeec353): slug mode shoots the draft channel
  // by default and the published channel on request; the channel is reflected
  // in the default output location.
  it('test_UAT_AC472_source_channel_draft_default_published_on_request', async () => {
    // Default (no --source): the draft channel is rendered, served, and shot.
    const draftCwd = freshCwd()
    cmdNew('shopco', { cwd: draftCwd })
    const draftRes = await cmdShot({
      cwd: draftCwd,
      slug: 'shopco',
      driverFactory: fakeFactory().factory,
    })
    // The draft channel was rendered (its dist index.html exists).
    const draftDist = distDir({ cwd: draftCwd, root: 'sites' }, 'shopco', 'draft')
    expect(existsSync(path.join(draftDist, 'index.html'))).toBe(true)
    // The default output location reflects the draft channel.
    expect(draftRes.outFile).toBe(path.join(draftDist, 'shot-draft-desktop.png'))
    expect(existsSync(draftRes.outFile)).toBe(true)

    // --source published: the published channel is rendered, served, and shot.
    const pubCwd = freshCwd()
    cmdNew('shopco', { cwd: pubCwd })
    await cmdPublish('shopco', { cwd: pubCwd, message: 'v1' })
    const pubRes = await cmdShot({
      cwd: pubCwd,
      slug: 'shopco',
      source: 'published',
      driverFactory: fakeFactory().factory,
    })
    // The published channel was rendered (its dist index.html exists).
    const pubDist = distDir({ cwd: pubCwd, root: 'sites' }, 'shopco', 'published')
    expect(existsSync(path.join(pubDist, 'index.html'))).toBe(true)
    // The default output location reflects the published channel.
    expect(pubRes.outFile).toBe(path.join(pubDist, 'shot-published-desktop.png'))
    expect(existsSync(pubRes.outFile)).toBe(true)
  })

  // AC-473 (acceptance_criterion-940a2f86): output path defaults per mode and is
  // overridable with --out; the returned path is always the absolute path of the
  // file actually written.
  it('test_UAT_AC473_output_path_defaults_per_mode_and_overridable', async () => {
    // Slug mode, no --out → default under the site's rendered dist for the shot.
    const cwd = freshCwd()
    cmdNew('acme', { cwd })
    const slugDefault = await cmdShot({ cwd, slug: 'acme', driverFactory: fakeFactory().factory })
    const expectedSlug = path.join(
      distDir({ cwd, root: 'sites' }, 'acme', 'draft'),
      'shot-draft-desktop.png',
    )
    expect(slugDefault.outFile).toBe(expectedSlug)
    expect(path.isAbsolute(slugDefault.outFile)).toBe(true)
    expect(existsSync(slugDefault.outFile)).toBe(true)

    // Slug mode, explicit --out → written exactly there.
    const slugOut = path.join(cwd, 'custom-slug.png')
    const slugOverride = await cmdShot({
      cwd,
      slug: 'acme',
      out: slugOut,
      driverFactory: fakeFactory().factory,
    })
    expect(slugOverride.outFile).toBe(path.resolve(slugOut))
    expect(existsSync(slugOverride.outFile)).toBe(true)

    // URL mode, no --out → a default file in the working directory (shot.png).
    const urlCwd = freshCwd()
    const prev = process.cwd()
    process.chdir(urlCwd)
    try {
      const expectedUrlDefault = path.resolve('shot.png')
      const urlDefault = await cmdShot({
        url: 'http://fixture.test/page',
        driverFactory: fakeFactory().factory,
      })
      expect(urlDefault.outFile).toBe(expectedUrlDefault)
      expect(path.isAbsolute(urlDefault.outFile)).toBe(true)
      expect(existsSync(urlDefault.outFile)).toBe(true)
    } finally {
      process.chdir(prev)
    }

    // URL mode, explicit --out → written exactly there.
    const urlOut = path.join(urlCwd, 'custom-url.png')
    const urlOverride = await cmdShot({
      url: 'http://fixture.test/page',
      out: urlOut,
      driverFactory: fakeFactory().factory,
    })
    expect(urlOverride.outFile).toBe(path.resolve(urlOut))
    expect(existsSync(urlOverride.outFile)).toBe(true)
  })

  // AC-474 (acceptance_criterion-b707bd3a): exactly one target is required —
  // both slug and --url is a mutual-exclusivity error; neither is a
  // missing-target error; no PNG is written in either case.
  it('test_UAT_AC474_ambiguous_or_missing_target_errors_without_writing', async () => {
    const cwd = freshCwd()

    // Both slug and --url → mutual-exclusivity error, no PNG written.
    const bothOut = path.join(cwd, 'both.png')
    await expect(
      cmdShot({
        cwd,
        slug: 'acme',
        url: 'http://fixture.test/page',
        out: bothOut,
        driverFactory: fakeFactory().factory,
      }),
    ).rejects.toThrow(/not both/i)
    expect(existsSync(bothOut)).toBe(false)

    // Neither slug nor --url → missing-target error, no PNG written.
    const neitherOut = path.join(cwd, 'neither.png')
    await expect(
      cmdShot({ cwd, out: neitherOut, driverFactory: fakeFactory().factory }),
    ).rejects.toThrow(/missing/i)
    expect(existsSync(neitherOut)).toBe(false)
  })
})
