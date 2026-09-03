/**
 * REQ-173 — **the comment is really written, and the chunk index really reads it**.
 *
 * WHAT THIS FILE PROVES, and what its node sibling proves instead. That one is
 * `describe` as a pure function of bytes: which half is a digest and which half is
 * the document. This is the half that only a request can make — that `ingest`
 * writes the text to one `material_text` comment on the material ticket, before
 * the index refresh, against real D1 and two real R2 buckets; that the two
 * indexes then read the same corpus through different eyes; and that a deployment
 * which cannot describe refuses the upload instead of storing an undescribed row.
 *
 * WHY THE INDEX CLAIM IS THE ONE THAT MATTERS. Moving the text is easy and
 * failing silently is easy too: the comment is stored, nothing indexes it, and
 * every symptom is a search that quietly does not return a document — which is
 * indistinguishable from a corpus that does not contain it. [[DOC-39]] §7's
 * *"search wide, read deep"* is a division of labour between two indexes, and
 * the claim below is that both halves still do their own job: the document vector
 * embeds a short on-topic digest, and the chunk vectors are cut from page 12.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES: the digest describer and the embedder.
 * `tests/support/stub-embedder.ts` argues the second at length and the same
 * argument covers the first — no claim here is about the quality of a summary or
 * of an embedding, and miniflare has no local Workers AI to reach either way.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { loadIndex } from '../apps/control-app/src/generated/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { MATERIAL_TEXT_KIND } from '../apps/control-app/src/material'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf } from './support/material-fixtures'

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
 * A document long enough to be cut into several chunks, whose deep sections say
 * something its opening does not — which is the only shape that can tell "the
 * chunk index read the document" apart from "the chunk index read its first page".
 */
const HANDBOOK = [
  '# Supplier handbook',
  '',
  'This handbook records how the bakery buys what it bakes with.',
  '',
  ...Array.from({ length: 40 }, (_, i) => `## Section ${i}\n\nRoutine paragraph about ordering.\n`),
  '## Milling',
  '',
  'The stoneground rye comes from Bennett Mill and is invoiced monthly.',
  '',
  ...Array.from({ length: 40 }, (_, i) => `## Appendix ${i}\n\nMore routine ordering detail.\n`),
].join('\n')

beforeAll(async () => {
  await APPLIED
})

describe('REQ-173 — the full text lands in one marked comment', () => {
  it('test_UAT_FC_REQ_173_the_documents_own_text_is_written_to_a_material_text_comment', async () => {
    const tenant = 'req173-comment'
    const response = await upload(tenant, {
      bytes: bytesOf(HANDBOOK),
      name: 'suppliers.md',
      type: 'text/markdown',
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    // Read back through a second, independently constructed store: the durable
    // record is the thing, not the response envelope.
    const store = await ticketStoreFor(routerEnv(tenant))
    const { ticket } = await store.get({ uid: String(body.uid) })
    // THE BODY IS THE DIGEST — the field the Library labels "What this is".
    expect(ticket.body).toBe(DIGEST)

    const { comments } = await store.comments({ uid: String(body.uid) })
    const kept = comments.filter((c) => c.fields.kind === MATERIAL_TEXT_KIND)
    // ONE COMMENT, not one per section and not one per re-read: the comment is
    // append-only in the store and written exactly once, at ingest.
    expect(kept).toHaveLength(1)
    expect(kept[0].body).toContain('Bennett Mill')
    expect(kept[0].fields.subject_uid).toBe(String(body.uid))
    // Echoed on the envelope, because the body no longer carries the text and a
    // caller that wants it has to know there is a comment to ask for.
    expect(body.text_comment).toBe(kept[0].uid)
  })

  it('test_UAT_FC_REQ_173_material_with_no_extracted_text_writes_no_comment', async () => {
    // An image has nothing to keep. A comment written anyway would be an empty
    // record per upload and a corpus member with nothing in it.
    const tenant = 'req173-nocomment'
    const response = await upload(
      tenant,
      { bytes: bytesOf('png-ish bytes'), name: 'logo.png', type: 'image/png' },
      deps({ describeImage: async () => ({ text: 'A mark\n\nOn white.', model: 'stub/vision-1' }) }),
    )
    const body = (await response.json()) as Record<string, unknown>
    expect(body.text_comment).toBeNull()

    const store = await ticketStoreFor(routerEnv(tenant))
    const { comments } = await store.comments({ uid: String(body.uid) })
    expect(comments.filter((c) => c.fields.kind === MATERIAL_TEXT_KIND)).toHaveLength(0)
  })
})

describe('REQ-173 — the two indexes read the same corpus through different eyes', () => {
  it('test_UAT_FC_REQ_173_the_chunk_index_reads_the_full_text_and_the_document_index_the_digest', async () => {
    const tenant = 'req173-index'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })

    const response = await upload(
      tenant,
      { bytes: bytesOf(HANDBOOK), name: 'suppliers.md', type: 'text/markdown' },
      deps({ index: async () => async () => void (await kb.refreshIndex()) }),
    )
    const body = (await response.json()) as Record<string, unknown>
    const uid = String(body.uid)

    // THE DOCUMENT INDEX EMBEDS THE DIGEST. That is the vector the awareness map
    // clusters territories from, and a 200,000-character body embedded whole is a
    // centroid of everything — a vector of nothing in particular.
    const docs = (await loadIndex(kb.index)) as { metadata: Array<Record<string, unknown>> }
    const doc = docs.metadata.find((m) => m.uid === uid)!
    expect(String(doc.body_snippet)).toContain('supplier handbook')
    expect(String(doc.body_snippet)).not.toContain('Bennett Mill')

    // AND THE CHUNK INDEX READS THE WHOLE DOCUMENT. Several chunks, and one of
    // them is cut from a section the digest never mentions — which is the
    // difference between "search wide" and "read deep", and is exactly what
    // moving the text would have deleted if nothing indexed it.
    const chunks = (await loadIndex(kb.chunks)) as { metadata: Array<Record<string, unknown>> }
    const mine = chunks.metadata.filter((m) => m.parent_uid === uid)
    expect(mine.length).toBeGreaterThan(1)
    expect(mine.some((m) => String(m.text_snippet).includes('Bennett Mill'))).toBe(true)

    // THE HIT POINTS AT THE DOCUMENT, not at a comment about it. This is why the
    // text is substituted into the material's body for the chunk builder rather
    // than declared as a corpus member of its own: a deep hit whose `parent_uid`
    // named the comment would send a reader to "Comment on material-x".
    for (const chunk of mine) expect(chunk.parent_uid).toBe(uid)
  })
})

describe('REQ-173 — a deployment that cannot describe refuses the upload', () => {
  it('test_UAT_FC_REQ_173_ingestion_is_refused_with_the_reason_when_no_key_is_configured', async () => {
    // NOTHING IN THIS PRODUCT WORKS WITHOUT A KEY, and since REQ-173 that
    // includes describing a document. Storing the file anyway would put a row in
    // the Library whose "What this is" says why it is empty — one such row per
    // upload, for a fact that is true of the whole deployment and is said once,
    // at the top of the screen, by the banner.
    const response = await upload(
      'req173-nokey',
      { bytes: bytesOf('anything'), name: 'a.txt', type: 'text/plain' },
      { index: async () => async () => {} },
    )
    expect(response.status).toBe(503)
    const body = (await response.json()) as Record<string, unknown>
    expect(String(body.error)).toMatch(/ANTHROPIC_API_KEY/)
  })

  it('test_UAT_FC_REQ_173_the_fetch_entry_point_is_gated_too', async () => {
    // Both entry points converge on `ingest`, so a guard on one of them is not a
    // guard. Refused before the address is even read.
    const response = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/a.pdf' }),
      }),
      routerEnv('req173-nokey'),
      { index: async () => async () => {} },
    )
    expect(response.status).toBe(503)
  })

  it('test_UAT_FC_REQ_173_the_status_route_says_which_deployment_this_is', async () => {
    // ONE QUESTION, ASKED ONCE. The builder used to discover an unconfigured
    // deployment one surface at a time — a frozen chat panel here, an undescribed
    // upload there — which asks an operator to infer a deployment-wide fact from
    // a scattering of local symptoms.
    const off = await route(
      new Request('https://app.test/api/status'),
      routerEnv('req173-status'),
      {},
    )
    expect(off.status).toBe(200)
    const offBody = (await off.json()) as Record<string, unknown>
    expect(offBody.ai).toBe(false)
    expect(String(offBody.message)).toMatch(/ANTHROPIC_API_KEY/)

    const on = await route(
      new Request('https://app.test/api/status'),
      routerEnv('req173-status', { ANTHROPIC_API_KEY: 'sk-test-not-a-real-key-000000' }),
      {},
    )
    const onBody = (await on.json()) as Record<string, unknown>
    expect(onBody.ai).toBe(true)
    expect(onBody.message).toBeNull()
    // AND IT NEVER REPORTS THE SECRET ITSELF. The answer is a capability.
    expect(JSON.stringify(onBody)).not.toContain('sk-test')
  })
})
