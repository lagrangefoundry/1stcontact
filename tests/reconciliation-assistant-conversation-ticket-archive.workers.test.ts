import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { sessionArchive } from '../apps/control-app/src/ai'
import { CURSOR_FIELD } from '../apps/control-app/src/session-delta'
import {
  SYSTEM_KB,
  systemKnowledge,
  type SystemKbBundle,
} from '../apps/control-app/src/system-knowledge'
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
 * **The conversation as a ticket, on the deployed host** (story-a58a0974 —
 * AC-1792, AC-1793, AC-1794).
 *
 * WHY THESE THREE ARE HERE AND NOT NEXT DOOR. The three criteria the file
 * `reconciliation-assistant-conversation-deployed.workers.test.ts` carries are
 * *properties* — the conversation is stored through the store the site belongs
 * to (AC-1057), in one language-neutral form (AC-1405), reachable by no request
 * address (AC-1409) — and each survived the carrier changing from an R2 object
 * to a ticket. These three are about the **arrangement itself**: the `chat`
 * ticket, its transcript comment, its cursor field, and the compare-and-set that
 * guards the fold. They are a persistent-artifact contract rather than a
 * restatement of a property, and the plan item that created them says why they
 * are stated separately: *an archive that minted a second ticket per turn would
 * still replay a conversation*, so AC-1057 would pass while the conversation had
 * quietly become several.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own route table, against a real D1 database and a real R2 bucket. The
 * transcript is written by the component's own `TicketSessionArchive` — reached
 * through `ai.ts`'s `sessionArchive`, which is what the Worker itself wires —
 * onto a real account-bound ticket store built by `ticketStoreFor`. The session
 * file is the library's own `Session.toFile()`. The cursor is written by the
 * product's own `turnDelta` during a real turn. Nothing here reimplements any of
 * it, and nothing here writes a ticket the archive is supposed to write.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES and both recorded in the story's
 * Technical Context in the same words: the Anthropic client (it is the network,
 * and it is the seam the library's backend is written to have injected) and the
 * embedder (miniflare has no local Workers AI to reach, and no claim below is
 * about embedding quality).
 */

const TENANT = 'ac179x'

/** The kind of the comment the whole session file lives in ([[DOC-10]] §8). */
const TRANSCRIPT_KIND = 'chat_transcript'

// ── the runtime ──────────────────────────────────────────────────────────────

/**
 * A Workers AI binding answering with the stub's vectors, widened.
 *
 * `projectKnowledgeFor` builds its own embedder from `env.AI`, which is right —
 * that is the one place the account's model is named — so a suite cannot
 * substitute the embedder without substituting the binding under it. Zero
 * padding preserves the unit norm, so the dot product the component takes as a
 * cosine is still a real overlap measure.
 *
 * Only the cursor case needs it: the change feed exists because the *project*
 * corpus can grow during a conversation, and that corpus is only opened when a
 * model is available to search it with.
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

function workerEnv(withModel = false): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ...(withModel ? { AI: fakeWorkersAi() } : {}),
  } as unknown as RouterEnv
}

/**
 * The shipped corpus, as small as it can be and still be a map plus a document.
 *
 * PLANTED, NOT READ OFF DISK. The built-in corpus is whatever `1c kb build` last
 * exported for this checkout — a release artefact whose contents change when the
 * design documents do — so a suite that let the real opener answer would depend
 * on whichever documents happened to be exported that week. None of the three
 * criteria here is about the corpus's contents; what they need is a conversation
 * in the configuration a deployment actually has.
 */
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

/**
 * A bundle built by the component's own index builders.
 *
 * `memoryIndexSource()` is writable and reports its own `files()`, which is
 * precisely the residency `1c assets` serialises — so this is not a stand-in for
 * the build, it is the build's own final step run in the runtime that consumes it.
 */
async function fixtureBundle(): Promise<SystemKbBundle> {
  const docs: SystemKbBundle['docs'] = {}
  for (const [name, text] of Object.entries(CORPUS)) {
    docs[name] = { text, updated_at: '2026-01-01T00:00:00Z' }
  }
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

/**
 * WITH OR WITHOUT A CORPUS, and the pairing is not a convenience.
 *
 * `withModel: false` is the ordinary nothing-packed state (AC-1320): no model
 * binding, no corpus, so no knowledge surface at all. AC-1792 and AC-1793 are
 * about the transcript and hold in it — a conversation stores its turns whether
 * or not it can look anything up.
 *
 * `withModel: true` is the configuration a deployment carrying a corpus actually
 * has — both knowledge bases open — which is what AC-1794 needs, because the
 * change feed exists for the *project* corpus and only opens alongside a model.
 */
const deps = (withModel = false): RouterDeps =>
  ({ knowledge: withModel ? fixtureRuntime : async () => null }) as RouterDeps

const post = (path: string, body: unknown, withModel = false): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(withModel),
    deps(withModel),
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

/** A site made only of L1, imported through the Worker's own route. */
async function seedSite(slug: string, withModel = false): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post(
    '/api/import',
    {
      slug: seed.slug,
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({
        name,
        page: page as Record<string, unknown>,
      })),
      assets: [] as { name: string; base64: string }[],
    },
    withModel,
  )
  expect(res.status).toBe(200)
}

/** The account's own ticket store — the same handle the chat routes are given. */
const store = (withModel = false): Promise<TicketStore> => ticketStoreFor(workerEnv(withModel))

/** Every `chat` ticket this account holds that names `sessionId`. */
async function chatTickets(sessionId: string): Promise<Ticket[]> {
  const { tickets } = await (await store()).query({ predicate: 'type=chat', limit: 'all' })
  return tickets.filter((t) => (t.fields ?? {}).session_id === sessionId)
}

async function transcriptComment(uid: string): Promise<Ticket | undefined> {
  const { comments } = await (await store()).comments({ uid })
  return comments.find((c) => (c.fields ?? {}).kind === TRANSCRIPT_KIND)
}

/** Open a site's conversation and return its identifier. */
async function open(slug: string, withModel = false): Promise<string> {
  const res = await post('/api/ai/session', { slug }, withModel)
  expect(res.status, await res.clone().text()).toBe(200)
  return ((await res.json()) as { sessionId: string }).sessionId
}

/**
 * One turn in an open conversation, answered by the scripted model.
 *
 * The model having actually been called is asserted here rather than left to the
 * cases: a turn that fails reports the failure INSIDE its stream and still ends
 * in a `done` (AC-1414), so "the last frame is `done`" is true of a broken turn
 * too. Checking the double was reached is what makes a failure surface where it
 * happened, with the stream that explains it.
 */
async function speak(sessionId: string, text: string, answer: string, withModel = false) {
  const client = scriptedClient([says(answer)])
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text }, withModel)
  const body = await response.clone().text()
  const events = await frames(response)
  expect(events.at(-1)?.kind, body).toBe('done')
  expect(client.seen.length, body).toBeGreaterThan(0)
  return events
}

/** A `material` in the happy shape [[DOC-38]] §9 specifies. */
async function upload(title: string, body: string): Promise<Ticket> {
  const { ticket } = await (await store(true)).create({
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

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-1792: the conversation IS a ticket ────────────────────────────────────

describe('a turn on the deployed host leaves the conversation as one chat ticket', () => {
  it('test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body', async () => {
    const slug = nextSlug('chatticket')
    await seedSite(slug)
    const sessionId = await open(slug)

    const SAID = 'Say something I can find again in the ticket store.'
    const ANSWERED = 'Noted — and this sentence is now somebody’s business.'
    await speak(sessionId, SAID, ANSWERED)

    // FOUND BY WHAT IT IS OF, not by a handle some process kept: the query is
    // the ordinary one any consumer of this account's tickets would make, and
    // the conversation is picked out of its answer by `fields.session_id`.
    const found = await chatTickets(sessionId)
    expect(found).toHaveLength(1)
    const chat = found[0]
    expect(chat.type).toBe('chat')
    expect((chat.fields ?? {}).session_id).toBe(sessionId)

    // THE BODY IS LEFT ALONE. It is reserved for the summary REQ-171 owns, and a
    // transcript written into it would be clobbered by that writer or clobber it.
    expect((chat.body ?? '').trim()).toBe('')

    // THE WHOLE SESSION FILE IS ONE COMMENT'S BODY — both speakers, in the
    // library's own neutral markup.
    const transcript = await transcriptComment(chat.uid)
    expect(transcript).toBeDefined()
    expect(transcript!.body).toContain(SAID)
    expect(transcript!.body).toContain(ANSWERED)
    expect(transcript!.body.startsWith('<!-- xgd-session\n')).toBe(true)

    // ONE TICKET PER CONVERSATION, NEVER ONE PER TURN. A second turn folds onto
    // the ticket and the comment that already exist. This is the half AC-1057
    // cannot catch: an archive minting a rival ticket per turn would still replay
    // a conversation from the newest one.
    await speak(sessionId, 'And another thing.', 'Still the same conversation.')

    const again = await chatTickets(sessionId)
    expect(again).toHaveLength(1)
    expect(again[0].uid).toBe(chat.uid)
    const folded = await transcriptComment(chat.uid)
    expect(folded!.uid).toBe(transcript!.uid)
    expect(folded!.body).toContain(SAID)
    expect(folded!.body).toContain(ANSWERED)
    expect(folded!.body).toContain('And another thing.')
    expect(folded!.body).toContain('Still the same conversation.')
    // …and the body is still not where any of it went.
    const reread = (await chatTickets(sessionId))[0]
    expect((reread.body ?? '').trim()).toBe('')
  })
})

// ── AC-1793: the fold is a compare-and-set ───────────────────────────────────

/**
 * A pass-through ticket client with one pause in it.
 *
 * NOT A DOUBLE. Every call delegates to the real store and returns exactly what
 * the real store returned; the only thing added is that `update` may be made to
 * wait before it runs. That is the same technique `stalls()` uses on the model
 * seam, and for the same reason: the criterion asks for two writers *each having
 * read the same stored transcript*, and against an archive whose read and write
 * are two consecutive awaits there is otherwise no instant at which that state
 * can be stood in. Racing two `apply` calls and hoping their reads straddle would
 * be asserting on a scheduler.
 */
function pausingClient(
  real: TicketStore,
  hook?: { entered(): void; wait: Promise<void> },
): Record<string, unknown> {
  const untyped = real as unknown as Record<string, (a: unknown) => Promise<unknown>>
  const passThrough = (name: string) => (a: unknown) => untyped[name].call(real, a)
  return {
    create: passThrough('create'),
    get: passThrough('get'),
    query: passThrough('query'),
    comment: passThrough('comment'),
    comments: passThrough('comments'),
    append_body: passThrough('append_body'),
    update: async (a: unknown) => {
      if (hook) {
        hook.entered()
        await hook.wait
      }
      return untyped.update.call(real, a)
    },
  }
}

/**
 * One increment: a turn the fold appends to the stored transcript.
 *
 * The timestamps are deliberately far in the future. The fold refuses a turn
 * dated before the transcript's current tail — correctly, because a stale
 * exchange sitting in the newest position is a false statement about what the
 * operator most recently said — and a refused turn would leave the stored body
 * unchanged, which is the one outcome that would make the assertions below pass
 * while proving nothing.
 */
const increment = (content: string, at: string) => [
  { kind: 'turn_start', role: 'user', content, at },
]
const LATER = '2099-01-01T00:00:00.000Z'
const LATEST = '2099-01-01T00:00:01.000Z'

describe('two writers folding onto one conversation conflict loudly', () => {
  it('test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact', async () => {
    const slug = nextSlug('cas')
    await seedSite(slug)
    const sessionId = await open(slug)

    const ESTABLISHED = 'The turn that was already there.'
    await speak(sessionId, 'Establish the conversation.', ESTABLISHED)

    const tickets = await store()

    // TWO INDEPENDENT ARCHIVES over the same conversation, each the component's
    // own `TicketSessionArchive` reached the way the Worker reaches it.
    let reachedGate!: () => void
    const atGate = new Promise<void>((resolve) => {
      reachedGate = resolve
    })
    let release!: () => void
    const mayWrite = new Promise<void>((resolve) => {
      release = resolve
    })

    const winner = sessionArchive(pausingClient(tickets) as unknown as TicketStore)
    const loser = sessionArchive(
      pausingClient(tickets, {
        entered: () => reachedGate(),
        wait: mayWrite,
      }) as unknown as TicketStore,
    )

    // EACH HAVING READ THE SAME STORED TRANSCRIPT. Both loads resolve the same
    // comment at the same version; the fold below is made against what was read.
    const before = (await winner.load(sessionId)) as { toFile(): string }
    await loser.load(sessionId)
    expect(before.toFile()).toContain(ESTABLISHED)

    const LANDED = 'The increment that won.'
    const LOST = 'The increment that was refused.'

    // The loser folds first and is held at its write, so its read is already
    // behind it when the winner's write moves the version.
    const refused = loser.apply(sessionId, increment(LOST, LATEST))
    await atGate
    await winner.apply(sessionId, increment(LANDED, LATER))
    release()

    // REFUSED, NOT SILENTLY DISCARDED. A store that overwrote unconditionally
    // would resolve here, and a conversation that had quietly lost a turn cannot
    // afterwards be told from one where the turn was never spoken.
    await expect(refused).rejects.toThrow(/conflict/i)
    const error = await refused.catch((err: unknown) => err)
    expect((error as { code?: string }).code).toBe('conflict')

    // THE WINNER'S INCREMENT IS INTACT AND WELL-FORMED — not a merge of the two,
    // and not an empty or truncated transcript.
    const chat = (await chatTickets(sessionId))[0]
    const stored = (await transcriptComment(chat.uid))!.body
    expect(stored).toContain(ESTABLISHED)
    expect(stored).toContain(LANDED)
    expect(stored).not.toContain(LOST)
    expect(stored.startsWith('<!-- xgd-session\n')).toBe(true)

    // …and re-opening the conversation replays it, which is the only proof that
    // matters to the operator: the refusal cost the loser's increment and nothing
    // of the conversation.
    resetAiHost()
    resetChatHost()
    const reopened = await post('/api/ai/session', { slug })
    const replayed = (await reopened.json()) as {
      sessionId: string
      turns: { role: string; markdown: string }[]
    }
    expect(replayed.sessionId).toBe(sessionId)
    const said = replayed.turns.map((t) => t.markdown).join('\n')
    expect(said).toContain(ESTABLISHED)
    expect(said).toContain(LANDED)
    expect(said).not.toContain(LOST)
  })
})

// ── AC-1794: the boundary lives on the conversation ──────────────────────────

describe('what a conversation has been told is recorded on its own chat ticket', () => {
  it('test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket', async () => {
    const first = nextSlug('cursorone')
    const second = nextSlug('cursortwo')
    await seedSite(first, true)
    await seedSite(second, true)

    const one = await open(first, true)
    await speak(one, 'Hello.', 'Hello back.', true)
    const two = await open(second, true)
    await speak(two, 'Hello from the other site.', 'Noted.', true)

    // Something enters the corpus, and the next turn is told about it — which is
    // what moves the boundary and gives it an entry to carry.
    const winter = await upload('Winter menu', 'Six courses, from November.')
    await speak(one, 'Take a look at what I just added.', 'Seen it.', true)

    // BOTH HALVES OF ONE FACT, in one field: the boundary in the change feed, and
    // the entries that sat exactly on it. Two fields would let a store update
    // move one without the other and leave the boundary meaning something nobody
    // wrote.
    const allOne = await chatTickets(one)
    expect(allOne).toHaveLength(1)
    const chatOne = allOne[0]
    const raw = (chatOne.fields ?? {})[CURSOR_FIELD]
    expect(typeof raw).toBe('string')
    expect(String(raw).trim()).not.toBe('')
    const cursorOne = JSON.parse(String(raw)) as { at: string; seen: string[] }
    expect(cursorOne.at).not.toBe('')
    expect(cursorOne.seen).toContain(winter.uid)

    // IT SURVIVES EVERYTHING HELD IN MEMORY BEING DROPPED — a reload, an eviction
    // and a redeployment all look the same from here — and it is still on the
    // same ticket rather than on a second one minted by the reopen.
    resetAiHost()
    resetChatHost()
    const reopened = await open(first, true)
    expect(reopened).toBe(one)

    const afterReload = await chatTickets(one)
    expect(afterReload).toHaveLength(1)
    expect(afterReload[0].uid).toBe(chatOne.uid)
    expect((afterReload[0].fields ?? {})[CURSOR_FIELD]).toBe(raw)

    // A SECOND CONVERSATION HAS ITS OWN, and neither is affected by the other's.
    const spring = await upload('Spring menu', 'Five courses, from March.')
    await speak(two, 'And look at this one.', 'Also seen.', true)

    const chatTwo = (await chatTickets(two))[0]
    expect(chatTwo.uid).not.toBe(chatOne.uid)
    const cursorTwo = JSON.parse(String((chatTwo.fields ?? {})[CURSOR_FIELD])) as {
      at: string
      seen: string[]
    }
    expect(cursorTwo.seen).toContain(spring.uid)
    expect(cursorTwo.seen).not.toContain(winter.uid)

    // The first conversation's boundary did not move because the second one was
    // told something: this is a property of a conversation, not of the index.
    const chatOneAgain = (await chatTickets(one))[0]
    expect((chatOneAgain.fields ?? {})[CURSOR_FIELD]).toBe(raw)
  })
})
