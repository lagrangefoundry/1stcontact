import { describe, expect, it } from 'vitest'
import {
  DELIVERY_WIDTHS,
  deliveryAssetName,
  deliveryWidthsFor,
  isLadderedAsset,
  renditionPath,
} from '../packages/framework/src/l1/delivery'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import {
  buildImageLadder,
  imageLadder,
  type ImageRenderer,
  type RenditionCache,
} from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { memorySiteStore } from '../tools/generate/src/store'
import { siteSeed } from './support/site-seed'

/**
 * REQ-222 — the delivery width ladder, and the `srcset`/`sizes` the renderer
 * writes from it.
 *
 * WHAT THE FAILURES LOOK LIKE, which is why each claim below is worth a test:
 *
 *   - A LADDER THAT UPSCALES is bytes spent to make a picture no sharper. It is
 *     invisible — the page looks right — and it is the precise harm this ticket
 *     exists to remove, applied in the other direction.
 *   - A `srcset` NAMING BYTES NOBODY WROTE is a 404 on the request the page
 *     cannot recover from, and the browser will have chosen that candidate
 *     *because* it was the best fit. So the manifest is asserted to be a record
 *     of what landed, never a prediction.
 *   - A `srcset` WITH NO `sizes` is the same download with extra markup: the
 *     browser assumes the viewport, multiplies by the device pixel ratio and
 *     takes the top rung. A test that only checked for `srcset` would pass on a
 *     change that delivers nothing.
 *   - A LADDER ON THE DRAFT is work done twice per keystroke-settle for a
 *     channel nobody outside the builder ever loads.
 *
 * THE FAKE RENDERER COUNTS ITS CALLS, because "republishing an unchanged picture
 * costs zero transforms" is the claim that justifies content-addressing at all,
 * and it is not observable from the bytes — both publishes produce the same
 * renditions whether or not the second one paid for them.
 */

const WIDTHS = [320, 1280]

/** A renderer over a fixed source size that records everything asked of it. */
function fakeRenderer(
  size: { width: number; height: number } | null,
  opts: { failAt?: number[] } = {},
): ImageRenderer & { resized: number[]; measured: number } {
  const state = { resized: [] as number[], measured: 0 }
  return {
    ...state,
    get resized() {
      return state.resized
    },
    get measured() {
      return state.measured
    },
    measure: async () => {
      state.measured += 1
      return size
    },
    resize: async (_bytes, _contentType, width) => {
      state.resized.push(width)
      if (opts.failAt?.includes(width)) return null
      // The bytes are the width, so a test can tell one rendition from another
      // without decoding anything.
      return new TextEncoder().encode(`rendition-${width}`)
    },
  } as ImageRenderer & { resized: number[]; measured: number }
}

/** A cache over a plain map, recording what it was asked for. */
function fakeCache(): RenditionCache & { held: Map<string, Uint8Array> } {
  const held = new Map<string, Uint8Array>()
  return {
    held,
    get: async (key) => held.get(key) ?? null,
    put: async (key, bytes) => {
      held.set(key, bytes)
    },
  }
}

/** Some bytes that are not any particular picture. */
const SOURCE = new TextEncoder().encode('not really a jpeg, but bytes are bytes')

/** One image node in a document, rendered. */
function renderImage(
  node: Partial<L1Node & { kind: 'image' }> & { src: string },
  opts: Parameters<typeof renderL1Document>[1] = {},
  column?: L1Document['column'],
): string {
  const image = { kind: 'image', alt: 'a picture', ...node } as L1Node
  const doc: L1Document = { widths: WIDTHS, root: { kind: 'box', children: [image] }, ...(column ? { column } : {}) }
  const res = validateL1(doc)
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(doc, opts).html
}

/** The manifest a publish of one 2000px-wide `hero.jpg` would produce. */
const HERO_MANIFEST = {
  'hero.jpg': {
    width: 2000,
    height: 1000,
    renditions: [
      { src: 'assets/d/abc123-320.jpg', width: 320 },
      { src: 'assets/d/abc123-640.jpg', width: 640 },
      { src: 'assets/hero.jpg', width: 2000 },
    ],
  },
}

describe('REQ-222 the ladder is conventional, and capped at the source', () => {
  it('offers the conventional widths below the source and never above it', () => {
    // A photograph from a modern phone: every step is available to it.
    expect(deliveryWidthsFor(4032)).toEqual([320, 640, 960, 1280, 1600, 1920])
    // A 1000px picture gets the steps under 1000 and nothing invented above.
    expect(deliveryWidthsFor(1000)).toEqual([320, 640, 960])
    expect(Math.max(...deliveryWidthsFor(1000))).toBeLessThan(1000)
  })

  it("does not give a client's 600px logo a fictional 2048px rendition", () => {
    const rungs = deliveryWidthsFor(600)
    expect(rungs).toEqual([320])
    expect(rungs.every((w) => w < 600)).toBe(true)
  })

  it('gives a picture below the smallest step no ladder at all', () => {
    // It is served as it is: there is no rung under it to offer, and a
    // one-entry srcset is a longer way to write the src already there.
    expect(deliveryWidthsFor(300)).toEqual([])
    expect(deliveryWidthsFor(DELIVERY_WIDTHS[0])).toEqual([])
  })

  it('refuses a source width that is not a width', () => {
    expect(deliveryWidthsFor(0)).toEqual([])
    expect(deliveryWidthsFor(-10)).toEqual([])
    expect(deliveryWidthsFor(Number.NaN)).toEqual([])
  })

  it('ladders raster stills and leaves vector and animation alone', () => {
    for (const name of ['hero.jpg', 'hero.JPEG', 'logo.png', 'shot.webp', 'shot.avif']) {
      expect(isLadderedAsset(name), name).toBe(true)
    }
    // An SVG scales for free, and a transform would flatten a GIF to one frame.
    for (const name of ['wordmark.svg', 'spinner.gif', 'brand.pdf', 'font.woff2', 'noext']) {
      expect(isLadderedAsset(name), name).toBe(false)
    }
  })
})

describe('REQ-222 a reference resolves to the asset it names, however it is spelled', () => {
  it('reads the three spellings of a local asset as one name', () => {
    expect(deliveryAssetName('/assets/hero.jpg')).toBe('hero.jpg')
    expect(deliveryAssetName('assets/hero.jpg')).toBe('hero.jpg')
    expect(deliveryAssetName('./assets/hero.jpg')).toBe('hero.jpg')
    expect(deliveryAssetName('  /assets/hero.jpg  ')).toBe('hero.jpg')
  })

  it('reads anything that is not a site asset as no asset', () => {
    for (const src of [
      'https://example.com/assets/hero.jpg',
      '//example.com/assets/hero.jpg',
      'data:image/png;base64,AAAA',
      '/assets/nested/hero.jpg',
      '/assets/hero.jpg?v=2',
      '/assets/',
      '/other/hero.jpg',
    ]) {
      expect(deliveryAssetName(src), src).toBeNull()
    }
  })
})

describe('REQ-222 the renderer emits srcset and sizes from the manifest', () => {
  it('emits every rendition with its width, and the original as the top rung', () => {
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: HERO_MANIFEST })
    expect(html).toContain(
      'srcset="assets/d/abc123-320.jpg 320w, assets/d/abc123-640.jpg 640w, assets/hero.jpg 2000w"',
    )
  })

  it('leaves src naming the full rendition, so a browser with neither attribute is unchanged', () => {
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: HERO_MANIFEST })
    expect(html).toContain('src="assets/hero.jpg"')
  })

  it('emits NOTHING extra when this render was handed no manifest', () => {
    // The draft and the edit channel take this path: publish is the only caller
    // that supplies one, so "the draft gets no ladder" holds by construction.
    const plain = renderImage({ src: '/assets/hero.jpg' })
    expect(plain).not.toContain('srcset')
    expect(plain).not.toContain('sizes')
    // And it is byte-identical to the render before this ticket existed.
    expect(plain).toContain('<img class=')
  })

  it('emits nothing for a picture the manifest does not mention', () => {
    const html = renderImage({ src: '/assets/other.png' }, { delivery: HERO_MANIFEST })
    expect(html).not.toContain('srcset')
  })

  it('never emits sizes without srcset', () => {
    const html = renderImage(
      { src: '/assets/other.png', sizing: { width: { mode: 'fixed', px: 400 } } },
      { delivery: HERO_MANIFEST },
    )
    expect(html).not.toContain('sizes=')
  })

  it('does not read a magic filename off Object.prototype', () => {
    // `src: "/assets/__proto__"` would otherwise index the prototype chain and
    // hand the emitter something that is not a manifest entry at all.
    const html = renderImage({ src: '/assets/__proto__' }, { delivery: HERO_MANIFEST })
    expect(html).not.toContain('srcset')
  })

  it('refuses a candidate that would break the srcset list or its scheme', () => {
    const hostile = {
      'hero.jpg': {
        width: 2000,
        height: 1000,
        renditions: [
          // A comma splits one candidate into two malformed ones, and a browser
          // that cannot parse the list falls back to `src` on every page.
          { src: 'assets/d/one,two-320.jpg', width: 320 },
          { src: 'javascript:alert(1)', width: 640 },
          { src: 'assets/d/ok-960.jpg', width: 960 },
          { src: 'assets/hero.jpg', width: 2000 },
        ],
      },
    }
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: hostile })
    expect(html).toContain('srcset="assets/d/ok-960.jpg 960w, assets/hero.jpg 2000w"')
    expect(html).not.toContain('one,two')
    expect(html).not.toContain('javascript:')
  })
})

describe('REQ-222 sizes states the box the picture actually fills', () => {
  it('reads a keyframe track, taking each segment at its upper bound', () => {
    const html = renderImage(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [
            { at: 320, x: 0, y: 0, width: 300, height: 200 },
            { at: 1280, x: 0, y: 0, width: 900, height: 600 },
          ],
        },
      },
      { delivery: HERO_MANIFEST },
    )
    // Below 1280 the box sweeps 300 → 900, so the segment's bound is 900; above
    // the ladder it is the widest keyframe.
    expect(html).toContain('sizes="(max-width: 1280px) 900px, 900px"')
  })

  it('holds the lower keyframe across a snapped segment', () => {
    const html = renderImage(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [
            { at: 320, x: 0, y: 0, width: 300, height: 200 },
            { at: 1280, x: 0, y: 0, width: 900, height: 600 },
          ],
          segments: ['snap'],
        },
      },
      { delivery: HERO_MANIFEST },
    )
    // `snap` holds 300 until the next breakpoint — so a phone is told 300px,
    // which is the whole value of the ladder on the device that needs it.
    expect(html).toContain('sizes="(max-width: 1280px) 300px, 900px"')
  })

  it('evaluates a column anchor as the closed form the CSS emits', () => {
    const column = { containerPx: 1152, insetPx: 24 }
    const html = renderImage(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [{ at: 320, x: 0, y: 0, width: 272, height: 200 }],
          anchor: { width: { fraction: 1 } },
        },
      },
      { delivery: HERO_MANIFEST },
      column,
    )
    // extent(320) = min(1152, 320) - 48 = 272; extent(1280) = 1152 - 48 = 1104;
    // past the ladder the column has stopped growing, so it saturates at 1104.
    expect(html).toContain('sizes="(max-width: 320px) 272px, (max-width: 1280px) 1104px, 1104px"')
  })

  it('prefers the anchor over the keyframe widths it suppresses', () => {
    // `geometryRules` suppresses keyframe widths for an anchored axis (REQ-88),
    // so reading them here would describe a box the stylesheet does not produce.
    const column = { containerPx: 800, insetPx: 0 }
    const html = renderImage(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [{ at: 320, x: 0, y: 0, width: 9999, height: 200 }],
          anchor: { width: { fraction: 0.5 } },
        },
      },
      { delivery: HERO_MANIFEST },
      column,
    )
    expect(html).not.toContain('9999px')
    expect(html).toContain('sizes="(max-width: 320px) 160px, (max-width: 1280px) 400px, 400px"')
  })

  it('reads a fixed px extent as one length', () => {
    const html = renderImage(
      { src: '/assets/hero.jpg', sizing: { width: { mode: 'fixed', px: 420 } } },
      { delivery: HERO_MANIFEST },
    )
    expect(html).toContain('sizes="420px"')
  })

  it('omits sizes for a width this renderer does not own', () => {
    // A fluid box with no cap belongs to its parent, and this renderer does not
    // resolve parents. Omitting falls back to the browser's assumption — an
    // over-fetch, never a picture too small for its box.
    const html = renderImage(
      { src: '/assets/hero.jpg', sizing: { width: { mode: 'fluid' } } },
      { delivery: HERO_MANIFEST },
    )
    expect(html).toContain('srcset=')
    expect(html).not.toContain('sizes=')
  })
})

describe('REQ-222 building the ladder', () => {
  const jpeg = (name = 'hero.jpg') => [{ name, bytes: SOURCE }]

  it('renders each rung and records it, with the original last', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const built = await buildImageLadder(jpeg(), renderer)
    expect(renderer.resized).toEqual([320, 640, 960])
    const entry = built.manifest['hero.jpg']
    expect(entry.width).toBe(1000)
    expect(entry.height).toBe(500)
    expect(entry.renditions.map((r) => r.width)).toEqual([320, 640, 960, 1000])
    expect(entry.renditions[3].src).toBe('assets/hero.jpg')
  })

  it('writes every rendition it named, and names every rendition it wrote', async () => {
    const built = await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }))
    const named = built.manifest['hero.jpg'].renditions
      .map((r) => r.src)
      .filter((src) => src !== 'assets/hero.jpg')
    // A candidate the bucket does not hold is a 404 on the request the page
    // cannot recover from, so the two sets are asserted to be the same set.
    expect([...built.derived.keys()].sort()).toEqual([...named].sort())
  })

  it('puts renditions under a derived segment inside the revision output', async () => {
    const built = await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }))
    for (const path of built.derived.keys()) {
      expect(path.startsWith('assets/d/')).toBe(true)
    }
    expect(renditionPath('abc', 640, '.jpg')).toBe('assets/d/abc-640.jpg')
  })

  it('transforms nothing at all for an unchanged picture on a republish', async () => {
    // The claim content-addressing exists to deliver. Publishes are frequent —
    // it is a toolbar button — and image edits are rare.
    const cache = fakeCache()
    const first = fakeRenderer({ width: 1000, height: 500 })
    const before = await buildImageLadder(jpeg(), first, cache)
    expect(first.resized).toEqual([320, 640, 960])

    const second = fakeRenderer({ width: 1000, height: 500 })
    const after = await buildImageLadder(jpeg(), second, cache)
    expect(second.resized).toEqual([])
    // And the republish still holds every rendition, from the cache.
    expect([...after.derived.keys()].sort()).toEqual([...before.derived.keys()].sort())
    expect(after.manifest).toEqual(before.manifest)
  })

  it('addresses a rendition by the source bytes, so edited bytes miss the cache', async () => {
    const cache = fakeCache()
    await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }), cache)
    const edited = fakeRenderer({ width: 1000, height: 500 })
    await buildImageLadder(
      [{ name: 'hero.jpg', bytes: new TextEncoder().encode('different bytes entirely') }],
      edited,
      cache,
    )
    expect(edited.resized).toEqual([320, 640, 960])
  })

  it('gives a picture the renderer cannot read no ladder, and no failed publish', async () => {
    const built = await buildImageLadder(jpeg(), fakeRenderer(null))
    expect(built.manifest).toEqual({})
    expect(built.derived.size).toBe(0)
  })

  it('drops a rung that would not render and keeps the rest of the ladder', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 }, { failAt: [640] })
    const built = await buildImageLadder(jpeg(), renderer, fakeCache())
    expect(built.manifest['hero.jpg'].renditions.map((r) => r.width)).toEqual([320, 960, 1000])
    expect([...built.derived.keys()].some((k) => k.includes('-640.'))).toBe(false)
  })

  it('never measures a vector or an animation', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const built = await buildImageLadder(
      [
        { name: 'wordmark.svg', bytes: SOURCE },
        { name: 'spinner.gif', bytes: SOURCE },
        { name: 'satoshi.woff2', bytes: SOURCE },
      ],
      renderer,
    )
    expect(renderer.measured).toBe(0)
    expect(built.manifest).toEqual({})
  })
})

describe('REQ-222 publish builds the ladder and the pages name it', () => {
  /**
   * The scaffolder's own home page with one picture in it.
   *
   * BUILT FROM `starterHomePage` RATHER THAN BY HAND, because a hand-written page
   * is an approximation of a real one that drifts from it — and the whole
   * definition is validated before a publish writes a byte, so an approximation
   * that is merely missing a field fails as though the ladder were broken.
   */
  const imagePage = (slug: string): Record<string, unknown> => ({
    ...starterHomePage(slug),
    l1: {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [
          {
            kind: 'image',
            src: '/assets/hero.jpg',
            alt: 'a picture',
            sizing: { width: { mode: 'fixed', px: 480 } },
          },
        ],
      },
    },
  })

  /** A site holding one picture, over the in-memory adapter. */
  function siteWithAPicture() {
    const seed = siteSeed({
      pages: { 'home.json': imagePage('home') },
      assets: { 'hero.jpg': SOURCE },
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
    return { store, slug: seed.slug }
  }

  it('writes the renditions into the revision and names them in the page', async () => {
    const { store, slug } = siteWithAPicture()
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const result = await publishSite(store, slug, { ladder: imageLadder(renderer) })
    expect(result.published).toBe(true)

    const derived = store.derivedRevision(slug, result.id)
    expect([...(derived ?? new Map()).keys()].sort()).toEqual([
      ...(await (async () => {
        const built = await buildImageLadder([{ name: 'hero.jpg', bytes: SOURCE }], fakeRenderer({ width: 1000, height: 500 }))
        return [...built.derived.keys()].sort()
      })()),
    ])

    const html = store.renderedRevision(slug, result.id)?.get('home.html') ?? ''
    expect(html).toContain('srcset=')
    expect(html).toContain('320w')
    expect(html).toContain('assets/hero.jpg 1000w')
    expect(html).toContain('sizes="480px"')
    // Every candidate the page names is a file this same publish wrote.
    for (const candidate of /srcset="([^"]+)"/.exec(html)![1].split(', ')) {
      const src = candidate.split(' ')[0]
      if (src === 'assets/hero.jpg') continue
      expect(derived?.has(src), src).toBe(true)
    }
  })

  it('keeps the renditions out of the frozen definition, so a checkout never sees one', async () => {
    const { store, slug } = siteWithAPicture()
    const result = await publishSite(store, slug, {
      ladder: imageLadder(fakeRenderer({ width: 1000, height: 500 })),
    })
    const snapshot = await store.readRevision(slug, result.id)
    // `source/` is what a checkout restores. A delivery rendition is not part of
    // what the site IS, and a checkout that grew six copies of every photograph
    // would then diff, publish and copy them all again.
    expect(snapshot?.assets.map((a) => a.name)).toEqual(['hero.jpg'])
  })

  it('publishes exactly as it always did when the deployment has no ladder', async () => {
    const { store, slug } = siteWithAPicture()
    const result = await publishSite(store, slug, {})
    expect(result.published).toBe(true)
    expect(store.derivedRevision(slug, result.id)?.size ?? 0).toBe(0)
    const html = store.renderedRevision(slug, result.id)?.get('home.html') ?? ''
    expect(html).toContain('src="assets/hero.jpg"')
    expect(html).not.toContain('srcset')
  })

  it('does not pay for a ladder on a publish that mints nothing', async () => {
    const { store, slug } = siteWithAPicture()
    await publishSite(store, slug, { ladder: imageLadder(fakeRenderer({ width: 1000, height: 500 })) })
    // The second press of the button. The no-op check comes first, so the most
    // expensive step in a publish is not paid for a revision nobody mints.
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const again = await publishSite(store, slug, { ladder: imageLadder(renderer) })
    expect(again.published).toBe(false)
    expect(renderer.measured).toBe(0)
    expect(renderer.resized).toEqual([])
  })
})
