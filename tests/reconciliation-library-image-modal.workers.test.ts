import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { encodePng } from '../tools/generate/src/cli/png'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * Library (story-1500b111) — the image modal's two writes, the ROUTE half, as
 * reconciled in BUNDLE-43 (REQ-220). The surface half is
 * `reconciliation-library-image-modal.test.ts`.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1, real R2 and — where a
 * case needs one — the real Images binding, and every stored fact is read back
 * off the ticket store's own record rather than off the response that claims it.
 *
 * ONE DOUBLE: the describers, which are model boundaries miniflare cannot reach.
 * Ingestion requires one (REQ-173), so every upload runs against a configured
 * deployment.
 *
 *  - AC-2555  a recipe for anything but a raster picture is refused 403 with
 *             the sentence for which refusal it is, and nothing is stored.
 *  - AC-2556  `POST /api/material/name` writes the title, never the filename;
 *             empty, malformed and foreign requests change nothing.
 *  - AC-2557  a recipe is stored on the record and the original bytes are
 *             byte-identical before and after.
 *  - AC-2559  a recipe outside the vocabulary, or one this picture cannot take,
 *             is refused 409 in the vocabulary's words with the stored recipe
 *             unchanged; malformed requests are 400; with no renderer the recipe
 *             is stored and marked not rendered.
 */

const APPLIED = applySchema()

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

/** The deployment WITH the Images renderer bound, which can measure a picture. */
const rendering = () => routerEnv({ IMAGES: env.IMAGES as ImagesBinding } as Partial<RouterEnv>)

const scopeOf = (businessId: string): Scope => ({ businessId })

function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({ text: 'A photograph.', model: 'stub/vision-1' }),
  }
}

type FileSpec = { bytes: Uint8Array; name: string; type: string }

async function upload(tenant: string, file: FileSpec, routing = routerEnv()): Promise<string> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', 'site')
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routing,
    scopeOf(tenant),
    deps(),
  )
  expect(response.status, await response.clone().text()).toBeLessThan(300)
  return String(((await response.json()) as Record<string, unknown>).uid)
}

async function post(tenant: string, path: string, payload: unknown, routing = routerEnv()): Promise<Response> {
  return route(
    new Request(`https://app.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routing,
    scopeOf(tenant),
    deps(),
  )
}

const json = async (r: Response) => (await r.json()) as Record<string, unknown>

async function stored(tenant: string, uid: string) {
  const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await store.get({ uid })).ticket
}

/** The stored original, asked for explicitly so no renderer stands between. */
async function original(tenant: string, uid: string): Promise<Uint8Array> {
  const response = await route(
    new Request(`https://app.test/api/material/file?uid=${encodeURIComponent(uid)}&original=1`),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  expect(response.status).toBe(200)
  return new Uint8Array(await response.arrayBuffer())
}

/** A real 8×8 PNG, written by this product's own codec. */
let PNG_BYTES: Uint8Array

const PICTURE = (): FileSpec => ({ bytes: PNG_BYTES, name: 'generated-3f2a.png', type: 'image/png' })

beforeAll(async () => {
  await APPLIED
  PNG_BYTES = await encodePng({ data: new Uint8Array(8 * 8 * 3).fill(120), width: 8, height: 8, channels: 3 })
})

// ── AC-2555 ──────────────────────────────────────────────────────────────────

describe('AC-2555 — the edit route refuses everything but a raster picture', () => {
  it('test_UAT_AC2555_recipe_for_a_drawing_document_or_capture_is_refused_403_and_nothing_is_stored', async () => {
    const tenant = 'ac2555-route'
    const recipe = [{ op: 'rotate', degrees: 90 }]

    // A DRAWING — filed as an image — is told it is changed by redrawing it.
    const drawing = await upload(tenant, {
      bytes: bytesOf('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      name: 'mark.svg',
      type: 'image/svg+xml',
    })
    expect((await stored(tenant, drawing)).fields.kind).toBe('image')
    const refusedDrawing = await post(tenant, '/api/material/recipe', { uid: drawing, recipe })
    expect(refusedDrawing.status).toBe(403)
    const drawingBody = await json(refusedDrawing)
    expect(String(drawingBody.error)).toMatch(/drawing/i)
    expect(String(drawingBody.error)).toMatch(/redraw/i)
    expect((await stored(tenant, drawing)).fields.edits ?? null).toBeNull()

    // A PDF DOCUMENT is not a picture.
    const pdf = await upload(tenant, {
      bytes: bytesOf('%PDF-1.4\n%%EOF\n'),
      name: 'brand.pdf',
      type: 'application/pdf',
    })
    const refusedPdf = await post(tenant, '/api/material/recipe', { uid: pdf, recipe })
    expect(refusedPdf.status).toBe(403)
    expect(String((await json(refusedPdf)).error)).toMatch(/not a picture/i)
    expect((await stored(tenant, pdf)).fields.edits ?? null).toBeNull()

    // A CAPTURE — a screenshot of someone else's site — is not a picture either.
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const { ticket: capture } = await store.create({
      type: 'reference',
      title: 'Their old site',
      body: 'A capture of https://theirs.example/.',
      fields: {
        kind: 'capture',
        origin: 'captured',
        role: 'reference',
        rights: 'third_party',
        republishable: false,
        exportable: false,
        source_url: 'https://theirs.example/',
        content_type: 'image/png',
      },
    })
    const refusedCapture = await post(tenant, '/api/material/recipe', { uid: capture.uid, recipe })
    expect(refusedCapture.status).toBe(403)
    expect(String((await json(refusedCapture)).error)).toMatch(/not a picture/i)
    expect((await stored(tenant, capture.uid)).fields.edits ?? null).toBeNull()

    // AND A RASTER PICTURE is taken — the rule is the one predicate, not a blanket refusal.
    const picture = await upload(tenant, PICTURE())
    expect((await post(tenant, '/api/material/recipe', { uid: picture, recipe })).status).toBe(200)
  })
})

// ── AC-2556 ──────────────────────────────────────────────────────────────────

describe('AC-2556 — the name route writes the title and nothing else', () => {
  it('test_UAT_AC2556_name_route_writes_the_title_not_the_filename_and_refuses_empty_malformed_and_foreign', async () => {
    const tenant = 'ac2556-route'
    const uid = await upload(tenant, PICTURE())

    // RENAMED: the stored title changes, the filename does not, and the answer is the row.
    const renamed = await post(tenant, '/api/material/name', { uid, title: '  The bakery, golden hour  ' })
    expect(renamed.status).toBe(200)
    const row = await json(renamed)
    expect(row.title).toBe('The bakery, golden hour')
    expect(row.filename).toBe('generated-3f2a.png')
    const ticket = await stored(tenant, uid)
    expect(ticket.title).toBe('The bakery, golden hour')
    expect(ticket.fields.filename).toBe('generated-3f2a.png')

    // KEPT: a fresh read of the material carries the new name.
    const reread = await route(
      new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect((await json(reread)).title).toBe('The bakery, golden hour')

    // AN EMPTY OR WHITESPACE NAME: 400 with its reason, name unchanged.
    for (const title of ['', '   \n ']) {
      const refused = await post(tenant, '/api/material/name', { uid, title })
      expect(refused.status, JSON.stringify(title)).toBe(400)
      expect(String((await json(refused)).error)).toMatch(/give it a name/i)
      expect((await stored(tenant, uid)).title).toBe('The bakery, golden hour')
    }

    // MALFORMED: no uid, an empty uid, a title that is not a string — 400 each.
    for (const payload of [{ title: 'x' }, { uid: '', title: 'x' }, { uid, title: 42 }, { uid }]) {
      const refused = await post(tenant, '/api/material/name', payload)
      expect(refused.status, JSON.stringify(payload)).toBe(400)
    }
    expect((await stored(tenant, uid)).title).toBe('The bakery, golden hour')

    // NOT THIS ACCOUNT'S MATERIAL: not found, and the other account's record is untouched.
    const foreign = await post('ac2556-other', '/api/material/name', { uid, title: 'Taken over' })
    expect(foreign.status).toBe(404)
    expect((await stored(tenant, uid)).title).toBe('The bakery, golden hour')
    const nothing = await post(tenant, '/api/material/name', { uid: 'material-does-not-exist', title: 'x' })
    expect(nothing.status).toBe(404)
  })
})

// ── AC-2557 ──────────────────────────────────────────────────────────────────

describe('AC-2557 — an edit is a recipe on the record; the original is never rewritten', () => {
  it('test_UAT_AC2557_recipe_is_stored_on_the_record_and_the_original_bytes_are_byte_identical', async () => {
    const tenant = 'ac2557-route'
    const uid = await upload(tenant, PICTURE())
    const before = await original(tenant, uid)

    // One operation of each tool, in order, as the modal composes them.
    const recipe = [
      { op: 'crop', left: 0.1, top: 0.1, right: 0, bottom: 0 },
      { op: 'rotate', degrees: 90 },
      { op: 'resize', width: 4 },
      { op: 'adjust', brightness: 1.3 },
    ]
    const saved = await post(tenant, '/api/material/recipe', { uid, recipe }, rendering())
    expect(saved.status).toBe(200)
    expect((await json(saved)).edits).toEqual(recipe)

    // WHAT IS STORED IS THE ORDERED RECIPE ON THE MATERIAL'S RECORD…
    expect((await stored(tenant, uid)).fields.edits).toEqual(recipe)
    // …AND THE ORIGINAL IS BYTE-FOR-BYTE WHAT WAS UPLOADED.
    const after = await original(tenant, uid)
    expect(after.byteLength).toBe(before.byteLength)
    expect(Array.from(after)).toEqual(Array.from(before))
    expect(Array.from(after)).toEqual(Array.from(PICTURE().bytes))

    // Stepping every operation back out leaves the original exactly as well.
    await post(tenant, '/api/material/recipe', { uid, recipe: [] }, rendering())
    expect((await stored(tenant, uid)).fields.edits).toEqual([])
    expect(Array.from(await original(tenant, uid))).toEqual(Array.from(before))
  })
})

// ── AC-2559 ──────────────────────────────────────────────────────────────────

describe('AC-2559 — a refused recipe changes nothing; an unrendered one is still stored', () => {
  it('test_UAT_AC2559_recipe_route_refuses_409_in_the_vocabularys_words_400_when_malformed_and_stores_unrendered', async () => {
    const tenant = 'ac2559-route'
    const uid = await upload(tenant, PICTURE(), rendering())
    const GOOD = [{ op: 'rotate', degrees: 90 }]
    expect((await post(tenant, '/api/material/recipe', { uid, recipe: GOOD }, rendering())).status).toBe(200)
    const editsNow = async () => (await stored(tenant, uid)).fields.edits

    // OUTSIDE THE VOCABULARY: 409, the vocabulary's own sentence, nothing stored.
    const unknown = await post(
      tenant,
      '/api/material/recipe',
      { uid, recipe: [{ op: 'rotate', degrees: 90 }, { op: 'flip', axis: 'x' }] },
      rendering(),
    )
    expect(unknown.status).toBe(409)
    expect(String((await json(unknown)).error)).toBe(
      "operation 2 asks for 'flip', which is not something a picture can be edited by. " +
        'The whole vocabulary is crop, rotate, resize, adjust.',
    )
    expect(await editsNow()).toEqual(GOOD)

    // MALFORMED (a rotate between quarters): 409, nothing stored.
    const malformed = await post(tenant, '/api/material/recipe', { uid, recipe: [{ op: 'rotate', degrees: 45 }] }, rendering())
    expect(malformed.status).toBe(409)
    expect(String((await json(malformed)).error)).toMatch(/turns in quarters/)
    expect(await editsNow()).toEqual(GOOD)

    // A CROP THIS PICTURE CANNOT TAKE: legal arithmetic, but on an 8×8 picture it
    // leaves nothing — refused against the real dimensions, 409, nothing stored.
    const nothingLeft = await post(
      tenant,
      '/api/material/recipe',
      { uid, recipe: [{ op: 'crop', left: 0.45, right: 0.5 }] },
      rendering(),
    )
    expect(nothingLeft.status).toBe(409)
    expect(String((await json(nothingLeft)).error)).toBe(
      'operation 1 would leave 0×8 of a 8×8 picture, which is nothing. Trim less, or resize before cropping rather than after.',
    )
    expect(await editsNow()).toEqual(GOOD)

    // NO UID, OR A RECIPE THAT IS NOT A LIST: 400.
    for (const payload of [{ recipe: GOOD }, { uid: '', recipe: GOOD }, { uid, recipe: { op: 'rotate' } }, { uid }]) {
      const refused = await post(tenant, '/api/material/recipe', payload, rendering())
      expect(refused.status, JSON.stringify(payload)).toBe(400)
    }
    expect(await editsNow()).toEqual(GOOD)

    // RENDERED WHERE A RENDERER IS BOUND…
    const rendered = await json(await post(tenant, '/api/material/recipe', { uid, recipe: GOOD }, rendering()))
    expect(rendered.rendered).toBe(true)

    // …AND WITHOUT ONE, STORED ANYWAY AND MARKED NOT RENDERED.
    const TURN = [{ op: 'rotate', degrees: 270 }]
    const unrendered = await post(tenant, '/api/material/recipe', { uid, recipe: TURN })
    expect(unrendered.status).toBe(200)
    const answer = await json(unrendered)
    expect(answer.rendered).toBe(false)
    expect(answer.edits).toEqual(TURN)
    expect(await editsNow()).toEqual(TURN)
  })
})
