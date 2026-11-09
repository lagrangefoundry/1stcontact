import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import type { ImagesLike } from '../apps/control-app/src/heic'
import { applySchema } from './support/d1-site-factory'
import { isoMediaBytes, pngBytes } from './support/material-fixtures'

/**
 * STORY-6ccaedd5 (ingestion), reconciled for REQ-221 — **HEIC at the door**.
 *
 * Everything here goes through the Worker's own upload route against real D1
 * and R2. The ONE double is the Cloudflare Images binding: miniflare's local
 * implementation does not decode HEIC, and what the live API does with real
 * HEIC bytes is a question about an account's plan, not this repository.
 *
 * Where the success path is exercised, the double stands in for `env.IMAGES`
 * itself rather than for the `convertHeic` seam, so the route builds its
 * converter the way the deployed Worker does and the rename is the real one.
 */

const APPLIED = applySchema()
const TENANT = 'recon-heic-door'
const scopeOf = (): Scope => ({ businessId: TENANT })

const MiB = 1024 * 1024

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** Model seams doubled; the index announcement is counted. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    describeImage: async () => ({ text: 'A shopfront\n\nPainted green.', model: 'stub/vision-1' }),
    describeText: async () => ({ text: 'A document\n\nDigest.', model: 'stub/digest-1' }),
    ...over,
    indexed,
  }
}

/** A JPEG-looking result, distinct per call so stored bytes can be identified. */
let jpegSerial = 0
function jpegBytes(): Uint8Array {
  jpegSerial += 1
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, (jpegSerial >>> 8) & 0xff, jpegSerial & 0xff, 0x4a, 0x46])
}

/** An Images binding double that records what it was handed. */
function imagesDouble(): { binding: ImagesLike; inputs: Uint8Array[]; produced: Uint8Array[] } {
  const inputs: Uint8Array[] = []
  const produced: Uint8Array[] = []
  const binding: ImagesLike = {
    input(stream) {
      const read = new Response(stream).arrayBuffer().then((b) => new Uint8Array(b))
      return {
        async output() {
          inputs.push(await read)
          const out = jpegBytes()
          produced.push(out)
          return {
            image: () => new Response(out).body as ReadableStream<Uint8Array>,
            contentType: () => 'image/jpeg',
          }
        },
      }
    },
  }
  return { binding, inputs, produced }
}

/** A converter seam that records calls (for the paths where it must not run). */
function recordingConverter(): { convert: NonNullable<RouterDeps['convertHeic']>; calls: number[] } {
  const calls: number[] = []
  return {
    calls,
    convert: async ({ bytes, filename }) => {
      calls.push(bytes.length)
      return { bytes: jpegBytes(), filename: `${filename}.jpg`, contentType: 'image/jpeg' }
    },
  }
}

async function upload(
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(envOver),
    scopeOf(),
    d,
  )
}

async function materials() {
  const store = await ticketStoreFor(routerEnv(), scopeOf())
  return (await store.list({ type: 'material', limit: 'all' })).tickets
}

async function blobKeys(): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix: `t/${TENANT}/`, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out
}

async function bytesAt(key: string): Promise<Uint8Array> {
  const object = await (env.BLOBS as R2Bucket).get(key)
  return new Uint8Array(await object!.arrayBuffer())
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** HEIF bytes made unique per call, so "no copy was written" is checkable. */
let heifSerial = 0
function uniqueIso(brand: string, filler = 64): Uint8Array {
  const bytes = isoMediaBytes(brand, filler)
  heifSerial += 1
  bytes[bytes.length - 1] = heifSerial & 0xff
  bytes[bytes.length - 2] = (heifSerial >>> 8) & 0xff
  return bytes
}

function uniquePng(): Uint8Array {
  const bytes = pngBytes()
  heifSerial += 1
  bytes[bytes.length - 1] = heifSerial & 0xff
  bytes[bytes.length - 2] = (heifSerial >>> 8) & 0xff
  return bytes
}

beforeAll(async () => {
  await APPLIED
})

const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']

describe('STORY-6ccaedd5 — HEIC at the upload door (REQ-221)', () => {
  it('test_UAT_AC2534_a_heif_upload_is_stored_as_a_jpeg_image_named_jpg_whatever_its_declared_type', async () => {
    const store = await ticketStoreFor(routerEnv(), scopeOf())

    // Every HEIF brand, with a declared type and with none at all.
    const cases: Array<{ brand: string; declared: string; name: string; expected: string }> = []
    for (const brand of HEIF_BRANDS) {
      cases.push({ brand, declared: 'image/heic', name: `${brand}-declared.HEIC`, expected: `${brand}-declared.jpg` })
      cases.push({ brand, declared: '', name: `${brand}-silent.heic`, expected: `${brand}-silent.jpg` })
    }
    // The rename rule: replace the extension, add one, or name a bare extension.
    cases.push({ brand: 'heic', declared: '', name: 'shopfront.HEIC', expected: 'shopfront.jpg' })
    cases.push({ brand: 'heic', declared: '', name: 'IMG_0001', expected: 'IMG_0001.jpg' })
    cases.push({ brand: 'heic', declared: 'image/heic', name: '.HEIC', expected: 'photograph.jpg' })

    for (const c of cases) {
      const images = imagesDouble()
      const original = uniqueIso(c.brand)
      const keysBefore = new Set(await blobKeys())

      const response = await upload(original, c.name, c.declared, deps(), { IMAGES: images.binding })
      expect(response.status, `${c.brand} / ${c.name}`).toBe(200)
      const body = (await response.json()) as Record<string, unknown>

      // The converter received the original bytes — once.
      expect(images.inputs).toHaveLength(1)
      expect(sameBytes(images.inputs[0], original)).toBe(true)

      // The material is an image, filed under the rewritten name, typed JPEG.
      const { ticket } = await store.get({ uid: String(body.uid) })
      expect(ticket.fields.kind, c.name).toBe('image')
      expect(ticket.fields.filename, c.name).toBe(c.expected)
      expect(ticket.fields.content_type, c.name).toBe('image/jpeg')
      const listed = (await materials()).find((t) => t.uid === ticket.uid)
      expect(listed?.fields.filename).toBe(c.expected)

      // The record of the stored bytes carries the JPEG type and the new name.
      const attachments = (await store.attachments({ uid: ticket.uid })).attachments
      expect(attachments).toHaveLength(1)
      expect(attachments[0].fields.content_type).toBe('image/jpeg')
      expect(attachments[0].fields.filename).toBe(c.expected)

      // Already the JPEG when the upload answers, and the HEIC bytes are nowhere.
      const added = (await blobKeys()).filter((k) => !keysBefore.has(k))
      expect(added.length).toBeGreaterThanOrEqual(1)
      const stored = await Promise.all(added.map(bytesAt))
      expect(stored.some((b) => sameBytes(b, images.produced[0]))).toBe(true)
      expect(stored.some((b) => sameBytes(b, original))).toBe(false)
    }

    // Declared `image/heic` on bytes that are not HEIF: never handed to the converter.
    const images = imagesDouble()
    const notHeif = uniquePng()
    const response = await upload(notHeif, 'mislabelled.heic', 'image/heic', deps(), {
      IMAGES: images.binding,
    })
    expect(response.status).toBe(200)
    expect(images.inputs).toHaveLength(0)
  })

  it('test_UAT_AC2535_avif_and_every_non_heif_upload_is_stored_byte_for_byte_under_its_own_name', async () => {
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const converter = recordingConverter()
    const images = imagesDouble()

    const cases = [
      { bytes: uniqueIso('avif'), name: 'hero.avif', type: 'image/avif' },
      { bytes: uniqueIso('avis'), name: 'loop.avif', type: '' },
      { bytes: uniquePng(), name: 'logo.png', type: 'image/png' },
    ]
    for (const c of cases) {
      const keysBefore = new Set(await blobKeys())
      // Both the injected seam and the real binding path are watched.
      const response = await upload(c.bytes, c.name, c.type, deps({ convertHeic: converter.convert }), {
        IMAGES: images.binding,
      })
      expect(response.status, c.name).toBe(200)
      const body = (await response.json()) as Record<string, unknown>

      const { ticket } = await store.get({ uid: String(body.uid) })
      expect(ticket.fields.filename).toBe(c.name)
      const attachments = (await store.attachments({ uid: ticket.uid })).attachments
      expect(attachments).toHaveLength(1)
      expect(attachments[0].fields.filename).toBe(c.name)

      const added = (await blobKeys()).filter((k) => !keysBefore.has(k))
      const stored = await Promise.all(added.map(bytesAt))
      expect(stored.some((b) => sameBytes(b, c.bytes)), `${c.name} stored byte for byte`).toBe(true)
    }

    expect(converter.calls).toHaveLength(0)
    expect(images.inputs).toHaveLength(0)
  })

  it('test_UAT_AC2536_an_unconvertible_heic_is_refused_with_a_distinct_sentence_and_nothing_is_created', async () => {
    const sentences: string[] = []

    async function refusedCase(
      bytes: Uint8Array,
      d: RouterDeps & { indexed: string[] },
    ): Promise<{ status: number; error: string }> {
      const before = (await materials()).length
      const keysBefore = (await blobKeys()).length
      const response = await upload(bytes, 'shopfront.HEIC', '', d)
      const body = (await response.json()) as { error: string }
      // Nothing created, nothing stored, nothing announced.
      expect(await materials()).toHaveLength(before)
      expect(await blobKeys()).toHaveLength(keysBefore)
      expect(d.indexed).toEqual([])
      // None of the sentences names the file.
      expect(body.error).not.toContain('shopfront')
      sentences.push(body.error)
      return { status: response.status, error: body.error }
    }

    // 1. No converter configured (null is the unconfigured deployment).
    const none = await refusedCase(uniqueIso('heic'), deps({ convertHeic: null }))
    expect(none.status).toBeGreaterThanOrEqual(400)
    expect(none.status).toBeLessThan(500)
    expect(none.error).toContain('HEIC')
    expect(none.error).toMatch(/iPhone/)
    expect(none.error).toMatch(/no image converter configured/)
    expect(none.error).toContain('Settings → Camera → Formats → Most Compatible')

    // 2. Over the converter's 20 MiB ceiling, under the 25 MiB material ceiling.
    const recorder = recordingConverter()
    const big = uniqueIso('heic', 21 * MiB)
    const tooBig = await refusedCase(big, deps({ convertHeic: recorder.convert }))
    expect(tooBig.status).toBeGreaterThanOrEqual(400)
    expect(tooBig.status).toBeLessThan(500)
    expect(tooBig.error).toMatch(/the limit is 20MB/)
    expect(tooBig.error).toMatch(/MB/)
    expect(tooBig.error).not.toMatch(/\d{6,}/)
    expect(tooBig.error).not.toMatch(/converter|could not be converted/)
    expect(recorder.calls).toHaveLength(0)

    // 3. The conversion itself fails on these bytes.
    const failed = await refusedCase(
      uniqueIso('heic'),
      deps({
        convertHeic: async () => {
          throw new Error('IMAGES_TRANSFORM_FAILED (9412) decoder exploded')
        },
      }),
    )
    expect(failed.status).toBeGreaterThanOrEqual(400)
    expect(failed.status).toBeLessThan(500)
    expect(failed.error).toContain('HEIC')
    expect(failed.error).toMatch(/could not be converted into a picture/)
    expect(failed.error).toMatch(/damaged/)
    expect(failed.error).toContain('Settings → Camera → Formats → Most Compatible')
    expect(failed.error).not.toContain('9412')
    expect(failed.error).not.toContain('IMAGES_TRANSFORM_FAILED')
    expect(failed.error).not.toContain('decoder exploded')

    // Three different facts, three different sentences.
    expect(new Set(sentences).size).toBe(3)
  })

  it('test_UAT_AC1810_a_declared_heic_type_on_bytes_that_are_not_heif_is_carried_through_untouched', async () => {
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const converter = recordingConverter()

    const response = await upload(uniquePng(), 'not-really.heic', 'image/heic', deps({
      convertHeic: converter.convert,
    }))
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    // The stated type is what both the material and its stored-bytes record hold.
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.fields.content_type).toBe('image/heic')
    expect(ticket.fields.filename).toBe('not-really.heic')
    const attachments = (await store.attachments({ uid: ticket.uid })).attachments
    expect(attachments).toHaveLength(1)
    expect(attachments[0].fields.content_type).toBe('image/heic')
    expect(converter.calls).toHaveLength(0)
  })
})
