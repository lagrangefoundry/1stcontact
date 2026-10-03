import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { PROJECT_KB } from '../apps/control-app/src/knowledge'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { STUB_DIM, stubVector } from './support/stub-embedder'
import { bytesOf } from './support/material-fixtures'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type WireEvent,
} from './support/scripted-model-client'

/**
 * BUG-185 — **a uid a knowledge search returned is a uid `KnowledgeGet` reads,
 * and what it reads is the document's own text**.
 *
 * THE SHAPE OF THE FAILURE. The chat host opens a session's knowledge once per
 * isolate, and `KnowledgeGet` admits only uids in the runtime's document
 * snapshot. Upstream keeps that snapshot in step with search by folding every
 * returned uid into it; this repository's co-ranked search skipped the step, so
 * anything uploaded after the session opened was found and then refused as
 * `not_in_corpus`. And once admitted, the read went to the material ticket's
 * body — the digest — while the chunk hit's offsets pointed into the extracted
 * text, so the client's document still could not be read.
 *
 * SO THE ORDER IN EVERY CASE IS LOAD-BEARING: the session takes a turn FIRST,
 * and only then is the document uploaded. Uploading before the first turn would
 * seed the snapshot from the index and pass whether or not the fix is there.
 *
 * EVERYTHING IS REAL BUT TWO MODEL BOUNDARIES, as in REQ-160 and REQ-173: the
 * Anthropic client (scripted, and never told the answer — each step reads what
 * the host actually sent it) and Workers AI (the stub embedder's vectors behind
 * the binding's own payload shape), plus the digest describer. The upload goes
 * through `/api/material`, so the `material_text` comment and the index refresh
 * are the ingest path's own.
 */

const STAMP_TENANT = 'bug185'

/** In the extracted text only — the digest below never says it. */
const DEEP_FACT = 'The stoneground rye comes from Bennett Mill and is invoiced monthly.'

const DIGEST = 'A supplier handbook for a bakery.'

/** Long enough to chunk, with the fact deep inside rather than on page one. */
const HANDBOOK = [
  '# Supplier handbook',
  '',
  'This handbook records how the bakery buys what it bakes with.',
  '',
  ...Array.from({ length: 30 }, (_, i) => `## Section ${i}\n\nRoutine paragraph about ordering.\n`),
  '## Milling',
  '',
  DEEP_FACT,
  '',
  ...Array.from({ length: 30 }, (_, i) => `## Appendix ${i}\n\nMore routine ordering detail.\n`),
].join('\n')

/** The binding, answering with the stub's vectors — see REQ-160's twin. */
function fakeWorkersAi(): { run(model: string, input: unknown): Promise<unknown> } {
  return {
    async run(_model: string, input: unknown) {
      const texts = ((input as { text: string[] }).text ?? []) as string[]
      const data = texts.map((text) => {
        const row = new Array<number>(384).fill(0)
        const narrow = stubVector(text)
        for (let i = 0; i < STUB_DIM; i++) row[i] = narrow[i]
        return row
      })
      return { shape: [data.length, 384], data }
    },
  }
}

function workerEnv(): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    AI: fakeWorkersAi(),
  } as unknown as RouterEnv
}

/** The project half only: no system KB, so every hit is the client's. */
const deps: RouterDeps = {
  knowledge: async () => null,
  describeText: async () => ({ text: DIGEST, model: 'stub/digest-1' }),
}

const send = (tenant: string, path: string, init: RequestInit): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(),
    { businessId: tenant },
    deps,
  )

const post = (tenant: string, path: string, body: unknown): Promise<Response> =>
  send(tenant, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

async function seedSite(tenant: string): Promise<string> {
  const seed = siteSeed({ slug: nextSlug('bug185') })
  const res = await post(tenant, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
  return ((await res.json()) as { site: string }).site
}

/** Open a session and take one turn, so the session's knowledge is open. */
async function warmSession(tenant: string): Promise<string> {
  const slug = await seedSite(tenant)
  const opened = await post(tenant, '/api/ai/session', { site: slug })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  setModelClient(scriptedClient([says('Hello.')]))
  expect((await frames(await post(tenant, '/api/ai/prompt', { sessionId, text: 'Hi.' }))).at(-1)?.kind).toBe('done')
  return sessionId
}

/** Upload through the real route: comment written, index refreshed. */
async function uploadHandbook(tenant: string): Promise<string> {
  const form = new FormData()
  form.append('file', new File([bytesOf(HANDBOOK) as unknown as BlobPart], 'suppliers.md', { type: 'text/markdown' }))
  form.append('role', 'reference')
  const res = await send(tenant, '/api/material', { method: 'POST', body: form })
  expect(res.status).toBe(200)
  return String(((await res.json()) as { uid: string }).uid)
}

/** The text of the last tool result the host sent the model. */
function lastToolResult(req: ModelRequest): string {
  const last = req.messages[req.messages.length - 1] as { content: unknown }
  const blocks = Array.isArray(last.content) ? last.content : []
  const result = [...blocks].reverse().find((b) => (b as { type?: string }).type === 'tool_result') as
    | { content: unknown }
    | undefined
  const content = result?.content
  if (typeof content === 'string') return content
  return (Array.isArray(content) ? content : [])
    .map((c) => (c as { text?: string }).text ?? '')
    .join('')
}

/** A step that builds its tool call from what the previous tool returned. */
const callsWith =
  (name: string, input: (previous: string) => Record<string, unknown>): ModelStep =>
  (req: ModelRequest): WireEvent[] =>
    calls(name, input(lastToolResult(req)))(req)

/**
 * The last step: keep the read's own tool result and say anything.
 *
 * ASSERTED ON THAT RESULT ALONE, never on the whole conversation — the model's
 * own search query names the fact it is looking for, so a transcript-wide
 * `toContain` would pass on the question rather than the answer.
 */
const keepsRead =
  (into: { text: string }): ModelStep =>
  (req) => {
    into.text = lastToolResult(req)
    return says('Read it.')(req)
  }

/** The first `material-…` uid in a tool result — read, never assumed. */
function uidIn(text: string): string {
  const match = /material-[0-9a-f]+/.exec(text)
  expect(match, `no material uid in the tool result:\n${text}`).not.toBeNull()
  return match![0]
}

async function turn(tenant: string, sessionId: string, steps: ModelStep[]): Promise<void> {
  setModelClient(scriptedClient(steps))
  const events = await frames(
    await post(tenant, '/api/ai/prompt', { sessionId, text: 'What does my supplier handbook say about rye?' }),
  )
  expect(events.at(-1)?.kind).toBe('done')
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-185 — a search hit is readable, and reads the document', () => {
  it('test_UAT_FC_BUG-185_a_document_uploaded_mid_session_is_readable_from_its_search_hit', async () => {
    const tenant = `${STAMP_TENANT}-search`
    const sessionId = await warmSession(tenant)
    const uploaded = await uploadHandbook(tenant)

    let searched = ''
    const read = { text: '' }
    await turn(tenant, sessionId, [
      calls('KnowledgeSearch', { query: 'supplier handbook rye Bennett Mill', kb: [PROJECT_KB] }),
      callsWith('KnowledgeGet', (result) => {
        searched = result
        return { uid: uidIn(result) }
      }),
      keepsRead(read),
    ])

    // The uid came out of the search, and it is the document just uploaded.
    expect(uidIn(searched)).toBe(uploaded)
    // CLIENT MATERIAL IS FENCED AS DATA. The co-ranked search used to return
    // its hits without their corpus claims, so they reached the model unfenced.
    expect(searched).toContain('<<<untrusted>>>')

    // THE READ WAS ADMITTED — and it returned the document's own text, which is
    // the only place the deep fact exists. The digest does not contain it.
    expect(read.text).not.toContain('not_in_corpus')
    expect(read.text).toContain(DEEP_FACT)
  })

  it('test_UAT_FC_BUG-185_a_chunk_hits_offsets_read_back_the_section_it_matched', async () => {
    const tenant = `${STAMP_TENANT}-chunks`
    const sessionId = await warmSession(tenant)
    const uploaded = await uploadHandbook(tenant)

    let found = ''
    const read = { text: '' }
    await turn(tenant, sessionId, [
      calls('KnowledgeChunkSearch', {
        query: 'stoneground rye Bennett Mill invoiced monthly',
        kb: [PROJECT_KB],
        doc: uploaded,
        chunks_per_hit: 1,
      }),
      callsWith('KnowledgeGet', (result) => {
        found = result
        const start = Number(/"start":\s*(\d+)/.exec(result)?.[1])
        const end = Number(/"end":\s*(\d+)/.exec(result)?.[1])
        return { uid: uidIn(result), start, end }
      }),
      keepsRead(read),
    ])

    expect(uidIn(found)).toBe(uploaded)
    expect(found).toContain('<<<untrusted>>>')
    // THE OFFSETS ADDRESS THE TEXT `KnowledgeGet` READS. Before, they pointed
    // into the extracted text while the read went to the digest — so a span of a
    // 33-character digest could never contain the matched section.
    expect(read.text).not.toContain('not_in_corpus')
    expect(read.text).not.toContain('bad_range')
    expect(read.text).toContain(DEEP_FACT)
  })
})
