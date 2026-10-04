import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PLAN_ASK_PATH, PLAN_PATH, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { chatLibrary } from '../apps/control-app/src/library'
import { findPlan, sitePlan } from '../apps/control-app/src/plan'
import { LibraryRefusedError, libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import {
  clientChangesLine,
  clientChangesSince,
  planOperations,
  type PlanFields,
} from '../tools/generate/src/cli/ai/plan-core'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * [[BUG-196]] — **an upload ask's files land as what the ask was for, and both the
 * client and the consultant can move or delete an upload.**
 *
 * EVERY CASE DRIVES THE ROUTES A REQUEST DRIVES — `/api/plan`, `/api/plan/ask`,
 * `/api/material` and `/api/material/role` — through the Worker's own `route`,
 * against a real D1 and R2, and the consultant's library surface over the same
 * stores. The doubles are the describers and the index seam (model boundaries),
 * the index seam as a recorder so deleting can be seen to reach it.
 */

const APPLIED = applySchema()

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A price list.', model: 'stub/digest-1' }),
    describeImage: async () => ({ text: 'A plumber beside a white van.', model: 'stub/vision-1' }),
    ...over,
  }
}

const call = (tenant: string, path: string, init: RequestInit = {}, d: RouterDeps = deps()): Promise<Response> =>
  route(new Request(`https://app.test${path}`, init), routerEnv(), scopeOf(tenant), d)

const post = (tenant: string, path: string, body: unknown): Promise<Response> =>
  call(tenant, path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

/** One file, through the upload route — with the role and site the panel sends. */
async function upload(tenant: string, name: string, role: string, slug: string): Promise<string> {
  const form = new FormData()
  form.append('file', new File([bytesOf(`bytes of ${name}`) as unknown as BlobPart], name, { type: 'image/png' }))
  form.append('role', role)
  form.append('site', slug)
  const response = await call(tenant, '/api/material', { method: 'POST', body: form })
  expect(response.status).toBe(200)
  return String(((await response.json()) as { uid: string }).uid)
}

async function panel(tenant: string, slug: string): Promise<Record<string, any>> {
  const response = await call(tenant, `${PLAN_PATH}?site=${encodeURIComponent(slug)}`)
  expect(response.status).toBe(200)
  return (await response.json()) as Record<string, any>
}

async function catalogue(tenant: string, slug: string, indexed: string[] = []) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  const index = async () => async (uid: string) => void indexed.push(uid)
  return { tickets, sites, ops: libraryOperations(chatLibrary(tickets, sites, slug, undefined, index)) }
}

async function refusal(run: Promise<unknown>): Promise<LibraryRefusedError> {
  try {
    await run
  } catch (error) {
    expect(error).toBeInstanceOf(LibraryRefusedError)
    return error as LibraryRefusedError
  }
  throw new Error('expected a refusal')
}

const PHOTOS = {
  ask: 'photos',
  prompt: 'Photos of your work for the site?',
  why: 'Real photographs beat stock every time.',
  input: 'upload',
}

beforeAll(async () => {
  await APPLIED
})

describe('BUG-196 — an upload ask says what its files are for', () => {
  it('test_UAT_FC_BUG-196_a_site_ask_stores_its_uploads_as_site_and_place_on_site_accepts_them', async () => {
    const tenant = 'bug196-site-ask'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196a' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    await planOperations(sitePlan(tickets, site.slug)).set_ask({ ...PHOTOS, upload_role: 'site' })

    // THE PANEL IS TOLD THE ROLE, AND THAT A SITE ASK TAKES SEVERAL.
    const before = (await panel(tenant, site.slug)).asks.find((a: { id: string }) => a.id === 'photos')
    expect(before).toMatchObject({ upload_role: 'site', multiple: true })

    // WHAT THE PANEL DOES WITH A PICK OF TWO: both uploaded with the ask's role,
    // then one answer citing both.
    const since = new Date(Date.now() - 1000).toISOString()
    const uids = [
      await upload(tenant, 'van.png', before.upload_role, site.slug),
      await upload(tenant, 'boiler.png', before.upload_role, site.slug),
    ]
    const answered = await post(tenant, PLAN_ASK_PATH, {
      site: site.slug,
      ask: 'photos',
      action: 'answer',
      answer_material: uids,
    })
    expect(answered.status).toBe(200)

    // ALL OF THEM RECORDED AGAINST THE ASK, read back off the stored plan.
    const stored = ((await findPlan(tickets, site.slug))!.fields as unknown as PlanFields).asks.find(
      (a) => a.id === 'photos',
    )!
    expect(stored.answer_material).toEqual(uids)

    // THE CHANGE NOTICE THE CONSULTANT GETS SAYS HOW MANY ARRIVED.
    const line = clientChangesLine(
      clientChangesSince((await findPlan(tickets, site.slug))!.fields as unknown as PlanFields, since),
    )
    expect(line).toContain('2 documents')

    // AND THE PANEL'S VIEW CARRIES THE ROWS: site role, republishable.
    const view = await panel(tenant, site.slug)
    for (const uid of uids) expect(view.materials[uid]).toMatchObject({ role: 'site', republishable: true })

    // SO THE CONSULTANT CAN PLACE THEM.
    const { ops } = await catalogue(tenant, site.slug)
    const placed = await ops.place_on_site({ item: uids[1] })
    expect(placed.placed_on).toContain(site.slug)
  })

  it('test_UAT_FC_BUG-196_an_ask_with_no_role_still_takes_one_reference_upload', async () => {
    const tenant = 'bug196-no-role'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196b' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    await planOperations(sitePlan(tickets, site.slug)).set_ask({ ...PHOTOS, ask: 'price_list' })

    const ask = (await panel(tenant, site.slug)).asks.find((a: { id: string }) => a.id === 'price_list')
    expect(ask).toMatchObject({ upload_role: 'reference', multiple: false })

    const uid = await upload(tenant, 'prices.png', ask.upload_role, site.slug)
    const { ops } = await catalogue(tenant, site.slug)
    expect((await refusal(ops.place_on_site({ item: uid }))).code).toBe('NOT_REPUBLISHABLE')
  })
})

describe('BUG-196 — moving an upload to the site', () => {
  it('test_UAT_FC_BUG-196_the_clients_use_on_the_site_makes_a_reference_upload_placeable', async () => {
    const tenant = 'bug196-client-move'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196c' })
    const uid = await upload(tenant, 'shopfront.png', 'reference', site.slug)
    const { ops, sites } = await catalogue(tenant, site.slug)
    expect((await refusal(ops.place_on_site({ item: uid }))).code).toBe('NOT_REPUBLISHABLE')

    // THE ROUTE THE PANEL'S AND THE ROW'S BUTTON CALL.
    const moved = await post(tenant, '/api/material/role', { uid, role: 'site' })
    expect(moved.status).toBe(200)
    expect(await moved.json()).toMatchObject({ role: 'site', republishable: true })
    expect(await sites.listAssets(site.slug)).toContain('shopfront.png')

    // AND PLACEMENT NOW SUCCEEDS — no longer refused as not republishable.
    expect((await ops.place_on_site({ item: uid })).placed_on).toContain(site.slug)
  })

  it('test_UAT_FC_BUG-196_the_consultant_changes_an_uploads_role_and_is_refused_on_material_it_was_not_given', async () => {
    const tenant = 'bug196-consultant-role'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196d' })
    const uid = await upload(tenant, 'team.png', 'reference', site.slug)
    const { ops, tickets } = await catalogue(tenant, site.slug)

    const changed = await ops.set_upload_role({ item: uid, role: 'site' })
    expect(changed).toMatchObject({ item: uid, role: 'site', republishable: true })
    expect(await ops.get_library_item({ item: uid })).toMatchObject({ role: 'site', republishable: true })
    // IT DOES NOT PLACE: placing stays its own decision.
    expect(changed.placed_on).not.toContain(site.slug)
    await ops.place_on_site({ item: uid })

    // ONCE ON THE SITE IT CANNOT GO BACK TO REFERENCE.
    expect((await refusal(ops.set_upload_role({ item: uid, role: 'reference' }))).code).toBe('ALREADY_ON_SITE')

    // AND MATERIAL NOBODY UPLOADED — here, something fetched — is refused.
    const fetched = (await (
      await call(
        tenant,
        '/api/material/fetch',
        { method: 'POST', body: JSON.stringify({ url: 'https://example.com/report.txt' }) },
        deps({
          fetch: async () => new Response('A report.', { status: 200, headers: { 'content-type': 'text/plain' } }),
        }),
      )
    ).json()) as { uid: string; origin: string }
    expect(fetched.origin).toBe('fetched')
    expect((await refusal(ops.set_upload_role({ item: fetched.uid, role: 'site' }))).code).toBe('NOT_AN_UPLOAD')
    expect(await ops.get_library_item({ item: fetched.uid })).toMatchObject({ role: 'reference', republishable: false })
  })
})

describe('BUG-196 — the consultant deletes, on the client\'s instruction', () => {
  it('test_UAT_FC_BUG-196_the_consultants_delete_archives_the_item_and_it_leaves_list_library', async () => {
    const tenant = 'bug196-delete'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196e' })
    const uid = await upload(tenant, 'blurry.png', 'reference', site.slug)
    const indexed: string[] = []
    const { ops } = await catalogue(tenant, site.slug, indexed)

    const result = await ops.delete_library_item({ item: uid })
    expect(result).toMatchObject({ item: uid, deleted: true, still_on_site: [] })
    expect(result.note).toMatch(/not on the site/i)

    // GONE FROM THE CATALOGUE, REFUSED AS DELETED, AND RETRIEVAL WAS TOLD.
    expect(((await ops.list_library({})).items as { item: string }[]).map((i) => i.item)).not.toContain(uid)
    expect((await refusal(ops.get_library_item({ item: uid }))).code).toBe('DELETED')
    expect(indexed).toContain(uid)
  })

  it('test_UAT_FC_BUG-196_deleting_a_placed_item_leaves_the_pages_asset_and_says_so', async () => {
    const tenant = 'bug196-delete-placed'
    const site = await makeD1Site({ tenantId: tenant, slug: 'bug196f' })
    const uid = await upload(tenant, 'logo.png', 'site', site.slug)
    const { ops, sites } = await catalogue(tenant, site.slug)
    expect(await sites.listAssets(site.slug)).toContain('logo.png')

    const result = await ops.delete_library_item({ item: uid })
    expect(result.still_on_site).toContain(site.slug)
    expect(result.note).toMatch(/still on the site/i)
    expect(result.note).toMatch(/edit the page/i)
    expect(await sites.listAssets(site.slug)).toContain('logo.png')
  })
})
