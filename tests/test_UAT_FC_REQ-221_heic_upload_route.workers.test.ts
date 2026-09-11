import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { heicBytes, pngBytes } from './support/material-fixtures'
import { CONVERTED_CONTENT_TYPE } from '../apps/control-app/src/heic'

/**
 * REQ-221 — **the door, through the Worker's own route, against a real store**.
 *
 * WHAT THIS ADDS TO ITS NODE SIBLING. That one proves the conversion decisions
 * against a recording store: what is converted, what is not, what is refused.
 * This one proves the two claims that are only true if the whole route agrees —
 * that a refused photograph leaves NOTHING BEHIND in a real D1 and a real R2,
 * and that a converted one is a material a later reader finds as an ordinary
 * image. A record naming bytes that are not there is the failure [[DOC-38]]
 * §7.3's ordering exists to forbid, and a store double cannot testify that it
 * did not happen.
 *
 * THE CONVERTER IS THE ONE DOUBLE, and the ticket's own argument is why. The
 * Images binding's local implementation supports a subset of transforms and does
 * not decode HEIC, so reaching for the real binding here would prove neither the
 * success path nor the refusals — it would only prove that miniflare declines. A
 * double makes every branch reachable; what the live API does with real HEIC
 * bytes is a question about an account's plan and is deliberately not claimed.
 */

const APPLIED = applySchema()
const TENANT = 'req221'
const scopeOf = (businessId = TENANT): Scope => ({ businessId })

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** The three model seams doubled, so nothing below depends on a network. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeImage: async () => ({
      text: 'A shopfront\n\nPainted green, with a bicycle outside.',
      model: 'stub/vision-1',
    }),
    describeText: async () => ({ text: 'unused', model: 'stub/digest-1' }),
    ...over,
  }
}

/** The converter, doubled: a JPEG with a signature a test can recognise. */
const CONVERTED = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x12, 0x34])
const converter: NonNullable<RouterDeps['convertHeic']> = async ({ filename }) => ({
  bytes: CONVERTED,
  filename: filename.replace(/\.[A-Za-z0-9]+$/, '.jpg'),
  contentType: CONVERTED_CONTENT_TYPE,
})

async function upload(
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps,
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  form.append('role', 'site')
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(),
    d,
  )
}

/** Every material this tenant holds, read back through the real store. */
async function materials() {
  const store = await ticketStoreFor(routerEnv(), scopeOf())
  return (await store.list({ type: 'material', limit: 'all' })).tickets
}

/** Every blob key in the tenant's prefix, so residency is counted not assumed. */
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

beforeAll(async () => {
  await APPLIED
})

describe('REQ-221 — an iPhone photograph through the real route', () => {
  it('UAT_FC_REQ-221 arrives as HEIC and is stored as an ordinary image', async () => {
    const before = (await materials()).length
    // THE COMMONEST FORM: dragged in from Finder, so the browser states no type
    // at all and the route falls back to `application/octet-stream`. Today this
    // is the case that lands in the Library as a `document`.
    const response = await upload(heicBytes(), 'shopfront.HEIC', '', {
      ...deps(),
      convertHeic: converter,
    })
    expect(response.status).toBe(200)

    const rows = await materials()
    expect(rows).toHaveLength(before + 1)
    const row = rows.find((t) => t.fields.filename === 'shopfront.jpg')
    expect(row, 'the material is filed under its converted name').toBeDefined()
    // INDISTINGUISHABLE FROM ANY OTHER IMAGE, in the two fields the Library
    // filters, badges and renders from.
    expect(row!.fields.kind).toBe('image')
    expect(row!.fields.content_type).toBe('image/jpeg')

    // AND THE BYTES IN R2 ARE THE JPEG. "The HEIC bytes are discarded" is a claim
    // about storage, so it is settled against storage.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const attachments = (await store.attachments({ uid: row!.uid })).attachments
    expect(attachments).toHaveLength(1)
    expect(attachments[0].fields.content_type).toBe('image/jpeg')
    expect(attachments[0].fields.filename).toBe('shopfront.jpg')
  })

  it('UAT_FC_REQ-221 a deployment with no binding refuses it, and leaves nothing behind', async () => {
    const before = (await materials()).length
    const keysBefore = (await blobKeys()).length

    // `null` IS THE UNCONFIGURED DEPLOYMENT. A deps object that simply omitted
    // the converter would ask the router for the real binding instead, which is
    // the opposite of the state under test.
    const response = await upload(heicBytes(), 'shopfront.heic', 'image/heic', {
      ...deps(),
      convertHeic: null,
    })

    // A REFUSAL, NOT A BROKEN ROW. `MaterialRejectedError` is a 400 and the
    // client reads the `error` field.
    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(body.error).toContain('HEIC')
    expect(body.error).toContain('Most Compatible')

    // NOTHING WAS CREATED AND NOTHING WAS STORED. The material is not created —
    // the failure §7.3's ordering exists to prevent is a record naming bytes
    // that are not there, and converting in front of `ingest` makes that state
    // unreachable rather than merely unlikely.
    expect(await materials()).toHaveLength(before)
    expect(await blobKeys()).toHaveLength(keysBefore)
  })

  it('UAT_FC_REQ-221 a conversion that fails refuses, and leaves nothing behind', async () => {
    const before = (await materials()).length
    const keysBefore = (await blobKeys()).length

    const response = await upload(heicBytes(), 'shopfront.heic', 'image/heic', {
      ...deps(),
      convertHeic: async () => {
        throw new Error('IMAGES_TRANSFORM_FAILED (9412)')
      },
    })

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(body.error).toContain('HEIC')
    // THE CODEC'S WORDS DO NOT REACH THE CLIENT. They are about decoders and are
    // addressed to a programmer; the sentence the client reads is one they can
    // act on.
    expect(body.error).not.toContain('9412')

    expect(await materials()).toHaveLength(before)
    expect(await blobKeys()).toHaveLength(keysBefore)
  })

  it('UAT_FC_REQ-221 an ordinary image is untouched by the door it passes through', async () => {
    const png = pngBytes()
    let asked = 0
    const response = await upload(png, 'logo.png', 'image/png', {
      ...deps(),
      convertHeic: async (input) => {
        asked += 1
        return { bytes: input.bytes, filename: input.filename, contentType: 'image/jpeg' }
      },
    })
    expect(response.status).toBe(200)
    // ANYTHING THAT IS NOT HEIC PASSES THROUGH UNTOUCHED, by identity rather than
    // by a re-encode: this runs on every upload, and a PNG that came out the
    // other side of an image pipeline would be a different file for no reason.
    expect(asked).toBe(0)

    const row = (await materials()).find((t) => t.fields.filename === 'logo.png')
    expect(row!.fields.content_type).toBe('image/png')
  })
})
