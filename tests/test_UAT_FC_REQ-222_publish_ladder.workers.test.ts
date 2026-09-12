import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ladderFor } from '../apps/control-app/src/image-ladder'
import { encodePng, pngDimensions } from '../tools/generate/src/cli/png'
import { publishSite } from '../tools/generate/src/publish/publish'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import {
  publishedOutPrefix,
  publishedSourcePrefix,
  PUBLISHED_ROOT,
} from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-222 — a publish building a real width ladder, inside workerd.
 *
 * WHAT MAKES THESE WORTH ANYTHING BEYOND THE NODE SUITE. The node tests drive
 * the ladder with a fake renderer, so they prove the policy: which widths, which
 * file kinds, what the manifest records. What they cannot prove is that the
 * PLATFORM does what the policy assumed — and that is the half this ticket
 * rests on. Here `env.IMAGES` is the actual Images binding, `env.SITES` is an
 * actual R2 bucket, and the rendition a `srcset` names is decoded to check its
 * real pixel width. A transform that silently ignored `width` would pass every
 * test in the node suite.
 *
 * THE CACHE IS PROVED BY A SENTINEL, not by timing or by counting. A rendition
 * is planted at the key the ladder would derive, and the publish is then
 * asserted to have served the planted bytes rather than a real transform. That
 * is the only observation that pins "content-addressed on the source bytes and
 * the width" to the actual key, using the real bucket — the alternative, two
 * publishes producing identical output, is true whether the second one paid for
 * it or not.
 *
 * THE PICTURE IS SYNTHESISED RATHER THAN COMMITTED, through the repository's own
 * PNG encoder. A fixture wide enough to earn a ladder is tens of kilobytes of
 * binary in the tree whose dimensions a reader has to take on trust; this way
 * the width under test is written in the test.
 */

const TENANT = 'req222'

/** A real PNG, `width` × `height`, with content that does not compress to nothing. */
async function picture(width: number, height: number): Promise<Uint8Array> {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    // A gradient rather than flat colour: a resize of a solid block is
    // indistinguishable from a crop, and a decoder is entitled to shortcuts.
    data[i * 3] = (i * 7) % 256
    data[i * 3 + 1] = (i * 13) % 256
    data[i * 3 + 2] = (i * 29) % 256
  }
  return encodePng({ data, width, height, channels: 3 })
}

/** The scaffolder's home page, with one picture placed on it. */
function pageWithAPicture(slug: string): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'image',
            src: '/assets/hero.png',
            alt: 'a picture',
            sizing: { width: { mode: 'fixed', px: 600 } },
          },
        ],
      },
    },
  }
}

/** A tenant-scoped store, and a site in it holding one 1000px-wide picture. */
async function siteWithAPicture(bytes: Uint8Array) {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const slug = nextSlug('req222')
  const seed = siteSeed({ slug, pages: { 'home.json': pageWithAPicture(slug) } })
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [{ name: 'hero.png', bytes }],
  })
  return { store, slug }
}

/** The ladder this deployment builds — the real binding, the real bucket. */
function realLadder() {
  const built = ladderFor(env as unknown as Parameters<typeof ladderFor>[0], {
    businessId: TENANT,
  })
  expect(built, 'the workerd project declares an IMAGES binding').not.toBeNull()
  return built!
}

/**
 * The rendition-name digest of some bytes.
 *
 * DERIVED HERE THE SAME WAY THE LADDER DERIVES IT, deliberately rather than by
 * importing its private helper: a test that called the implementation would
 * assert that it agrees with itself, and what is worth pinning is the KEY — the
 * thing the cache, the bucket and a future reader of a listing all have to agree
 * on.
 */
async function shaOf(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice())
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

/** Every key under a prefix, in the named bucket (the sites bucket by default). */
async function keysUnder(prefix: string, bucket: R2Bucket = env.SITES): Promise<string[]> {
  const listed = await bucket.list({ prefix, limit: 1000 })
  return listed.objects.map((o) => o.key).sort()
}

/** Full hex SHA-256, which is what the shared rendition cache keys with. */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice())
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * The key [[REQ-219]]'s rendition cache will hold this rung under.
 *
 * DERIVED HERE RATHER THAN IMPORTED, deliberately, for the reason {@link shaOf}
 * is: what is worth pinning is the ADDRESS — the thing the cache, the bucket and
 * the ladder all have to agree on — and a test that called the implementation
 * would only assert that it agrees with itself.
 *
 * THE EMPTY RECIPE IS THE POINT. A site asset is bytes promotion already
 * produced by applying the recipe, so a publish adds sizing and nothing else. If
 * the ladder ever started passing a recipe here, this key would stop matching
 * and the sentinel below would stop being served.
 */
async function cacheKeyFor(bytes: Uint8Array, width: number, type = ''): Promise<string> {
  const source = await sha256Hex(bytes)
  return await sha256Hex(new TextEncoder().encode(`${source}\n[]\n${width}\n${type}`))
}

/** One `srcset` list, parsed into its candidates. */
function candidatesOf(attr: string): Array<{ src: string; width: number }> {
  return attr.split(', ').map((candidate) => {
    const [src, descriptor] = candidate.split(' ')
    return { src, width: Number(descriptor.replace(/w$/, '')) }
  })
}

/**
 * The `<img>`'s OWN `srcset` — the source-format ladder.
 *
 * NAMED PRECISELY BECAUSE THERE IS MORE THAN ONE NOW ([[REQ-222]] typed sources).
 * A published `<picture>` carries a `srcset` per `<source>` as well as the
 * `<img>`'s, and a helper that took the first one it found would have quietly
 * become a helper about the WebP ladder — so every claim about "the conventional
 * widths, capped at the source, with the original as the top rung" would have
 * been silently retargeted at a different list.
 */
function srcsetOf(html: string): Array<{ src: string; width: number }> {
  const img = /<img\b[^>]*>/.exec(html)
  expect(img, 'the published page carries an img').not.toBeNull()
  const attr = /srcset="([^"]*)"/.exec(img![0])
  expect(attr, 'the img carries a srcset').not.toBeNull()
  return candidatesOf(attr![1])
}

/** A typed `<source>`'s `srcset`, by media type, or null if there is none. */
function sourceSrcsetOf(
  html: string,
  type: string,
): Array<{ src: string; width: number }> | null {
  for (const tag of html.matchAll(/<source\b[^>]*>/g)) {
    if (!tag[0].includes(`type="${type}"`)) continue
    const attr = /srcset="([^"]*)"/.exec(tag[0])
    return attr === null ? null : candidatesOf(attr[1])
  }
  return null
}

describe('REQ-222 — the ladder a real publish builds', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('renders each rung at the width it claims, through the real binding', async () => {
    const { store, slug } = await siteWithAPicture(await picture(1000, 500))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    expect(result.published).toBe(true)

    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()

    const candidates = srcsetOf(html)
    // The conventional widths below 1000, and the original as the top rung.
    expect(candidates.map((c) => c.width)).toEqual([320, 640, 960, 1000])

    for (const candidate of candidates) {
      const object = await env.SITES.get(`${out}/${candidate.src}`)
      expect(object, `${candidate.src} was named but not written`).not.toBeNull()
      // THE ASSERTION THE NODE SUITE CANNOT MAKE: the bytes really are that wide.
      const bytes = new Uint8Array(await object!.arrayBuffer())
      expect(pngDimensions(bytes).width, candidate.src).toBe(candidate.width)
    }
  })

  it('never upscales, so a small logo gains no fictional rendition', async () => {
    // 600px wide: the one conventional step under it is 320, and nothing above.
    const { store, slug } = await siteWithAPicture(await picture(600, 300))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()
    const candidates = srcsetOf(html)
    expect(candidates.map((c) => c.width)).toEqual([320, 600])
    for (const candidate of candidates) {
      const object = await env.SITES.get(`${out}/${candidate.src}`)
      const bytes = new Uint8Array(await object!.arrayBuffer())
      expect(pngDimensions(bytes).width).toBeLessThanOrEqual(600)
    }
  })

  it('serves a picture below the smallest step exactly as it is', async () => {
    const { store, slug } = await siteWithAPicture(await picture(300, 150))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()
    expect(html).toContain('src="assets/hero.png"')
    expect(html).not.toContain('srcset')
    expect(await keysUnder(`${out}/assets/d/`)).toEqual([])
  })

  it('keeps the renditions out of the frozen definition', async () => {
    const { store, slug } = await siteWithAPicture(await picture(1000, 500))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    // `source/` is what a checkout reads back. Only the picture the client
    // actually uploaded is in it.
    const frozen = await keysUnder(`${publishedSourcePrefix(siteKey, result.id)}/assets/`)
    expect(frozen).toEqual([`${publishedSourcePrefix(siteKey, result.id)}/assets/hero.png`])
  })

  it('caches renditions in a bucket no published URL resolves into', async () => {
    // A picture of its own width, so the keys this publish caches are this
    // publish's — the tenant prefix is shared by every test in the file, and a
    // count over it would be an assertion about the other tests.
    const bytes = await picture(1100, 500)
    const { store, slug } = await siteWithAPicture(bytes)
    await publishSite(store, slug, { ladder: realLadder() })

    // [[REQ-219]]'s cache, which the ladder rides rather than duplicating: the
    // MATERIAL bucket, under this tenant's own prefix. `public-site` never
    // touches that bucket at all, and within the sites bucket it resolves
    // `sites/` and appends a request path to a prefix the DATABASE gave it — so
    // these bytes are unreachable by any URL rather than by a check.
    for (const width of [320, 640, 960]) {
      const key = `rendition/${TENANT}/${await cacheKeyFor(bytes, width)}`
      expect(await env.BLOBS.get(key), `the ${width} rung was cached`).not.toBeNull()
      expect(key.startsWith(`${PUBLISHED_ROOT}/`)).toBe(false)
    }
    expect(await keysUnder(`${PUBLISHED_ROOT}/rendition/`)).toEqual([])
  })

  it('reads the cache instead of transforming, addressed by the source bytes and the width', async () => {
    const bytes = await picture(1000, 500)
    const { store, slug } = await siteWithAPicture(bytes)

    // The key the shared cache will derive, computed here the same way it is
    // there — and then planted with a rendition that is unmistakably not a
    // transform of anything. If the publish serves these bytes, the cache was
    // consulted BEFORE the transform, and at this exact key.
    const sentinel = new TextEncoder().encode('a planted rendition, not a transform')
    await env.BLOBS.put(
      `rendition/${TENANT}/${await cacheKeyFor(bytes, 640)}`,
      sentinel as unknown as ArrayBuffer,
      { httpMetadata: { contentType: 'image/png' }, customMetadata: { width: '640', height: '320' } },
    )

    const sha = await shaOf(bytes)
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const served = await env.SITES.get(`${out}/assets/d/${sha}-640.png`)
    expect(served, 'the 640 rung was published under its content address').not.toBeNull()
    expect(await served!.text()).toBe('a planted rendition, not a transform')

    // And the rungs that were NOT planted are real renditions, so the cache is a
    // lookup rather than a switch that turned the transform off.
    const other = await env.SITES.get(`${out}/assets/d/${sha}-320.png`)
    expect(pngDimensions(new Uint8Array(await other!.arrayBuffer())).width).toBe(320)
  })

  it('publishes a vector without measuring or transforming it', async () => {
    const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
    const store = await platform.forTenant(TENANT)
    const slug = nextSlug('req222-svg')
    const seed = siteSeed({ slug, pages: { 'home.json': pageWithAPicture(slug) } })
    await store.createDraft(slug)
    await store.write(slug, {
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
      assets: [
        {
          name: 'wordmark.svg',
          bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
        },
      ],
    })
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    // A vector scales for free; a ladder of rasterisations is strictly worse.
    expect(await keysUnder(`${publishedOutPrefix(siteKey, result.id)}/assets/d/`)).toEqual([])
  })
})

describe('REQ-222 — a deployment with no Images binding', () => {
  it('builds no ladder at all, rather than refusing to publish', async () => {
    expect(ladderFor({ BLOBS: env.BLOBS }, { businessId: TENANT })).toBeNull()
  })

  it('publishes the same revision it always did', async () => {
    await applySchema()
    const { store, slug } = await siteWithAPicture(await picture(1000, 500))
    // What `1c publish` does against an operator's disk, and what this Worker
    // does before the binding is configured: a real revision, real pages, and an
    // `<img>` carrying nothing but its `src`.
    const result = await publishSite(store, slug, {})
    expect(result.published).toBe(true)
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()
    expect(html).toContain('src="assets/hero.png"')
    expect(html).not.toContain('srcset')
    expect(await keysUnder(`${out}/assets/d/`)).toEqual([])
    // And the picture itself is still published, unchanged.
    expect(await env.SITES.get(`${out}/assets/hero.png`)).not.toBeNull()
  })
})

/**
 * REQ-222 — typed `<source>` elements, against the real Images binding.
 *
 * WHAT ONLY workerd CAN PROVE HERE, and it is the whole risk of format
 * negotiation: **that the bytes behind a typed source really are that format.**
 * A browser that takes a `type="image/webp"` source and finds a JPEG behind it
 * does not fall back — it has already committed — so the picture simply does not
 * paint, for every visitor whose browser reads WebP, which is nearly all of them.
 * The node suite drives a fake that returns whatever it is told to; only the real
 * binding can be caught labelling a re-encode it did not perform.
 */
describe('REQ-222 — typed sources, through the real binding', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('encodes the WebP source in WebP, and names it first', async () => {
    const { store, slug } = await siteWithAPicture(await picture(1000, 500))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()

    // WebP precedes the `<img>`, because the browser takes the first type it
    // supports and never looks at the rest.
    expect(html.indexOf('<source')).toBeLessThan(html.indexOf('<img'))
    const webp = sourceSrcsetOf(html, 'image/webp')
    expect(webp, 'the published page offers a WebP source').not.toBeNull()
    // Including the source's own width, because an alternative format has no
    // free top rung the way the original does.
    expect(webp!.map((c) => c.width)).toEqual([320, 640, 960, 1000])

    for (const candidate of webp!) {
      const object = await env.SITES.get(`${out}/${candidate.src}`)
      expect(object, `${candidate.src} was named but not written`).not.toBeNull()
      const bytes = new Uint8Array(await object!.arrayBuffer())
      // THE ASSERTION THE NODE SUITE CANNOT MAKE: these bytes really are a WebP.
      // `RIFF....WEBP` is the container's own magic, read here rather than taken
      // from a content type nobody set.
      const magic = new TextDecoder().decode(bytes.slice(0, 4))
      const form = new TextDecoder().decode(bytes.slice(8, 12))
      expect(magic, candidate.src).toBe('RIFF')
      expect(form, candidate.src).toBe('WEBP')
    }
  })

  it('keeps the img on the source format, so the fallback is real', async () => {
    // ITS OWN WIDTH, so the cache keys this publish derives are this publish's.
    // The tenant's rendition prefix is shared by every test in the file, and one
    // above plants a sentinel at a 1000px picture's 640 rung — reusing that width
    // here would assert against the other test's fixture.
    const { store, slug } = await siteWithAPicture(await picture(1300, 650))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()

    // Every candidate in the `<img>`'s own ladder is still a PNG, decodable by
    // the repository's PNG reader — which is what makes it a fallback rather
    // than a second copy of the WebP ladder.
    for (const candidate of srcsetOf(html)) {
      expect(candidate.src.endsWith('.png'), candidate.src).toBe(true)
      const object = await env.SITES.get(`${out}/${candidate.src}`)
      const bytes = new Uint8Array(await object!.arrayBuffer())
      expect(pngDimensions(bytes).width, candidate.src).toBe(candidate.width)
    }
  })

  it('caches an alternative rendition at its own address, so a republish is free', async () => {
    // THE FORMAT IS IN THE KEY. Two renders of one picture at one width in two
    // codecs are two different files, and a key that omitted the format would
    // serve whichever of them was encoded first for both — which is the
    // JPEG-behind-a-WebP-source failure, arriving through the cache instead.
    const bytes = await picture(1200, 600)
    const { store, slug } = await siteWithAPicture(bytes)
    await publishSite(store, slug, { ladder: realLadder() })

    const sourceKey = `rendition/${TENANT}/${await cacheKeyFor(bytes, 640)}`
    const webpKey = `rendition/${TENANT}/${await cacheKeyFor(bytes, 640, 'image/webp')}`
    expect(sourceKey).not.toBe(webpKey)
    expect(await env.BLOBS.get(sourceKey), 'the 640 PNG rung was cached').not.toBeNull()
    expect(await env.BLOBS.get(webpKey), 'the 640 WebP rung was cached').not.toBeNull()

    const cached = await env.BLOBS.get(webpKey)
    const cachedBytes = new Uint8Array(await cached!.arrayBuffer())
    expect(new TextDecoder().decode(cachedBytes.slice(8, 12))).toBe('WEBP')
  })

  it('gives a picture below the smallest step no picture element at all', async () => {
    // The body's plainest promise: such a picture is served exactly as it is.
    const { store, slug } = await siteWithAPicture(await picture(300, 150))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const siteKey = (await store.siteKey(slug))!
    const out = publishedOutPrefix(siteKey, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('<source')
    expect(html).toContain('src="assets/hero.png"')
  })
})
