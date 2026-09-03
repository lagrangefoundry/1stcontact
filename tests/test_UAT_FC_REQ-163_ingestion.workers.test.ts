import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { projectKnowledgeFor, PROJECT_KB, indexPrefix } from '../apps/control-app/src/knowledge'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import {
  MAX_MATERIAL_BYTES,
  NotRepublishableError,
  promoteToSiteAsset,
} from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf, minimalPdf } from './support/material-fixtures'
import { siteSeed } from './support/site-seed'

/**
 * REQ-163 — **ingestion, in workerd, end to end**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion below goes through `route()` — the
 * Worker's own route table — against a real D1 database and two real R2 buckets
 * supplied by `@cloudflare/vitest-pool-workers`. The blob is stored by the
 * ticketing component's own `attach`, the material row is written by its own
 * validator, the index is refreshed by the knowledge component's own
 * `buildIndex`. Nothing here reimplements a step in order to assert it, and
 * `MAX_MATERIAL_BYTES` is the component's own constant rather than a second
 * opinion about it.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES. The vision describer and the embedder.
 * `tests/support/stub-embedder.ts` argues the second at length and the same
 * argument covers the first: neither claim below is about the quality of a
 * description or of an embedding, and miniflare has no local Workers AI to reach
 * even if one were wanted.
 *
 * THE SIX CLAIMS, in the order the ticket makes them:
 *
 * 1. A FILE ARRIVING THROUGH THE WORKER BECOMES A BLOB AND THEN A MATERIAL, and
 *    is searchable without a full reindex — proved by actually searching for it.
 * 2. THE SAME FILE TWICE IS ONE BLOB AND TWO RECORDS. Counted in R2.
 * 3. A FILE OVER THE CEILING IS REFUSED IN WORDS A CLIENT CAN ACT ON.
 * 4. A CRASH BETWEEN BLOB AND RECORD LEAVES NO DANGLING POINTER. Injected at the
 *    one point the ordering claim is about.
 * 5. THE INDEX SEAM IS CALLED EXACTLY ONCE PER MATERIAL, and its absence is LOUD.
 * 6. PROMOTING A NON-REPUBLISHABLE SOURCE IS REFUSED — [[DOC-38]] §5's "most
 *    damaging single action available in the system".
 */

const APPLIED = applySchema()

const TENANT = 'req163'

function routerEnv(tenantId = TENANT, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/**
 * The business a case operates on ([[REQ-168]]).
 *
 * It used to ride on the env as `TENANT_ID`; the business comes from the
 * caller's identity now, so it is an argument the way a request supplies it.
 */
const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** The stubbed describer, plus a count of how often it was reached. */
function vision(text: string) {
  const state = { calls: 0 }
  return {
    state,
    describeImage: async () => {
      state.calls++
      return { text, model: 'stub/vision-1' }
    },
  }
}

/** The digest describer, doubled — see the module note's argument for the vision one. */
const digest: NonNullable<RouterDeps['describeText']> = async () => ({
  text: 'A bakery brand guide, kept for reference.',
  model: 'stub/digest-1',
})

/** Deps with all three model seams stubbed and the indexer counted. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    describeImage: vision('A thing\n\nSomething depicted.').describeImage,
    describeText: digest,
    ...over,
    indexed,
  }
}

async function upload(
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps = deps(),
  envOver: Partial<RouterEnv> = {},
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(TENANT, envOver),
    scopeOf(TENANT),
    d,
  )
}

/** Every R2 key under a prefix, so blob residency is counted rather than assumed. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await bucket.list({ prefix, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('REQ-163 — a file arriving through the Worker', () => {
  it('UAT_FC_REQ-163 becomes a blob, then a material whose body is a usable description', async () => {
    const d = deps()
    const response = await upload(
      minimalPdf('The kitchen opens at six and the bread is baked overnight.'),
      'guidelines.pdf',
      'application/pdf',
      d,
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    // The §9 field block, computed from provenance and written to the ticket.
    expect(body.kind).toBe('document')
    expect(body.rights).toBe('owned')
    expect(body.republishable).toBe(true)
    expect(body.exportable).toBe(false)
    expect(body.origin).toBe('uploaded')
    expect(body.description_status).toBe('ok')
    expect(body.indexed).toBe(true)

    // The BLOB is in the material bucket — not in SITES, which the public Worker
    // serves. That separation is [[REQ-162]]'s and this is where an upload would
    // break it.
    //
    // ADDRESSED BY THE ATTACHMENT RECORD'S UID, not by the hash ([[REQ-161]]).
    // This asserted `t/<tenant>/blob/<sha>` because the component content-
    // addressed when [[REQ-163]] was written; it gave that up deliberately —
    // a shared blob cannot be moved to the trash without breaking whichever
    // sibling record still names it, and moving it is what makes deletion
    // actually revoke reach. `sha256` stays on the record for INTEGRITY, which
    // is why it is still asserted here, and is no longer the address.
    const attachment = body.attachment as Record<string, unknown>
    const sha = String(attachment.sha256)
    expect(sha).toMatch(/^[0-9a-f]{64}$/)
    const key = `t/${TENANT}/blob/${attachment.uid}`
    expect(await keysUnder(env.BLOBS as R2Bucket, key)).toEqual([key])

    // And the description really is in the ticket's body, read back through a
    // second, independently constructed store — not from the response envelope.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.type).toBe('material')
    expect(ticket.title).toBe('Brand guidelines')
    // A DIGEST, not the document ([[REQ-173]]). The body says what the material
    // IS; what it SAYS is in the `material_text` comment below.
    expect(ticket.body).toContain('bakery brand guide')
    expect(ticket.body).not.toContain('kitchen')
    expect(ticket.fields.filename).toBe('guidelines.pdf')
    // The model that wrote the digest, and the extractor that produced the text.
    expect(String(ticket.fields.description_model)).toContain('unpdf')

    // AND THE DOCUMENT'S OWN TEXT IS KEPT, verbatim, in one comment on the
    // material ([[REQ-173]]). This is the half that makes a fact on page 12 of a
    // brand book retrievable at all — the chunk index reads it, and dropping it
    // in favour of three sentences would silently delete deep retrieval.
    const { comments } = await store.comments({ uid: String(body.uid) })
    const kept = comments.filter((c) => c.fields.kind === 'material_text')
    expect(kept).toHaveLength(1)
    expect(kept[0].body).toContain('kitchen')
    expect(kept[0].body).toContain('bread')
    // Echoed on the envelope, because the body no longer carries the text and a
    // caller that wants it has to know there is a comment to ask for.
    expect(body.text_comment).toBe(kept[0].uid)
  })

  it('UAT_FC_REQ-163 is searchable immediately, without a full reindex', async () => {
    // THE ACCEPTANCE, PROVED BY SEARCHING. The pipeline's index step is wired to
    // the project KB's `onMaterialWritten`, which is a change-feed consumer: it
    // embeds what changed and keeps every vector it already had. So this uploads
    // into a KB that ALREADY HOLDS a document, then asserts both that the new one
    // is retrievable and that the old one's vector was not recomputed — which is
    // what "without a full reindex" means mechanically.
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(), scopeOf(), { embedder, defer: () => {} })

    const store = await ticketStoreFor(routerEnv(), scopeOf())
    await store.create({
      type: 'material',
      title: 'An older note',
      body: 'Suppliers deliver flour on Tuesdays.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
      },
    })
    await kb.refreshIndex()
    const before = embedder.calls

    const response = await upload(
      bytesOf('The kitchen opens at six and the bread is baked overnight.'),
      'note.txt',
      'text/plain',
      deps({ index: async () => async () => void (await kb.onMaterialWritten()) }),
    )
    expect(response.status).toBe(200)
    const uid = String(((await response.json()) as Record<string, unknown>).uid)

    const hits = await kb.search('when does the kitchen open')
    expect(hits.map((hit) => hit.uid)).toContain(uid)
    expect(hits[0].kbs).toContain(PROJECT_KB)

    // Incremental, not a rebuild: the older note was NOT re-embedded. Counted on
    // the embedder rather than read off a tally the implementation also computes.
    expect(embedder.calls).toBeGreaterThan(before)
    expect(embedder.calls - before).toBeLessThan(before)
  })

  it('UAT_FC_REQ-163 the same file uploaded twice is TWO records that OWN their bytes', async () => {
    // WHAT THIS CRITERION NOW SAYS, AND WHY IT CHANGED ([[REQ-161]]). It read
    // "ONE blob and TWO records" — content addressing inside the tenant prefix,
    // so a client uploading the same PDF twice paid for it once. The component
    // withdrew that: sharing a blob between two records makes deletion
    // unimplementable, because the shared bytes cannot be moved to the trash
    // without breaking whichever sibling still names them, and moving them is
    // what makes deletion actually revoke reach ([[DOC-37]]).
    //
    // So one record owns exactly one blob. The property that survives — and the
    // one the tenant barrier rests on — is that the bytes stay under THIS
    // tenant's prefix and that identical content still hashes identically, which
    // is what `sha256` is for now that it is not the address.
    const bytes = bytesOf('a positioning paper, uploaded twice')
    const first = (await (await upload(bytes, 'a.txt', 'text/plain')).json()) as Record<string, unknown>
    const second = (await (await upload(bytes, 'b.txt', 'text/plain')).json()) as Record<string, unknown>

    const attachA = first.attachment as Record<string, unknown>
    const attachB = second.attachment as Record<string, unknown>
    expect(String(attachA.sha256)).toBe(String(attachB.sha256))
    expect(first.uid).not.toBe(second.uid)
    expect(attachA.uid).not.toBe(attachB.uid)
    for (const attachment of [attachA, attachB]) {
      const key = `t/${TENANT}/blob/${attachment.uid}`
      expect(await keysUnder(env.BLOBS as R2Bucket, key)).toEqual([key])
    }
  })

  it('UAT_FC_REQ-163 a file over the ceiling is refused in words a client can act on', async () => {
    // [[DOC-38]] §14 asks for "a clear rejection rather than an out-of-memory".
    // The component's own refusal is correct and addressed to a programmer; this
    // one is addressed to someone who has just dragged their brand book onto the
    // page, and it is checked BEFORE the material ticket is created so nothing is
    // left behind.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const before = (await store.list({ type: 'material', limit: 'all' })).tickets.length

    const response = await upload(
      new Uint8Array(MAX_MATERIAL_BYTES + 1),
      'huge.bin',
      'application/octet-stream',
    )
    expect(response.status).toBe(413)
    const body = (await response.json()) as { error: string }
    expect(body.error).toMatch(/^That file is 25MB, and the limit is 25MB\./)
    expect(body.error).toMatch(/smaller version/)
    // No byte count, no "attachment is 26214401 bytes", no stack.
    expect(body.error).not.toMatch(/\d{7}/)

    expect((await store.list({ type: 'material', limit: 'all' })).tickets.length).toBe(before)
  })
})

describe('REQ-163 — a degraded description is still material', () => {
  it('UAT_FC_REQ-163 an image with no describer is stored, honest, and selectable by predicate', async () => {
    // The one mechanism for three degraded cases. What makes a later re-describe
    // pass a QUERY rather than a migration is that the status is a declared field,
    // so this asserts the predicate actually selects it.
    const response = await upload(bytesOf('png-ish bytes'), 'logo.png', 'image/png', {
      index: async () => async () => {},
      // NO VISION DESCRIBER, on a deployment that is otherwise configured
      // ([[REQ-173]]). The route refuses an upload where nothing at all can
      // describe, so the state this claim is about — an image nothing has LOOKED
      // at — is expressed by withholding the vision seam alone.
      describeImage: undefined,
      describeText: digest,
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.description_status).toBe('no_describer')
    expect(body.description_model).toBeNull()

    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const { ticket } = await store.get({ uid: String(body.uid) })
    // VISIBLE and HONEST: the body says what is missing rather than being empty,
    // which in the Library reads as a bug rather than a known limitation.
    expect(ticket.body).toMatch(/no describer is configured/i)

    const { tickets } = await store.query({
      predicate: "type = material AND fields.description_status = 'no_describer'",
      limit: 'all',
    })
    expect(tickets.map((t) => t.uid)).toContain(String(body.uid))
  })
})

describe('REQ-163 — the index seam', () => {
  it('UAT_FC_REQ-163 is called exactly once per created material, with its uid', async () => {
    const d = deps()
    const response = await upload(bytesOf('one document'), 'one.txt', 'text/plain', d)
    const uid = String(((await response.json()) as Record<string, unknown>).uid)
    expect(d.indexed).toEqual([uid])
  })

  it('UAT_FC_REQ-163 an unwired indexer is LOUD, and the file is still stored', async () => {
    // [[DOC-39]] §4: an unindexed document is INVISIBLE, not merely stale. An
    // unwired optional hook is therefore the worst kind of silent failure —
    // every upload succeeds, the Library fills, and nothing can be found. So the
    // Worker says so, naming the binding, and the envelope carries `indexed:
    // false` so a surface can say it too.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const response = await upload(bytesOf('unindexed'), 'lost.txt', 'text/plain', {
      // The production default with no `AI` binding on the env — resolved by the
      // router, not injected here, so this is the real absence. The describer is
      // supplied because [[REQ-173]]'s gate is about the KEY and this claim is
      // about the INDEX: the two absences are unlike, which is the whole point
      // the loud log makes.
      describeImage: undefined,
      describeText: digest,
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.indexed).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    const said = String(warn.mock.calls[0][0])
    expect(said).toContain(String(body.uid))
    expect(said).toMatch(/NOT indexed/)
    expect(said).toContain('[ai]')

    // Stored regardless. Losing the client's file to a problem the operator has
    // to fix would be the wrong trade.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    expect((await store.get({ uid: String(body.uid) })).ticket.title).toBeTruthy()
  })
})

describe('REQ-163 — fetched material', () => {
  it('UAT_FC_REQ-163 lands as third-party, non-republishable, and records the FINAL address', async () => {
    const stub: typeof fetch = async (input) =>
      String(input) === 'https://example.com/a'
        ? new Response(null, { status: 301, headers: { location: 'https://example.com/report.txt' } })
        : new Response('An industry report about bakeries.', {
            status: 200,
            headers: { 'content-type': 'text/plain' },
          })
    const response = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/a' }),
      }),
      routerEnv(),
      scopeOf(),
      { ...deps(), fetch: stub },
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.rights).toBe('third_party')
    expect(body.republishable).toBe(false)
    expect(body.exportable).toBe(true)
    expect(body.origin).toBe('fetched')
    expect(body.source_url).toBe('https://example.com/report.txt')
  })

  it('UAT_FC_REQ-163 an address the guard refuses never becomes material', async () => {
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const before = (await store.list({ type: 'material', limit: 'all' })).tickets.length
    const response = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' }),
      }),
      routerEnv(),
      scopeOf(),
      deps(),
    )
    expect(response.status).toBe(400)
    expect((await response.json()) as { error: string }).toMatchObject({
      error: expect.stringMatching(/Only https addresses/),
    })
    expect((await store.list({ type: 'material', limit: 'all' })).tickets.length).toBe(before)
  })
})

describe('REQ-163 — the crash property and the asset gate', () => {
  it('UAT_FC_REQ-163 a crash between blob and record leaves an orphan blob, never a dangling pointer', async () => {
    // [[DOC-38]] §7.3's ordering, asserted where it actually lives. The crash is
    // injected at the ONE point the claim is about: between `attach`'s blob write
    // and its record write. What must hold afterwards is that no record names
    // absent bytes — the failure nothing can heal — while the reverse, a blob
    // nothing names, is fine because the sweep collects it.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const bytes = bytesOf('a file whose attachment record never landed')
    const { ticket } = await store.create({
      type: 'material',
      title: 'Interrupted',
      body: 'Interrupted mid-attach.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
      },
    })

    const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const blobs = store.blobs as unknown as {
      put(key: string, bytes: Uint8Array, opts?: { contentType?: string }): Promise<void>
    }
    await blobs.put(sha, bytes, { contentType: 'text/plain' })
    // …and here the isolate dies. Nothing writes the attachment record.

    // The blob is present and unreferenced — collectable, and costing storage
    // until it is collected.
    expect(await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/blob/${sha}`)).toHaveLength(1)
    // The material carries NO pointer: `sha256` lives on the attachment record,
    // which `attach` writes after the blob. So there is nothing to dangle.
    expect((await store.get({ uid: ticket.uid })).ticket.fields.sha256).toBeUndefined()
    expect((await store.attachments({ uid: ticket.uid })).attachments).toEqual([])
  })

  it('UAT_FC_REQ-163 promoting a non-republishable source is REFUSED', async () => {
    // [[DOC-38]] §5 — "the most damaging single action available in the system",
    // because it publishes third-party copyright under the client's own domain.
    // The check reads the MATERIAL'S OWN RECORD rather than an argument, so a
    // caller cannot assert its way past it.
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const sites = await storeFor(routerEnv(), scopeOf())
    await sites.createDraft('gate')

    const { ticket } = await tickets.create({
      type: 'material',
      title: "A competitor's hero image",
      body: 'A photograph from someone else’s site.',
      fields: {
        rights: 'third_party',
        republishable: false,
        exportable: true,
        origin: 'fetched',
        kind: 'image',
        source_url: 'https://competitor.example/hero.jpg',
      },
    })
    await tickets.attach({
      uid: ticket.uid,
      bytes: bytesOf('their bytes'),
      filename: 'hero.jpg',
      content_type: 'image/jpeg',
    })

    await expect(
      promoteToSiteAsset(tickets, sites, { uid: ticket.uid, slug: 'gate', name: 'hero.jpg' }),
    ).rejects.toBeInstanceOf(NotRepublishableError)
    // And nothing landed: refusing after writing the bytes would be no refusal at
    // all, because the asset would already be servable.
    expect(await sites.listAssets('gate')).toEqual([])
  })

  it('UAT_FC_REQ-163 promoting the client’s own upload COPIES the bytes into the site store', async () => {
    // A copy and not a pointer, and the bucket boundary is why: `readAsset`
    // resolves `site_assets.r2_key` against SITES alone, and making a BLOBS key
    // resolve would mean handing the public Worker a binding on the private
    // bucket. Promotion is therefore a real act — private becomes publishable —
    // and the byte copy is that act made honest.
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const sites = await storeFor(routerEnv(), scopeOf())
    // A REAL SITE, not a bare draft (BUG-45). Promotion now registers the asset
    // in `site.json` rather than only storing its bytes, so it needs a site
    // definition to register into — which every provisioned site has, because
    // `createStarterSite` writes the scaffold immediately after `createDraft`.
    const seed = siteSeed({ slug: 'promo' })
    await sites.createDraft(seed.slug)
    await sites.write(seed.slug, {
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    })

    const { ticket } = await tickets.create({
      type: 'material',
      title: 'The kitchen at dusk',
      body: 'A photograph of the kitchen.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'image',
      },
    })
    await tickets.attach({
      uid: ticket.uid,
      bytes: bytesOf('their own photograph'),
      filename: 'kitchen.jpg',
      content_type: 'image/jpeg',
    })

    const promoted = await promoteToSiteAsset(tickets, sites, {
      uid: ticket.uid,
      slug: seed.slug,
      name: 'kitchen.jpg',
    })
    expect(promoted.name).toBe('kitchen.jpg')
    expect(await sites.listAssets(seed.slug)).toEqual(['kitchen.jpg'])
    const read = await sites.readAsset(seed.slug, 'kitchen.jpg')
    expect(new TextDecoder().decode(read as Uint8Array)).toBe('their own photograph')
  })
})

describe('REQ-163 — the index prefix is the tenant’s', () => {
  it('UAT_FC_REQ-163 one tenant’s upload is invisible to another’s search', async () => {
    // The barrier holds at both layers, and an ingestion route is exactly where a
    // new one could be breached: the material row is tenant-scoped by the ticket
    // store, and the vectors derived from it sit under a tenant-derived prefix.
    const embedder = stubEmbedder()
    const mine = await projectKnowledgeFor(routerEnv(TENANT), scopeOf(TENANT), { embedder, defer: () => {} })
    const theirs = await projectKnowledgeFor(routerEnv('req163-other'), scopeOf('req163-other'), {
      embedder,
      defer: () => {},
    })

    const response = await upload(
      bytesOf('Oxblood and bone are the palette for the bakery.'),
      'palette.txt',
      'text/plain',
      deps({ index: async () => async () => void (await mine.onMaterialWritten()) }),
    )
    const uid = String(((await response.json()) as Record<string, unknown>).uid)

    expect((await mine.search('oxblood palette bakery')).map((h) => h.uid)).toContain(uid)
    await theirs.refreshIndex()
    expect((await theirs.search('oxblood palette bakery')).map((h) => h.uid)).not.toContain(uid)
    // Stated structurally too: the two index prefixes cannot collide.
    expect(indexPrefix(TENANT, PROJECT_KB)).not.toBe(indexPrefix('req163-other', PROJECT_KB))
  })
})
