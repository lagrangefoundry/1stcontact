import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { CoRankedKnowledge, sessionKnowledgeFor } from '../apps/control-app/src/session-knowledge'
import { loadIndex } from '../apps/control-app/src/generated/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { MATERIAL_TEXT_KIND } from '../apps/control-app/src/material'
import { MAX_EXTRACTED_TEXT_CHARS } from '../apps/control-app/src/describe'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf } from './support/material-fixtures'

/**
 * Reconciliation UATs for story-6ccaedd5 (STORY-140) — **a document's own text,
 * kept beside its material, and a deployment that cannot describe refusing
 * ingestion** — as REQ-173 left them.
 *
 * WHAT MAKES THIS EVIDENCE. Every ingestion goes through `route()` — the Worker's
 * own upload and fetch entry points — against real D1 and two real R2 buckets.
 * What was stored is read back through a second, independently constructed
 * `ticketStoreFor` handle; what is retrievable is asked of the chat host's own
 * `chunk_search` over the index the ingestion's indexer refreshed. Nothing
 * reimplements a step of the pipeline in order to assert it.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES: the digest describer and the embedder.
 * `tests/support/stub-embedder.ts` argues the second and the same argument covers
 * the first — no claim here is about the quality of a summary or of an embedding,
 * and miniflare has no local Workers AI to reach either way.
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

const DIGEST = 'A supplier handbook for a bakery.'

function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: DIGEST, model: 'stub/digest-1' }),
    ...over,
  }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string },
  d: RouterDeps = deps(),
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', 'reference')
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    d,
  )
}

/**
 * A document long enough to be cut into several chunks, whose deep section says
 * something its opening, its title, its filename and its digest do not — the only
 * shape that tells "the chunk index read the document" apart from "it read the
 * first page".
 */
const DEEP = 'The stoneground rye comes from Bennett Mill and is invoiced monthly.'
const HANDBOOK = [
  '# Supplier handbook',
  '',
  'This handbook records how the bakery buys what it bakes with.',
  '',
  ...Array.from({ length: 40 }, (_, i) => `## Section ${i}\n\nRoutine paragraph about ordering.\n`),
  '## Milling',
  '',
  DEEP,
  '',
  ...Array.from({ length: 40 }, (_, i) => `## Appendix ${i}\n\nMore routine ordering detail.\n`),
].join('\n')

/**
 * What this account holds right now: every ticket the store lists, its material
 * specifically, and every byte under its private prefix — "nothing was created"
 * is a diff of this. A text comment needs a material subject, so no new material
 * is also no new comment.
 */
async function holdings(tenant: string): Promise<{ tickets: string[]; material: string[]; blobs: string[] }> {
  const store = await ticketStoreFor(routerEnv(tenant))
  const uids = (tickets: Array<{ uid: string }>) => tickets.map((t) => t.uid).sort()
  const blobs: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix: `t/${tenant}/`, cursor })
    for (const object of page.objects) blobs.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return {
    tickets: uids((await store.list({ limit: 'all' })).tickets),
    material: uids((await store.list({ type: 'material', limit: 'all' })).tickets),
    blobs: blobs.sort(),
  }
}

beforeAll(async () => {
  await APPLIED
})

describe('story-6ccaedd5 — a document keeps its own text beside its material (REQ-173)', () => {
  it('test_UAT_AC2095_a_documents_full_text_is_stored_once_as_a_material_text_comment_bounded_and_marked_where_truncated', async () => {
    const tenant = 'ac2095'
    const response = await upload(tenant, {
      bytes: bytesOf(HANDBOOK),
      name: 'suppliers.md',
      type: 'text/markdown',
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(body.text_comment).not.toBeNull()

    // Read back through a second, independently constructed store: the durable
    // record is the thing, not the response envelope.
    const store = await ticketStoreFor(routerEnv(tenant))
    const { ticket } = await store.get({ uid: String(body.uid) })
    // THE BODY IS THE DIGEST, and the document's own sentence is not in it.
    expect(ticket.body).toBe(DIGEST)
    expect(ticket.body).not.toContain('Bennett Mill')

    const { comments } = await store.comments({ uid: String(body.uid) })
    const kept = comments.filter((c) => c.fields.kind === MATERIAL_TEXT_KIND)
    // EXACTLY ONE, holding the full text — not the digest — and named on the answer.
    expect(kept).toHaveLength(1)
    // The whole document, first line to last — not a sample of it.
    expect(kept[0].body).toContain('# Supplier handbook')
    expect(kept[0].body).toContain(DEEP)
    expect(kept[0].body).toContain('## Appendix 39')
    expect(kept[0].body).not.toBe(DIGEST)
    expect(kept[0].body).not.toContain('truncated at')
    expect(kept[0].fields.subject_uid).toBe(String(body.uid))
    expect(body.text_comment).toBe(kept[0].uid)

    // PAST THE CEILING: the leading text, then a statement naming the length.
    const opening = 'Ridgeway Bakery opened on a Tuesday. '
    const huge = opening + 'sourdough '.repeat(Math.ceil((MAX_EXTRACTED_TEXT_CHARS + 5000) / 10))
    const big = await upload(tenant, { bytes: bytesOf(huge), name: 'huge.txt', type: 'text/plain' })
    expect(big.status).toBe(200)
    const bigBody = (await big.json()) as Record<string, unknown>
    const bigComments = (await store.comments({ uid: String(bigBody.uid) })).comments.filter(
      (c) => c.fields.kind === MATERIAL_TEXT_KIND,
    )
    expect(bigComments).toHaveLength(1)
    expect(bigComments[0].body.startsWith(huge.slice(0, MAX_EXTRACTED_TEXT_CHARS))).toBe(true)
    expect(bigComments[0].body).toContain(`truncated at ${MAX_EXTRACTED_TEXT_CHARS} characters`)
    expect(bigComments[0].body.length).toBeLessThan(huge.length)

    // MATERIAL WITH NO EXTRACTABLE TEXT gets no comment, and the answer says null.
    const image = await upload(
      tenant,
      { bytes: bytesOf('png-ish bytes'), name: 'logo.png', type: 'image/png' },
      deps({ describeImage: async () => ({ text: 'A mark\n\nOn white.', model: 'stub/vision-1' }) }),
    )
    expect(image.status).toBe(200)
    const imageBody = (await image.json()) as Record<string, unknown>
    expect(imageBody.text_comment).toBeNull()
    const imageComments = (await store.comments({ uid: String(imageBody.uid) })).comments
    expect(imageComments.filter((c) => c.fields.kind === MATERIAL_TEXT_KIND)).toHaveLength(0)
  })

  it('test_UAT_AC2096_a_deep_text_search_finds_the_material_by_its_own_uid_while_its_listed_description_is_the_digest', async () => {
    const tenant = 'ac2096'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })

    const response = await upload(
      tenant,
      { bytes: bytesOf(HANDBOOK), name: 'suppliers.md', type: 'text/markdown' },
      deps({ index: async () => async () => void (await kb.refreshIndex()) }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    const uid = String(body.uid)
    const commentUid = String(body.text_comment)
    expect(commentUid).not.toBe(uid)
    // The phrase is in neither the digest, the title nor the filename.
    expect(`${DIGEST} ${body.title} suppliers.md`).not.toMatch(/Bennett|stoneground/i)

    // NO FURTHER REBUILD: the chat host's own passage search, over the index the
    // ingestion refreshed, finds the material — by ITS uid, never the comment's.
    const knowledge = await sessionKnowledgeFor(routerEnv(tenant), { embedder, system: null })
    expect(knowledge).not.toBeNull()
    const toolbox = new CoRankedKnowledge(knowledge!)
    const hits = (await toolbox.chunk_search({ query: 'stoneground rye Bennett Mill invoiced' })) as Array<
      Record<string, unknown>
    >
    const hit = hits.find((h) => h.uid === uid)
    expect(hit).toBeTruthy()
    expect(JSON.stringify(hit!.chunks)).toContain('Bennett Mill')
    expect(hits.map((h) => h.uid)).not.toContain(commentUid)

    // THE MATERIAL-LEVEL INDEX reads the digest, and holds no entry for the comment.
    const docs = (await loadIndex(kb.index)) as { metadata: Array<Record<string, unknown>> }
    const doc = docs.metadata.find((m) => m.uid === uid)!
    expect(String(doc.body_snippet)).toContain('supplier handbook')
    expect(String(doc.body_snippet)).not.toContain('Bennett Mill')
    expect(docs.metadata.map((m) => m.uid)).not.toContain(commentUid)

    // THE LISTING has the material and not the comment; its description is the digest.
    const listed = await route(new Request('https://app.test/api/material'), routerEnv(tenant), deps())
    const rows = ((await listed.json()) as { material: Array<Record<string, unknown>> }).material
    expect(rows.map((r) => r.uid)).toContain(uid)
    expect(rows.map((r) => r.uid)).not.toContain(commentUid)
    const item = await route(
      new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
      routerEnv(tenant),
      deps(),
    )
    expect(((await item.json()) as Record<string, unknown>).body).toBe(DIGEST)
  })
})

describe('story-6ccaedd5 — a deployment with no model key refuses ingestion (REQ-173)', () => {
  it('test_UAT_AC2098_with_no_key_the_status_route_says_so_and_both_ingestion_routes_refuse_with_503_storing_nothing', async () => {
    const tenant = 'ac2098'
    const noKey: RouterDeps = { index: async () => async () => {} }

    // THE STATUS ROUTE says which deployment this is, once.
    const off = await route(new Request('https://app.test/api/status'), routerEnv(tenant), {})
    expect(off.status).toBe(200)
    const offBody = (await off.json()) as Record<string, unknown>
    expect(offBody.ai).toBe(false)
    const message = String(offBody.message)
    expect(message).toMatch(/ANTHROPIC_API_KEY/)

    const before = await holdings(tenant)

    // UPLOAD: refused with 503 and the same message.
    const uploaded = await upload(tenant, { bytes: bytesOf('anything'), name: 'a.txt', type: 'text/plain' }, noKey)
    expect(uploaded.status).toBe(503)
    expect(String(((await uploaded.json()) as Record<string, unknown>).error)).toBe(message)

    // FETCH-ON-BEHALF: refused too, before the address is read.
    const fetched = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/a.pdf' }),
      }),
      routerEnv(tenant),
      noKey,
    )
    expect(fetched.status).toBe(503)
    expect(String(((await fetched.json()) as Record<string, unknown>).error)).toBe(message)

    // NOTHING WAS STORED: no material, attachment or text comment.
    expect(await holdings(tenant)).toEqual(before)

    // WITH A KEY: ai true, no message, and never the secret itself.
    const on = await route(
      new Request('https://app.test/api/status'),
      routerEnv(tenant, { ANTHROPIC_API_KEY: 'sk-test-not-a-real-key-000000' }),
      {},
    )
    const onBody = (await on.json()) as Record<string, unknown>
    expect(onBody.ai).toBe(true)
    expect(onBody.message).toBeNull()
    expect(JSON.stringify(onBody)).not.toContain('sk-test')

    // OR A DESCRIBER HANDED IN BY THE HOST: also ai true.
    const injected = await route(new Request('https://app.test/api/status'), routerEnv(tenant), deps())
    expect(((await injected.json()) as Record<string, unknown>).ai).toBe(true)
  })
})
