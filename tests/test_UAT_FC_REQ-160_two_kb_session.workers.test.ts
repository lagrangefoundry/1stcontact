import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { SYSTEM_KB, systemKnowledge, type SystemKbBundle } from '../apps/control-app/src/system-knowledge'
import { PROJECT_KB } from '../apps/control-app/src/knowledge'
import { CURSOR_FIELD } from '../apps/control-app/src/session-delta'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { STUB_DIM, stubEmbedder, stubVector } from './support/stub-embedder'
import { says, scriptedClient } from './support/scripted-model-client'

/**
 * REQ-160 — **two knowledge bases in one session, and the channel that says one
 * of them changed**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own route table, against a real D1 database and a real R2 bucket. The
 * transcript is a real `chat` ticket written by the component's own
 * `TicketSessionArchive`; the landscapes are real awareness reports read by the
 * component's own `primeSession`; the delta is the component's own
 * `resolveCorpus` with a `since` cursor. Nothing here reimplements any of it.
 *
 * TWO DOUBLES, AND THEY ARE THE SAME ONE TWICE. The model, because a UAT that
 * called Anthropic would be asserting a sentence rather than a mechanism; and the
 * embedder, for the reasons `tests/support/stub-embedder.ts` sets out at length —
 * it is the component's declared model seam, none of the claims below is about
 * embedding quality, and miniflare has no local Workers AI to reach. Everything
 * the ticket is actually about is real.
 *
 * THE CLAIM THAT MATTERS is
 * `test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn`.
 * The rest is the mechanism that makes that sentence true.
 */

const TENANT = 'req160'
const STAMP = '2026-01-01T00:00:00Z'

/**
 * A Workers AI binding that answers with the stub's vectors, widened.
 *
 * `projectKnowledgeFor` builds its own `WorkersAiEmbedder` from `env.AI`, which
 * is right — it is the one place the account's model is named — and it means a
 * suite cannot substitute the embedder without substituting the binding under it.
 * So this is the binding, answering in Workers AI's own `{shape, data}` payload
 * with vectors the stub produced and zero-padded to the declared width. Padding
 * with zeros preserves the unit norm, so the dot product the component takes as a
 * cosine is still a real overlap measure.
 */
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

/** The shipped corpus, as small as it can be and still be a map plus a document. */
const CORPUS: Record<string, string> = {
  'doc-storage.md': `---
uid: doc-storage
type: doc
title: How pages are stored
status: active
---

# How pages are stored

A page is a tree of typed elements held in the draft store.
`,
  'awareness.md': `---
uid: doc-awareness-system
type: system
title: 'Awareness map: system'
status: active
fields:
  kind: awareness_report
  kb: system
---

# Awareness map: system

## Storage and publishing

*1 document · entry point: How pages are stored (doc-storage)*

Where a page lives before anybody else can see it.
`,
}

async function fixtureBundle(): Promise<SystemKbBundle> {
  const docs: SystemKbBundle['docs'] = {}
  for (const [name, text] of Object.entries(CORPUS)) docs[name] = { text, updated_at: STAMP }
  const store = new DocDirStore(bundleDocReader(docs), { type: 'doc' })
  const kbs = new Map([
    [
      SYSTEM_KB,
      {
        name: SYSTEM_KB,
        description: 'Test system knowledge.',
        corpus: { types: new Set(['doc']), terms: new Map() },
        landscape: 'authored',
        source: 'shipped',
        weight: 1,
      },
    ],
  ])
  const embedder = stubEmbedder()
  const sources = { shipped: store }
  const index = memoryIndexSource()
  const chunks = memoryIndexSource()
  await buildIndex(store, kbs, index, { embedder, sources })
  await buildChunkIndex(store, kbs, chunks, { embedder, sources })
  return { index: index.files(), chunks: chunks.files(), docs }
}

const fixtureRuntime = async (): Promise<unknown> =>
  systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() })

const deps: RouterDeps = { knowledge: fixtureRuntime }

function workerEnv(): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    AI: fakeWorkersAi(),
  } as unknown as RouterEnv
}

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    deps,
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

const store = (): Promise<TicketStore> => ticketStoreFor(workerEnv())

/** A `material` that satisfies [[DOC-38]] §9 — the happy shape. */
async function upload(title: string, body: string): Promise<Ticket> {
  const { ticket } = await (await store()).create({
    type: 'material',
    title,
    fields: {
      rights: 'owned',
      republishable: true,
      exportable: false,
      origin: 'uploaded',
      kind: 'document',
    },
    body,
  })
  return ticket
}

/** The client's map, published so the landscape has two entries and not one. */
async function publishProjectMap(body: string): Promise<Ticket> {
  const { ticket } = await (await store()).create({
    type: 'system',
    title: `Awareness map: ${PROJECT_KB}`,
    fields: { kind: 'awareness_report', kb: PROJECT_KB },
    body,
  })
  return ticket
}

async function chatTicket(sessionId: string): Promise<Ticket | null> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  return tickets.find((t) => (t.fields ?? {}).session_id === sessionId) ?? null
}

/** Open a session and take one turn, returning what the model was sent. */
async function turn(slug: string, text: string): Promise<{ system: string; sessionId: string }> {
  const opened = await post('/api/ai/session', { slug })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const events = await frames(await post('/api/ai/prompt', { sessionId, text }))
  expect(events.at(-1)?.kind).toBe('done')
  return { system: client.seen[0].system, sessionId }
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-160 — two-KB priming, the change cursor, and the delta channel', () => {
  it('test_UAT_FC_REQ-160_a_cold_session_is_primed_with_both_landscapes_in_one_section', async () => {
    // ONE LANDSCAPE SECTION, NOT TWO. Splitting them would recreate what
    // [[DOC-10]] §5.2 removed when it merged the transcript tools into the
    // knowledge surface: the AI having to know which KIND of thing it was looking
    // for before it could look.
    const slug = nextSlug('prime')
    await seedSite(slug)
    await publishProjectMap('# Awareness map: project\n\n## Brand and positioning\n\nWhat this client sounds like.\n')

    const { system } = await turn(slug, 'Hello.')

    const landscape = system.indexOf('# What exists')
    const purpose = system.indexOf('# Your purpose')
    const mechanism = system.indexOf('# How to search')
    expect(landscape).toBeGreaterThanOrEqual(0)

    // Both maps, and both INSIDE the one landscape section rather than in a
    // second one of their own.
    const client = system.indexOf('Brand and positioning')
    const ours = system.indexOf('Storage and publishing')
    expect(client).toBeGreaterThan(landscape)
    expect(ours).toBeGreaterThan(landscape)
    expect(client).toBeLessThan(purpose)
    expect(ours).toBeLessThan(purpose)

    // PROJECT MAP FIRST — the client's material is what the session is about,
    // and the role purpose already frames standing capability.
    expect(client).toBeLessThan(ours)

    // The component's order, and it is load-bearing: what exists, then what to
    // do, then — last, so it is what the agent acts on — how to search and go.
    expect(purpose).toBeGreaterThan(landscape)
    expect(mechanism).toBeGreaterThan(purpose)
    expect(system.indexOf('Prime yourself now')).toBeGreaterThan(mechanism)

    // And both are named as searchable, which is the claim the co-ranked surface
    // is what makes true.
    expect(system).toContain(PROJECT_KB)
    expect(system).toContain(SYSTEM_KB)
  })

  it('test_UAT_FC_REQ-160_a_small_project_corpus_enumerates_and_says_it_is_complete', async () => {
    // Below the floor a complete listing is strictly better than a map, and
    // LABELLING IT AS COMPLETE is not decoration: a short list read as "knowledge
    // here is thin" produces very different behaviour in front of a new client
    // than the same list read as "you know everything there is".
    const slug = nextSlug('enum')
    await seedSite(slug)
    await upload('The kitchen at dusk', 'A photograph of the restaurant at closing time.')
    const kb = await (await import('../apps/control-app/src/knowledge')).projectKnowledgeFor(
      workerEnv(),
      { embedder: stubEmbedder() },
    )
    const built = await kb.rebuildMap()
    expect(built.mode).toBe('enumerated')

    const { system } = await turn(slug, 'Hello.')
    expect(system).toContain('The kitchen at dusk')
    expect(system).toContain('small enough to list in full')
  })

  it('test_UAT_FC_REQ-160_a_turn_leaves_the_session_in_a_chat_ticket', async () => {
    // [[DOC-10]] §8 — everything is a ticket, and the transcript is not the
    // exception. The session file lives in a `chat_transcript` comment; the body
    // is left alone because it is the AI-maintained summary's home ([[REQ-171]]).
    const slug = nextSlug('ticket')
    await seedSite(slug)
    const { sessionId } = await turn(slug, 'Say something memorable.')

    const chat = await chatTicket(sessionId)
    expect(chat).not.toBeNull()
    expect((chat!.fields ?? {}).session_id).toBe(sessionId)
    expect((chat!.body ?? '').trim()).toBe('')

    const { comments } = await (await store()).comments({ uid: chat!.uid })
    const transcript = comments.find((c) => (c.fields ?? {}).kind === 'chat_transcript')
    expect(transcript).toBeDefined()
    expect(transcript!.body).toContain('Say something memorable.')

    // ONE TICKET PER SESSION, not one per turn: a second turn folds onto the
    // comment it already has rather than minting a rival conversation.
    setModelClient(scriptedClient([says('Again.')]))
    await frames(await post('/api/ai/prompt', { sessionId, text: 'And another thing.' }))
    const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
    expect(tickets.filter((t) => (t.fields ?? {}).session_id === sessionId)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-160_a_document_uploaded_mid_session_is_known_on_the_next_turn', async () => {
    // THE BEHAVIOURAL TEST, and the criterion the ticket says is the one that
    // matters. Everything else is the mechanism.
    //
    // Crucially, WITHOUT WAITING FOR A MAP REBUILD: no map is published here at
    // all, so nothing about the landscape changes between the two turns. If the
    // AI learns of the document it is because the delta told it, which is the
    // whole point — a map is a description, not a notification.
    const slug = nextSlug('mid')
    await seedSite(slug)
    const first = await turn(slug, 'Do you have any positioning material?')
    expect(first.system).not.toContain('Ravenswood positioning note')

    await upload('Ravenswood positioning note', 'We sell to independent restaurants.')

    const client = scriptedClient([says('Thanks, I can see it.')])
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId: first.sessionId, text: 'I just uploaded it.' }))

    const reminder = client.seen[0].system
    expect(reminder).toContain('Ravenswood positioning note')
    expect(reminder).toContain('1 document')
  })

  it('test_UAT_FC_REQ-160_an_empty_delta_contributes_no_tokens_to_a_real_turn', async () => {
    // The rule asserted where it actually costs something. A turn on which
    // nothing entered the corpus carries no delta at all — not a heading, not
    // "nothing new" — because a line that appears every turn and is almost always
    // empty trains the model to skim the region the non-empty case needs to be
    // noticed in.
    const slug = nextSlug('quiet')
    await seedSite(slug)
    const { sessionId } = await turn(slug, 'Hello.')

    const client = scriptedClient([says('Still here.')])
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Anything else?' }))
    expect(client.seen[0].system).not.toMatch(/entered this client's knowledge/)
  })

  it('test_UAT_FC_REQ-160_the_cursor_lives_on_the_chat_ticket_and_advances', async () => {
    // The cursor is a property of a CONVERSATION — what this session has already
    // been told — so it lives with the session, which is a ticket. And it moves,
    // which is what stops the same upload being announced on every turn for the
    // rest of the conversation.
    const slug = nextSlug('cursor')
    await seedSite(slug)
    const { sessionId } = await turn(slug, 'Hello.')

    await upload('Winter menu', 'Six courses, from November.')

    const client = scriptedClient([says('Seen it.')])
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Take a look.' }))
    expect(client.seen[0].system).toContain('Winter menu')

    const chat = await chatTicket(sessionId)
    const cursor = JSON.parse(String((chat!.fields ?? {})[CURSOR_FIELD])) as {
      at: string
      seen: string[]
    }
    expect(cursor.at).not.toBe('')
    expect(cursor.seen.length).toBeGreaterThan(0)

    // THE SECOND TURN IS SILENT ABOUT IT. Reporting it again would be the
    // inclusive-boundary bug the cursor's `seen` list exists to prevent.
    const again = scriptedClient([says('Yes.')])
    setModelClient(again)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Anything new?' }))
    expect(again.seen[0].system).not.toContain('Winter menu')
  })

  it('test_UAT_FC_REQ-160_a_resumed_sessions_first_turn_reports_what_arrived_while_away', async () => {
    // The cursor persists on the ticket, so it survives everything held in
    // memory being dropped — which is what a reload, an eviction and a redeploy
    // all look like from here. There is no separate "while you were away"
    // report and there does not need to be: the delta sweeps from where the
    // session was left, so the gap is covered by the ordinary mechanism.
    const slug = nextSlug('resume')
    await seedSite(slug)
    const { sessionId } = await turn(slug, 'Hello.')

    await upload('Supplier agreement', 'Signed with the dairy in August.')

    resetAiHost()
    resetChatHost()

    const client = scriptedClient([says('Welcome back.')])
    setModelClient(client)
    const reopened = await post('/api/ai/session', { slug })
    expect(reopened.status).toBe(200)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'I am back.' }))
    expect(client.seen[0].system).toContain('Supplier agreement')
  })

  it('test_UAT_FC_REQ-160_a_conversation_is_never_reported_to_itself', async () => {
    // The session's own chat ticket is written by the cursor that lives on it, so
    // a sweep that treated conversations as delta entries would announce the
    // conversation to itself on every turn, forever. Chat tickets stay in the
    // corpus and out of the delta.
    const slug = nextSlug('selfref')
    await seedSite(slug)
    const { sessionId } = await turn(slug, 'Hello.')

    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    await frames(await post('/api/ai/prompt', { sessionId, text: 'Second turn.' }))
    // The quoted form is the one a delta entry takes; the bare slug appears in
    // the reminder's own first line and always will, which is why the assertion
    // names the shape rather than the string.
    expect(client.seen[0].system).not.toContain(`"${sessionId}"`)
    expect(client.seen[0].system).not.toMatch(/entered this client's knowledge/)
  })
})
