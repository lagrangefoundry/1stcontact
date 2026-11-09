import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { r2RenditionCache } from '../apps/control-app/src/image-ladder'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { imageLadder, type ImageRenderer } from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { distDir, revisionDir } from '../tools/generate/src/store/paths'
import { derivedPrefix, PUBLISHED_ROOT } from '../tools/generate/src/store/revision-model'
import { memorySiteStore } from '../tools/generate/src/store'
import { makeFsSite } from './support/site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs — story-5349d01f, the publish's delivery width ladder
 * (REQ-222): AC-2523 (filesystem leg), AC-2524, AC-2525, AC-2526, AC-2527.
 *
 * Every test drives the real publish (`publishSite`, the one implementation the
 * builder route and `1c publish` both call) against real store adapters. The
 * only stand-ins are the two external platform boundaries: the Images binding
 * (a fake renderer that records what it was asked) and the R2 bucket the
 * rendition cache sits in. AC-2523's cloud leg runs against real D1/R2 in
 * `reconciliation-publish-ladder-cloud.workers.test.ts`.
 */

const WIDTHS = [320, 1280]
const CONVENTIONAL = [320, 640, 960, 1280, 1600, 1920]

/** Bytes standing in for a JPEG; the fake renderer never decodes them. */
const HERO = new TextEncoder().encode('hero photograph bytes')
/** A file named as a PNG whose bytes the renderer cannot measure. */
const BROKEN = new TextEncoder().encode('not a png at all')

interface FakeRenderer extends ImageRenderer {
  measuredTypes: string[]
  resized: Array<{ width: number; contentType: string }>
}

/**
 * The Images binding, faked at its port. `sizeOf` decides what a picture
 * measures as (null = undecodable); `failAt` names widths whose transform fails.
 */
function fakeRenderer(
  sizeOf: (bytes: Uint8Array) => { width: number; height: number } | null,
  opts: { failAt?: number[] } = {},
): FakeRenderer {
  const measuredTypes: string[] = []
  const resized: Array<{ width: number; contentType: string }> = []
  return {
    measuredTypes,
    resized,
    measure: async (bytes, contentType) => {
      measuredTypes.push(contentType)
      return sizeOf(bytes)
    },
    resize: async (bytes, contentType, width) => {
      resized.push({ width, contentType })
      if (opts.failAt?.includes(width)) return null
      return new TextEncoder().encode(`${new TextDecoder().decode(bytes)}@${width}`)
    },
  }
}

const wide = (width: number, height = Math.round(width / 2)) => () => ({ width, height })

/** An R2 bucket, faked at the binding: what the rendition cache is handed. */
class FakeR2 {
  readonly objects = new Map<string, Uint8Array>()
  async get(key: string) {
    const bytes = this.objects.get(key)
    if (bytes === undefined) return null
    return { arrayBuffer: async () => bytes.slice().buffer }
  }
  async put(key: string, bytes: ArrayBuffer | Uint8Array) {
    this.objects.set(key, new Uint8Array(bytes as ArrayBuffer).slice())
  }
}

/** The scaffolder's home page holding one picture as an `<img>`. */
function imagePage(slug: string, src = '/assets/hero.jpg'): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [
          { kind: 'image', src, alt: 'a picture', sizing: { width: { mode: 'fixed', px: 480 } } },
        ],
      },
    },
  }
}

/** The scaffolder's home page whose only picture is a box's background. */
function backgroundPage(slug: string): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [{ kind: 'box', children: [], axes: { backgroundImageUrl: '/assets/band.jpg' } }],
      },
    },
  }
}

/** A site over the in-memory adapter. */
function memorySite(pages: Record<string, Record<string, unknown>>, assets: Record<string, Uint8Array>, slug = nextSlug('ladder')) {
  const seed = siteSeed({ slug, pages, assets })
  const store = memorySiteStore()
  store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
  return { store, slug: seed.slug }
}

/** Every file under `dir`, by path relative to it, with its bytes. */
function filesUnder(dir: string): Map<string, Buffer> {
  const found = new Map<string, Buffer>()
  const walk = (at: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(at)
    } catch {
      return
    }
    for (const name of entries) {
      const full = path.join(at, name)
      if (statSync(full).isDirectory()) walk(full)
      else found.set(path.relative(dir, full).split(path.sep).join('/'), readFileSync(full))
    }
  }
  walk(dir)
  return found
}

/** The `srcset` candidates a page names, as paths. */
function srcsetPaths(html: string): string[] {
  const attr = /srcset="([^"]+)"/.exec(html)
  expect(attr, 'the published page carries a srcset').not.toBeNull()
  return attr![1].split(', ').map((candidate) => candidate.split(' ')[0])
}

describe('story-5349d01f — the publish builds a delivery width ladder (REQ-222)', () => {
  it('test_UAT_AC2523_filesystem_and_memory_stores_hold_identical_renditions_and_the_manifest_only_feeds_the_render', async () => {
    const slug = nextSlug('ladder-port')
    const pages = { 'home.json': imagePage(slug) }
    const assets = { 'hero.jpg': HERO }

    // The same publish, same fake renderer, on the filesystem and in-memory stores.
    const fs = makeFsSite({ slug, pages, assets })
    const bare = makeFsSite({ slug, pages, assets })
    try {
      const mem = memorySite(pages, assets, slug)
      const onFs = await publishSite(fs.store, slug, { ladder: imageLadder(fakeRenderer(wide(1000))) })
      const onMem = await publishSite(mem.store, slug, { ladder: imageLadder(fakeRenderer(wide(1000))) })
      expect(onFs.published).toBe(true)
      expect(onMem.id).toBe(onFs.id)

      // Renditions went through the port, beside the rendered output, at the
      // same paths with the same bytes on both stores.
      const memDerived = mem.store.derivedRevision(slug, onMem.id) ?? new Map<string, Uint8Array>()
      expect(memDerived.size).toBe(3) // 320, 640, 960 under a 1000px source
      const fsOut = filesUnder(distDir({ cwd: fs.cwd!, root: 'sites' }, slug, 'published'))
      const fsDerived = [...fsOut.keys()].filter((k) => k.startsWith('assets/d/')).sort()
      expect(fsDerived).toEqual([...memDerived.keys()].sort())
      for (const key of fsDerived) {
        expect(Buffer.compare(fsOut.get(key)!, Buffer.from(memDerived.get(key)!)), key).toBe(0)
      }

      // A revision written without renditions reads none back.
      const plainMem = memorySite(pages, assets, slug)
      const plain = await publishSite(plainMem.store, slug, {})
      expect(plainMem.store.derivedRevision(slug, plain.id)?.size ?? 0).toBe(0)

      // The manifest fed the render: the measured dimensions are on the <img>,
      // and every candidate the page names is a rendition the revision holds.
      const html = mem.store.renderedRevision(slug, onMem.id)?.get('home.html') ?? ''
      expect(html).toContain('width="1000"')
      expect(html).toContain('height="500"')
      for (const src of srcsetPaths(html)) {
        if (src === 'assets/hero.jpg') continue
        expect(memDerived.has(src), src).toBe(true)
      }
      expect(fsOut.get('home.html')?.toString('utf8')).toBe(html)

      // ...and was never stored in the document: the frozen definition is
      // byte-identical with and without a ladder.
      const noLadder = await publishSite(bare.store, slug, {})
      const frozenWith = filesUnder(revisionDir({ cwd: fs.cwd!, root: 'sites' }, slug, onFs.id))
      const frozenWithout = filesUnder(revisionDir({ cwd: bare.cwd!, root: 'sites' }, slug, noLadder.id))
      expect([...frozenWith.keys()].sort()).toEqual([...frozenWithout.keys()].sort())
      for (const [key, bytes] of frozenWith) {
        expect(Buffer.compare(bytes, frozenWithout.get(key)!), key).toBe(0)
      }
      expect(JSON.stringify(await mem.store.readRevision(slug, onMem.id))).toBe(
        JSON.stringify(await plainMem.store.readRevision(slug, plain.id)),
      )
      expect([...frozenWith.keys()].some((k) => k.includes('assets/d/'))).toBe(false)
    } finally {
      fs.dispose()
      bare.dispose()
    }
  })

  it('test_UAT_AC2524_publish_writes_raster_renditions_under_assets_d_and_skips_vectors_animations_and_undecodable_files', async () => {
    const renderer = fakeRenderer((bytes) =>
      new TextDecoder().decode(bytes) === new TextDecoder().decode(BROKEN) ? null : { width: 2000, height: 1000 },
    )
    const { store, slug } = memorySite(
      { 'home.json': imagePage('home') },
      {
        'hero.jpg': HERO,
        'wordmark.svg': new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
        'spinner.gif': new TextEncoder().encode('GIF89a'),
        'broken.png': BROKEN,
      },
    )
    const result = await publishSite(store, slug, { ladder: imageLadder(renderer) })
    expect(result.published).toBe(true)

    // Only the raster stills were measured; SVG and GIF never reached the binding.
    expect(renderer.measuredTypes.sort()).toEqual(['image/jpeg', 'image/png'])

    // The JPEG has a full ladder under assets/d/, in its own format; the other
    // three have none.
    const derived = store.derivedRevision(slug, result.id) ?? new Map<string, Uint8Array>()
    const keys = [...derived.keys()].sort()
    expect(keys).toHaveLength(CONVENTIONAL.length)
    for (const key of keys) expect(key).toMatch(/^assets\/d\/[0-9a-f]{16}-\d+\.jpg$/)
    expect(renderer.resized.every((r) => r.contentType === 'image/jpeg')).toBe(true)

    // None of it is in the frozen definition, so a checkout restores no rendition.
    const frozen = await store.readRevision(slug, result.id)
    expect(frozen?.assets.map((a) => a.name).sort()).toEqual(
      ['broken.png', 'hero.jpg', 'spinner.gif', 'wordmark.svg'],
    )

    // A site whose only picture is a background still gets renditions.
    const band = memorySite({ 'home.json': backgroundPage('home') }, { 'band.jpg': HERO })
    const banded = await publishSite(band.store, band.slug, {
      ladder: imageLadder(fakeRenderer(wide(4000))),
    })
    const bandDerived = band.store.derivedRevision(band.slug, banded.id) ?? new Map()
    expect(bandDerived.size).toBe(CONVENTIONAL.length)

    // One width failing to render costs that width only; the publish stands.
    const flaky = memorySite({ 'home.json': imagePage('home') }, { 'hero.jpg': HERO })
    const partial = await publishSite(flaky.store, flaky.slug, {
      ladder: imageLadder(fakeRenderer(wide(2000), { failAt: [960] })),
    })
    expect(partial.published).toBe(true)
    const widths = [...(flaky.store.derivedRevision(flaky.slug, partial.id) ?? new Map()).keys()]
      .map((k) => Number(/-(\d+)\.jpg$/.exec(k)![1]))
      .sort((a, b) => a - b)
    expect(widths).toEqual(CONVENTIONAL.filter((w) => w !== 960))
    const html = flaky.store.renderedRevision(flaky.slug, partial.id)?.get('home.html') ?? ''
    expect(html).not.toContain('-960.jpg')
  })

  it('test_UAT_AC2525_renditions_are_content_addressed_and_a_republish_of_an_unchanged_picture_transforms_nothing', async () => {
    const bucket = new FakeR2()
    const cacheA = r2RenditionCache(bucket as unknown as R2Bucket, 'biz-a')
    const { store, slug } = memorySite({ 'home.json': imagePage('home') }, { 'hero.jpg': HERO })

    const first = fakeRenderer(wide(1000))
    const r1 = await publishSite(store, slug, { ladder: imageLadder(first, cacheA) })
    expect(first.resized.map((r) => r.width)).toEqual([320, 640, 960])
    const derived1 = store.derivedRevision(slug, r1.id) ?? new Map<string, Uint8Array>()
    // `<sha>-<width><ext>`, the sha over the source bytes.
    for (const key of derived1.keys()) expect(key).toMatch(/^assets\/d\/[0-9a-f]{16}-(320|640|960)\.jpg$/)

    // Edit something other than the picture and publish again: zero transforms,
    // and the new revision holds the same rendition names and bytes.
    await store.write(slug, { siteJson: starterSiteJson(slug, 'Renamed business') })
    const second = fakeRenderer(wide(1000))
    const r2 = await publishSite(store, slug, { ladder: imageLadder(second, cacheA) })
    expect(r2.published).toBe(true)
    expect(r2.id).toBe(r1.id + 1)
    expect(second.resized).toEqual([])
    const derived2 = store.derivedRevision(slug, r2.id) ?? new Map<string, Uint8Array>()
    expect([...derived2.keys()].sort()).toEqual([...derived1.keys()].sort())
    for (const [key, bytes] of derived1) expect(derived2.get(key)).toEqual(bytes)

    // New bytes: new names, new transforms.
    await store.write(slug, { assets: [{ name: 'hero.jpg', bytes: new TextEncoder().encode('a different photograph') }] })
    const third = fakeRenderer(wide(1000))
    const r3 = await publishSite(store, slug, { ladder: imageLadder(third, cacheA) })
    expect(third.resized.map((r) => r.width)).toEqual([320, 640, 960])
    const derived3 = [...(store.derivedRevision(slug, r3.id) ?? new Map()).keys()]
    for (const key of derived3) expect(derived1.has(key), key).toBe(false)

    // The cache sits under the business's own prefix, outside the published root.
    expect(bucket.objects.size).toBe(6)
    for (const key of bucket.objects.keys()) {
      expect(key.startsWith(`${derivedPrefix('biz-a')}/`), key).toBe(true)
      expect(key.startsWith(`${PUBLISHED_ROOT}/`), key).toBe(false)
    }

    // Another business's cache never answers for this one's.
    const other = memorySite({ 'home.json': imagePage('home') }, { 'hero.jpg': HERO })
    const otherRenderer = fakeRenderer(wide(1000))
    await publishSite(other.store, other.slug, {
      ladder: imageLadder(otherRenderer, r2RenditionCache(bucket as unknown as R2Bucket, 'biz-b')),
    })
    expect(otherRenderer.resized.map((r) => r.width)).toEqual([320, 640, 960])
  })

  it('test_UAT_AC2526_ladder_is_the_conventional_widths_strictly_below_the_source_and_never_upscales', async () => {
    const ladderWidths = async (sourceWidth: number): Promise<number[]> => {
      const { store, slug } = memorySite({ 'home.json': imagePage('home') }, { 'hero.jpg': HERO })
      const renderer = fakeRenderer(wide(sourceWidth))
      const result = await publishSite(store, slug, { ladder: imageLadder(renderer) })
      expect(result.published).toBe(true)
      const widths = [...(store.derivedRevision(slug, result.id) ?? new Map()).keys()]
        .map((k) => Number(/-(\d+)\.jpg$/.exec(k)![1]))
        .sort((a, b) => a - b)
      // No transform was ever asked for a width at or above the source's.
      for (const r of renderer.resized) expect(r.width).toBeLessThan(sourceWidth)
      const html = store.renderedRevision(slug, result.id)?.get('home.html') ?? ''
      if (widths.length === 0) {
        expect(html).not.toContain('srcset')
      } else {
        // The original is the top rung, at its own width.
        expect(html).toContain(`assets/hero.jpg ${sourceWidth}w`)
      }
      return widths
    }

    expect(await ladderWidths(300)).toEqual([])
    expect(await ladderWidths(320)).toEqual([])
    expect(await ladderWidths(600)).toEqual([320])
    expect(await ladderWidths(5000)).toEqual(CONVENTIONAL)
  })

  it('test_UAT_AC2527_draft_channel_and_a_publish_with_no_images_binding_build_no_ladder_and_are_otherwise_unchanged', async () => {
    const { store, slug } = memorySite({ 'home.json': imagePage('home') }, { 'hero.jpg': HERO })

    // The builder's draft and edit channels render the working picture, no ladder.
    const preview = new PreviewRenderer(store)
    const draft = await preview.file(slug, 'draft', '/home')
    const edit = await preview.file(slug, 'edit', '/home')
    for (const page of [draft, edit]) {
      expect(page?.kind).toBe('text')
      const body = (page as { body: string }).body
      expect(body).toContain('assets/hero.jpg')
      expect(body).not.toContain('assets/d/')
      expect(body).not.toContain('srcset')
    }

    // No ladder supplied — the command line, or a deployment with no binding.
    const result = await publishSite(store, slug, {})
    expect(result.published).toBe(true)
    expect(result.id).toBe(1)
    expect(store.derivedRevision(slug, result.id)?.size ?? 0).toBe(0)
    const out = store.renderedRevision(slug, result.id) ?? new Map<string, string>()
    expect([...out.keys()].some((k) => k.startsWith('assets/d/'))).toBe(false)
    // The rendered page is what a ladder-free render has always produced: the
    // same bytes the draft channel renders from the same definition.
    expect(out.get('home.html')).toBe((draft as { body: string }).body)

    // `1c publish` against the operator's disk: published, no renditions on disk.
    const cli = makeFsSite({ slug: nextSlug('ladder-cli'), pages: { 'home.json': imagePage('home') }, assets: { 'hero.jpg': HERO } })
    try {
      const { cmdPublish } = await import('../tools/generate/src/cli/commands')
      const published = await cmdPublish(cli.slug, { cwd: cli.cwd! } as Parameters<typeof cmdPublish>[1])
      expect(published.published).toBe(true)
      const onDisk = filesUnder(published.outDir)
      expect(onDisk.has('home.html')).toBe(true)
      expect([...onDisk.keys()].some((k) => k.startsWith('assets/d/'))).toBe(false)
      expect(onDisk.get('home.html')!.toString('utf8')).not.toContain('srcset')
    } finally {
      cli.dispose()
    }
  })
})
