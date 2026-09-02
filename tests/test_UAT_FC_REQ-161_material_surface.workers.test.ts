import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { projectKnowledgeFor, PROJECT_KB } from '../apps/control-app/src/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { CLIENT_DESCRIBER } from '../apps/control-app/src/material'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf } from './support/material-fixtures'

/**
 * REQ-161 — **the Library's surface, in workerd, end to end**.
 *
 * WHAT THIS FILE IS FOR, and what its two siblings prove instead. The Library is
 * a browser surface over an origin contract, and the two halves fail in
 * completely different ways: this one is the CONTRACT — what the role does to the
 * rights record, what "put it on the site" actually puts there, what the list
 * carries, and whether a corrected description reaches search. The jsdom suites
 * beside it prove the surface — that the overlay never creates anything without
 * a choice, and that the tab is `list-detail` over what these routes answer.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and two real R2 buckets.
 * The blob is stored by the ticketing component's own `attach`, the material row
 * is written by its own validator, the vectors are built by the knowledge
 * component's own index. Nothing here reimplements a step in order to assert it.
 *
 * ONE DOUBLE, AND IT IS THE EMBEDDER — `tests/support/stub-embedder.ts` argues it
 * at length, and the short form is that miniflare has no local Workers AI to
 * reach and no claim below is about the quality of an embedding. The describer is
 * left ABSENT rather than stubbed wherever the claim is about a degraded
 * description, because absent is the state the claim is about.
 *
 * THE FIVE CLAIMS, in the order the ticket makes them:
 *
 * 1. THE ROLE IS THE ONLY THING ASKED, AND IT DECIDES THE RIGHTS. Identical bytes
 *    under opposite roles are one blob with opposite `republishable`.
 * 2. "PUT IT ON THE SITE" PUTS IT ON THE SITE, and "just for you to read" is
 *    MECHANICALLY incapable of reaching one — refused by [[DOC-38]] §5's gate.
 * 3. THE LIST IS TENANT-WIDE AND CARRIES NO BODIES.
 * 4. A CORRECTED DESCRIPTION REACHES RETRIEVAL, and survives a re-describe pass.
 * 5. THE READ ROUTES REACH MATERIAL AND NOTHING ELSE.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** No describer, and an indexer that only counts — the default for most claims. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    ...over,
    indexed,
  }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
  d: RouterDeps = deps(),
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  if (file.role !== undefined) form.append('role', file.role)
  if (file.slug) form.append('slug', file.slug)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    d,
  )
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-161 — the client chooses a role, and the role chooses the rights', () => {
  it('UAT_FC_REQ-161 identical bytes under opposite roles are one blob with opposite rights', async () => {
    // THE CASE THE TICKET IS BUILT ON. A JPEG may be a hero photograph destined
    // for the site or a screenshot of something the client likes that must never
    // be published: identical bytes, identical content type, opposite rights. No
    // rule over `origin` or `kind` separates them, which is why the areas are
    // roles rather than file types.
    const tenant = 'req161-roles'
    const bytes = bytesOf('the same picture, wanted for two different things')

    const forSite = await body(
      await upload(tenant, { bytes, name: 'shot.png', type: 'image/png', role: 'site' }),
    )
    const toRead = await body(
      await upload(tenant, { bytes, name: 'shot.png', type: 'image/png', role: 'reference' }),
    )

    expect(forSite.role).toBe('site')
    expect(forSite.republishable).toBe(true)
    expect(toRead.role).toBe('reference')
    expect(toRead.republishable).toBe(false)

    // ONE BLOB. The role is a property of the material, not of a byte range
    // ([[DOC-38]] §7.4) — so content addressing still dedups across the two, and
    // the same bytes are paid for once.
    expect((forSite.attachment as Record<string, unknown>).sha256).toBe(
      (toRead.attachment as Record<string, unknown>).sha256,
    )
    expect(forSite.uid).not.toBe(toRead.uid)

    // NOTHING ELSE WAS ASKED. `rights` is still inferred from provenance
    // ([[DOC-38]] §10.1) — the client was never put in front of a legal question
    // — so both are `owned` and neither is exportable. The role NARROWED one of
    // them; it did not turn into a second rights model.
    expect(forSite.rights).toBe('owned')
    expect(toRead.rights).toBe('owned')
    expect(forSite.exportable).toBe(false)
    expect(toRead.exportable).toBe(false)
  })

  it('UAT_FC_REQ-161 a role the overlay could not have sent is refused, never coerced', async () => {
    // Both silent alternatives are wrong in a way nobody would notice: falling
    // back to `site` publishes something the client marked private, and falling
    // back to `reference` withholds a photograph they meant to publish.
    const response = await upload('req161-roles', {
      bytes: bytesOf('x'),
      name: 'x.png',
      type: 'image/png',
      role: 'Site',
    })
    expect(response.status).toBe(400)
    expect((await body(response)).error).toMatch(/role must be/)
  })
})

describe('REQ-161 — "put it on the site" means the bytes are on the site', () => {
  it('UAT_FC_REQ-161 a site-role upload lands in the asset library, without overwriting one already there', async () => {
    const tenant = 'req161-place'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req161' })

    const first = await body(
      await upload(tenant, {
        bytes: bytesOf('the logo'),
        name: 'logo.png',
        type: 'image/png',
        role: 'site',
        slug: site.slug,
      }),
    )
    expect(first.site_asset).toBe('logo.png')
    expect(await site.store.listAssets(site.slug)).toContain('logo.png')

    // A SECOND FILE OF THE SAME NAME MUST NOT REPLACE THE FIRST. `write` puts
    // bytes at a name and says nothing about what was there — so without a free
    // name, dropping a second `logo.png` would silently change a picture that is
    // live on the client's site, from a surface whose whole promise is that it
    // adds.
    const second = await body(
      await upload(tenant, {
        bytes: bytesOf('a different logo'),
        name: 'logo.png',
        type: 'image/png',
        role: 'site',
        slug: site.slug,
      }),
    )
    expect(second.site_asset).toBe('logo-2.png')
    // The suffix goes BEFORE the extension, because the extension is what every
    // consumer reads the type from.
    expect(String(second.site_asset)).toMatch(/\.png$/)

    const bytes = await site.store.readAsset(site.slug, 'logo.png')
    expect(new TextDecoder().decode(bytes!)).toBe('the logo')
  })

  it('UAT_FC_REQ-161 material the client marked "just for you to read" cannot reach a site at all', async () => {
    // [[DOC-38]] §5 calls promoting a non-republishable source "the most damaging
    // single action available in the system" — it publishes third-party copyright
    // under the client's own domain. The refusal is not a routing decision that
    // could be forgotten: it is the gate on the ticket's own `republishable` bit,
    // which the ROLE wrote. So the second drop area is mechanically incapable of
    // reaching a published site rather than merely not wired to one.
    const tenant = 'req161-refuse'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req161b' })
    const before = (await site.store.listAssets(site.slug)).length

    const placed = await body(
      await upload(tenant, {
        bytes: bytesOf('a competitor screenshot'),
        name: 'them.png',
        type: 'image/png',
        role: 'reference',
        slug: site.slug,
      }),
    )
    // Stored, described, indexed — and NOT on the site.
    expect(placed.uid).toBeTruthy()
    expect(placed.republishable).toBe(false)
    expect(placed.site_asset).toBeNull()
    expect(await site.store.listAssets(site.slug)).toHaveLength(before)

    // And asked for directly, the gate answers 403 — forbidden, not malformed.
    const store = await ticketStoreFor(routerEnv(tenant))
    const { ticket } = await store.get({ uid: String(placed.uid) })
    expect(ticket.fields.republishable).toBe(false)
    expect(ticket.fields.role).toBe('reference')
  })
})

describe('REQ-161 — the Library reads what ingestion wrote', () => {
  it('UAT_FC_REQ-161 the list is the whole tenant, carries no bodies, and the item carries one', async () => {
    const tenant = 'req161-list'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req161c' })

    await upload(tenant, {
      bytes: bytesOf('positioning: we are the only late-night bakery in the town'),
      name: 'positioning.txt',
      type: 'text/plain',
      role: 'reference',
    })
    const bound = await body(
      await upload(tenant, {
        bytes: bytesOf('the wordmark'),
        name: 'wordmark.svg',
        type: 'image/svg+xml',
        role: 'site',
        slug: site.slug,
      }),
    )

    const listed = await body(
      await route(new Request('https://app.test/api/material'), routerEnv(tenant), deps()),
    )
    const rows = listed.material as Array<Record<string, unknown>>
    expect(rows).toHaveLength(2)

    // TENANT-WIDE, NOT SITE-SCOPED ([[DOC-38]] §7.7, [[DOC-10]] §4.1): the row
    // placed on a site and the row placed nowhere are both here, and `placed_on`
    // is what the browser badges and filters on rather than something the origin
    // used to hide anything.
    const wordmark = rows.find((row) => row.uid === bound.uid)!
    const positioning = rows.find((row) => row.uid !== bound.uid)!
    expect(wordmark.placed_on).toEqual([site.slug])
    // EMPTY, because nothing was ever put on a site for it (BUG-47).
    expect(positioning.placed_on).toEqual([])
    expect(wordmark.role).toBe('site')
    expect(positioning.role).toBe('reference')

    // NO BODIES. A material's body is its extracted text, so a list that carried
    // them would ship the client's whole corpus to draw a column of filenames.
    for (const row of rows) expect(row.body).toBeUndefined()
    // …and the filename IS on the row, which is why `tickets.ts` duplicates it
    // there: the alternative is an `attachments` call per row.
    expect(rows.map((row) => row.filename).sort()).toEqual(['positioning.txt', 'wordmark.svg'])

    // The item route is where the description lives.
    const item = await body(
      await route(
        new Request(`https://app.test/api/material/item?uid=${positioning.uid}`),
        routerEnv(tenant),
        deps(),
      ),
    )
    expect(String(item.body)).toContain('late-night bakery')

    // And a second tenant sees none of it — the barrier is the store handle's,
    // and this is the surface that would leak it if it were not.
    const other = await body(
      await route(new Request('https://app.test/api/material'), routerEnv('req161-other'), deps()),
    )
    expect(other.material).toHaveLength(0)
  })

  it('UAT_FC_REQ-161 the blob comes back as itself, so the pane can show it', async () => {
    const tenant = 'req161-file'
    const created = await body(
      await upload(tenant, {
        bytes: bytesOf('<svg/>'),
        name: 'mark.svg',
        type: 'image/svg+xml',
        role: 'site',
      }),
    )
    const file = await route(
      new Request(`https://app.test/api/material/file?uid=${created.uid}`),
      routerEnv(tenant),
      deps(),
    )
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toBe('image/svg+xml')
    // INLINE, so the detail pane renders it rather than prompting a download.
    expect(file.headers.get('content-disposition')).toContain('inline')
    expect(await file.text()).toBe('<svg/>')
  })

  it('UAT_FC_REQ-161 the read routes reach material and nothing else', async () => {
    // A uid off the wire must not be able to read a conversation or rewrite an
    // awareness map through a surface built for material. 404 and not 403, so the
    // route is not an oracle for which uids exist in the tenant.
    const tenant = 'req161-scope'
    const store = await ticketStoreFor(routerEnv(tenant))
    const { ticket } = await store.create({
      type: 'brief',
      title: 'The brief',
      body: 'Decisions taken so far.',
      fields: { site_slug: 'somewhere' },
    })

    for (const path of [
      `/api/material/item?uid=${ticket.uid}`,
      `/api/material/file?uid=${ticket.uid}`,
    ]) {
      const response = await route(
        new Request(`https://app.test${path}`),
        routerEnv(tenant),
        deps(),
      )
      expect(response.status, path).toBe(404)
    }

    const written = await route(
      new Request('https://app.test/api/material/description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: ticket.uid, body: 'rewritten from outside' }),
      }),
      routerEnv(tenant),
      deps(),
    )
    expect(written.status).toBe(404)
    expect((await store.get({ uid: ticket.uid })).ticket.body).toBe('Decisions taken so far.')
  })
})

describe('REQ-161 — the client corrects the description', () => {
  it('UAT_FC_REQ-161 the correction is what search answers with afterwards', async () => {
    // THE ACCEPTANCE, PROVED BY SEARCHING. A correction that changed the body and
    // not the index would leave the Library showing the client's words while
    // search kept answering with ours — and [[DOC-39]] §4 is explicit that an
    // unindexed document is INVISIBLE rather than merely stale.
    const tenant = 'req161-correct'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })
    const index = async () => async () => void (await kb.onMaterialWritten())

    // A DISTRACTOR FIRST, so the claim below is about RANKING and not merely
    // about a store with one row in it. A knowledge base holding a single
    // document returns that document for any query at all; asserting "it comes
    // back" there would pass whether or not the correction had reached the index.
    await upload(
      tenant,
      {
        bytes: bytesOf('Suppliers deliver flour on Tuesdays and the mill invoices monthly.'),
        name: 'suppliers.txt',
        type: 'text/plain',
        role: 'reference',
      },
      { index },
    )

    // NO DESCRIBER, which is the case the correction exists for: an image nothing
    // has looked at is stored, honest about it, and unfindable by what is in it.
    const created = await body(
      await upload(
        tenant,
        { bytes: bytesOf('png-ish bytes'), name: 'DSC_4821.jpg', type: 'image/jpeg', role: 'site' },
        { index, describeImage: undefined },
      ),
    )
    expect(created.description_status).toBe('no_describer')

    // THE CLAIM IS THE MOVEMENT, not the membership. Every indexed document is
    // scored against every query, so "it comes back" is true of a corpus of two
    // before anyone has written anything — what cannot be true unless the
    // correction reached the INDEX is that the photograph scores higher against a
    // question about its own contents afterwards than it did before.
    const query = 'the courtyard at dusk with the tables laid for service'
    const scoreOf = (hits: Array<{ uid: string; semantic: number }>) =>
      hits.find((hit) => hit.uid === String(created.uid))?.semantic ?? 0
    const before = scoreOf(await kb.search(query))

    const corrected = await body(
      await route(
        new Request('https://app.test/api/material/description', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            uid: created.uid,
            body: 'The courtyard at dusk, with the tables laid for service.',
          }),
        }),
        routerEnv(tenant),
        { index },
      ),
    )
    expect(corrected.description_status).toBe('ok')

    const hits = await kb.search(query)
    expect(scoreOf(hits)).toBeGreaterThan(before)
    // And it is now the BEST answer to a question about what the client said it
    // is — ranked above a document about something else entirely, which is what
    // makes this a retrieval claim rather than a "the store has two rows" claim.
    expect(hits[0].uid).toBe(String(created.uid))
    expect(hits[0].kbs).toContain(PROJECT_KB)
  })

  it('UAT_FC_REQ-161 a corrected description records who wrote it, so a re-describe pass leaves it alone', async () => {
    // [[REQ-163]] declared `description_status` precisely so a later re-describe
    // pass could be a QUERY rather than a migration. A client who has just written
    // a better description than any model could must not be inside that query's
    // result set — and the model field says who to credit.
    const tenant = 'req161-credit'
    const created = await body(
      await upload(
        tenant,
        { bytes: bytesOf('png-ish'), name: 'a.jpg', type: 'image/jpeg', role: 'site' },
        { index: async () => async () => {}, describeImage: undefined },
      ),
    )
    const store = await ticketStoreFor(routerEnv(tenant))
    const backlog = async () =>
      (await store.list({ type: 'material', limit: 'all' })).tickets.filter(
        (t) => t.fields.description_status === 'no_describer',
      )
    expect((await backlog()).map((t) => t.uid)).toContain(String(created.uid))

    await route(
      new Request('https://app.test/api/material/description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: created.uid, body: 'The old shopfront, before the repaint.' }),
      }),
      routerEnv(tenant),
      deps(),
    )

    expect((await backlog()).map((t) => t.uid)).not.toContain(String(created.uid))
    const { ticket } = await store.get({ uid: String(created.uid) })
    expect(ticket.fields.description_model).toBe(CLIENT_DESCRIBER)
    expect(ticket.body).toBe('The old shopfront, before the repaint.')
  })

  it('UAT_FC_REQ-161 an empty description is refused, because it is the only way in', async () => {
    // Not pedantry: the body is the ONLY thing that makes a blob findable
    // ([[DOC-38]] §6). Accepting an empty one would let a client silently delete
    // their own file from search while it sat in the Library looking present.
    const tenant = 'req161-empty'
    const created = await body(
      await upload(tenant, { bytes: bytesOf('text'), name: 'n.txt', type: 'text/plain', role: 'reference' }),
    )
    const response = await route(
      new Request('https://app.test/api/material/description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: created.uid, body: '   ' }),
      }),
      routerEnv(tenant),
      deps(),
    )
    expect(response.status).toBe(400)
    expect((await body(response)).error).toMatch(/findable/)
  })
})
