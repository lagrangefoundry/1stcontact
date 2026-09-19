import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { chatLibrary } from '../apps/control-app/src/library'
import { listDeletedMaterial, listMaterial } from '../apps/control-app/src/material'
import { LibraryRefusedError, libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * [[REQ-281]] — **deleting a Library item**, over the real stores.
 *
 * WHAT THIS FILE IS FOR. The jsdom suite beside it proves the surface — where
 * the control is, what the confirmation says, and that the row and the pane go.
 * This is the contract half: what the origin actually does to D1 and R2 when
 * that confirmation is answered, and what it deliberately does NOT do.
 *
 * EVERY FACT IS READ BACK OFF THE STORES rather than off the reply that claims
 * it. A route that returned `{deleted: true}` and archived nothing would pass an
 * assertion on its own envelope.
 *
 * ONE DOUBLE, NAMED WHERE IT IS USED: the describers and the index seam, which
 * are model boundaries miniflare cannot reach. The index seam is doubled as a
 * RECORDER rather than a no-op, because *"the erasure runs the index seam"* is a
 * claim about a call happening and there is no other way to observe it here.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. `archive` IS THE VERB. The record is archived rather than deleted or
 *     status-flipped, so nothing in the lifecycle learns a new state — and the
 *     row is gone from every read that draws the Library.
 *  2. IT IS A DELETION AND NOT A HIDING. The attachment is trashed with the
 *     record and its bytes move, so the file route stops serving it. *"'Deleted'
 *     that still serves is not deleted."*
 *  3. **THE SITE'S COPY SURVIVES.** *"Placement copies the bytes … so deleting a
 *     placed item does not take it off the site."* This is the fact that makes
 *     the whole CTA safe, and it is asserted against the site's own asset store.
 *  4. THE CONSULTANT'S VIEW DOES NOT GO STALE. The item leaves `list_library`,
 *     and its NAME is refused as DELETED rather than as never having existed.
 *  5. RETRIEVAL IS TOLD. The index seam runs, so a deleted document stops being
 *     findable by search rather than waiting for an unrelated upload.
 *  6. THE SURFACE REACHES MATERIAL AND NOTHING ELSE. A uid that is not this
 *     tenant's material is refused, and nothing is archived.
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

/**
 * The describers, doubled — and the index seam doubled as a RECORDER.
 *
 * `index` IS THE ONE THAT IS OBSERVED. `defaultIndexer` would reach Workers AI,
 * which miniflare cannot; what this suite claims is not that an embedding was
 * computed but that the erasure ASKED for one, which is the half the router
 * owns. The uids it was handed are the observation.
 */
function deps(indexed: string[] = []): RouterDeps {
  return {
    index: async () => async (uid: string) => void indexed.push(uid),
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({
      text: 'A warm photograph of a corner bakery at golden hour.',
      model: 'stub/vision-1',
    }),
  }
}

/** One dropped file, through the real route. `slug` is what makes it PLACED. */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'site')
  if (file.slug) form.append('site', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** The erasure, through the real route. */
function remove(tenant: string, uid: string, indexed: string[] = []): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material?uid=${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    }),
    routerEnv(),
    scopeOf(tenant),
    deps(indexed),
  )
}

/** The Library tab's own list, through the real route. */
async function listed(tenant: string): Promise<Array<Record<string, unknown>>> {
  const response = await route(
    new Request('https://app.test/api/material'),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  const body = (await response.json()) as { material: Array<Record<string, unknown>> }
  return body.material
}

/** The catalogue surface, over this tenant's real stores. */
async function catalogue(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  return { tickets, sites, ops: libraryOperations(chatLibrary(tickets, sites, slug)) }
}

type Row = Record<string, unknown>
const rowsOf = (page: unknown): Row[] => (page as { items: Row[] }).items

beforeAll(async () => {
  await APPLIED
})

// ── the erasure itself ───────────────────────────────────────────────────────

describe('REQ-281 — the row leaves the Library', () => {
  it('test_UAT_FC_REQ-281_deleting_archives_the_record_and_takes_the_row_out_of_every_list', async () => {
    // `archive` IS A COLUMN AND NOT A STATUS, which is the whole reason it is
    // the verb: the record is still there to be read with `include_archived`,
    // and every ordinary read stops seeing it. Both halves are asserted, because
    // a hard delete would pass the second and a status flip would pass neither.
    const tenant = 'req281-archive'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req281a' })
    const wordmark = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
    })
    const brand = await upload(tenant, {
      bytes: bytesOf('# Brand\n\nGold on cream.'),
      name: 'brand.md',
      type: 'text/markdown',
      role: 'reference',
    })
    expect((await listed(tenant)).map((r) => r.uid).sort()).toEqual(
      [wordmark.uid, brand.uid].sort(),
    )

    const response = await remove(tenant, String(wordmark.uid))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ uid: wordmark.uid })

    // GONE FROM THE CLIENT'S OWN LIST…
    expect((await listed(tenant)).map((r) => r.uid)).toEqual([brand.uid])
    // …AND FROM THE ONE READ BOTH HALVES GO THROUGH, which is the same call and
    // is asserted separately because REQ-228 made that identity load-bearing.
    const { tickets, ops } = await catalogue(tenant, site.slug)
    expect((await listMaterial(tickets)).map((r) => r.uid)).toEqual([brand.uid])
    expect(rowsOf(await ops.list_library({ limit: 100 })).map((r) => r.item)).toEqual([brand.uid])

    // AND IT IS IN THE TRASH, not destroyed — which is what leaves the door open
    // to the recovery affordance the ticket rules out of scope rather than out.
    expect((await listDeletedMaterial(tickets)).map((r) => r.uid)).toEqual([wordmark.uid])
  })

  it('test_UAT_FC_REQ-281_the_bytes_stop_being_served_and_the_item_stops_being_readable', async () => {
    // *"Hiding the record logically would leave every outstanding URL serving
    // the file, and 'deleted' that still serves is not deleted."* The cascade
    // onto the attachment and the move of its bytes are the component's; what is
    // asserted here is that this route really gets them — a route that patched a
    // field instead would leave the file route answering 200 forever.
    const tenant = 'req281-bytes'
    await makeD1Site({ tenantId: tenant, slug: 'req281b' })
    const photo = await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'bakery.png',
      type: 'image/png',
    })
    const fileUrl = `https://app.test/api/material/file?uid=${encodeURIComponent(String(photo.uid))}`
    expect((await route(new Request(fileUrl), routerEnv(), scopeOf(tenant), deps())).status).toBe(200)

    await remove(tenant, String(photo.uid))

    expect(
      (await route(new Request(fileUrl), routerEnv(), scopeOf(tenant), deps())).status,
    ).not.toBe(200)
    // AND THE DETAIL PANE'S OWN READ STOPS ANSWERING, so a tab holding the uid
    // cannot re-open a pane over a file that is gone.
    const item = await route(
      new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(String(photo.uid))}`),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect(item.status).not.toBe(200)
  })

  it('test_UAT_FC_REQ-281_the_erasure_asks_retrieval_to_forget_it_too', async () => {
    // THE CATALOGUE IS NOT THE ONLY THING THAT ANSWERS ABOUT A FILE. Retrieval
    // reads the INDEX rather than the body (DOC-39 §4), and the chunk index
    // drops a parent that has left the corpus on its next refresh — so the one
    // thing that has to happen here is that a refresh is ASKED FOR. Left to the
    // next upload, a client who deleted a document could still be quoted from it.
    const tenant = 'req281-index'
    await makeD1Site({ tenantId: tenant, slug: 'req281c' })
    const brand = await upload(tenant, {
      bytes: bytesOf('# Brand\n\nGold on cream.'),
      name: 'brand.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const indexed: string[] = []
    const response = await remove(tenant, String(brand.uid), indexed)

    expect(indexed).toEqual([brand.uid])
    // AND THE ENVELOPE SAYS WHETHER IT WORKED, because the erasure stands either
    // way and a caller is entitled to know which — the same honesty the upload
    // route's own `indexed` carries.
    expect(await response.json()).toMatchObject({ uid: brand.uid, forgotten: true })
  })

  it('test_UAT_FC_REQ-281_a_uid_that_is_not_this_tenants_material_is_refused', async () => {
    // THE SURFACE REACHES MATERIAL AND NOTHING ELSE. Without the check a uid off
    // the wire could archive a brief or a conversation through a route that is
    // supposed to reach the client's files — and the answer is the read routes'
    // own 404 rather than a 403, so this cannot become an oracle for which uids
    // exist in the tenant.
    const tenant = 'req281-scope'
    await makeD1Site({ tenantId: tenant, slug: 'req281d' })
    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const { ticket } = await tickets.create({
      type: 'brief',
      title: 'The brief',
      fields: { site_slug: 'req281d' },
      body: 'What was decided.',
    })

    expect((await remove(tenant, ticket.uid)).status).toBe(404)
    // AND NOTHING WAS ARCHIVED. A refusal that had already written would be the
    // worst of both.
    expect((await tickets.get({ uid: ticket.uid })).ticket.uid).toBe(ticket.uid)

    // A MISSING uid IS A BAD REQUEST, because there is nothing to delete and no
    // other body that would make the call mean something.
    const bare = await route(
      new Request('https://app.test/api/material', { method: 'DELETE' }),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect(bare.status).toBe(400)
  })
})

// ── the fact that makes it safe ──────────────────────────────────────────────

describe('REQ-281 — deleting a placed item does not take it off the site', () => {
  it('test_UAT_FC_REQ-281_the_sites_own_copy_of_a_placed_picture_survives_the_deletion', async () => {
    // **THE SINGLE MOST IMPORTANT THING FOR THIS CTA TO SAY CORRECTLY**, and the
    // reason it can be said at all: `promoteToSiteAsset` COPIES the bytes into
    // the site's asset store and then records `placed_on`, so the page holds the
    // site's own file and the Library row is the catalogue entry. Asserted
    // against the site store's own listing AND its bytes — a listing alone would
    // pass against an entry pointing at material that has just been trashed.
    const tenant = 'req281-placed'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req281e' })
    const photo = await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'bakery.png',
      type: 'image/png',
      slug: site.slug,
    })

    const { sites } = await catalogue(tenant, site.slug)
    // ASSERTED RATHER THAN ASSUMED, so a case about surviving a deletion cannot
    // pass by having never been placed.
    expect(await sites.listAssets(site.slug)).toContain('bakery.png')
    const before = await sites.readAsset(site.slug, 'bakery.png')

    await remove(tenant, String(photo.uid))

    expect((await listed(tenant)).map((r) => r.uid)).not.toContain(photo.uid)
    expect(await sites.listAssets(site.slug)).toContain('bakery.png')
    const after = await sites.readAsset(site.slug, 'bakery.png')
    expect(after).not.toBeNull()
    expect(after?.byteLength).toBe(before?.byteLength)
  })
})

// ── the consultant's view ────────────────────────────────────────────────────

describe('REQ-281 — the consultant is told it was deleted', () => {
  it('test_UAT_FC_REQ-281_a_deleted_number_is_refused_as_deleted_and_not_as_unknown', async () => {
    // A CONSULTATION THAT SAID *"use IMAGE-5"* HOLDS A NAME THE CLIENT HAS SINCE
    // DELETED. Told there is no such item — followed by a list of the ones there
    // are — the session argues with the client about a number they both read off
    // the same row. The refusal is asserted through the REAL deleted catalogue,
    // resolving the REAL label the upload allocated, because the claim is that a
    // deleted item still answers to the spellings it answered to before.
    const tenant = 'req281-name'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req281f' })
    const photo = await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'bakery.png',
      type: 'image/png',
    })

    const { tickets, ops } = await catalogue(tenant, site.slug)
    // THE NUMBER IS ALLOCATED ON THE LISTING READ, so it is taken from the same
    // place the client reads it rather than composed here.
    const label = (await listMaterial(tickets)).find((r) => r.uid === photo.uid)?.label
    expect(label).toBeTruthy()

    await remove(tenant, String(photo.uid))

    const refusal = await ops
      .get_library_item({ item: String(label) })
      .then(() => null)
      .catch((err: unknown) => err as LibraryRefusedError)
    expect(refusal).toBeInstanceOf(LibraryRefusedError)
    expect(refusal?.code).toBe('DELETED')
    expect(refusal?.message).toMatch(/deleted/i)

    // AND A NAME THAT NEVER EXISTED IS STILL THE OTHER REFUSAL. Collapsing the
    // two would make the new one useless: a session told DELETED about a name it
    // made up would stop believing the code.
    const unknown = await ops
      .get_library_item({ item: 'IMAGE-4000' })
      .then(() => null)
      .catch((err: unknown) => err as LibraryRefusedError)
    expect(unknown?.code).toBe('NOT_FOUND')
  })

  it('test_UAT_FC_REQ-281_placing_a_deleted_item_is_refused_before_anything_is_copied', async () => {
    // THE OTHER OPERATION THAT RESOLVES A NAME, and the one where getting it
    // wrong would be expensive: a session acting on a stale name must not put
    // bytes on the client's site. The refusal happens at the name, before the
    // placement is attempted at all, so the site is untouched.
    const tenant = 'req281-place'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req281g' })
    const wordmark = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
    })

    await remove(tenant, String(wordmark.uid))

    const { sites, ops } = await catalogue(tenant, site.slug)
    const refusal = await ops
      .place_on_site({ item: String(wordmark.uid) })
      .then(() => null)
      .catch((err: unknown) => err as LibraryRefusedError)
    expect(refusal?.code).toBe('DELETED')
    expect(await sites.listAssets(site.slug)).not.toContain('wordmark.svg')
  })
})
