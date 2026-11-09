import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { chatLibrary } from '../apps/control-app/src/library'
import { listMaterial, readMaterial } from '../apps/control-app/src/material'
import { libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { PUBLISHED_ROOT } from '../tools/generate/src/store/revision-model'
import { encodePng } from '../tools/generate/src/cli/png'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { bytesOf } from './support/material-fixtures'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelRequest, ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * **The assistant reads the client's Library as one catalogue and places an item
 * on the site** (story-a0b20525, REQ-228).
 *
 * ENTRY POINT. Every criterion is driven through `route()`, the control app's own
 * route table: material arrives through `POST /api/material` exactly as a client
 * drops it, a conversation is opened through `POST /api/ai/session`, and each
 * catalogue tool is called by the model in a turn through `POST /api/ai/prompt`.
 * What is asserted is the tool result the hosted session handed back to the
 * model, and — for placement — what the real D1 and R2 stores hold afterwards.
 *
 * TWO DOUBLES, both genuine external boundaries: the Anthropic client (the
 * network), and the describers (model calls). AC-2581 also needs eyes, so the
 * browser is the shared `fakeBrowser`; a PNG picture passes through without it.
 *
 * The one call that does not go through the route is AC-2584's `NO_SITE` half:
 * the control app always holds a site store, so a conversation without one is
 * composed directly through `chatLibrary(tickets, null, slug)`, the same
 * composition the route uses.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * The image describer, doubled. The title is taken from the bytes (`TITLE:<t>|…`)
 * so each fixture can carry a distinct, known title, and the description is a
 * sentence derived from it.
 */
function titleFromBytes(bytes: Uint8Array): string {
  const text = new TextDecoder().decode(bytes)
  return /^TITLE:([^|]*)\|/.exec(text)?.[1] ?? 'A photograph'
}

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async (bytes) => {
      const title = titleFromBytes(bytes)
      return { text: `${title}\n\nWhat ${title} shows.`, model: 'stub/vision-1' }
    },
    ...over,
  }
}

/** A business with one site, imported through the route. */
async function business(
  id: string,
  assets: { name: string; base64: string }[] = [],
): Promise<{ scope: Scope; slug: string }> {
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
        assets,
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: seed.slug }
}

/** One file dropped on the client's Library, with no site open (so not placed). */
async function upload(
  scope: Scope,
  file: { bytes: Uint8Array; name: string; type: string; role?: string },
  routerDeps: RouterDeps = deps(),
): Promise<string> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'site')
  const response = await route(
    new Request(`${ORIGIN}/api/material`, { method: 'POST', body: form }),
    routerEnv(),
    scope,
    routerDeps,
  )
  const body = (await response.json()) as Record<string, unknown>
  expect(typeof body.uid, JSON.stringify(body)).toBe('string')
  return String(body.uid)
}

async function stores(scope: Scope) {
  return {
    tickets: await ticketStoreFor(routerEnv(), scope),
    sites: await storeFor(routerEnv(), scope),
  }
}

/** A tool call with its own id, so one turn can make several. */
function call(id: string, name: string, input: Record<string, unknown>): ModelStep {
  return (req: ModelRequest) =>
    (calls(name, input)(req) as Record<string, unknown>[]).map((event) =>
      event.type === 'content_block_start'
        ? { ...event, content_block: { type: 'tool_use', id, name } }
        : event,
    )
}

/** Open a session and run one scripted turn through the Worker's routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  routerDeps: RouterDeps = deps(),
): Promise<ScriptedClient> {
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
    }),
    routerEnv(),
    scope,
    routerDeps,
  )
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string }
  const client = scriptedClient([...script, says('Done.')])
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, text: 'Look at my Library.' }),
    }),
    routerEnv(),
    scope,
    routerDeps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  return client
}

/** The text of the tool result the model was handed for call `id`. */
function resultText(client: ScriptedClient, id: string): string {
  for (const req of client.seen) {
    for (const message of req.messages) {
      if (message.role !== 'user' || !Array.isArray(message.content)) continue
      for (const block of message.content as Record<string, unknown>[]) {
        if (block.type !== 'tool_result' || block.tool_use_id !== id) continue
        const content = block.content
        if (typeof content === 'string') return content
        if (Array.isArray(content)) {
          return (content as Record<string, unknown>[])
            .map((b) => (typeof b.text === 'string' ? b.text : JSON.stringify(b)))
            .join('\n')
        }
        return JSON.stringify(content)
      }
    }
  }
  throw new Error(`no tool result for '${id}'`)
}

/** A successful tool result's JSON object. */
function resultOf(client: ScriptedClient, id: string): Record<string, unknown> {
  const text = resultText(client, id)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error(`not a result object for '${id}': ${text.slice(0, 400)}`)
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
}

type Row = Record<string, unknown>
const itemsOf = (page: Record<string, unknown>): Row[] => page.items as Row[]

/** Every key the public (published) side of the site holds in R2. */
async function publishedKeys(): Promise<string[]> {
  const listed = await (env.SITES as R2Bucket).list({ prefix: `${PUBLISHED_ROOT}/` })
  return listed.objects.map((o) => o.key).sort()
}

async function realPng(): Promise<Uint8Array> {
  const width = 8
  const height = 8
  const data = new Uint8Array(width * height * 3).fill(0x60)
  return encodePng({ data, width, height, channels: 3 })
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

const ITEM_FIELDS = [
  'content_type',
  'described',
  'edits',
  'filename',
  'item',
  'kind',
  'placed_on',
  'republishable',
  'rights',
  'role',
  'source_url',
  'title',
  'updated_at',
]

// ── AC-2576 — every kind, newest first, the catalogue item field set ─────────

describe('AC-2576 — list_library returns the whole catalogue', () => {
  it('test_UAT_AC2576_list_library_returns_every_kind_newest_first_with_the_catalogue_item_fields', async () => {
    // An empty catalogue first: the empty page shape.
    const empty = await business('ac2576-empty')
    const none = await turn(empty.scope, empty.slug, [call('c0', 'list_library', {})])
    // The hosted conversation offers the catalogue tools.
    const offered = none.seen[0].tools.map((t) => t.name)
    for (const tool of ['list_library', 'get_library_item', 'place_on_site']) expect(offered).toContain(tool)
    expect(resultOf(none, 'c0')).toEqual({ items: [], total: 0, more: false })
    resetAiHost()
    resetChatHost()

    const { scope, slug } = await business('ac2576')
    await upload(scope, { bytes: bytesOf('TITLE:Shop front|png'), name: 'front.png', type: 'image/png' })
    await upload(scope, {
      bytes: bytesOf('# Positioning\n\nThe only late-night bakery in town.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
    })
    await upload(scope, {
      bytes: new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3, 4]),
      name: 'face.woff2',
      type: 'font/woff2',
    })

    const client = await turn(scope, slug, [call('c1', 'list_library', {})])
    const page = resultOf(client, 'c1')
    const rows = itemsOf(page)
    expect(page.total).toBe(3)
    expect(page.more).toBe(false)
    expect(rows.map((r) => r.kind).sort()).toEqual(['document', 'font', 'image'])

    // Newest first: the Library tab's own order, and non-increasing timestamps.
    const { tickets } = await stores(scope)
    expect(rows.map((r) => r.item)).toEqual((await listMaterial(tickets)).map((m) => m.uid))
    for (let i = 1; i < rows.length; i++) {
      expect(String(rows[i - 1].updated_at) >= String(rows[i].updated_at)).toBe(true)
    }

    for (const row of rows) {
      // Exactly the catalogue item field set, and no description.
      expect(Object.keys(row).sort()).toEqual(ITEM_FIELDS)
      expect(row).not.toHaveProperty('description')
      expect(typeof row.item).toBe('string')
      expect(typeof row.filename).toBe('string')
      expect(typeof row.republishable).toBe('boolean')
      expect(Array.isArray(row.placed_on)).toBe(true)
      expect(Array.isArray(row.edits)).toBe(true)
      expect(Object.keys(row.described as Row).sort()).toEqual(['by', 'status'])
      expect(['site', 'reference', null]).toContain(row.role)
      expect(row.source_url === null || typeof row.source_url === 'string').toBe(true)
    }
    const image = rows.find((r) => r.kind === 'image')!
    expect(image.filename).toBe('front.png')
    expect(image.title).toBe('Shop front')
    expect(image.content_type).toBe('image/png')
  }, 60000)
})

// ── AC-2577 — bounded by a default page of 20 ────────────────────────────────

describe('AC-2577 — list_library is bounded and says so', () => {
  it('test_UAT_AC2577_list_library_defaults_to_twenty_and_reports_total_and_more', async () => {
    const { scope, slug } = await business('ac2577')
    for (let n = 0; n < 25; n++) {
      await upload(scope, { bytes: bytesOf(`TITLE:Photo ${n}|${n}`), name: `photo-${n}.png`, type: 'image/png' })
    }

    const client = await turn(scope, slug, [
      call('none', 'list_library', {}),
      call('five', 'list_library', { limit: 5 }),
      call('thirty', 'list_library', { limit: 30 }),
      call('zero', 'list_library', { limit: 0 }),
    ])
    const expected: [string, number, boolean][] = [
      ['none', 20, true],
      ['five', 5, true],
      ['thirty', 25, false],
      ['zero', 20, true],
    ]
    for (const [id, count, more] of expected) {
      const page = resultOf(client, id)
      expect(itemsOf(page), id).toHaveLength(count)
      expect(page.total, id).toBe(25)
      expect(page.more, id).toBe(more)
    }
  }, 120000)
})

// ── AC-2578 — filters by kind, role, placement and text, combined ────────────

describe('AC-2578 — list_library filters combine with AND', () => {
  it('test_UAT_AC2578_list_library_filters_by_kind_role_placed_on_this_site_and_text', async () => {
    const { scope, slug } = await business('ac2578')
    const { tickets, sites } = await stores(scope)

    const bakery = await upload(scope, {
      bytes: bytesOf('TITLE:Bakery Front|a'),
      name: 'front.png',
      type: 'image/png',
    })
    const here = await upload(scope, { bytes: bytesOf('TITLE:Logo mark|b'), name: 'logo.png', type: 'image/png' })
    const elsewhere = await upload(scope, {
      bytes: bytesOf('TITLE:Old sign|c'),
      name: 'sign.png',
      type: 'image/png',
    })
    const notes = await upload(scope, {
      bytes: bytesOf('# Notes\n\nOpening hours and history.'),
      name: 'notes.md',
      type: 'text/markdown',
      role: 'reference',
    })
    // Placed on this conversation's site, through the real placement.
    await libraryOperations(chatLibrary(tickets, sites, slug)).place_on_site({ item: here })
    // Placed only on a different site of the same business.
    await tickets.update({
      uid: elsewhere,
      patch: { fields: { placed_on: ['another-site'], placed_as: [{ slug: 'another-site', name: 'sign.png' }] } },
    })

    const client = await turn(scope, slug, [
      call('kind', 'list_library', { kind: 'image', limit: 100 }),
      call('role', 'list_library', { role: 'reference', limit: 100 }),
      call('placed', 'list_library', { placed: true, limit: 100 }),
      call('unplaced', 'list_library', { placed: false, limit: 100 }),
      call('text', 'list_library', { matching: 'bakery', limit: 100 }),
      call('blank', 'list_library', { matching: '   ', limit: 100 }),
      call('combined', 'list_library', { kind: 'image', placed: false, matching: 'o', limit: 100 }),
    ])
    const names = (id: string) => itemsOf(resultOf(client, id)).map((r) => r.item as string).sort()

    expect(itemsOf(resultOf(client, 'kind')).every((r) => r.kind === 'image')).toBe(true)
    expect(names('kind')).toEqual([bakery, elsewhere, here].sort())
    expect(names('role')).toEqual([notes])
    expect(names('placed')).toEqual([here])
    expect(names('unplaced')).toContain(elsewhere)
    expect(names('unplaced')).not.toContain(here)
    expect(names('text')).toEqual([bakery])
    expect(names('blank')).toHaveLength(4)

    // Combined: images, not on this site, whose name/title/filename contains "o".
    // front.png (Bakery Front) and sign.png (Old sign) qualify; logo.png is placed.
    const combined = resultOf(client, 'combined')
    expect(names('combined')).toEqual([bakery, elsewhere].sort())
    expect(combined.total).toBe(2)
    expect(combined.more).toBe(false)
  }, 60000)
})

// ── AC-2579 — one item, with its description, by any of its names ────────────

describe('AC-2579 — get_library_item reads one item in full', () => {
  it('test_UAT_AC2579_get_library_item_returns_the_item_and_description_by_name_filename_or_title', async () => {
    const { scope, slug } = await business('ac2579')
    const uid = await upload(scope, {
      bytes: bytesOf('TITLE:The bakery at dawn|x'),
      name: 'DSC_0912.png',
      type: 'image/png',
    })

    const client = await turn(scope, slug, [
      call('byName', 'get_library_item', { item: uid }),
      call('byFile', 'get_library_item', { item: 'DSC_0912.png' }),
      call('byTitle', 'get_library_item', { item: 'The bakery at dawn' }),
    ])
    const { tickets } = await stores(scope)
    const recorded = (await readMaterial(tickets, uid)).body
    expect(recorded).toBe('The bakery at dawn\n\nWhat The bakery at dawn shows.')

    for (const id of ['byName', 'byFile', 'byTitle']) {
      const one = resultOf(client, id)
      expect(one.item, id).toBe(uid)
      expect(Object.keys(one).sort(), id).toEqual([...ITEM_FIELDS, 'description'].sort())
      expect(one.description, id).toBe(recorded)
      expect(one.filename, id).toBe('DSC_0912.png')
      expect(one.title, id).toBe('The bakery at dawn')
    }
  }, 60000)
})

// ── AC-2580 — ambiguous and unknown names are refused ────────────────────────

describe('AC-2580 — a name that is not exactly one item is refused', () => {
  it('test_UAT_AC2580_ambiguous_and_unknown_item_names_are_refused_naming_candidates', async () => {
    // Empty catalogue: NOT_FOUND says the client has given nothing yet.
    const empty = await business('ac2580-empty')
    const nothing = await turn(empty.scope, empty.slug, [call('e', 'get_library_item', { item: 'anything' })])
    const emptyRefusal = resultText(nothing, 'e')
    expect(emptyRefusal).toContain('NOT_FOUND')
    expect(emptyRefusal).toMatch(/has not given you anything yet/)
    resetAiHost()
    resetChatHost()

    // Two uploads sharing a filename: AMBIGUOUS from both tools, nothing placed.
    const { scope, slug } = await business('ac2580')
    const first = await upload(scope, { bytes: bytesOf('TITLE:First logo|1'), name: 'logo.png', type: 'image/png' })
    const second = await upload(scope, { bytes: bytesOf('TITLE:Second logo|2'), name: 'logo.png', type: 'image/png' })
    for (let n = 0; n < 12; n++) {
      await upload(scope, { bytes: bytesOf(`TITLE:Filler ${n}|${n}`), name: `filler-${n}.png`, type: 'image/png' })
    }
    const { sites } = await stores(scope)
    const assetsBefore = await sites.listAssets(slug)

    const client = await turn(scope, slug, [
      call('get', 'get_library_item', { item: 'logo.png' }),
      call('place', 'place_on_site', { item: 'logo.png' }),
      call('unknown', 'get_library_item', { item: 'no-such-thing' }),
    ])
    for (const id of ['get', 'place']) {
      const refusal = resultText(client, id)
      expect(refusal, id).toContain('AMBIGUOUS')
      expect(refusal, id).toContain(`'${first}'`)
      expect(refusal, id).toContain(`'${second}'`)
    }
    expect(await sites.listAssets(slug)).toEqual(assetsBefore)

    // 14 items: NOT_FOUND lists at most 12 names, then an ellipsis.
    const unknown = resultText(client, 'unknown')
    expect(unknown).toContain('NOT_FOUND')
    const listed = unknown.match(/'material-[^']+'/g) ?? []
    expect(listed.length).toBe(12)
    expect(unknown).toContain(', …')
  }, 120000)
})

// ── AC-2581 — the catalogue name is the picture name screenshot takes ────────

describe('AC-2581 — a catalogue item name is a picture name', () => {
  it('test_UAT_AC2581_catalogue_item_name_and_filename_are_accepted_by_screenshot_as_the_same_picture', async () => {
    const { scope, slug } = await business('ac2581')
    const browser = fakeBrowser({ png: await realPng() })
    const withEyes = deps({ launch: browser.launch })
    const picture = await realPng()
    const uid = await upload(scope, { bytes: picture, name: 'shopfront.png', type: 'image/png' }, withEyes)

    const client = await turn(
      scope,
      slug,
      [
        call('list', 'list_library', { kind: 'image' }),
        call('byItem', 'screenshot', { of: { kind: 'image', image: uid } }),
        call('byFile', 'screenshot', { of: { kind: 'image', image: 'shopfront.png' } }),
      ],
      withEyes,
    )
    const listed = itemsOf(resultOf(client, 'list'))
    expect(listed.map((r) => r.item)).toEqual([uid])

    for (const id of ['byItem', 'byFile']) {
      const shot = resultText(client, id)
      expect(shot, id).not.toMatch(/no stored picture called/)
      expect(shot, id).not.toMatch(/names \d+ pictures/)
      expect(shot, id).not.toMatch(/^Error:/)
      // The same stored picture: the label names the catalogue item.
      expect(shot, id).toContain(`library image ${uid}`)
      // A picture came back, not a description of one.
      expect(shot, id).toContain('image/png')
    }
  }, 60000)
})

// ── AC-2582 — placing copies to draft assets and returns the handle ──────────

describe('AC-2582 — place_on_site puts a republishable item on the draft site', () => {
  it('test_UAT_AC2582_place_on_site_copies_to_draft_assets_and_returns_handle_description_and_placed_on', async () => {
    const { scope, slug } = await business('ac2582')
    const bytes = bytesOf('TITLE:Gold wordmark|logo bytes')
    const logo = await upload(scope, { bytes, name: 'logo.png', type: 'image/png' })
    const hero = await upload(scope, { bytes: bytesOf('TITLE:Hero shot|hero'), name: 'big.png', type: 'image/png' })
    const { tickets, sites } = await stores(scope)
    const publishedBefore = await publishedKeys()
    const revisionsBefore = await sites.revisions(slug)

    const client = await turn(scope, slug, [
      call('place', 'place_on_site', { item: logo }),
      call('placed', 'list_library', { placed: true }),
      call('as', 'place_on_site', { item: hero, as: '  hero.png ' }),
    ])

    const placed = resultOf(client, 'place')
    expect(placed.item).toBe(logo)
    expect(placed.asset).toBe('logo.png')
    expect(placed.src).toBe('/assets/logo.png')
    expect(placed.size).toBe(bytes.byteLength)
    expect(placed.description).toBe((await readMaterial(tickets, logo)).body)
    expect(placed.description).toBe('Gold wordmark\n\nWhat Gold wordmark shows.')
    expect(placed.placed_on).toContain(slug)

    // The bytes are in the draft site's assets, and the record carries the mark.
    expect(await sites.listAssets(slug)).toContain('logo.png')
    expect(await sites.readAsset(slug, 'logo.png')).toEqual(bytes)
    expect((await readMaterial(tickets, logo)).placed_on).toContain(slug)
    expect(itemsOf(resultOf(client, 'placed')).map((r) => r.item)).toContain(logo)

    // `as` names the asset (trimmed).
    const renamed = resultOf(client, 'as')
    expect(renamed.asset).toBe('hero.png')
    expect(renamed.src).toBe('/assets/hero.png')
    expect(await sites.listAssets(slug)).toContain('hero.png')

    // Placing does not publish.
    expect(await publishedKeys()).toEqual(publishedBefore)
    expect(await sites.revisions(slug)).toEqual(revisionsBefore)
  }, 60000)
})

// ── AC-2583 — a taken name is renamed around, never overwritten ──────────────

describe('AC-2583 — place_on_site never overwrites a site asset', () => {
  it('test_UAT_AC2583_place_on_site_renames_around_a_taken_asset_name_and_keeps_the_original_bytes', async () => {
    const original = bytesOf('the logo already on the site')
    const { scope, slug } = await business('ac2583', [
      { name: 'logo.png', base64: btoa(new TextDecoder().decode(original)) },
    ])
    const { sites } = await stores(scope)
    expect(await sites.readAsset(slug, 'logo.png')).toEqual(original)

    const incoming = bytesOf('TITLE:New logo|different bytes')
    const uid = await upload(scope, { bytes: incoming, name: 'logo.png', type: 'image/png' })

    const client = await turn(scope, slug, [call('place', 'place_on_site', { item: uid })])
    const placed = resultOf(client, 'place')
    expect(placed.asset).not.toBe('logo.png')
    expect(placed.src).toBe(`/assets/${String(placed.asset)}`)

    // The original is untouched, and both files are on the site.
    expect(await sites.readAsset(slug, 'logo.png')).toEqual(original)
    expect(await sites.readAsset(slug, String(placed.asset))).toEqual(incoming)
    const assets = await sites.listAssets(slug)
    expect(assets).toContain('logo.png')
    expect(assets).toContain(String(placed.asset))
  }, 60000)
})

// ── AC-2584 — NOT_REPUBLISHABLE and NO_SITE ──────────────────────────────────

describe('AC-2584 — what place_on_site refuses', () => {
  it('test_UAT_AC2584_place_on_site_refuses_non_republishable_material_and_a_missing_site_store', async () => {
    const { scope, slug } = await business('ac2584')
    const { tickets, sites } = await stores(scope)
    const uid = await upload(scope, {
      bytes: bytesOf('TITLE:Their hero|somebody elses'),
      name: 'their-hero.png',
      type: 'image/png',
    })
    // The record a fetch would have written: third-party, not republishable.
    await tickets.update({
      uid,
      patch: {
        fields: {
          republishable: false,
          rights: 'third_party',
          origin: 'fetched',
          source_url: 'https://a-competitor.example/hero.png',
        },
      },
    })
    const assetsBefore = await sites.listAssets(slug)

    const client = await turn(scope, slug, [
      call('place', 'place_on_site', { item: uid }),
      call('read', 'get_library_item', { item: uid }),
    ])
    const refusal = resultText(client, 'place')
    expect(refusal).toContain('NOT_REPUBLISHABLE')
    // The surface's declared rights sentence.
    expect(refusal).toContain('we do not hold the right to republish it')
    expect(await sites.listAssets(slug)).toEqual(assetsBefore)
    expect(resultOf(client, 'read').placed_on).toEqual([])
    expect((await readMaterial(tickets, uid)).placed_on).toEqual([])

    // No site store: NO_SITE, nothing written; reading still works.
    const owned = await upload(scope, { bytes: bytesOf('TITLE:Our logo|ours'), name: 'ours.png', type: 'image/png' })
    const siteless = libraryOperations(chatLibrary(tickets, null, slug))
    const noSite = await siteless.place_on_site({ item: owned }).catch((e: unknown) => e)
    expect((noSite as { code?: string }).code).toBe('NO_SITE')
    expect(await sites.listAssets(slug)).toEqual(assetsBefore)
    expect((await readMaterial(tickets, owned)).placed_on).toEqual([])
    const listed = (await siteless.list_library({})) as { items: Row[] }
    expect(listed.items.map((r) => r.item)).toContain(owned)
    expect(((await siteless.get_library_item({ item: owned })) as Row).item).toBe(owned)
  }, 60000)
})
