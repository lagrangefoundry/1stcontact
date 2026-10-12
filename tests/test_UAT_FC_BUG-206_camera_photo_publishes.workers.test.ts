import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import { ladderFor } from '../apps/control-app/src/image-ladder'
import { storeFor } from '../apps/control-app/src/store'
import type { Scope } from '../apps/control-app/src/scope'
import { LadderPictureError, MAX_SOURCE_EDGE } from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { publishedOutPrefix } from '../tools/generate/src/store/revision-model'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * BUG-206 — a photograph straight off a camera must not make a site
 * unpublishable.
 *
 * WHAT HAPPENED. `faelan.com` held a 5712 × 4284 (24.5 MP) JPEG, and its publish
 * died with the Images service's own `IMAGES_TRANSFORM_ERROR 9529`, naming no
 * picture. The ladder transformed every rung straight from the original, and the
 * full-width WebP rung asked the service for 24.5 MP of output.
 *
 * THE IMAGES SERVICE IS THE ONE THING FAKED, because it is the external boundary
 * and the behaviour under test is how this code answers the service's refusals —
 * which the local emulation never produces. The fake refuses, with the real
 * message, any transform whose OUTPUT exceeds {@link REFUSED_ABOVE_PIXELS}, and
 * can be told to be "busy" for a number of calls. Everything else — the router,
 * the door, the store, the renderer, its R2 rendition cache, the ladder and the
 * publish — is the real code over the real local bindings.
 *
 * A FAKE PICTURE IS A HEADER AND A TAG. Its bytes carry its own dimensions, so
 * what the store holds and what each transform was handed can be read off the
 * bytes rather than trusted; the tag makes every picture in the file a distinct
 * content address, so the shared rendition cache cannot answer one test with
 * another's work.
 */

const ORIGIN = 'https://app.test'
const TENANT = 'bug206'
const scope: Scope = { businessId: TENANT }

/** What the service's real refusal said, verbatim from the production failure. */
const REFUSAL =
  'IMAGES_TRANSFORM_ERROR 9529: The image is too large to process or the service is too busy'

/** The fake service refuses any output larger than this — 16 MP. */
const REFUSED_ABOVE_PIXELS = 16_000_000

const MAGIC = [0x46, 0x41, 0x4b, 0x45] // "FAKE"
let tags = 0

/** A fake picture `width` × `height`, unique to this call. */
function picture(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(32)
  bytes.set(MAGIC, 0)
  const view = new DataView(bytes.buffer)
  view.setUint32(4, width)
  view.setUint32(8, height)
  view.setFloat64(12, Date.now() + tags++ + Math.random())
  return bytes
}

/** What a fake picture says it is, or null for bytes that are not one. */
function dimensionsOf(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 12 || MAGIC.some((b, i) => bytes[i] !== b)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(4), height: view.getUint32(8) }
}

/** One transform the service performed or refused. */
interface Transform {
  input: { width: number; height: number }
  output: { width: number; height: number }
  format: string
  refused: boolean
}

/**
 * The Images binding, as far as this code reaches it: `info`, and an
 * `input → transform → output` chain applying `scale-down` widths.
 */
function fakeImages(opts: { busy?: number } = {}) {
  let busy = opts.busy ?? 0
  const log = { info: 0, inputs: 0, transforms: [] as Transform[] }
  const read = async (stream: ReadableStream<Uint8Array>) =>
    new Uint8Array(await new Response(stream).arrayBuffer())
  const binding = {
    async info(stream: ReadableStream<Uint8Array>) {
      log.info += 1
      const bytes = await read(stream)
      const size = dimensionsOf(bytes)
      if (!size) throw new Error('IMAGES_INFO_ERROR 9520: not an image')
      return { format: 'image/jpeg', fileSize: bytes.length, ...size }
    },
    input(stream: ReadableStream<Uint8Array>) {
      log.inputs += 1
      const steps: { width?: number; fit?: string }[] = []
      const chain = {
        transform(step: { width?: number; fit?: string }) {
          steps.push(step)
          return chain
        },
        async output({ format }: { format: string }) {
          const input = dimensionsOf(await read(stream))!
          let { width, height } = input
          for (const step of steps) {
            if (step.width !== undefined && step.width < width) {
              height = Math.round((height * step.width) / width)
              width = step.width
            }
          }
          const refused = busy > 0 || width * height > REFUSED_ABOVE_PIXELS
          log.transforms.push({ input, output: { width, height }, format, refused })
          if (busy > 0) busy -= 1
          if (refused) throw new Error(REFUSAL)
          const out = picture(width, height)
          return {
            image: () => new Blob([out]).stream(),
            contentType: () => format,
          }
        },
      }
      return chain
    },
  }
  return { binding, log, failForever: () => (busy = Number.POSITIVE_INFINITY) }
}

function routerEnv(images: unknown): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: images,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))

/** The starter home page, placing one picture. */
function pageShowing(slug: string, name: string): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          {
            kind: 'image',
            src: `/assets/${name}`,
            alt: 'a photograph',
            sizing: { width: { mode: 'fixed', px: 600 } },
          },
        ],
      },
    },
  }
}

/** Copy a one-picture site up through `/api/import`, as `1c push` does. */
async function importSite(images: unknown, name: string, bytes: Uint8Array): Promise<string> {
  const seed = siteSeed({ slug: `bug206-${tags++}` })
  const response = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: [{ name: 'home.json', page: pageShowing(seed.slug, name) }],
        assets: [{ name, base64: base64(bytes) }],
      }),
    }),
    routerEnv(images),
    scope,
    {},
  )
  expect(response.status, await response.clone().text()).toBe(200)
  return ((await response.json()) as { site: string }).site
}

/**
 * A site that already holds `bytes` — written straight to the store, past the
 * door, as every site uploaded before this fix was.
 */
async function siteHolding(name: string, bytes: Uint8Array) {
  const store = await storeFor({ DB: env.DB, SITES: env.SITES }, scope)
  const seed = siteSeed({ slug: `bug206-${tags++}` })
  const slug = await store.createDraft()
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: [{ name: 'home.json', page: pageShowing(seed.slug, name) }],
    assets: [{ name, bytes }],
  })
  return { store, slug }
}

/** The ladder this deployment builds, over the fake service. */
function ladderOver(images: unknown) {
  const ladder = ladderFor(routerEnv(images) as Parameters<typeof ladderFor>[0], scope)
  expect(ladder).not.toBeNull()
  return ladder!
}

describe('BUG-206 — a full-size camera photograph', () => {
  beforeAll(async () => {
    await applySchema()
    await ensureTenant(TENANT)
  })

  it('test_UAT_FC_BUG-206_an_imported_camera_photo_is_stored_capped_with_its_aspect', async () => {
    const service = fakeImages()
    const site = await importSite(service.binding, 'scorched-earth.jpeg', picture(5712, 4284))

    const store = await storeFor({ DB: env.DB, SITES: env.SITES }, scope)
    const stored = dimensionsOf((await store.readAsset(site, 'scorched-earth.jpeg'))!)
    expect(stored).not.toBeNull()
    expect(Math.max(stored!.width, stored!.height)).toBeLessThanOrEqual(MAX_SOURCE_EDGE)
    expect(stored).toEqual({ width: MAX_SOURCE_EDGE, height: 3072 })
    // Its own format: a JPEG stays a JPEG.
    expect(service.log.transforms.map((t) => t.format)).toEqual(['image/jpeg'])
  })

  it('test_UAT_FC_BUG-206_a_picture_at_or_under_the_cap_is_stored_byte_identical', async () => {
    const service = fakeImages()
    const atCap = picture(MAX_SOURCE_EDGE, 3072)
    const site = await importSite(service.binding, 'at-cap.jpg', atCap)

    const store = await storeFor({ DB: env.DB, SITES: env.SITES }, scope)
    expect(await store.readAsset(site, 'at-cap.jpg')).toEqual(atCap)
    // Its dimensions were READ — headers, through `info` — and nothing was
    // transformed: the picture never went into a transform chain at all.
    expect(service.log.info).toBe(1)
    expect(service.log.inputs).toBe(0)
  })

  it('test_UAT_FC_BUG-206_a_site_already_holding_an_oversized_photo_publishes_from_a_capped_source', async () => {
    const service = fakeImages()
    const original = picture(5712, 4284)
    const { store, slug } = await siteHolding('scorched-earth.jpeg', original)

    const result = await publishSite(store, slug, { ladder: ladderOver(service.binding) })
    expect(result.published).toBe(true)

    // NOTHING WAS REFUSED, and the one transform that read the full-size
    // original is the cap itself; every rung came from the capped picture.
    expect(service.log.transforms.filter((t) => t.refused)).toEqual([])
    const fromOriginal = service.log.transforms.filter((t) => t.input.width === 5712)
    expect(fromOriginal.length).toBeGreaterThan(0)
    for (const t of fromOriginal) expect(t.output).toEqual({ width: MAX_SOURCE_EDGE, height: 3072 })
    const rungs = service.log.transforms.filter((t) => t.input.width !== 5712)
    expect(rungs.length).toBeGreaterThan(0)
    for (const t of rungs) expect(t.input).toEqual({ width: MAX_SOURCE_EDGE, height: 3072 })

    // DELIVERY IS UNCHANGED: the stored original is still the top rung.
    const html = await (
      await env.SITES.get(`${publishedOutPrefix(slug, result.id)}/home.html`)
    )!.text()
    expect(html).toContain('assets/scorched-earth.jpeg 5712w')
    expect(html).toContain(`${MAX_SOURCE_EDGE}w`)
  })

  it('test_UAT_FC_BUG-206_a_transient_refusal_is_retried_and_the_publish_succeeds', async () => {
    const service = fakeImages({ busy: 1 })
    const { store, slug } = await siteHolding('hero.jpg', picture(1000, 750))

    const result = await publishSite(store, slug, { ladder: ladderOver(service.binding) })
    expect(result.published).toBe(true)
    expect(service.log.transforms.filter((t) => t.refused)).toHaveLength(1)
    expect(service.log.transforms.filter((t) => !t.refused).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-206_a_persistent_refusal_names_the_picture_and_its_size', async () => {
    const service = fakeImages()
    service.failForever()
    const { store, slug } = await siteHolding('hero.jpg', picture(1000, 750))

    const failure = await publishSite(store, slug, { ladder: ladderOver(service.binding) }).then(
      () => null,
      (err: unknown) => err,
    )
    expect(failure).toBeInstanceOf(LadderPictureError)
    const message = (failure as Error).message
    expect(message).toContain('hero.jpg')
    expect(message).toContain('1000 × 750')
    expect(message).toContain(String(MAX_SOURCE_EDGE))
    expect(message).not.toMatch(/9529|IMAGES_TRANSFORM_ERROR/)
    // It was retried before it was reported.
    expect(service.log.transforms.length).toBeGreaterThanOrEqual(3)
  })
})
