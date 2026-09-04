import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import {
  MAX_MATERIAL_BYTES,
  MaterialRejectedError,
  NotRepublishableError,
  promoteToSiteAsset,
} from '../apps/control-app/src/material'
import { MAX_REDIRECTS } from '../apps/control-app/src/fetch-guard'
import { storeFor } from '../apps/control-app/src/store'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf, minimalPdf } from './support/material-fixtures'

/**
 * story-70a922b9 — **ingestion: bytes in, a kept and findable record out**.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim below is made through `route()` — the
 * Worker's own route table, the same one the deployed Worker serves — against a
 * real D1 database and two real object stores supplied by
 * `@cloudflare/vitest-pool-workers`. The two entry points this story owns are
 * `POST /api/material` (a file the client hands over) and
 * `POST /api/material/fetch` (an address we retrieve on their behalf); the
 * reading surfaces used to check what landed are `/api/material/item` and
 * `/api/material/file`, which are the same ones the Library uses. Nothing here
 * reimplements a pipeline step in order to assert it, and the ceiling is the
 * component's own `MAX_MATERIAL_BYTES` rather than a second opinion about it.
 *
 * THE DOUBLES, AND WHY EACH IS A TRUE BOUNDARY:
 *
 *   - **the network**, for every retrieval claim. The claims are about which
 *     addresses are *refused* and which are *never requested*; a test that stood
 *     up a redirecting server to make them would be testing the server. The
 *     stand-in records every address asked for, which is what turns "refused"
 *     into the load-bearing "never reached".
 *   - **the embedder**, for the findability claim. Miniflare has no local
 *     Workers AI, and none of these claims is about embedding quality
 *     (`tests/support/stub-embedder.ts` argues this at length).
 *   - **the index seam**, where a claim is about *how often* it is called. The
 *     router injects it for exactly this reason.
 *
 * Everything else is real: real PDF bytes parsed by the real `unpdf`, the real
 * ticket store writing real rows, real R2 objects counted by listing the bucket.
 */

const TENANT = 'story-70a922b9'

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** Router deps with the index seam counted. The describer is left absent. */
function countingDeps(over: Partial<RouterDeps> = {}): RouterDeps & { indexed: string[] } {
  const indexed: string[] = []
  return {
    index: async () => async (uid: string) => {
      indexed.push(uid)
    },
    ...over,
    indexed,
  }
}

/** POST a file to the upload entry point, exactly as a browser would. */
async function upload(
  file: {
    bytes: Uint8Array
    filename: string
    /** Omitted entirely where the test is about a file with no declared type. */
    contentType?: string
    /** Extra form fields, for the "a caller cannot assert its way in" claims. */
    extra?: Record<string, string>
  },
  deps: RouterDeps = countingDeps(),
  envOver: Partial<RouterEnv> = {},
): Promise<Response> {
  const form = new FormData()
  const part =
    file.contentType === undefined
      ? new File([file.bytes as unknown as BlobPart], file.filename)
      : new File([file.bytes as unknown as BlobPart], file.filename, { type: file.contentType })
  form.append('file', part)
  for (const [key, value] of Object.entries(file.extra ?? {})) form.append(key, value)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(envOver),
    deps,
  )
}

/** POST an address to the retrieval entry point. */
async function retrieve(
  body: Record<string, unknown>,
  deps: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/fetch', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    routerEnv(envOver),
    deps,
  )
}

/** The Library's own read surfaces, so what landed is read the way a client reads it. */
async function readItem(uid: string): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
    routerEnv(),
    countingDeps(),
  )
}

async function readFile(uid: string): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material/file?uid=${encodeURIComponent(uid)}`),
    routerEnv(),
    countingDeps(),
  )
}

const bodyOf = async (response: Response): Promise<Record<string, unknown>> =>
  (await response.json()) as Record<string, unknown>

/** Every material the account holds — the "nothing was left behind" measure. */
async function allMaterial(store: TicketStore): Promise<Ticket[]> {
  const pages = await Promise.all(
    ['material', 'reference'].map((type) => store.list({ type, limit: 'all' })),
  )
  return pages.flatMap((page) => page.tickets)
}

/** Every object the account holds — the second half of "nothing was left behind". */
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

/**
 * Does this refusal name the address that was refused?
 *
 * Either in the sentence itself or in the envelope's own `url` field — both are
 * the refusal naming the address, and which one carries it is a detail of the
 * error's shape rather than of what the client is told.
 */
function namesAddress(payload: Record<string, unknown>, address: string): boolean {
  return String(payload.url ?? '') === address || String(payload.error ?? '').includes(address)
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── AC-1536: a handed-over file, and the answer that describes it ────────────

describe('story-70a922b9 — a file the client hands the platform', () => {
  it('test_UAT_AC1536_a_handed_over_file_is_kept_as_a_described_record_and_the_same_request_says_what_was_created', async () => {
    const bytes = minimalPdf('The kitchen opens at six and the bread is baked overnight.')
    const response = await upload({
      bytes,
      filename: 'guidelines.pdf',
      contentType: 'application/pdf',
    })
    expect(response.status).toBe(200)
    const created = await bodyOf(response)

    // ── the account of what was created, in the SAME request ────────────────
    // Sufficient for the surface that sent the file to draw the result without
    // asking a second question: identity, kind, the rights block, provenance,
    // the state of the description, and the stored file's size and type.
    expect(String(created.uid)).not.toBe('')
    expect(created.title).toBe('Brand guidelines')
    expect(created.kind).toBe('document')
    expect(created.rights).toBe('owned')
    expect(created.republishable).toBe(true)
    expect(created.exportable).toBe(false)
    expect(created.origin).toBe('uploaded')
    expect(created.description_status).toBe('ok')
    const attachment = created.attachment as Record<string, unknown>
    expect(attachment.size).toBe(bytes.byteLength)
    expect(attachment.content_type).toBe('application/pdf')

    // ── read back through the ordinary material-reading surface ─────────────
    // Not from the envelope the upload returned: that would only prove the
    // pipeline can describe its own output.
    const item = await bodyOf(await readItem(String(created.uid)))
    expect(item.title).toBe('Brand guidelines')
    expect(item.filename).toBe('guidelines.pdf')
    expect(item.kind).toBe('document')
    expect(item.origin).toBe('uploaded')
    expect(item.rights).toBe('owned')

    // The body is prose ABOUT THE CONTENTS — the words a client would search
    // by — rather than a restatement of the filename. This is the difference
    // between a findable record and a row in a filing cabinet.
    const body = String(item.body)
    expect(body).toContain('kitchen')
    expect(body).toContain('bread')
    expect(body).not.toBe('guidelines.pdf')

    // ── and the bytes come back byte-identical through that same record ─────
    const file = await readFile(String(created.uid))
    expect(file.status).toBe(200)
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes)

    // ── nothing is required beyond the bytes, the name and the declared type,
    //    and the declared type itself is optional ────────────────────────────
    const plain = bytesOf('A note handed over with no declared type at all.')
    const bare = await upload({ bytes: plain, filename: 'note' })
    expect(bare.status).toBe(200)
    const bareCreated = await bodyOf(bare)
    const bareFile = await readFile(String(bareCreated.uid))
    expect(bareFile.status).toBe(200)
    expect(new Uint8Array(await bareFile.arrayBuffer())).toEqual(plain)
  })
})

// ── AC-1537: retrieval, recorded against the address it finally came from ────

describe('story-70a922b9 — material retrieved on the client’s behalf', () => {
  it('test_UAT_AC1537_retrieved_material_is_recorded_against_the_address_the_bytes_finally_came_from', async () => {
    const store = await ticketStoreFor(routerEnv())
    const report = 'An industry report about bakeries and their opening hours.'

    // ── a permitted address, retrieved through the same pipeline ────────────
    const direct: typeof fetch = async () =>
      new Response(report, { status: 200, headers: { 'content-type': 'text/plain' } })
    const first = await retrieve(
      { url: 'https://example.com/report.txt' },
      { ...countingDeps(), fetch: direct },
    )
    expect(first.status).toBe(200)
    const created = await bodyOf(first)
    expect(created.origin).toBe('fetched')
    expect(created.source_url).toBe('https://example.com/report.txt')
    // Same record shape as an upload: a title, a described body, an attachment.
    expect(String(created.title)).not.toBe('')
    expect(created.description_status).toBe('ok')
    // The name is derived from the address rather than asked for.
    expect(String((await bodyOf(await readItem(String(created.uid)))).filename)).toBe('report.txt')
    const bytes = await readFile(String(created.uid))
    expect(new TextDecoder().decode(await bytes.arrayBuffer())).toBe(report)

    // ── redirected once: the recorded address is the SECOND one ─────────────
    // A `source_url` naming an address we were redirected AWAY from would be a
    // provenance record that is quietly wrong.
    const redirecting: typeof fetch = async (input) =>
      String(input) === 'https://example.com/a'
        ? new Response(null, {
            status: 301,
            headers: { location: 'https://example.com/final/report.txt' },
          })
        : new Response(report, { status: 200, headers: { 'content-type': 'text/plain' } })
    const second = await bodyOf(
      await retrieve({ url: 'https://example.com/a' }, { ...countingDeps(), fetch: redirecting }),
    )
    expect(second.source_url).toBe('https://example.com/final/report.txt')
    expect(second.source_url).not.toBe('https://example.com/a')

    // ── an address that returns nothing to store creates no material ────────
    const before = (await allMaterial(store)).length

    const emptyAddress = 'https://example.com/empty.txt'
    const empty: typeof fetch = async () =>
      new Response('', { status: 200, headers: { 'content-type': 'text/plain' } })
    const emptyResponse = await retrieve(
      { url: emptyAddress },
      { ...countingDeps(), fetch: empty },
    )
    expect(emptyResponse.status).toBe(400)
    const emptyPayload = await bodyOf(emptyResponse)
    expect(String(emptyPayload.error)).toMatch(/nothing to store/i)
    expect(namesAddress(emptyPayload, emptyAddress), JSON.stringify(emptyPayload)).toBe(true)

    const missingAddress = 'https://example.com/gone.txt'
    const missing: typeof fetch = async () => new Response('nope', { status: 404 })
    const missingResponse = await retrieve(
      { url: missingAddress },
      { ...countingDeps(), fetch: missing },
    )
    expect(missingResponse.status).toBe(400)
    const missingPayload = await bodyOf(missingResponse)
    expect(namesAddress(missingPayload, missingAddress), JSON.stringify(missingPayload)).toBe(true)

    expect((await allMaterial(store)).length).toBe(before)
  })
})

// ── AC-1538: the rights block comes from provenance, never from the caller ───

describe('story-70a922b9 — what may be done with a file', () => {
  it('test_UAT_AC1538_the_rights_block_is_decided_from_provenance_and_no_caller_can_widen_it', async () => {
    const store = await ticketStoreFor(routerEnv())

    // ── an upload: the client's own, publishable, and it must not leave ─────
    const uploaded = await bodyOf(
      await upload({ bytes: bytesOf('our own price list'), filename: 'prices.txt', contentType: 'text/plain' }),
    )
    expect(uploaded.rights).toBe('owned')
    expect(uploaded.republishable).toBe(true)
    expect(uploaded.exportable).toBe(false)

    // All three are PRESENT on the record rather than absent-and-assumed: a
    // predicate over them never has to reason about absence as a third state.
    const uploadedTicket = (await store.get({ uid: String(uploaded.uid) })).ticket
    expect(uploadedTicket.fields).toHaveProperty('rights', 'owned')
    expect(uploadedTicket.fields).toHaveProperty('republishable', true)
    expect(uploadedTicket.fields).toHaveProperty('exportable', false)

    // ── a retrieval: third-party, NOT publishable, and it may leave ─────────
    // The two permissions INVERT with provenance, which is why neither can be
    // derived from the other or from `rights`.
    const fetcher: typeof fetch = async () =>
      new Response('someone else’s industry report', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    const fetched = await bodyOf(
      await retrieve({ url: 'https://example.com/theirs.txt' }, { ...countingDeps(), fetch: fetcher }),
    )
    expect(fetched.rights).toBe('third_party')
    expect(fetched.republishable).toBe(false)
    expect(fetched.exportable).toBe(true)
    const fetchedTicket = (await store.get({ uid: String(fetched.uid) })).ticket
    expect(fetchedTicket.fields).toHaveProperty('rights', 'third_party')
    expect(fetchedTicket.fields).toHaveProperty('republishable', false)
    expect(fetchedTicket.fields).toHaveProperty('exportable', true)

    // ── and nothing a caller supplies is honoured ───────────────────────────
    // The dangerous direction is `republishable`: a caller that could assert it
    // would be one plausible tool call from publishing someone else's copyright
    // under the client's own domain.
    const assertedUpload = await bodyOf(
      await upload({
        bytes: bytesOf('an upload with opinions attached'),
        filename: 'opinions.txt',
        contentType: 'text/plain',
        extra: { rights: 'third_party', republishable: 'false', exportable: 'true' },
      }),
    )
    expect(assertedUpload.rights).toBe('owned')
    expect(assertedUpload.republishable).toBe(true)
    expect(assertedUpload.exportable).toBe(false)

    const assertedFetch = await bodyOf(
      await retrieve(
        {
          url: 'https://example.com/theirs.txt',
          rights: 'owned',
          republishable: true,
          exportable: false,
        },
        { ...countingDeps(), fetch: fetcher },
      ),
    )
    expect(assertedFetch.rights).toBe('third_party')
    expect(assertedFetch.republishable).toBe(false)
    expect(assertedFetch.exportable).toBe(true)
  })
})

// ── AC-1539: what kind of thing a file is ────────────────────────────────────

describe('story-70a922b9 — what kind of thing a file is', () => {
  it('test_UAT_AC1539_kind_comes_from_the_declared_type_with_the_name_as_a_fallback_and_nothing_is_refused', async () => {
    // ── the declared type leads ─────────────────────────────────────────────
    const declared: Array<[string, string, string]> = [
      ['image/png', 'kitchen.png', 'image'],
      ['font/woff2', 'satoshi.woff2', 'font'],
      ['application/pdf', 'guidelines.pdf', 'document'],
      ['application/octet-stream', 'payload', 'document'],
    ]
    for (const [contentType, filename, kind] of declared) {
      const created = await bodyOf(
        await upload({ bytes: minimalPdf('some bytes'), filename, contentType }),
      )
      expect(created.kind, `${contentType} → ${kind}`).toBe(kind)
    }

    // ── and where it says nothing, the file's own name decides ──────────────
    // A `.woff2` served as a generic binary is common enough that ignoring the
    // name would misfile most fonts.
    const byName: Array<[string, string]> = [
      ['satoshi-400.woff2', 'font'],
      ['heading.ttf', 'font'],
      ['hero.jpg', 'image'],
      ['logo.svg', 'image'],
    ]
    for (const [filename, kind] of byName) {
      const created = await bodyOf(
        await upload({ bytes: bytesOf('generic bytes'), filename, contentType: 'application/octet-stream' }),
      )
      expect(created.kind, `${filename} → ${kind}`).toBe(kind)
    }

    // ── anything unrecognised is STORED as a document, never refused ────────
    // The trade this pipeline makes everywhere else: an honest "we could not
    // read this" costs less than losing the client's file.
    const bytes = bytesOf('a proprietary format nothing here can read')
    const response = await upload({
      bytes,
      filename: 'ledger.zzz',
      contentType: 'application/vnd.acme-ledger',
    })
    expect(response.status).toBe(200)
    const created = await bodyOf(response)
    expect(created.kind).toBe('document')
    const readBack = await readFile(String(created.uid))
    expect(readBack.status).toBe(200)
    expect(new Uint8Array(await readBack.arrayBuffer())).toEqual(bytes)

    // ── and the decision is the same for the other entry point ─────────────
    const fetcher: typeof fetch = async () =>
      new Response(bytes as unknown as BodyInit, {
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
      })
    const retrieved = await bodyOf(
      await retrieve({ url: 'https://example.com/brand.woff2' }, { ...countingDeps(), fetch: fetcher }),
    )
    expect(retrieved.kind).toBe('font')
  })
})

// ── AC-1540: offered to search exactly once, findable immediately ────────────

describe('story-70a922b9 — every created material reaches the index', () => {
  it('test_UAT_AC1540_every_created_material_is_offered_to_search_exactly_once_and_is_findable_the_moment_the_request_returns', async () => {
    // ── exactly once, naming the material, per created record ───────────────
    const deps = countingDeps()
    const first = await bodyOf(
      await upload({ bytes: bytesOf('one document'), filename: 'one.txt', contentType: 'text/plain' }, deps),
    )
    expect(deps.indexed).toEqual([String(first.uid)])

    const second = await bodyOf(
      await upload({ bytes: bytesOf('two documents'), filename: 'two.txt', contentType: 'text/plain' }, deps),
    )
    const third = await bodyOf(
      await upload({ bytes: bytesOf('three documents'), filename: 'three.txt', contentType: 'text/plain' }, deps),
    )
    // Never zero, never twice: one offer per created record, in order.
    expect(deps.indexed).toEqual([String(first.uid), String(second.uid), String(third.uid)])

    // ── and the consequence: findable the moment the request returns ────────
    // Against an account whose knowledge ALREADY holds a document, so that the
    // second half of the claim — the arrival of a new file does not re-read the
    // rest of the corpus — is observable at all.
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

    const distinctive = 'Oxblood and bone are the palette for the bakery.'
    const created = await bodyOf(
      await upload(
        { bytes: bytesOf(distinctive), filename: 'palette.txt', contentType: 'text/plain' },
        countingDeps({
          index: async () => async () => {
            // The index refresh is AWAITED — that is the half this claim is
            // about. The awareness-map rebuild it starts behind itself is
            // deferred and needs a `describe` seam a Worker has no reason to
            // supply, so its rejection is absorbed here rather than surfacing
            // as an unhandled one that would fail a sibling test.
            const { rebuild } = await kb.onMaterialWritten()
            rebuild.catch(() => {})
          },
        }),
      ),
    )

    // NO SECOND CALL, no scheduled pass, no waiting — searched immediately.
    const hits = await kb.search('what is the oxblood bakery palette')
    expect(hits.map((hit) => hit.uid)).toContain(String(created.uid))

    // Incremental: the arrival embedded the new material and did NOT recompute
    // the corpus that was already indexed.
    expect(embedder.calls).toBeGreaterThan(before)
    expect(embedder.calls - before).toBeLessThan(before)
  })
})

// ── AC-1541: a deployment that cannot index ──────────────────────────────────

describe('story-70a922b9 — a deployment where nothing can index', () => {
  it('test_UAT_AC1541_an_unindexable_deployment_keeps_the_file_reports_it_unfindable_and_warns_its_operator', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bytes = bytesOf('A file nothing on this deployment can find.')

    // No injected indexer and no AI binding on the env — the real absence,
    // resolved by the router rather than simulated here.
    const response = await upload({ bytes, filename: 'lost.txt', contentType: 'text/plain' }, {})
    expect(response.status).toBe(200)
    const created = await bodyOf(response)

    // ── the failure is INVISIBILITY, not loss ───────────────────────────────
    const item = await readItem(String(created.uid))
    expect(item.status).toBe(200)
    const file = await readFile(String(created.uid))
    expect(file.status).toBe(200)
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes)

    // ── the answer says so, so the surface can say "stored, but nothing has
    //    read it" without a second request ──────────────────────────────────
    expect(created.indexed).toBe(false)

    // ── and it is never silent: the deployment says so, naming the material
    //    and the configuration that is missing ──────────────────────────────
    expect(warn).toHaveBeenCalledTimes(1)
    const said = String(warn.mock.calls[0][0])
    expect(said).toContain(String(created.uid))
    expect(said).toMatch(/NOT indexed/)
    expect(said).toMatch(/\[ai\]/)

    // ── and where indexing IS configured, the same answer says so ───────────
    const indexedResponse = await upload(
      { bytes, filename: 'found.txt', contentType: 'text/plain' },
      countingDeps(),
    )
    expect((await bodyOf(indexedResponse)).indexed).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

// ── AC-1542: a file the platform will not hold ───────────────────────────────

describe('story-70a922b9 — a file the platform will not hold', () => {
  it('test_UAT_AC1542_an_unstorable_file_is_refused_in_words_the_client_can_act_on_and_nothing_is_left_behind', async () => {
    const store = await ticketStoreFor(routerEnv())
    const materialBefore = (await allMaterial(store)).length
    const objectsBefore = (await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)).length

    // ── one byte over the stated ceiling ────────────────────────────────────
    const tooBig = await upload({
      bytes: new Uint8Array(MAX_MATERIAL_BYTES + 1),
      filename: 'brandbook.pdf',
      contentType: 'application/pdf',
    })
    // 413 and NOT 400: the calling surface has to be able to say "try a smaller
    // file" rather than "something about your request was wrong".
    expect(tooBig.status).toBe(413)
    const tooBigPayload = await bodyOf(tooBig)
    expect(String(tooBigPayload.error)).toMatch(/That file is 25MB, and the limit is 25MB\./)
    expect(String(tooBigPayload.error)).toMatch(/smaller version/)
    // Addressed to the person who dragged the file, not to a programmer: no raw
    // byte counts, no stack.
    expect(String(tooBigPayload.error)).not.toMatch(/\d{7}/)

    // ── zero bytes: a plain statement that there is nothing to store ────────
    const emptyFile = await upload({
      bytes: new Uint8Array(0),
      filename: 'empty.txt',
      contentType: 'text/plain',
    })
    expect(emptyFile.status).toBe(400)
    expect(emptyFile.status).not.toBe(413)
    expect(String((await bodyOf(emptyFile)).error)).toMatch(/nothing to store/i)

    // ── and an address that returns an empty document, likewise ─────────────
    const empty: typeof fetch = async () =>
      new Response('', { status: 200, headers: { 'content-type': 'text/plain' } })
    const emptyFetch = await retrieve(
      { url: 'https://example.com/nothing.txt' },
      { ...countingDeps(), fetch: empty },
    )
    expect(emptyFetch.status).toBe(400)
    expect(String((await bodyOf(emptyFetch)).error)).toMatch(/nothing to store/i)

    // ── nothing was left behind by any of the three ─────────────────────────
    expect((await allMaterial(store)).length).toBe(materialBefore)
    expect((await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/`)).length).toBe(objectsBefore)
  })
})

// ── AC-1543: no record ever names bytes that are not there ───────────────────

/**
 * A ticket store whose `attach` is interrupted, so the ordering claim can be
 * driven at the one point it is about.
 *
 * A DELEGATING WRAPPER RATHER THAN A FAKE: every other operation is the real
 * store's, so the material record below is written by the component's own
 * validator into real D1 — the interruption is the only thing substituted, and
 * it is injected through the router's own `tickets` seam.
 */
function interruptedAt(inner: TicketStore, attach: TicketStore['attach']): TicketStore {
  return {
    create: (a) => inner.create(a),
    get: (a) => inner.get(a),
    resolve_id: (a) => inner.resolve_id(a),
    list: (a) => inner.list(a),
    query: (a) => inner.query(a),
    update: (a) => inner.update(a),
    comment: (a) => inner.comment(a),
    comments: (a) => inner.comments(a),
    attach,
    attachments: (a) => inner.attachments(a),
    blobs: inner.blobs,
  }
}

describe('story-70a922b9 — however an ingestion is interrupted', () => {
  it('test_UAT_AC1543_no_material_ever_names_bytes_that_are_not_there_however_an_ingestion_is_interrupted', async () => {
    const store = await ticketStoreFor(routerEnv())

    // ── interrupted AFTER the record and BEFORE the bytes ───────────────────
    const crashBeforeBlob = interruptedAt(store, async () => {
      throw new Error('the isolate died before the bytes were stored')
    })
    const failed = await upload(
      { bytes: bytesOf('a file whose bytes never landed'), filename: 'interrupted.txt', contentType: 'text/plain' },
      { tickets: async () => crashBeforeBlob, index: async () => async () => {} },
    )
    expect(failed.status).not.toBe(200)

    const stranded = (await allMaterial(store)).find(
      (ticket) => ticket.fields.filename === 'interrupted.txt',
    )
    // ── state one: a record with no file — visible, honest, sweepable ───────
    expect(stranded, 'the material record survives the interruption').toBeTruthy()
    expect((await store.attachments({ uid: stranded!.uid })).attachments).toEqual([])

    // Reading its bytes reports the FILE as absent, not the MATERIAL as unknown:
    // 404 here would tell the client their upload never happened, which is false.
    const noFile = await readFile(stranded!.uid)
    expect(noFile.status).not.toBe(404)
    expect(String((await bodyOf(noFile)).error)).toMatch(/no file attached/i)

    // ── interrupted AFTER the bytes and BEFORE any record names them ────────
    const blobs = store.blobs as unknown as {
      put(key: string, bytes: Uint8Array, opts?: { contentType?: string }): Promise<void>
    }
    const orphanKey = 'orphan-story-70a922b9'
    const crashAfterBlob = interruptedAt(store, async (a) => {
      await blobs.put(orphanKey, a.bytes as Uint8Array, { contentType: 'text/plain' })
      throw new Error('the isolate died after the bytes were stored')
    })
    const alsoFailed = await upload(
      { bytes: bytesOf('bytes nothing names'), filename: 'orphaned.txt', contentType: 'text/plain' },
      { tickets: async () => crashAfterBlob, index: async () => async () => {} },
    )
    expect(alsoFailed.status).not.toBe(200)

    // ── state two: stored bytes that no record names — collectable ──────────
    expect(await keysUnder(env.BLOBS as R2Bucket, `t/${TENANT}/blob/${orphanKey}`)).toEqual([
      `t/${TENANT}/blob/${orphanKey}`,
    ])
    const everyAttachment = (
      await Promise.all(
        (await allMaterial(store)).map(async (ticket) =>
          (await store.attachments({ uid: ticket.uid })).attachments,
        ),
      )
    ).flat()
    expect(everyAttachment.map((a) => a.uid)).not.toContain(orphanKey)

    // ── and never a third state: no record names bytes that are not there ───
    // Swept across every material the account holds, including the two the
    // interruptions above left behind.
    for (const attachment of everyAttachment) {
      expect(
        await store.blobs!.get(attachment.uid),
        `${attachment.uid} names bytes that are not there`,
      ).not.toBeNull()
    }

    // ── and where storage nevertheless loses the bytes, it says THAT ────────
    // The state the ordering makes unconstructible is still reported honestly if
    // it is ever encountered: storage lost the file, not "no such material".
    const intact = await bodyOf(
      await upload({ bytes: bytesOf('bytes a sweep will take'), filename: 'swept.txt', contentType: 'text/plain' }),
    )
    const swept = (await store.attachments({ uid: String(intact.uid) })).attachments[0]
    await (env.BLOBS as R2Bucket).delete(`t/${TENANT}/blob/${swept.uid}`)
    const lost = await readFile(String(intact.uid))
    expect(lost.status).not.toBe(404)
    expect(String((await bodyOf(lost)).error)).toMatch(/no longer in storage/i)
  })
})

// ── AC-1544: only safe public web addresses are retrieved ────────────────────

describe('story-70a922b9 — which addresses may be retrieved at all', () => {
  it('test_UAT_AC1544_only_safe_public_web_addresses_are_retrieved_and_everything_else_is_refused_by_name_before_any_request', async () => {
    const store = await ticketStoreFor(routerEnv())
    const before = (await allMaterial(store)).length
    const seen: string[] = []
    const recording: typeof fetch = async (input) => {
      seen.push(String(input))
      return new Response('this must never be reached', { status: 200 })
    }

    const refused: Array<[string, RegExp]> = [
      // Not a secure web address — refused, never silently upgraded.
      ['http://example.com/report.pdf', /Only https addresses/],
      ['file:///etc/passwd', /Only https addresses/],
      ['data:text/plain;base64,aGVsbG8=', /Only https addresses/],
      // Loopback, by number and by name.
      ['https://127.0.0.1:8788/secrets', /private network/],
      ['https://localhost/secrets', /private network/],
      // Each private range.
      ['https://10.1.2.3/admin', /private network/],
      ['https://172.16.0.1/admin', /private network/],
      ['https://192.168.1.1/admin', /private network/],
      // The link-local range cloud metadata services live on — the reason this
      // rule exists at all.
      ['https://169.254.169.254/latest/meta-data/', /private network/],
      // Carrier-grade NAT.
      ['https://100.64.0.1/', /private network/],
      // The newer address format: loopback, unique-local, link-local…
      ['https://[::1]/secrets', /private network/],
      ['https://[fd00::1]/secrets', /private network/],
      ['https://[fe80::1]/secrets', /private network/],
      // …and the form that embeds an older-format address, which would
      // otherwise smuggle loopback past the check.
      ['https://[::ffff:127.0.0.1]/secrets', /private network/],
      // Conventional internal and local-network zones.
      ['https://db.internal/dump', /private network/],
      ['https://printer.local/', /private network/],
      // And text that is not an address at all.
      ['not a web address at all', /does not look like a web address/],
    ]

    for (const [address, rule] of refused) {
      const response = await retrieve({ url: address }, { ...countingDeps(), fetch: recording })
      // A bad request, not a server failure: it is not a permission the caller
      // could be granted and nothing here went wrong.
      expect(response.status, address).toBe(400)
      const payload = await bodyOf(response)
      expect(String(payload.error), address).toMatch(rule)
      expect(namesAddress(payload, address), `${address} → ${JSON.stringify(payload)}`).toBe(true)
    }

    // THE LOAD-BEARING ASSERTION: no request was made for any of them. A guard
    // that refuses after reaching is a report, not a guard.
    expect(seen).toEqual([])
    expect((await allMaterial(store)).length).toBe(before)
  })
})

// ── AC-1545: every redirect hop is re-checked, and the chain is bounded ──────

describe('story-70a922b9 — where a retrieval is redirected', () => {
  it('test_UAT_AC1545_every_redirect_hop_is_rechecked_before_it_is_followed_and_the_chain_is_bounded', async () => {
    const store = await ticketStoreFor(routerEnv())
    const before = (await allMaterial(store)).length

    // ── a permitted public address that redirects to a refused one ──────────
    const toLoopback: string[] = []
    const redirectsToLoopback: typeof fetch = async (input) => {
      toLoopback.push(String(input))
      return new Response(null, {
        status: 302,
        headers: { location: 'https://169.254.169.254/latest/meta-data/' },
      })
    }
    const hop = await retrieve(
      { url: 'https://example.com/report.pdf' },
      { ...countingDeps(), fetch: redirectsToLoopback },
    )
    expect(hop.status).toBe(400)
    const hopPayload = await bodyOf(hop)
    // The refusal names the address the CALLER asked for — what they recognise.
    expect(hopPayload.url).toBe('https://example.com/report.pdf')
    expect(String(hopPayload.error)).toMatch(/private network/)
    // THE LOAD-BEARING ASSERTION: the refused address was never requested.
    expect(toLoopback).toEqual(['https://example.com/report.pdf'])

    // ── a relative redirect target is resolved against the hop it came from,
    //    and then checked ─────────────────────────────────────────────────────
    const relative: string[] = []
    const redirectsRelatively: typeof fetch = async (input) => {
      relative.push(String(input))
      return new Response(null, {
        status: 302,
        headers: { location: '//169.254.169.254/latest/meta-data/' },
      })
    }
    const resolved = await retrieve(
      { url: 'https://example.com/start' },
      { ...countingDeps(), fetch: redirectsRelatively },
    )
    expect(resolved.status).toBe(400)
    expect(String((await bodyOf(resolved)).error)).toMatch(/private network/)
    expect(relative).toEqual(['https://example.com/start'])

    // ── a redirect that names no destination is refused, saying so ──────────
    const nowhere: typeof fetch = async () => new Response(null, { status: 302 })
    const noLocation = await retrieve(
      { url: 'https://example.com/nowhere' },
      { ...countingDeps(), fetch: nowhere },
    )
    expect(noLocation.status).toBe(400)
    const noLocationPayload = await bodyOf(noLocation)
    expect(String(noLocationPayload.error)).toMatch(/redirected without saying where to/)
    expect(noLocationPayload.url).toBe('https://example.com/nowhere')

    // ── and the chain is bounded rather than followed forever ───────────────
    const loop: string[] = []
    const forever: typeof fetch = async (input) => {
      loop.push(String(input))
      return new Response(null, {
        status: 302,
        headers: { location: `https://example.com/${loop.length}` },
      })
    }
    const bounded = await retrieve(
      { url: 'https://example.com/loop' },
      { ...countingDeps(), fetch: forever },
    )
    expect(bounded.status).toBe(400)
    const boundedPayload = await bodyOf(bounded)
    expect(String(boundedPayload.error)).toMatch(
      new RegExp(`redirected more than ${MAX_REDIRECTS} times`),
    )
    expect(boundedPayload.url).toBe('https://example.com/loop')
    expect(loop.length).toBeLessThanOrEqual(MAX_REDIRECTS + 1)

    // None of the four created any material.
    expect((await allMaterial(store)).length).toBe(before)
  })
})

// ── AC-1546: the ceiling, enforced on the way in ─────────────────────────────

/**
 * A response whose body is streamed chunk by chunk, counting what was pulled.
 *
 * The claim is that reading STOPS rather than draining, so the stand-in has to
 * be able to say how much of itself was actually read — a fixed `Uint8Array`
 * body could not.
 */
function streamingResponse(
  chunkBytes: number,
  chunks: number,
  headers: Record<string, string>,
): { response: () => Response; pulls: () => number; cancelled: () => boolean } {
  let pulls = 0
  let cancelled = false
  const body = new ReadableStream(
    {
      pull(controller) {
        pulls++
        if (pulls > chunks) {
          controller.close()
          return
        }
        controller.enqueue(new Uint8Array(chunkBytes))
      },
      cancel() {
        cancelled = true
      },
    },
    // A HIGH WATER MARK OF ZERO, so `pulls` counts what the GUARD read rather
    // than what the stream primitive pre-fetched. The default strategy fills a
    // one-chunk queue as soon as the stream is constructed, which would make
    // "the body was not read" unobservable — the first chunk would be gone
    // before anything asked for it.
    { highWaterMark: 0 },
  )
  return {
    response: () => new Response(body, { status: 200, headers }),
    pulls: () => pulls,
    cancelled: () => cancelled,
  }
}

describe('story-70a922b9 — a retrieved body over the ceiling', () => {
  it('test_UAT_AC1546_a_retrieved_body_over_the_ceiling_is_refused_as_it_arrives_whatever_the_remote_claimed', async () => {
    const store = await ticketStoreFor(routerEnv())
    const before = (await allMaterial(store)).length

    // ── the remote DECLARES a size above the ceiling ────────────────────────
    // Refused without pulling the body: a cheap refusal that avoids dragging
    // megabytes across the network to discover they are too many.
    const declared = streamingResponse(1024, 8, {
      'content-type': 'text/plain',
      'content-length': String(MAX_MATERIAL_BYTES + 1),
    })
    const onDeclared = await retrieve(
      { url: 'https://example.com/huge.bin' },
      { ...countingDeps(), fetch: async () => declared.response() },
    )
    expect(onDeclared.status).toBe(400)
    expect(String((await bodyOf(onDeclared)).error)).toMatch(/and the limit is 25MB\./)
    expect(declared.pulls(), 'the body was not read').toBe(0)

    // ── the remote UNDERSTATES the size, then sends more ────────────────────
    const CHUNK = 4 * 1024 * 1024
    const PLANNED = 20
    const lying = streamingResponse(CHUNK, PLANNED, {
      'content-type': 'text/plain',
      'content-length': '1024',
    })
    const onLie = await retrieve(
      { url: 'https://example.com/lies.bin' },
      { ...countingDeps(), fetch: async () => lying.response() },
    )
    expect(onLie.status).toBe(400)
    // The same over-the-ceiling message a client gets for a file of their own:
    // the size, the limit, and what to do.
    expect(String((await bodyOf(onLie)).error)).toMatch(
      /That file is \d+(\.\d)?MB, and the limit is 25MB\. Try a smaller version of it\./,
    )
    // Reading STOPPED rather than draining the whole body.
    expect(lying.pulls()).toBeLessThan(PLANNED)
    expect(lying.cancelled()).toBe(true)

    // ── and the remote DECLARES NOTHING, then sends more ────────────────────
    const silent = streamingResponse(CHUNK, PLANNED, { 'content-type': 'text/plain' })
    const onSilence = await retrieve(
      { url: 'https://example.com/silent.bin' },
      { ...countingDeps(), fetch: async () => silent.response() },
    )
    expect(onSilence.status).toBe(400)
    expect(String((await bodyOf(onSilence)).error)).toMatch(/and the limit is 25MB\./)
    expect(silent.pulls()).toBeLessThan(PLANNED)
    expect(silent.cancelled()).toBe(true)

    // No material exists afterwards for any of the three.
    expect((await allMaterial(store)).length).toBe(before)
  })
})

// ── AC-1547: the promotion gate ──────────────────────────────────────────────

describe('story-70a922b9 — material that may not be republished', () => {
  it('test_UAT_AC1547_material_that_may_not_be_republished_can_never_reach_a_sites_asset_library', async () => {
    const tickets = await ticketStoreFor(routerEnv())
    const sites = await storeFor(routerEnv())
    await sites.createDraft('gate')

    // ── a non-republishable piece of material, created the ordinary way ─────
    // Retrieved, not hand-written: the bit the gate reads is one this pipeline
    // wrote from provenance, which is what makes the refusal unconditional.
    const fetcher: typeof fetch = async () =>
      new Response('a photograph from someone else’s site', {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })
    const created = await bodyOf(
      await retrieve(
        { url: 'https://competitor.example/hero.jpg' },
        { ...countingDeps(), fetch: fetcher },
      ),
    )
    expect(created.republishable).toBe(false)

    const assetsBefore = await sites.listAssets('gate')
    const objectsBefore = await keysUnder(env.SITES as R2Bucket, '')

    // ── refused, as a matter of RIGHTS rather than of syntax ────────────────
    const refusal = await promoteToSiteAsset(tickets, sites, {
      uid: String(created.uid),
      slug: 'gate',
      name: 'hero.jpg',
    }).then(
      () => null,
      (err: unknown) => err,
    )
    expect(refusal).toBeInstanceOf(NotRepublishableError)
    // Distinguishable from the malformed-request refusals: the router answers
    // this one 403 and those 400/413, and the classes are what it reads.
    expect(refusal).not.toBeInstanceOf(MaterialRejectedError)
    // It names the material, and reads as an explanation to the client.
    expect((refusal as NotRepublishableError).uid).toBe(String(created.uid))
    const said = (refusal as Error).message
    expect(said).toMatch(/came from somewhere else/)
    expect(said).toMatch(/reference/)

    // ── nothing was written to the site ─────────────────────────────────────
    expect(await sites.listAssets('gate')).toEqual(assetsBefore)
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual(objectsBefore)

    // ── and no argument can talk it round ───────────────────────────────────
    // The decision is read from the material's OWN record; there is no argument
    // by which a caller declares something publishable.
    const asserted = await (
      promoteToSiteAsset as unknown as (
        t: TicketStore,
        s: typeof sites,
        a: Record<string, unknown>,
      ) => Promise<unknown>
    )(tickets, sites, {
      uid: String(created.uid),
      slug: 'gate',
      name: 'hero.jpg',
      republishable: true,
      rights: 'owned',
    }).then(
      () => null,
      (err: unknown) => err,
    )
    expect(asserted).toBeInstanceOf(NotRepublishableError)
    expect(await sites.listAssets('gate')).toEqual(assetsBefore)
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual(objectsBefore)

    // ── material with no file attached is refused SEPARATELY ────────────────
    // "There is nothing to publish" is a different thing to tell a client than
    // "you may not publish this".
    const { ticket: fileless } = await tickets.create({
      type: 'material',
      title: 'A record with nothing attached',
      body: 'Nothing was ever stored for this.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'image',
      },
    })
    const nothing = await promoteToSiteAsset(tickets, sites, {
      uid: fileless.uid,
      slug: 'gate',
      name: 'nothing.jpg',
    }).then(
      () => null,
      (err: unknown) => err,
    )
    expect(nothing).toBeInstanceOf(MaterialRejectedError)
    expect(nothing).not.toBeInstanceOf(NotRepublishableError)
    expect((nothing as Error).message).toMatch(/nothing to publish/i)
    expect(await sites.listAssets('gate')).toEqual(assetsBefore)
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual(objectsBefore)
  })
})
