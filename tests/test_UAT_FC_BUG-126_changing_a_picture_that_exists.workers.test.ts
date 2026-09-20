import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import {
  GENERATED_ORIGIN,
  IMAGE_SECRET,
  generatedMaterialStore,
} from '../apps/control-app/src/imagegen'
import { listMaterial, promoteToSiteAsset } from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[BUG-126]] — **changing a picture that already exists**.
 *
 * WHAT WAS BROKEN. `EditImage` crashed on every picture, for every client, on
 * its first line: `this.store.get is not a function`. The handle this product
 * hands the image plugin was `Pick<TicketStore, 'create' | 'attach'>` and the
 * surface's edit path calls five methods, not two — so the operation had never
 * worked in this deployment and could not have. It was still GRANTED on every
 * turn, because the grant is derived from the surface's own declaration and the
 * surface cannot know what the store behind it can serve. A consultant spent
 * five attempts establishing that a capability it was being offered did not
 * exist.
 *
 * AND THE OTHER HALF, which is the same request from the client's side. A
 * picture placed on a page is a COPY of a Library item, and only the Library
 * item carries an edit recipe — so `list_image_edits` refused a site file,
 * coherently, and *"make this one a bit warmer"* about the thing on screen had
 * nowhere to go at all. Fixing the crash alone leaves that wall standing.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim about the tool goes through `route()` —
 * the Worker's own route table — over real D1 and real R2 inside workerd, with
 * the real plugin, the real surface, the real grant and the real refusal
 * taxonomy. Two doubles, both genuinely external: the Anthropic client, and the
 * image provider's HTTP endpoint. The claims about the handle's own scope are
 * made against the handle over the same real store, because *"the only material
 * this plugin can reach is this client's"* is a property of the handle.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. `edit_image` REACHES A LIBRARY PICTURE by the id of the ticket it is on,
 *      resolving through the attachment — the call that used to crash.
 *   2. AND BY THE PICTURE'S OWN ID, which is the other id the operation hands
 *      back.
 *   3. AND BY ANY NAME THE PICTURE ANSWERS TO — the catalogue label and the
 *      filename — because five attempts were spent on exactly that.
 *   4. AN UNKNOWN ID IS REFUSED, in the declared taxonomy, rather than crashing.
 *   5. A READ CANNOT REACH WHAT IS NOT THIS CLIENT'S MATERIAL.
 *   6. THE WRITE REFUSALS SURVIVE: `create` still takes one type, and `attach`
 *      still only reaches a ticket this handle made.
 *   7. AN ADJUSTMENT TO A PLACED PICTURE HAS SOMEWHERE TO LAND: the refusal
 *      names the Library original whose recipe governs those bytes.
 */

const APPLIED = applySchema()

const ORIGIN = 'https://app.test'

/** A real 3×2 PNG, so the component measures real dimensions off real bytes. */
const PNG_3x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

const pngBytes = (): Uint8Array =>
  Uint8Array.from(atob(PNG_3x2), (character) => character.charCodeAt(0))

/** An OpenAI image response carrying one image, in the provider's own shape. */
const providerImage = (image = PNG_3x2) => ({ data: [{ b64_json: image }] })

/**
 * A recording `fetch` that answers `body` under `status`.
 *
 * IT RECORDS THE URL AND NOT THE BODY, unlike the generation suite's. An edit is
 * a `multipart/form-data` upload — the picture is a file, so the adapter posts
 * bytes rather than JSON — and a fake that assumed one shape would throw on the
 * operation this file exists to prove. The path is what says which operation
 * actually reached the vendor, which is the fact worth recording.
 */
function fakeProvider(body: unknown, status = 200): typeof fetch & { paths: string[] } {
  const impl = async (url: unknown) => {
    impl.paths.push(new URL(String(url)).pathname)
    return { status, ok: status >= 200 && status < 300, json: async () => body }
  }
  impl.paths = [] as string[]
  return impl as unknown as typeof fetch & { paths: string[] }
}

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: env.IMAGES,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    [IMAGE_SECRET]: 'test-image-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** A business with the schema applied, its tenant registered, and one site. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = scopeOf(id)
  const seed = siteSeed({ slug: `site-${id}` })
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({
          name,
          page: page as Record<string, unknown>,
        })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: ((await imported.json()) as { site: string }).site }
}

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps,
): Promise<ScriptedClient> {
  const workerEnv = routerEnv()
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string }

  const client = scriptedClient(script)
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        text: 'Make my photo match the site’s style.',
      }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  return client
}

/** This business's real ticket store, for seeding and for reading back. */
async function ticketsFor(id: string): Promise<TicketStore> {
  return ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: id },
  )
}

/**
 * Every tool result the model was handed back, as text, in order.
 *
 * READ OFF THE LAST REQUEST ALONE, for the reason the generation suite gives:
 * each round of the tool loop re-sends the whole conversation, so summing across
 * every request counts each result once per subsequent round.
 */
function toolResults(client: ScriptedClient): string[] {
  const out: string[] = []
  const last = client.seen[client.seen.length - 1]
  for (const message of last.messages) {
    const content = message.content
    if (!Array.isArray(content)) continue
    for (const block of content as Record<string, unknown>[]) {
      if (block.type === 'tool_result') out.push(JSON.stringify(block.content))
    }
  }
  return out
}

/**
 * The names the model actually sees — the declaration's `tool`, not its `op`.
 *
 * TWO SURFACES, TWO NAMES, AND THEY ARE DIFFERENT ACTS. `EditImage` is the
 * generator's: it redraws a picture and hands back a new one. `edit_image` is
 * the recipe surface's ([[REQ-219]]): it crops and straightens what is already
 * there. This file is about the first and about the SECOND's refusal, which is
 * the other half of the same client request.
 */
const EDIT_TOOL = 'EditImage'
const EDITS_TOOL = 'list_image_edits'

/** One picture in the client's Library, created the way ingestion creates one. */
async function libraryPicture(
  tickets: TicketStore,
  opts: { filename?: string; label?: string; title?: string } = {},
): Promise<{ material: string; picture: string }> {
  const filename = opts.filename ?? 'shopfront.png'
  const { ticket } = await tickets.create({
    type: 'material',
    title: opts.title ?? 'A wide shopfront at dusk',
    body: 'A photograph of the client’s shopfront.',
    fields: {
      kind: 'image',
      rights: 'owned',
      republishable: true,
      exportable: false,
      origin: 'uploaded',
      role: 'site',
      filename,
      content_type: 'image/png',
      ...(opts.label ? { label: opts.label } : {}),
    },
  })
  const { attachment } = await tickets.attach({
    uid: ticket.uid,
    bytes: pngBytes(),
    filename,
    content_type: 'image/png',
  })
  return { material: ticket.uid, picture: attachment.uid }
}

/** One `EditImage` call, then prose — the ordinary shape of a turn. */
const edits = (image: string): ModelStep[] => [
  calls(EDIT_TOOL, { image, change: 'warmer light, the same shopfront' }),
  says('Here is the warmer version — tell me if it is closer.'),
]

/** The materials this client holds that were made rather than received. */
async function generated(tickets: TicketStore): Promise<string[]> {
  return (await listMaterial(tickets))
    .filter((row) => row.origin === GENERATED_ORIGIN)
    .map((row) => row.uid)
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-126 — changing a picture that already exists', () => {
  it('test_UAT_FC_BUG-126_edit_image_reaches_a_library_picture_by_its_ticket_id', async () => {
    // AC1. The call that used to crash on its first line. A ticket id is what
    // the generator hands back and what the display line teaches, so it is the
    // id a consultant is most likely to be holding — and `_source` resolves it
    // through the pictures attached to the ticket, which needs `get` AND
    // `attachments` AND `read_attachment`. All three were missing.
    const id = 'bug126-by-ticket'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    const { material } = await libraryPicture(tickets)
    const provider = fakeProvider(providerImage())

    const client = await turn(scope, slug, edits(material), { imageFetch: provider })

    // THE VENDOR'S EDIT ENDPOINT WAS REACHED, which is only true if the source
    // bytes were read out of the store first.
    expect(provider.paths).toEqual(['/v1/images/edits'])
    // AND THE RESULT IS A PICTURE, not a refusal. The crash reported the missing
    // method verbatim, so the absence of that sentence is the regression guard.
    const [result] = toolResults(client)
    expect(result).not.toContain('is not a function')
    expect(result).not.toContain('failed (')
    // THE EDIT LANDS AS A NEW MATERIAL AND THE SOURCE IS UNTOUCHED — "one thing
    // about it different" means both pictures have to exist.
    const madeUids = await generated(tickets)
    expect(madeUids).toHaveLength(1)
    expect(madeUids).not.toContain(material)
    // And the record the model was handed names it, so the consultant can look
    // at what it just made and put it in front of the client.
    expect(result).toContain(madeUids[0])
  })

  it('test_UAT_FC_BUG-126_edit_image_reaches_a_picture_by_its_own_id', async () => {
    // AC2. The other id the operation hands back. It reads directly rather than
    // through a listing, so it is a different path through the handle — `get`
    // answers an attachment record and `read_attachment` serves the bytes.
    const id = 'bug126-by-picture'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    const { picture } = await libraryPicture(tickets)
    const provider = fakeProvider(providerImage())

    const client = await turn(scope, slug, edits(picture), { imageFetch: provider })

    expect(provider.paths).toEqual(['/v1/images/edits'])
    expect(toolResults(client)[0]).not.toContain('is not a function')
    expect(await generated(tickets)).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-126_a_picture_answers_to_every_name_it_answers_to', async () => {
    // AC3. The consultant tried five times — by document id, by the right
    // Library id, and by filename. A fix that took only the canonical uid would
    // have left two of those three still failing, and the id a client says out
    // loud is the catalogue label. `resolveStoredImage` is [[REQ-218]]'s single
    // rule for what a stored picture is called, so this asserts the handle
    // reaches that rule rather than inventing a second matcher.
    const id = 'bug126-by-name'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    await libraryPicture(tickets, { filename: 'shopfront.png', label: 'IMAGE-7' })
    const provider = fakeProvider(providerImage())

    const client = await turn(
      scope,
      slug,
      [
        calls(EDIT_TOOL, { image: 'IMAGE-7', change: 'warmer light' }),
        calls(EDIT_TOOL, { image: 'shopfront.png', change: 'cooler light' }),
        says('Two versions for you.'),
      ],
      { imageFetch: provider },
    )

    expect(provider.paths).toEqual(['/v1/images/edits', '/v1/images/edits'])
    for (const result of toolResults(client)) {
      expect(result).not.toContain('does not name a picture')
      expect(result).not.toContain('is not a function')
    }
    expect(await generated(tickets)).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-126_an_unknown_id_is_refused_rather_than_crashing', async () => {
    // AC4. The difference between a bug and a refusal is whether the model can
    // act on it. `unknown_image` is a declared error with a sentence telling the
    // model to check the id it was given; `this.store.get is not a function` is
    // a sentence about our source code, and the only thing a model can do with
    // it is try again and get it twice.
    const id = 'bug126-unknown'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    await libraryPicture(tickets)
    const provider = fakeProvider(providerImage())

    const client = await turn(scope, slug, edits('material-not-a-real-one'), {
      imageFetch: provider,
    })

    // NOTHING WAS DRAWN AND NOTHING WAS SPENT: the refusal is before the vendor.
    expect(provider.paths).toEqual([])
    const [result] = toolResults(client)
    expect(result).toContain('That id does not name a picture')
    expect(result).not.toContain('is not a function')
    expect(await generated(tickets)).toHaveLength(0)
  })

  it('test_UAT_FC_BUG-126_a_read_cannot_reach_what_is_not_this_clients_material', async () => {
    // AC5. Reads need their own scope rule and it is a different sentence from
    // the write rule: what this handle may REACH is the client's own material
    // and the files on it. The store is already tenant-bound, so this is a type
    // check rather than a new barrier — but a business holds a great deal that
    // is not material, and an image tool has no business reading a brief.
    const id = 'bug126-scope'
    await business(id)
    const tickets = await ticketsFor(id)
    const scoped = generatedMaterialStore(tickets, () => 'a-model', null)

    const { ticket } = await tickets.create({
      type: 'brief',
      title: 'someone else’s',
      body: 'the brief',
      fields: { site_slug: `site-${id}` },
    })
    const { attachment } = await tickets.attach({
      uid: ticket.uid,
      bytes: pngBytes(),
      filename: 'on-the-brief.png',
      content_type: 'image/png',
    })

    // The record itself, the listing of its files, and the bytes of one of them
    // — all three refused, because all three go through the one rule.
    await expect(scoped.get({ uid: ticket.uid })).rejects.toThrow(/rather than a piece of/)
    await expect(scoped.attachments({ uid: ticket.uid })).rejects.toThrow(/rather than a piece of/)
    await expect(scoped.read_attachment({ uid: attachment.uid })).rejects.toThrow(
      /rather than a piece of/,
    )

    // AND THE CLIENT'S OWN MATERIAL IS REACHED, so the rule is a scope and not
    // a wall: the same three calls answer for a Library picture.
    const { material, picture } = await libraryPicture(tickets)
    expect((await scoped.get({ uid: material })).ticket.uid).toBe(material)
    expect((await scoped.attachments({ uid: material })).attachments).toHaveLength(1)
    expect((await scoped.read_attachment({ uid: picture })).bytes.byteLength).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-126_the_write_refusals_survive_the_widening', async () => {
    // AC6. The handle got three methods wider and must not have got one
    // permission looser. *"The only record this plugin can cause is one holding
    // a picture it was allowed to make"* is the property the narrowing bought,
    // and it is still a property of the handle rather than of good behaviour.
    const id = 'bug126-writes'
    await business(id)
    const tickets = await ticketsFor(id)
    const scoped = generatedMaterialStore(tickets, () => 'a-model', null)

    await expect(scoped.create({ type: 'brief', title: 'not a picture' })).rejects.toThrow(
      /may only create 'material' tickets/,
    )
    const { ticket } = await tickets.create({
      type: 'brief',
      title: 'someone else’s',
      body: 'the brief',
      fields: { site_slug: `site-${id}` },
    })
    await expect(
      scoped.attach({ uid: ticket.uid, bytes: pngBytes(), filename: 'x.png' }),
    ).rejects.toThrow(/may only attach to a ticket it created/)
  })

  it('test_UAT_FC_BUG-126_an_adjustment_to_a_placed_picture_has_somewhere_to_land', async () => {
    // AC7. The second half. A site file still cannot carry a recipe — that is
    // correct and unchanged — but the bytes on the page are a COPY of a Library
    // item, and the refusal used to stop at "there is nowhere to keep edits for
    // it". The client is looking at the page, so the consultant is holding the
    // site file's name and nothing else; working out which Library item those
    // bytes came from is a search this surface can do and they cannot.
    const id = 'bug126-placed'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    const { material } = await libraryPicture(tickets, {
      filename: 'founder-portrait.png',
      title: 'The founder, in sanguine chalk',
    })

    const sites = await storeFor(routerEnv(), scopeOf(id))
    const placed = await promoteToSiteAsset(tickets, sites, {
      uid: material,
      slug,
      // A NAME OF ITS OWN ON THE SITE. A site file and a Library item sharing
      // one filename are two pictures answering to one name, which
      // `resolveStoredImage` refuses as AMBIGUOUS before any of this is
      // reached — correctly, and a different refusal from the one under test.
      name: 'founder-plate.png',
    })

    const client = await turn(
      scope,
      slug,
      [
        calls(EDITS_TOOL, { image: placed.name }),
        says('I will change the Library picture instead.'),
      ],
      {},
    )

    const [result] = toolResults(client)
    // THE REFUSAL STILL REFUSES — the recipe has not moved to the site.
    expect(result).toContain('nowhere to keep a list of edits')
    // AND IT NAMES THE PICTURE TO EDIT INSTEAD, by the name that always means
    // exactly one picture, with the title a person would recognise.
    expect(result).toContain(material)
    expect(result).toContain('The founder, in sanguine chalk')
    // AND IT SAYS WHY THAT IS THE ANSWER AND NOT A DETOUR: the edit is published
    // back over the file on the page, which is what `republishingRecipes`
    // already does — so the path the sentence describes is one that works.
    expect(result).toContain('published back over the file on the page')
    // The model was told, rather than left to infer it from an absence.
    expect(systemText(client.seen[0])).toContain(EDITS_TOOL)
  })
})
