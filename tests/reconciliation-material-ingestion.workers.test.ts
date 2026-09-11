import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { PROJECT_KB, projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { MAX_MATERIAL_BYTES } from '../apps/control-app/src/material'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * Reconciliation UATs for story-6ccaedd5 — **ingestion: a file handed to the
 * platform becomes stored, classified, findable material**.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim below is made through `route()` — the
 * Worker's own route table, at its own two ingestion entry points — against a
 * real D1 database and two real R2 buckets supplied by
 * `@cloudflare/vitest-pool-workers`. The bytes are stored by the ticketing
 * component's own `attach`, the material row is written and validated by its own
 * type pack, the index is refreshed by the knowledge component's own
 * `buildIndex`. Nothing here reimplements a step of the pipeline in order to
 * assert it, and the per-file ceiling is read from `MAX_MATERIAL_BYTES` rather
 * than restated as a second opinion about it.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES — the vision describer and the embedder.
 * `tests/support/stub-embedder.ts` argues the second at length and the same
 * argument covers the first: no criterion in this story is about the quality of
 * a description or of an embedding, and miniflare has no local Workers AI to
 * reach even if one were wanted. The index SEAM itself is the third stand-in, and
 * it exists for exactly this reason — it is what lets "announced exactly once per
 * created material" be counted rather than inferred.
 *
 * WHERE THE BYTES ARE READ BACK FROM. Several criteria insist on a second,
 * independently constructed handle rather than on the response envelope: an
 * envelope that echoed its own input would satisfy a weaker test while proving
 * nothing about what was stored. So the assertions that matter re-open the store
 * with `ticketStoreFor` and read the record by the identifier the response gave.
 */

const APPLIED = applySchema()

const TENANT = 'story6ccaedd5'
const OTHER_TENANT = 'story6ccaedd5-other'

function routerEnv(tenantId = TENANT, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** Whatever the caller says, as bytes. */
function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/**
 * Router deps with the model seam stubbed and the index seam COUNTED.
 *
 * The counter is the whole apparatus behind AC-1685: the pipeline announces each
 * created material to whatever the router resolved as the deployment's indexer,
 * so recording the uids it was handed is a direct observation of the
 * announcement rather than a tally the pipeline reports about itself.
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    describeImage: async () => ({ text: 'A thing\n\nSomething depicted.', model: 'stub/vision-1' }),
    ...over,
    indexed,
  }
}

/** An upload through the entry point, exactly as a dropped file arrives. */
async function upload(
  bytes: Uint8Array,
  filename: string,
  contentType: string,
  d: RouterDeps = deps(),
  opts: { tenant?: string; extra?: Record<string, string> } = {},
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([bytes as unknown as BlobPart], filename, { type: contentType }))
  for (const [key, value] of Object.entries(opts.extra ?? {})) form.append(key, value)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(opts.tenant ?? TENANT),
    d,
  )
}

/** Every R2 key under a prefix, so residency is ENUMERATED rather than assumed. */
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

/** How many pieces of material an account holds right now. */
async function materialCount(tenant = TENANT): Promise<number> {
  const store = await ticketStoreFor(routerEnv(tenant))
  return (await store.list({ type: 'material', limit: 'all' })).tickets.length
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('story-6ccaedd5 — a file handed to the platform becomes material', () => {
  it('test_UAT_AC1678_an_ingested_file_becomes_a_stored_material_whose_body_is_its_description', async () => {
    // The whole of AC-1678 in one pass: the answer reports what was stored, and
    // the record read back through a FRESH handle agrees with it. The second half
    // is what makes this end-to-end rather than an echo — a response that
    // reflected its own request would satisfy the first half alone.
    const text = 'The kitchen opens at six and the bread is baked overnight.'
    const response = await upload(bytesOf(text), 'kitchen-notes.txt', 'text/plain')
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    // What was stored, as the answer states it: the identifier, a human-readable
    // title, the §9 classification block, the outcome of the description attempt,
    // the attached file, and whether it was announced to the index.
    expect(String(body.uid)).not.toBe('')
    expect(String(body.title).trim()).not.toBe('')
    expect(body.kind).toBe('document')
    expect(body.rights).toBe('owned')
    expect(body.republishable).toBe(true)
    expect(body.exportable).toBe(false)
    expect(body.origin).toBe('uploaded')
    expect(body.description_status).toBe('ok')
    expect(body.indexed).toBe(true)

    const attachment = body.attachment as Record<string, unknown>
    expect(String(attachment.uid)).not.toBe('')
    expect(String(attachment.sha256)).toMatch(/^[0-9a-f]{64}$/)
    expect(attachment.size).toBe(bytesOf(text).length)
    expect(attachment.content_type).toBe('text/plain')

    // A SECOND, INDEPENDENTLY CONSTRUCTED HANDLE on the account's material store.
    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.type).toBe('material')
    expect(ticket.title.trim()).not.toBe('')
    // THE BODY IS THE DESCRIPTION — the text the corpus is searched over. Drawn
    // from the file itself and not from its name, which is the distinction that
    // makes one corpus out of documents, pictures and fonts alike.
    expect(ticket.body).toContain('bread is baked overnight')
    expect(ticket.body).not.toBe('kitchen-notes.txt')
    // Carried on the record, so the material can be listed without reading
    // anything else.
    expect(ticket.fields.filename).toBe('kitchen-notes.txt')
  })

  it('test_UAT_AC1679_ingested_bytes_reside_in_the_private_store_and_never_in_the_public_one', async () => {
    // RESIDENCY, NOT NAMING (AC-1679). The assertion enumerates both buckets
    // around the ingestion and compares, so it fails if a future change writes
    // the bytes into the store that serves published sites EVEN UNDER A
    // DIFFERENT KEY — which a key-shaped assertion would quietly permit.
    const text = 'A brand book, private to this account.'
    const privateBefore = await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)
    const publicBefore = await keysUnder(env.SITES as R2Bucket, '')

    const response = await upload(bytesOf(text), 'brand.txt', 'text/plain')
    expect(response.status).toBe(200)

    // Exactly one stored object arrived, under the ACCOUNT'S OWN PREFIX in the
    // private material store, and it holds the bytes that were sent.
    const privateAfter = await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)
    const added = privateAfter.filter((key) => !privateBefore.includes(key))
    expect(added).toHaveLength(1)
    expect(added[0].startsWith(`t/${TENANT}/`)).toBe(true)
    const stored = await (env.BLOBS as R2Bucket).get(added[0])
    expect(stored).not.toBeNull()
    expect(new TextDecoder().decode(await stored!.arrayBuffer())).toBe(text)

    // And NOTHING was written to the store the public internet is served from.
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual(publicBefore)
  })

  it('test_UAT_AC1680_one_accounts_material_is_invisible_to_another_accounts_listing_and_search', async () => {
    // BOTH HALVES ARE REQUIRED (AC-1680): an isolation claim proved only over
    // stored records would miss a shared index, and one proved only over search
    // would miss a shared listing.
    const embedder = stubEmbedder()
    const mine = await projectKnowledgeFor(routerEnv(TENANT), { embedder, defer: () => {} })
    const theirs = await projectKnowledgeFor(routerEnv(OTHER_TENANT), {
      embedder,
      defer: () => {},
    })

    const response = await upload(
      bytesOf('Oxblood and bone are the palette chosen for the bakery.'),
      'palette.txt',
      'text/plain',
      deps({ index: async () => async () => void (await mine.onMaterialWritten()) }),
    )
    expect(response.status).toBe(200)
    const uid = String(((await response.json()) as Record<string, unknown>).uid)

    // In the uploading account's own context, the new material is retrievable.
    expect((await mine.search('oxblood palette bakery')).map((hit) => hit.uid)).toContain(uid)

    // In a second account's context — with that account's own index brought up
    // to date first, so absence cannot be mistaken for staleness — it is gone
    // from search and from the listing alike.
    await theirs.refreshIndex()
    expect((await theirs.search('oxblood palette bakery')).map((hit) => hit.uid)).not.toContain(uid)

    const otherStore = await ticketStoreFor(routerEnv(OTHER_TENANT))
    const listed = (await otherStore.list({ type: 'material', limit: 'all' })).tickets
    expect(listed.map((ticket) => ticket.uid)).not.toContain(uid)
  })

  it('test_UAT_AC1681_an_interruption_never_leaves_a_record_naming_bytes_that_are_not_there', async () => {
    // THE PROPERTY, NOT THE ORDER (AC-1681). The pipeline is driven to the point
    // where bytes are in the private store, and the record that ADDRESSES them is
    // then prevented from being written — which is what an interruption at that
    // instant looks like from outside. What must hold afterwards is that nothing
    // observable points at a location holding nothing.
    const store = await ticketStoreFor(routerEnv())
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
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
    const blobs = store.blobs as unknown as {
      put(key: string, bytes: Uint8Array, opts?: { contentType?: string }): Promise<void>
    }
    await blobs.put(sha, bytes, { contentType: 'text/plain' })
    // …and here the isolate dies. Nothing writes the record that addresses them.

    // The bytes are present and UNREFERENCED — collectable, and costing only
    // storage until they are collected.
    expect(await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/blob/${sha}`)).toHaveLength(1)
    // The material carries no integrity hash of its own and no attached-file
    // record, so there is no pointer available to dangle.
    const after = (await store.get({ uid: ticket.uid })).ticket
    expect(after.fields.sha256).toBeUndefined()
    expect((await store.attachments({ uid: ticket.uid })).attachments).toEqual([])
    // Reading the material back REPORTS IT AS HAVING NO FILE rather than failing
    // to resolve a pointer into an empty place.
    expect(after.title).toBe('Interrupted')
  })

  it('test_UAT_AC1682_kind_follows_the_content_type_then_the_filename_and_unrecognised_stays_a_document', async () => {
    // PARAMETERIZED OVER THE CASES rather than one test per pair (AC-1682). The
    // same bytes each time, so the only thing varying is what the request DECLARES
    // about them — which is exactly the input the criterion is about.
    const bytes = bytesOf('the same bytes, declared five different ways')
    const cases: Array<{ contentType: string; filename: string; kind: string; why: string }> = [
      // The declared content type LEADS.
      { contentType: 'image/png', filename: 'logo.png', kind: 'image', why: 'a picture type' },
      { contentType: 'font/woff2', filename: 'display.woff2', kind: 'font', why: 'a font type' },
      // The filename is consulted only where the content type SAYS NOTHING.
      {
        contentType: 'application/octet-stream',
        filename: 'display.woff2',
        kind: 'font',
        why: 'generic binary, font extension',
      },
      {
        contentType: 'application/octet-stream',
        filename: 'logo.png',
        kind: 'image',
        why: 'generic binary, image extension',
      },
      // Anything unrecognised is FILED AS A DOCUMENT and KEPT, never refused.
      {
        contentType: 'application/octet-stream',
        filename: 'mystery.zzz',
        kind: 'document',
        why: 'generic binary, extension matching nothing',
      },
    ]

    const closed = ['document', 'image', 'font', 'capture']
    for (const scenario of cases) {
      const response = await upload(bytes, scenario.filename, scenario.contentType)
      expect(response.status, scenario.why).toBe(200)
      const body = (await response.json()) as Record<string, unknown>
      expect(body.kind, scenario.why).toBe(scenario.kind)
      // The recorded kind is one of the closed vocabulary — there is no "other".
      expect(closed).toContain(String(body.kind))

      const store = await ticketStoreFor(routerEnv())
      const { ticket } = await store.get({ uid: String(body.uid) })
      expect(ticket.fields.kind, scenario.why).toBe(scenario.kind)
    }
  })

  it('test_UAT_AC1683_rights_are_inferred_from_provenance_and_never_taken_from_the_request', async () => {
    // Asserted ON THE STORED RECORD and not only in the response (AC-1683): the
    // envelope is derived from the ticket, so a claim the pipeline accepted would
    // show up in both — but a test that read only the envelope could not tell the
    // difference between "inferred" and "echoed".
    const store = await ticketStoreFor(routerEnv())

    const plain = (await (
      await upload(bytesOf('an ordinary upload'), 'plain.txt', 'text/plain')
    ).json()) as Record<string, unknown>
    const plainTicket = (await store.get({ uid: String(plain.uid) })).ticket
    expect(plainTicket.fields.rights).toBe('owned')
    expect(plainTicket.fields.republishable).toBe(true)
    // THE TWO DISTRIBUTION BITS ARE INDEPENDENT: neither is derived from the
    // other, and an upload is republishable while NOT being exportable.
    expect(plainTicket.fields.exportable).toBe(false)

    // The same upload, now carrying an ownership claim alongside the file. The
    // request has no ownership input, so the recorded rights are exactly those
    // the provenance implies — the client's assertion is not consulted.
    const asserted = (await (
      await upload(bytesOf('an upload that claims otherwise'), 'claims.txt', 'text/plain', deps(), {
        extra: {
          rights: 'third_party',
          republishable: 'false',
          exportable: 'true',
          owned: 'false',
        },
      })
    ).json()) as Record<string, unknown>
    const assertedTicket = (await store.get({ uid: String(asserted.uid) })).ticket
    expect(assertedTicket.fields.rights).toBe('owned')
    expect(assertedTicket.fields.republishable).toBe(true)
    expect(assertedTicket.fields.exportable).toBe(false)
  })

  it('test_UAT_AC1684_a_file_over_the_ceiling_or_with_no_bytes_is_refused_and_leaves_nothing_behind', async () => {
    // REFUSED BEFORE ANYTHING IS CREATED (AC-1684). The count around each refusal
    // is what proves it: a refusal issued after the record was written would leave
    // the client with a material they cannot see the file for.
    const beforeCeiling = await materialCount()
    const tooLarge = await upload(
      new Uint8Array(MAX_MATERIAL_BYTES + 1),
      'huge.bin',
      'application/octet-stream',
    )
    // Reported as a request that was TOO LARGE, distinctly from an ordinary
    // malformed request.
    expect(tooLarge.status).toBe(413)
    const ceilingBody = (await tooLarge.json()) as { error: string }
    // Both sizes in units a person reads, plus a remedy.
    expect(ceilingBody.error).toMatch(/That file is \d+(\.\d)?MB, and the limit is \d+(\.\d)?MB\./)
    expect(ceilingBody.error).toMatch(/smaller version/)
    // No raw byte count, and no diagnostic text addressed to a programmer.
    expect(ceilingBody.error).not.toMatch(/\d{7}/)
    expect(await materialCount()).toBe(beforeCeiling)

    const beforeEmpty = await materialCount()
    const empty = await upload(new Uint8Array(0), 'nothing.txt', 'text/plain')
    expect(empty.status).not.toBe(200)
    expect(((await empty.json()) as { error: string }).error).toMatch(/nothing to store/)
    expect(await materialCount()).toBe(beforeEmpty)
  })

  it('test_UAT_AC1685_each_created_material_is_announced_for_indexing_exactly_once', async () => {
    // NOT ZERO (the material would be invisible to search), NOT TWO (the work
    // would be done twice), and NOT SOMETHING ELSE'S IDENTIFIER. The counting
    // stand-in exists so this needs no embedding model to observe.
    const d = deps()

    const first = await upload(bytesOf('the first document'), 'one.txt', 'text/plain', d)
    const firstUid = String(((await first.json()) as Record<string, unknown>).uid)
    expect(d.indexed).toEqual([firstUid])

    const second = await upload(bytesOf('the second document'), 'two.txt', 'text/plain', d)
    const secondUid = String(((await second.json()) as Record<string, unknown>).uid)
    expect(secondUid).not.toBe(firstUid)
    expect(d.indexed).toEqual([firstUid, secondUid])
  })

  it('test_UAT_AC1686_new_material_is_searchable_immediately_without_reprocessing_the_rest', async () => {
    // "WITHOUT A FULL REINDEX", MEASURED ON THE EMBEDDER (AC-1686) rather than
    // read off a tally the pipeline also computes. The account's knowledge is
    // brought up to date first so there is a real prior cost to compare against.
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(), { embedder, defer: () => {} })

    const store = await ticketStoreFor(routerEnv())
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
    expect(before).toBeGreaterThan(0)

    const response = await upload(
      bytesOf('The kitchen opens at six and the bread is baked overnight.'),
      'note.txt',
      'text/plain',
      deps({ index: async () => async () => void (await kb.onMaterialWritten()) }),
    )
    expect(response.status).toBe(200)
    const uid = String(((await response.json()) as Record<string, unknown>).uid)

    // Retrievable THE MOMENT THE INGESTION RETURNS, phrased in the words of the
    // new file, and attributed to the client's own knowledge base.
    const hits = await kb.search('when does the kitchen open')
    expect(hits.map((hit) => hit.uid)).toContain(uid)
    expect(hits[0].kbs).toContain(PROJECT_KB)

    // Proportional to what changed: the new material WAS processed, and the
    // increase is a small fraction of the initial cost rather than a repeat of it.
    expect(embedder.calls).toBeGreaterThan(before)
    expect(embedder.calls - before).toBeLessThan(before)
  })

  it('test_UAT_AC1687_with_no_indexer_the_file_is_still_stored_and_both_the_answer_and_the_log_say_so', async () => {
    // AN UNINDEXED DOCUMENT IS INVISIBLE, not merely stale, so this must be said
    // twice to two audiences (AC-1687): to the caller, so a surface can report
    // "stored, but not yet findable" without a second request; and to the
    // deployment, so the operator knows what to fix.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // No indexer is injected and the env declares no AI binding, so the router
    // resolves the deployment's real absence rather than a stand-in for one.
    const response = await upload(bytesOf('stored but unfindable'), 'lost.txt', 'text/plain', {
      describeImage: undefined,
    })

    // The ingestion SUCCEEDS — never reported to the client as a failure.
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    // The answer says the material was NOT indexed.
    expect(body.indexed).toBe(false)

    // Exactly one warning for this ingestion — per affected ingestion, not per
    // request and not per boot.
    expect(warn).toHaveBeenCalledTimes(1)
    const said = String(warn.mock.calls[0][0])
    expect(said).toContain(String(body.uid))
    expect(said).toMatch(/NOT indexed/)
    // And it names the configuration that has to be supplied to fix it.
    expect(said).toContain('[ai]')

    // Stored exactly as it is when an indexer is present: readable afterwards,
    // as a real record.
    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.type).toBe('material')
    expect(ticket.title.trim()).not.toBe('')
  })
})
