import { describe, expect, it } from 'vitest'
import {
  DELIVERY_WIDTHS,
  alternativeDeliveryTypes,
  alternativeDeliveryWidthsFor,
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
  LadderTooLargeError,
  LADDER_CONCURRENCY,
  LADDER_MAX_RENDITIONS,
  type ImageSizer,
} from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { memorySiteStore } from '../tools/generate/src/store'
import { siteSeed } from './support/site-seed'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import worker, { type Env as PublicEnv } from '../apps/public-site/src/index'
import { emptyPublished, publishInto, type PublishedFixture } from './fixtures/published-site'

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

/**
 * A sizer over a fixed source size that records everything asked of it.
 *
 * THE TWO LADDERS ARE RECORDED SEPARATELY ([[REQ-222]] typed sources). `resized`
 * is the SOURCE-FORMAT rungs and `encoded` is every alternative-format one, and
 * keeping them apart is what lets a claim about one ladder stay a claim about
 * that ladder — a single list would make "the conventional widths, capped at the
 * source" unassertable the moment a second format doubled it.
 */
function fakeRenderer(
  size: { width: number; height: number } | null,
  opts: { failAt?: number[]; failFormat?: string } = {},
): ImageSizer & { resized: number[]; encoded: { width: number; type: string }[]; measured: number } {
  const state = {
    resized: [] as number[],
    encoded: [] as { width: number; type: string }[],
    measured: 0,
  }
  return {
    ...state,
    get resized() {
      return state.resized
    },
    get encoded() {
      return state.encoded
    },
    get measured() {
      return state.measured
    },
    measure: async () => {
      state.measured += 1
      return size
    },
    resize: async (_bytes, _contentType, width, type) => {
      if (type === undefined) state.resized.push(width)
      else state.encoded.push({ width, type })
      if (opts.failAt?.includes(width)) return null
      if (opts.failFormat !== undefined && type === opts.failFormat) return null
      // The bytes are the width and the format, so a test can tell one rendition
      // from another without decoding anything.
      return new TextEncoder().encode(`rendition-${width}-${type ?? 'source'}`)
    },
  } as ImageSizer & {
    resized: number[]
    encoded: { width: number; type: string }[]
    measured: number
  }
}

/** Every rendition path a manifest entry names, across every format. */
function namedRenditions(entry: {
  renditions: readonly { src: string }[]
  sources?: readonly { renditions: readonly { src: string }[] }[]
}): string[] {
  return [
    ...entry.renditions.map((r) => r.src),
    ...(entry.sources ?? []).flatMap((s) => s.renditions.map((r) => r.src)),
  ].filter((src) => src.startsWith('assets/d/'))
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
    // ACROSS EVERY FORMAT, not just the source's. A typed `<source>`'s candidates
    // are chosen by the same browser through the same mechanism, so a WebP
    // candidate the bucket does not hold is the same 404 — and it is the one a
    // modern browser reaches for FIRST.
    const named = namedRenditions(built.manifest['hero.jpg'])
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

  it('names a rendition for the SOURCE bytes, so a republish of one picture is free', async () => {
    // The ladder does not hold the cache — [[REQ-219]]'s renderer already does,
    // addressed by the original, the recipe and the size asked for. What IS the
    // ladder's own job is the name, and the name is why an unchanged picture
    // republishes for nothing: identical bytes at an identical width produce an
    // identical address, so the sizer's cache answers before any transform.
    const same = await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }))
    const again = await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }))
    expect([...again.derived.keys()].sort()).toEqual([...same.derived.keys()].sort())
    expect(again.manifest).toEqual(same.manifest)
  })

  it('gives edited bytes a different address, so nothing serves a stale rendition', async () => {
    const before = await buildImageLadder(jpeg(), fakeRenderer({ width: 1000, height: 500 }))
    const after = await buildImageLadder(
      [{ name: 'hero.jpg', bytes: new TextEncoder().encode('different bytes entirely') }],
      fakeRenderer({ width: 1000, height: 500 }),
    )
    // Same name, same width, different bytes — and therefore a different key
    // everywhere: the manifest, the revision, and the renderer's own cache.
    expect([...after.derived.keys()]).not.toEqual([...before.derived.keys()])
  })

  it('gives a picture the renderer cannot read no ladder, and no failed publish', async () => {
    const built = await buildImageLadder(jpeg(), fakeRenderer(null))
    expect(built.manifest).toEqual({})
    expect(built.derived.size).toBe(0)
  })

  it('drops a rung that would not render and keeps the rest of the ladder', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 }, { failAt: [640] })
    const built = await buildImageLadder(jpeg(), renderer)
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

/**
 * REQ-222 — the SECOND sink: a background image's ladder.
 *
 * WHY IT NEEDED ITS OWN CASES RATHER THAN RIDING THE `<img>` ONES. A band
 * backdrop is the largest file on most sites and it is not an `<img>` at all —
 * it is a CSS `url()` on a box. A ladder that reached only `<img>` would report
 * success and save nothing on the one photograph a real client actually has, so
 * these cases are the difference between the ticket being true and being
 * plausible.
 *
 * WHAT THE FAILURES LOOK LIKE HERE:
 *
 *   - AN OVERRIDE THAT DROPS A LAYER. The rule restates the whole stack with one
 *     URL swapped, so a scrim or a gradient that survives the base rule and
 *     vanishes at 1280px is a client's contrast disappearing on a desktop only.
 *   - A RENDITION TOO SMALL FOR THE BOX. `cover` upscales it, and the photograph
 *     is visibly soft — a bug the client can see, in exchange for bytes.
 *   - AN OVERRIDE PER RUNG REGARDLESS. Stylesheet noise that says the same thing
 *     three times and invites the three copies to fall out of step.
 */
const BAND_MANIFEST = {
  'band.jpg': {
    width: 4000,
    height: 2000,
    renditions: [
      { src: 'assets/d/beef01-320.jpg', width: 320 },
      { src: 'assets/d/beef01-640.jpg', width: 640 },
      { src: 'assets/d/beef01-1280.jpg', width: 1280 },
      { src: 'assets/band.jpg', width: 4000 },
    ],
  },
}

/** One box carrying a surface, rendered — returns the stylesheet. */
function renderBox(
  box: Partial<L1Node & { kind: 'box' }>,
  opts: Parameters<typeof renderL1Document>[1] = {},
): string {
  const node = { kind: 'box', children: [], ...box } as L1Node
  const doc: L1Document = { widths: WIDTHS, root: { kind: 'box', children: [node] } }
  const res = validateL1(doc)
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(doc, opts).css
}

describe('REQ-222 a background image gets the same ladder as an img', () => {
  it('paints a rendition at the base rule, not the full photograph', () => {
    // The base rule is what a viewport BELOW the ladder gets — the narrowest
    // screen on the worst connection, which is the visitor this ticket is for.
    // A 320px band at 2× wants 640px of picture.
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: BAND_MANIFEST,
    })
    expect(css).toContain('url("assets/d/beef01-640.jpg")')
  })

  it('overrides per breakpoint, through the rules L1 already emits', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: BAND_MANIFEST,
    })
    // A 1280px band at 2× wants 2560px, which only the source covers.
    expect(css).toContain('@media (min-width: 1280px)')
    expect(css).toContain('url("assets/band.jpg")')
    // ...and with no alternative format in this manifest there is nothing for
    // [[REQ-234]]'s `image-set()` to offer, so the override is a plain `url()`.
    expect(css).not.toContain('image-set(')
  })

  it('restates the whole layer stack, so a scrim survives the override', () => {
    const css = renderBox(
      {
        axes: {
          backgroundImageUrl: '/assets/band.jpg',
          overlay: { color: '#000000', opacity: 0.5 },
        },
      },
      { delivery: BAND_MANIFEST },
    )
    const override = css.slice(css.indexOf('@media (min-width: 1280px)'))
    expect(override).toContain('linear-gradient(')
    expect(override).toContain('url("assets/band.jpg")')
  })

  it('emits one rule where one rendition answers every breakpoint', () => {
    // A 150px box at 2× wants 300px at every rung, and 320 is the smallest that
    // covers it — so there is nothing for a wider breakpoint to say.
    const css = renderBox(
      {
        axes: { backgroundImageUrl: '/assets/band.jpg' },
        sizing: { width: { mode: 'fixed', px: 150 } },
      },
      { delivery: BAND_MANIFEST },
    )
    expect(css).toContain('url("assets/d/beef01-320.jpg")')
    expect(css).not.toContain('@media (min-width: 1280px)')
  })

  it('takes a smaller rendition for a box narrower than the viewport', () => {
    const band = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: BAND_MANIFEST,
    })
    const card = renderBox(
      {
        axes: { backgroundImageUrl: '/assets/band.jpg' },
        sizing: { width: { mode: 'fixed', px: 300 } },
      },
      { delivery: BAND_MANIFEST },
    )
    // Same picture, same viewport, different box — so a different rendition.
    expect(band).toContain('url("assets/d/beef01-640.jpg")')
    expect(card).toContain('url("assets/d/beef01-640.jpg")')
    expect(band).toContain('@media (min-width: 1280px)')
    expect(card).not.toContain('@media (min-width: 1280px)')
  })

  it('emits exactly today’s stylesheet when this render has no manifest', () => {
    const axes = { backgroundImageUrl: '/assets/band.jpg' }
    expect(renderBox({ axes })).toBe(renderBox({ axes }, {}))
    expect(renderBox({ axes })).toContain('url("assets/band.jpg")')
    expect(renderBox({ axes })).not.toContain('assets/d/')
  })

  it('leaves a picture the manifest does not mention alone', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/other.jpg' } }, {
      delivery: BAND_MANIFEST,
    })
    expect(css).toContain('url("assets/other.jpg")')
    expect(css).not.toContain('assets/d/')
  })

  it('keeps the backdrop when a rendition would not pass the url() sink', () => {
    // A rejected candidate must not remove the layer: that does not serve a
    // smaller picture, it serves none — the client's backdrop simply disappears.
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: {
        'band.jpg': {
          width: 4000,
          height: 2000,
          renditions: [
            { src: 'javascript:alert(1)', width: 320 },
            { src: 'assets/band.jpg', width: 4000 },
          ],
        },
      },
    })
    expect(css).toContain('url("assets/band.jpg")')
    expect(css).not.toContain('javascript:')
  })
})

describe('REQ-222 the picture states its own dimensions', () => {
  it('stamps the intrinsic width and height the publish measured', () => {
    // The publish had to measure the source to cap its ladder, so these cost
    // nothing — and they give the browser the aspect ratio before a byte of the
    // photograph has arrived, which is what stops the text below it jumping.
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: HERO_MANIFEST })
    expect(html).toContain('width="2000"')
    expect(html).toContain('height="1000"')
  })

  it('stamps nothing when this render was handed no manifest', () => {
    const html = renderImage({ src: '/assets/hero.jpg' })
    expect(html).not.toContain('width="')
    expect(html).not.toContain('height="')
  })
})

/**
 * REQ-222 — a rendition may be cached forever, and `public-site` says so.
 *
 * WHY THIS BELONGS TO THIS TICKET RATHER THAN TO THE CACHE NOTE IT ANSWERS.
 * `public-site` serves every published byte with `max-age=60`, and its own
 * comment names the fix it is waiting for: paths whose name cannot change
 * meaning. Content-addressed renditions ARE that, today — `<sha>-<width><ext>`
 * over the source bytes — whether or not it ever becomes true of the rest of a
 * revision. And the saving is worth the most to exactly the visitor the ladder
 * is for: serving a phone a 640px photograph is undone by a repeat visit that
 * pays for it again.
 *
 * THROUGH THE WORKER'S REAL ENTRY POINT, with the bucket seeded by a REAL
 * publish — so the path this asserts on is the path the ladder actually chose,
 * not one this file invented and then matched.
 */
describe('REQ-222 a content-addressed rendition is cached forever', () => {
  const ORIGIN = 'https://1stcontact.io'
  const SLUG = 'ladder-site'

  async function publishWithLadder() {
    const fixture = emptyPublished()
    const page = {
      ...starterHomePage('home'),
      l1: {
        widths: WIDTHS,
        root: {
          kind: 'box',
          children: [{ kind: 'image', src: '/assets/hero.jpg', alt: 'a picture' }],
        },
      },
    }
    const { content } = await publishInto(
      fixture,
      SLUG,
      {
        siteJson: starterSiteJson(SLUG) as unknown as Record<string, unknown>,
        pages: { 'home.json': page },
        assets: { 'hero.jpg': SOURCE },
      },
      imageLadder(fakeRenderer({ width: 1000, height: 500 })),
    )
    return { fixture, content }
  }

  async function get(fixture: PublishedFixture, path: string): Promise<Response> {
    return await worker.fetch(
      new Request(`${ORIGIN}${path}`),
      { SITES: fixture.bucket as unknown as R2Bucket, DB: fixture.db as unknown as D1Database } as PublicEnv,
      { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as unknown as ExecutionContext,
    )
  }

  it('serves a rendition immutably, at the key the publish actually wrote', async () => {
    const { fixture, content } = await publishWithLadder()
    const rendition = [...(content.derived ?? new Map()).keys()][0]
    expect(rendition).toMatch(/^assets\/d\//)

    const res = await get(fixture, `/site/${SLUG}/${rendition}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('immutable')
  })

  it('leaves every other published byte on the short cache it had', async () => {
    // The rest of a revision is NOT content-addressed — `assets/hero.jpg` means
    // different bytes after an edit — so nothing here may quietly inherit this.
    const { fixture } = await publishWithLadder()
    for (const path of ['/site/' + SLUG + '/', `/site/${SLUG}/assets/hero.jpg`]) {
      const res = await get(fixture, path)
      expect(res.status).toBe(200)
      expect(res.headers.get('cache-control')).toBe('public, max-age=60')
    }
  })
})

/**
 * REQ-222 — a picture placed ONLY as a background is not quietly skipped.
 *
 * THE RISK IS NOT THAT A BACKGROUND NEEDS SPECIAL HANDLING. It is that a
 * predicate written against "an image node" silently excludes it, and nobody
 * notices — because backgrounds are exactly the pictures nobody clicks on. The
 * ladder is built by walking the SNAPSHOT'S ASSETS rather than the document, so
 * it cannot have that bug by construction; this case is what keeps that true
 * when someone later reaches for the document instead.
 */
describe('REQ-222 a background-placed picture reaches the ladder', () => {
  it('renders and names renditions for a site whose only picture is a backdrop', async () => {
    const seed = siteSeed({
      pages: {
        'home.json': {
          ...starterHomePage('home'),
          l1: {
            widths: WIDTHS,
            root: {
              kind: 'box',
              children: [
                { kind: 'box', children: [], axes: { backgroundImageUrl: '/assets/band.jpg' } },
              ],
            },
          },
        },
      },
      assets: { 'band.jpg': SOURCE },
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })

    const renderer = fakeRenderer({ width: 4000, height: 2000 })
    const result = await publishSite(store, seed.slug, { ladder: imageLadder(renderer) })
    expect(renderer.resized).toEqual([...DELIVERY_WIDTHS])

    const derived = store.derivedRevision(seed.slug, result.id) ?? new Map()
    const html = store.renderedRevision(seed.slug, result.id)?.get('home.html') ?? ''
    // Every rendition the stylesheet paints is a file this same publish wrote.
    const painted = [...html.matchAll(/url\("(assets\/d\/[^"]+)"\)/g)].map((m) => m[1])
    expect(painted.length).toBeGreaterThan(0)
    for (const src of painted) expect(derived.has(src), src).toBe(true)
  })
})

/**
 * REQ-222 — `<picture>` with typed `<source>` elements.
 *
 * WHY THESE ARE WORTH WRITING, beyond "the attribute appeared":
 *
 *   - A `<source>` WITH THE WRONG BYTES paints NOTHING. A browser that takes a
 *     `type="image/webp"` source and finds a JPEG behind it does not fall back —
 *     it has already committed. So the one thing that must never happen is a
 *     typed source whose renditions were not actually encoded in that type.
 *   - A `<source>` WITH NO `sizes` is the whole ticket undone for exactly the
 *     visitors modern enough to prefer WebP: selection happens inside the chosen
 *     source, so without it the browser assumes the viewport and takes the top
 *     rung.
 *   - A WRAPPER THAT GENERATES A BOX moves the layout. Every geometry rule this
 *     renderer emits lands on the `<img>`, so a `<picture>` that became the flex
 *     item would apply them one level inside the layout instead of in it — and
 *     nothing about the HTML would look wrong.
 *   - A BACKGROUND THAT TOOK A WEBP is a backdrop that silently does not paint
 *     for a visitor whose browser cannot read one, with no fallback and no way
 *     for the page to find out.
 */

/** The manifest for a 2000px `hero.jpg` published with a WebP source as well. */
const TYPED_MANIFEST = {
  'hero.jpg': {
    width: 2000,
    height: 1000,
    renditions: [
      { src: 'assets/d/abc123-320.jpg', width: 320 },
      { src: 'assets/d/abc123-640.jpg', width: 640 },
      { src: 'assets/hero.jpg', width: 2000 },
    ],
    sources: [
      {
        type: 'image/webp',
        renditions: [
          { src: 'assets/d/abc123-320.webp', width: 320 },
          { src: 'assets/d/abc123-640.webp', width: 640 },
          { src: 'assets/d/abc123-2000.webp', width: 2000 },
        ],
      },
    ],
  },
}

describe('REQ-222 the sink emits a picture with typed sources', () => {
  it('puts WebP first and leaves the original as the final fallback inside img', () => {
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: TYPED_MANIFEST })
    // The browser takes the FIRST source whose type it supports, so order is the
    // whole mechanism: WebP precedes the original, and a browser that reads
    // neither still gets the picture it gets today from `src`.
    expect(html.indexOf('<source')).toBeLessThan(html.indexOf('<img'))
    expect(html).toContain('type="image/webp"')
    // The img keeps the SOURCE-FORMAT ladder and its own src.
    const img = /<img\b[^>]*>/.exec(html)![0]
    expect(img).toContain('src="assets/hero.jpg"')
    expect(img).toContain('assets/d/abc123-640.jpg 640w')
    expect(img).not.toContain('.webp')
  })

  it('emits a bare img when the publish encoded no alternative format', () => {
    // No typed source, no wrapper — byte-identical to what shipped before this
    // existed, which is what a WebP original, a deployment with no ladder and
    // the draft channel all get.
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: HERO_MANIFEST })
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('<source')
    expect(html).toContain('srcset=')
  })

  it('wraps in a picture that generates no box, so the layout is unchanged', () => {
    // A `<picture>` is an inline box by default. Without `display:contents` it
    // would become the flex or grid item the parent sizes, and every rule this
    // renderer emits for the node — all of which land on the `<img>` — would
    // apply one level inside the layout rather than in it.
    const html = renderImage({ src: '/assets/hero.jpg' }, { delivery: TYPED_MANIFEST })
    expect(html).toContain('<picture style="display:contents">')
  })

  it('repeats sizes on the source, because selection happens inside it', () => {
    const html = renderImage(
      {
        src: '/assets/hero.jpg',
        geometry: { keyframes: [{ at: 320, width: 300, height: 150, x: 0, y: 0 }] },
      },
      { delivery: TYPED_MANIFEST },
    )
    const source = /<source\b[^>]*>/.exec(html)![0]
    const img = /<img\b[^>]*>/.exec(html)![0]
    const sizesOf = (tag: string) => /sizes="([^"]*)"/.exec(tag)?.[1]
    expect(sizesOf(source)).toBeDefined()
    // The SAME conditions list: the box is the box whichever format fills it, and
    // a source that understated it would send the browser back to assuming the
    // viewport for exactly the visitors this saves the most bytes for.
    expect(sizesOf(source)).toBe(sizesOf(img))
  })

  it('drops a source with nothing to choose between rather than offering it', () => {
    // It has no fallback of its own — the `<img>` carries the source format — so
    // a source a browser PREFERS and then cannot usefully choose within is
    // strictly worse than no source at all.
    const html = renderImage(
      { src: '/assets/hero.jpg' },
      {
        delivery: {
          'hero.jpg': {
            ...TYPED_MANIFEST['hero.jpg'],
            sources: [{ type: 'image/webp', renditions: [{ src: 'assets/d/x-320.webp', width: 320 }] }],
          },
        },
      },
    )
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('image/webp')
  })

  it('refuses a type it does not recognise instead of escaping it', () => {
    // `type` is PARSED by the browser, not merely displayed: an unrecognised one
    // disqualifies the source silently, on every page, with nothing reporting
    // why. Layer 2 does not trust Layer 1, and a manifest arrives from a publish
    // that read bytes out of a bucket.
    const html = renderImage(
      { src: '/assets/hero.jpg' },
      {
        delivery: {
          'hero.jpg': {
            ...TYPED_MANIFEST['hero.jpg'],
            sources: [
              {
                type: 'text/html',
                renditions: [
                  { src: 'assets/d/x-320.webp', width: 320 },
                  { src: 'assets/d/x-640.webp', width: 640 },
                ],
              },
            ],
          },
        },
      },
    )
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('text/html')
  })

  it('keeps a link wrapping the whole picture, and still generating no box', () => {
    const html = renderImage(
      { src: '/assets/hero.jpg', link: { href: 'https://example.com/' } },
      { delivery: TYPED_MANIFEST },
    )
    expect(html.indexOf('<a')).toBeLessThan(html.indexOf('<picture'))
    // Both wrappers generate no box, so an anchored picture lays out exactly as
    // an anchored bare `<img>` did.
    expect(html).toContain('<a href="https://example.com/" style="display:contents">')
    expect(html).toContain('<picture style="display:contents">')
  })

  it('never paints a typed rendition as a background without a fallback beside it', () => {
    // A `background-image` declares nothing and negotiates nothing, so a BARE
    // `url()` naming a WebP is a backdrop that does not paint at all for a visitor
    // whose browser cannot read one — and no way for the page to find out.
    //
    // [[REQ-234]] SUPERSEDES THE SHAPE OF THIS CLAIM, NOT THE CLAIM. It supplies
    // the fallback CSS was missing — `image-set()` with `type()` — so a typed
    // rendition may now be OFFERED as a backdrop. What still may not happen is the
    // thing this test was always about: it may never be the whole declaration.
    const css = renderBox(
      { axes: { backgroundImageUrl: '/assets/hero.jpg' } },
      { delivery: TYPED_MANIFEST },
    )
    expect(css).toContain('assets/d/abc123-')
    // Every declaration that is NOT an `image-set()` — the bare `url()` ones — is
    // what a browser with no `image-set()` is left holding.
    const bare = css.split(';').filter((d) => !d.includes('image-set('))
    expect(bare.join(';')).not.toContain('.webp')
  })
})

describe('REQ-222 which formats a picture is offered in', () => {
  it('offers a JPEG and a PNG WebP, and a WebP nothing', () => {
    expect(alternativeDeliveryTypes('image/jpeg')).toEqual(['image/webp'])
    expect(alternativeDeliveryTypes('image/png')).toEqual(['image/webp'])
    // The `<img>` already carries the WebP ladder, so a source repeating it is a
    // byte-for-byte duplicate for the browser to choose between identically.
    expect(alternativeDeliveryTypes('image/webp')).toEqual([])
  })

  it('does not offer an AVIF source a larger WebP', () => {
    // WebP is LARGER than AVIF at equivalent quality, so a WebP source ahead of
    // an AVIF original is a pessimisation the browser cannot refuse — it takes
    // the first type it supports, and it supports WebP.
    expect(alternativeDeliveryTypes('image/avif')).toEqual([])
  })

  it('gives an alternative format the source width as an encoded rung', () => {
    // The original IS the source format, so naming it in the `<img>`'s srcset
    // costs no transform. In WebP there is no such free rung, and a ladder that
    // stopped below the source would hand a wide box an upscaled rendition.
    expect(alternativeDeliveryWidthsFor(1000)).toEqual([320, 640, 960, 1000])
    expect(deliveryWidthsFor(1000)).toEqual([320, 640, 960])
  })

  it('gives a picture below the smallest step no alternative ladder either', () => {
    // The body's plainest promise is that such a picture is served exactly as it
    // is. A lone WebP rendition of a file that already fits every box it appears
    // in is a transform, an R2 write and a second element for a few kilobytes.
    expect(alternativeDeliveryWidthsFor(300)).toEqual([])
  })
})

describe('REQ-222 the ladder builds both formats', () => {
  const jpeg = (name = 'hero.jpg') => [{ name, bytes: SOURCE }]

  it('encodes every alternative rung and records it in its own source', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const built = await buildImageLadder(jpeg(), renderer)
    // The source format, unchanged and still capped strictly below the source.
    expect(renderer.resized).toEqual([320, 640, 960])
    // And WebP, including the source's own width, because it has no free rung.
    expect(renderer.encoded).toEqual([
      { width: 320, type: 'image/webp' },
      { width: 640, type: 'image/webp' },
      { width: 960, type: 'image/webp' },
      { width: 1000, type: 'image/webp' },
    ])
    const sources = built.manifest['hero.jpg'].sources!
    expect(sources.map((s) => s.type)).toEqual(['image/webp'])
    expect(sources[0].renditions.map((r) => r.width)).toEqual([320, 640, 960, 1000])
    // Named for the alternative's OWN extension, so it can never collide with
    // the source-format rendition at the same width.
    for (const rendition of sources[0].renditions) {
      expect(rendition.src.endsWith('.webp'), rendition.src).toBe(true)
    }
  })

  it('drops an alternative format the renderer could not encode, and keeps the ladder', async () => {
    const renderer = fakeRenderer({ width: 1000, height: 500 }, { failFormat: 'image/webp' })
    const built = await buildImageLadder(jpeg(), renderer)
    const entry = built.manifest['hero.jpg']
    // The source-format ladder is untouched: a deployment whose binding cannot
    // encode WebP publishes exactly the page it published before.
    expect(entry.renditions.map((r) => r.width)).toEqual([320, 640, 960, 1000])
    expect(entry.sources).toBeUndefined()
    for (const path of built.derived.keys()) expect(path.endsWith('.webp')).toBe(false)
  })

  it('offers no alternative for a WebP original', async () => {
    const built = await buildImageLadder(
      [{ name: 'logo.webp', bytes: SOURCE }],
      fakeRenderer({ width: 1000, height: 500 }),
    )
    expect(built.manifest['logo.webp'].sources).toBeUndefined()
  })
})

describe('REQ-222 the publish is rationed to what one request can carry', () => {
  /** `count` distinct pictures, each wide enough to earn a full ladder. */
  const manyPictures = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      name: `photo${i}.jpg`,
      // Distinct bytes, so each gets its own content address.
      bytes: new TextEncoder().encode(`photograph number ${i}`),
    }))

  it('renders more than one rendition at a time', async () => {
    // THE CLAIM IS ABOUT CONCURRENCY, so it is observed as concurrency: the
    // sizer records how many calls are in flight at their peak. A sequential
    // ladder makes wall-clock the SUM of every transform on the site, which is
    // the one arrangement that turns a first publish into an open-ended wait.
    let inFlight = 0
    let peak = 0
    const sizer: ImageSizer = {
      measure: async () => ({ width: 1000, height: 500 }),
      resize: async () => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((r) => setTimeout(r, 1))
        inFlight -= 1
        return new TextEncoder().encode('bytes')
      },
    }
    await buildImageLadder(manyPictures(4), sizer)
    expect(peak).toBeGreaterThan(1)
    // And bounded, so a large site does not open an unbounded number at once.
    expect(peak).toBeLessThanOrEqual(LADDER_CONCURRENCY)
  })

  it('refuses a site over the ceiling, naming the site’s own facts', async () => {
    // The failure this guards against is not slowness — it is a publish that
    // dies most of the way through with a platform error naming nothing the
    // client did. So it refuses in advance, in terms the client can act on.
    const pictures = manyPictures(Math.ceil(LADDER_MAX_RENDITIONS / 10) + 1)
    const err = await buildImageLadder(pictures, fakeRenderer({ width: 4000, height: 2000 })).catch(
      (e) => e,
    )
    expect(err).toBeInstanceOf(LadderTooLargeError)
    expect(err.message).toContain(String(pictures.length))
    expect(err.message).toContain(String(LADDER_MAX_RENDITIONS))
  })

  it('leaves no revision at all when the ladder is over the ceiling', async () => {
    // Upstream of `writeRevision`, so an over-budget publish leaves no revision,
    // no history entry and no bytes — exactly as an invalid draft does. A publish
    // that died halfway would leave a partial ladder, paid for, serving nothing.
    const seed = siteSeed({
      pages: { 'home.json': starterHomePage('over-budget') },
      assets: Object.fromEntries(
        manyPictures(Math.ceil(LADDER_MAX_RENDITIONS / 10) + 1).map((a) => [a.name, a.bytes]),
      ),
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
    const ladder = imageLadder(fakeRenderer({ width: 4000, height: 2000 }))
    await expect(publishSite(store, seed.slug, { ladder })).rejects.toThrow(LadderTooLargeError)
    expect(await store.revisions(seed.slug)).toEqual([])
  })
})

describe('REQ-222 the publish reports how far through resizing it is', () => {
  const jpeg = [{ name: 'hero.jpg', bytes: SOURCE }]

  it('states a real total before the first transform, then counts up to it', async () => {
    // DETERMINATE, NOT A SPINNER. A spinner is right for an unknown wait of
    // seconds; for a wait of minutes it is the thing that reads as a hang, which
    // is the failure the reporting exists to prevent.
    const frames: { total: number; done: number }[] = []
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    await buildImageLadder(jpeg, renderer, { onProgress: (p) => frames.push(p) })
    // The first frame is the plan: a total, nothing done. The denominator is real
    // because the ladder planned before it rendered.
    expect(frames[0]).toEqual({ total: 7, done: 0 })
    expect(frames[frames.length - 1]).toEqual({ total: 7, done: 7 })
    // And it never goes backwards or past the total.
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i].done).toBeGreaterThanOrEqual(frames[i - 1].done)
      expect(frames[i].done).toBeLessThanOrEqual(frames[i].total)
    }
  })

  it('reports a total of zero when every rendition is already held', async () => {
    // WHICH IS WHAT LETS THE BUILDER STAY QUIET. A republish with nothing to
    // build must not warn about resizing: a client shown that warning every time
    // has been taught to ignore the one time it means something.
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    const held: ImageSizer = { ...renderer, held: async () => true }
    const frames: { total: number; done: number }[] = []
    const built = await buildImageLadder(jpeg, held, { onProgress: (p) => frames.push(p) })
    expect(frames[0]).toEqual({ total: 0, done: 0 })
    // And the ladder is still complete — "nothing to build" is not "nothing to
    // serve": the renditions exist, they just cost nothing this time.
    expect(built.manifest['hero.jpg'].renditions.length).toBeGreaterThan(1)
  })

  it('counts everything as work where the sizer holds nothing', async () => {
    // ABSENT `held` MEANS NOTHING IS FREE, which is the truthful answer for a
    // deployment with nowhere to keep a rendition rather than a conservative one.
    const renderer = fakeRenderer({ width: 1000, height: 500 })
    expect(renderer.held).toBeUndefined()
    const frames: { total: number; done: number }[] = []
    await buildImageLadder(jpeg, renderer, { onProgress: (p) => frames.push(p) })
    expect(frames[0].total).toBe(7)
  })

  it('does not report at all when the publish supplies no reporter', async () => {
    // Progress is a property of the ROUTE, not of the publish: the Worker's route
    // passes a reporter because it has a stream to write frames into, and
    // `1c publish` has a terminal and no use for frames. So the CLI's publish is
    // byte-identical to before.
    const seed = siteSeed({
      pages: { 'home.json': starterHomePage('quiet') },
      assets: { 'hero.jpg': SOURCE },
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
    const result = await publishSite(store, seed.slug, {
      ladder: imageLadder(fakeRenderer({ width: 1000, height: 500 })),
    })
    expect(result.published).toBe(true)
  })
})
