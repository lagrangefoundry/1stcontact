import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * REQ-220 — **what the modal's two writes actually do to the record**.
 *
 * WHAT THIS FILE IS FOR. The jsdom suites beside it prove the surface: that
 * clicking a picture opens it, that the name is one field in two places, that the
 * tools are the vocabulary and nothing more. This is the contract half — what the
 * origin stores when that surface commits, and the two ways it refuses.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and real R2, and every
 * fact is read back off the ticket store's own record rather than off the
 * response that claims it. A route that returned the right envelope and wrote
 * nothing would pass an assertion on its own reply.
 *
 * ONE DOUBLE, NAMED WHERE IT IS USED: the describers, which are model boundaries
 * miniflare cannot reach and about which nothing here claims anything. Ingestion
 * requires one (REQ-173), so every case uploads against a configured deployment.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. THE LIBRARY NAME IS EDITABLE, AND IT IS THE TITLE. *"This is the fix for
 *     generated images arriving named after their own prompt."* The filename is
 *     untouched, because it is a different fact about the same material.
 *  2. AN EMPTY NAME IS REFUSED, because the row falls back to the FILENAME when a
 *     title is missing — so an empty one would silently re-label the picture with
 *     the path the client was trying to get away from.
 *  3. AN EDIT IS A RECIPE, NOT NEW BYTES. The operations land on the record and
 *     the attachment is byte-for-byte what was uploaded. **The picture is never
 *     destroyed**, and this is where that is true rather than merely promised.
 *  4. THE RECIPE IS PARSED BY THE ONE VOCABULARY, `image-recipe.ts` — the same
 *     functions `edit_image` dispatches to. An operation that is not on the list
 *     is refused and nothing is written, so a record never carries an instruction
 *     no renderer can honour.
 *  5. `rendered` IS ANSWERED HONESTLY. The recipe is stored; applying it to bytes
 *     is the renderer's, and the renderer is REQ-219's — so the editor can say
 *     *you are looking at a preview* rather than implying bytes that do not exist.
 *  6. A DRAWING IS REFUSED, AND IS TOLD WHICH REFUSAL IT IS. An SVG is filed as
 *     an `image` and none of the four operations applies to it.
 *  7. A THING THAT IS NOT A PICTURE IS REFUSED — 403 and not 400, because no other
 *     body would make a crop of a brand PDF mean something.
 */

const APPLIED = applySchema()

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** The describers, doubled — see the header. Nothing here claims anything of them. */
function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({
      text: 'A warm photograph of a corner bakery at golden hour.',
      model: 'stub/vision-1',
    }),
  }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', 'site')
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

async function post(tenant: string, path: string, payload: unknown): Promise<Response> {
  return route(
    new Request(`https://app.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
}

const body = async (r: Response) => (await r.json()) as Record<string, unknown>

/** The ticket as the STORE holds it, not as a response describes it. */
async function stored(tenant: string, uid: string) {
  const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const { ticket } = await store.get({ uid })
  return ticket
}

/** The bytes the file route serves, so "never destroyed" is checked against them. */
async function served(tenant: string, uid: string): Promise<string> {
  const response = await route(
    new Request(`https://app.test/api/material/file?uid=${encodeURIComponent(uid)}`),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return response.text()
}

/** A PNG by content type, which is all `kindOf` reads to file it as a picture. */
const PICTURE = { bytes: bytesOf('not really a png, and nothing here decodes one'), name: 'generated-3f2a.png', type: 'image/png' }

beforeAll(async () => {
  await APPLIED
})

describe('REQ-220 — the Library name is editable', () => {
  it('test_UAT_FC_REQ-220_a_generated_image_can_be_renamed_and_the_filename_is_left_alone', async () => {
    const tenant = 'req220-name'
    const created = await upload(tenant, PICTURE)
    const uid = String(created.uid)

    // It arrives under what the describer wrote — for a generated image, the
    // prompt that made it. That is the gap this ticket is about.
    expect(await post(tenant, '/api/material/name', { uid, title: 'The bakery, golden hour' })).
      toMatchObject({ status: 200 })

    const ticket = await stored(tenant, uid)
    // THE TITLE IS WHAT CHANGED — the name the item appears under in the Library.
    expect(ticket.title).toBe('The bakery, golden hour')
    // AND THE FILENAME IS WHAT DID NOT. It is the name the bytes arrived with and
    // what the download saves under; a control that wrote both would quietly
    // change what lands in the client's downloads folder.
    expect(ticket.fields.filename).toBe('generated-3f2a.png')
  })

  it('test_UAT_FC_REQ-220_an_empty_name_is_refused_and_the_record_is_left_as_it_was', async () => {
    const tenant = 'req220-empty'
    const uid = String((await upload(tenant, PICTURE)).uid)
    const was = (await stored(tenant, uid)).title

    const refused = await post(tenant, '/api/material/name', { uid, title: '   ' })
    expect(refused.status).toBe(400)
    // A SENTENCE WRITTEN FOR THE PERSON WHO CLEARED THE BOX, which is what
    // `mountFields` shows inline against the field it rolled back.
    expect(String((await body(refused)).error)).toMatch(/name/i)
    expect((await stored(tenant, uid)).title).toBe(was)
  })
})

describe('REQ-220 — an edit is a recipe, not new bytes', () => {
  it('test_UAT_FC_REQ-220_cropping_writes_operations_and_leaves_the_picture_byte_for_byte', async () => {
    const tenant = 'req220-recipe'
    const uid = String((await upload(tenant, PICTURE)).uid)
    const before = await served(tenant, uid)

    const saved = await post(tenant, '/api/material/recipe', {
      uid,
      recipe: [
        { op: 'crop', left: 0.2, top: 0.1, right: 0.3, bottom: 0.4 },
        { op: 'rotate', degrees: 90 },
      ],
    })
    expect(saved.status).toBe(200)

    // STORED IN THE FIELD THE RENDERER AND THE ASSISTANT ALREADY READ ([[REQ-219]]).
    // The modal is a second producer of structured edits, not a second store, so
    // a picture cropped here and a picture cropped by `edit_image` are one record.
    const ticket = await stored(tenant, uid)
    expect(ticket.fields.edits).toEqual([
      { op: 'crop', left: 0.2, top: 0.1, right: 0.3, bottom: 0.4 },
      { op: 'rotate', degrees: 90 },
    ])

    // **AND THE PICTURE IS NEVER DESTROYED.** The original is kept forever: a
    // crop can be widened again a year later because what it took away is still
    // there. This is the assertion that makes that true rather than promised.
    expect(await served(tenant, uid)).toBe(before)

    // Which means removing the operation returns the whole picture — the limiting
    // case of widening it.
    await post(tenant, '/api/material/recipe', { uid, recipe: [] })
    expect((await stored(tenant, uid)).fields.edits).toEqual([])
    expect(await served(tenant, uid)).toBe(before)
  })

  it('test_UAT_FC_REQ-220_an_operation_that_is_not_in_the_vocabulary_never_becomes_a_stored_instruction', async () => {
    const tenant = 'req220-vocab'
    const uid = String((await upload(tenant, PICTURE)).uid)

    const refused = await post(tenant, '/api/material/recipe', {
      uid,
      // `flip` is deliberately out of v1 (REQ-219): four operations answer the
      // ask and a fifth with no caller is a fifth to maintain. Storing it anyway
      // would leave a record carrying an instruction nothing can honour,
      // discovered at publish.
      recipe: [{ op: 'flip', axis: 'x' }, { op: 'rotate', degrees: 180 }],
    })

    // ONE LIST, ENFORCED WHERE IT IS WRITTEN — and the whole call is refused
    // rather than the unknown entry being quietly dropped. A recipe is an ordered
    // list whose entries depend on each other, so a route that stored the half it
    // recognised would give the client a picture nobody asked for. NOTHING is
    // written, which is what makes a refusal safe to show.
    expect(refused.status).toBe(409)
    expect((await stored(tenant, uid)).fields.edits ?? null).toBeNull()
  })

  it('test_UAT_FC_REQ-220_the_origin_says_plainly_that_it_has_not_rendered_the_bytes', async () => {
    const tenant = 'req220-rendered'
    const uid = String((await upload(tenant, PICTURE)).uid)
    const saved = await body(await post(tenant, '/api/material/recipe', {
      uid,
      recipe: [{ op: 'rotate', degrees: 90 }],
    }))

    // *"Interaction is local; truth is rendered."* This deployment has no Images
    // binding, so there is nothing to measure the picture with and nothing to
    // apply the recipe: the recipe is stored anyway — refusing a change we have
    // recorded would be worse — and `rendered: false` is what lets the editor say
    // *you are looking at this picture before the change* instead of implying
    // bytes that do not exist.
    expect(saved.rendered).toBe(false)
    expect(saved.edits).toEqual([{ op: 'rotate', degrees: 90 }])
  })
})

describe('REQ-220 — a thing that is not a picture', () => {
  it('test_UAT_FC_REQ-220_asking_for_a_crop_of_a_document_is_refused_as_a_matter_of_meaning', async () => {
    const tenant = 'req220-notapicture'
    const uid = String(
      (await upload(tenant, { bytes: bytesOf('Our brand, at length.'), name: 'brand.md', type: 'text/markdown' }))
        .uid,
    )

    const refused = await post(tenant, '/api/material/recipe', {
      uid,
      recipe: [{ op: 'rotate', degrees: 90 }],
    })
    // 403 AND NOT 400. The request is perfectly well formed and there is nothing
    // the caller could send instead that would make a crop of a brand document
    // mean something — the same distinction REQ-213's refusals draw.
    expect(refused.status).toBe(403)
    expect((await stored(tenant, uid)).fields.edits ?? null).toBeNull()
  })
})

describe('REQ-220 — a drawing is not edited this way', () => {
  it('test_UAT_FC_REQ-220_a_drawing_is_refused_and_told_which_refusal_it_is', async () => {
    const tenant = 'req220-drawing'
    const uid = String(
      (
        await upload(tenant, {
          bytes: bytesOf('<svg xmlns="http://www.w3.org/2000/svg"/>'),
          name: 'mark.svg',
          type: 'image/svg+xml',
        })
      ).uid,
    )

    const refused = await post(tenant, '/api/material/recipe', {
      uid,
      recipe: [{ op: 'crop', x: 0.1, y: 0.1, w: 0.5, h: 0.5 }],
    })
    // FILED AS AN `image` AND STILL REFUSED. `kindOf` calls an SVG an image, so
    // `kind` alone would have let a crop of a vector be stored — an instruction
    // no renderer can honour. And the sentence says which refusal it is: *a
    // drawing* is a different fact from *not a picture*, and a client told the
    // second about their own logo has been told something false.
    expect(refused.status).toBe(403)
    expect(String((await body(refused)).error)).toMatch(/drawing/i)
    expect((await stored(tenant, uid)).fields.edits ?? null).toBeNull()
  })
})
