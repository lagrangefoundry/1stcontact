import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import {
  SYSTEM_KB,
  knowledgeSurfaceFor,
  systemKnowledge,
  type SystemKbBundle,
} from '../apps/control-app/src/system-knowledge'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { stubEmbedder } from './support/stub-embedder'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type WireEvent,
} from './support/scripted-model-client'

/**
 * REQ-158 — **the system knowledge base, in workerd**.
 *
 * THE ACCEPTANCE SENTENCE HAS THREE PARTS, and this file asserts all three: the
 * assistant answers a question whose answer lives only in a design document,
 * FROM that document; its reply NAMES the document; and the session was PRIMED
 * with the awareness map, because a tool the assistant never learns to reach for
 * is the same failure as no tool at all.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own `route()`, over the real shared knowledge component:
 * the corpus is resolved by its `resolveCorpus`, both indexes are built by its
 * `buildIndex` and `buildChunkIndex`, the search is its own `search`, the tool
 * surface is the bridge's `KnowledgeToolbox` and the priming is the bridge's
 * `KnowledgeDocs`. The bundle handed in is the exact shape `1c assets` emits.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES AND BOTH ARGUED ELSEWHERE. The embedder
 * (`tests/support/stub-embedder.ts` — miniflare has no local Workers AI to
 * reach, and no claim here is about embedding quality) and the Anthropic client
 * (`tests/support/scripted-model-client.ts` — it is the network).
 *
 * THE CORPUS IS PLANTED BY THIS TEST AND NOT READ OFF DISK, deliberately. The
 * built-in `KB` is the corpus `1c kb build` produced for this checkout: a release
 * artefact whose contents change when the design documents do, so a test
 * asserting against it would assert against whatever happened to be exported
 * that week. Injecting through `deps.knowledge` means "answered from the
 * document" is a claim about a document this file wrote.
 *
 * AND THE MODEL DOUBLE IS NOT TOLD THE ANSWER. {@link quotesToolResult} reads the
 * tool result out of the request the host sent it. Scripting the answer as a
 * literal would prove only that this file can type a sentence; reading it back
 * proves the fact travelled from the corpus, through search, through the tool
 * loop, into the model's context.
 */

const TENANT = 'req158'

/** The fact that exists nowhere but the planted document. */
const PLANTED = 'Ravensblack Ledger is retained for eleven days and then discarded.'

/** The corpus stamp, carried through both halves of the bundle. */
const STAMP = '2026-08-31T00:00:00Z'

const CORPUS: Record<string, string> = {
  'DOC-Z.md': `---
id: DOC-Z
type: doc
title: The Ravensblack Ledger retention rule
---
# The Ravensblack Ledger retention rule

${PLANTED}
`,
  'DOC-Y.md': `---
id: DOC-Y
type: doc
title: Storage and revisions
---
# Storage and revisions

Publishing snapshots the draft into a numbered revision and renders the output.
`,
  // The map. `type: system` keeps it out of the searchable corpus — it is what a
  // cold session is primed WITH, not something a search should return.
  'awareness.md': `---
type: system
title: 'Awareness map: system'
status: active
fields:
  kind: awareness_report
  kb: system
---
# Awareness map: system

## Retention and disposal

*1 document · entry point: The Ravensblack Ledger retention rule (DOC-Z)*

How long things are kept and what happens when they are not.
`,
}

/**
 * A bundle built the way `1c assets` builds one — real component, real indexes.
 *
 * `memoryIndexSource()` is writable and reports its own `files()`, which is
 * precisely the residency the emitter serialises. So this is not a stand-in for
 * the build: it is the build's own final step, run in the runtime that consumes
 * it.
 */
async function fixtureBundle(): Promise<SystemKbBundle> {
  // Stamped, and the SAME stamped map both halves are built from — which is the
  // property the emitter exists to preserve. Indexing an unstamped corpus and
  // then serving a stamped one (or the reverse) produces no error at all: the
  // two simply disagree about how recent every document is, and recency is one
  // of the ranker's own inputs.
  const docs: SystemKbBundle['docs'] = {}
  for (const [name, text] of Object.entries(CORPUS)) {
    docs[name] = { text, updated_at: STAMP }
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

/** A knowledge runtime over the fixture, opened through the Worker's own opener. */
async function fixtureRuntime(): Promise<unknown> {
  return systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() })
}

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
  } as unknown as RouterEnv
}

const post = (path: string, body: unknown, deps: RouterDeps): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    deps,
  )

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

/**
 * An answer composed from what the host actually sent back.
 *
 * THE POINT OF THE INDIRECTION. A scripted `says('… eleven days …')` would pass
 * whether or not the search found anything — it would prove this file can type a
 * sentence. Reading the tool result out of the request means the assertion below
 * ("the answer contains the planted fact and names the document") can only hold
 * if the fact travelled out of the corpus, through the component's search, back
 * through the tool loop and into the model's context.
 */
const quotesToolResult =
  (prefix: string): ModelStep =>
  (req: ModelRequest): WireEvent[] =>
    says(`${prefix}\n\n${JSON.stringify(req.messages)}`)(req)

async function seedSite(slug: string, deps: RouterDeps): Promise<void> {
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
    deps,
  )
  expect(res.status).toBe(200)
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-158 — the assistant can read its own design documents', () => {
  it('test_UAT_FC_REQ-158_the_assistant_answers_from_a_design_document_and_names_it', async () => {
    // THE ACCEPTANCE CRITERION THAT MATTERS. Everything else in this ticket is
    // the mechanism that makes this sentence true.
    const deps: RouterDeps = { knowledge: fixtureRuntime }
    const slug = nextSlug('kb')
    await seedSite(slug, deps)

    const opened = await post('/api/ai/session', { slug }, deps)
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string }

    const client = scriptedClient([
      calls('KnowledgeSearch', {
        query: 'how long is the Ravensblack Ledger kept',
        kb: [SYSTEM_KB],
      }),
      quotesToolResult('Here is what the design documents say:'),
    ])
    setModelClient(client)

    const turn = await post(
      '/api/ai/prompt',
      { sessionId: session.sessionId, text: 'How long do we keep the Ravensblack Ledger?' },
      deps,
    )
    expect(turn.status).toBe(200)
    const events = await frames(turn)
    expect(events.at(-1)?.kind).toBe('done')

    const answer = events
      .filter((e) => e.kind === 'text')
      .map((e) => e.content)
      .join('')

    // FROM THE DOCUMENT: the fact reached the model, and the only path it could
    // have taken is the corpus → search → tool loop.
    expect(answer).toContain('eleven days')
    // AND IT NAMES IT: the hit carries the document's identity, so the assistant
    // can attribute rather than assert.
    expect(answer).toContain('DOC-Z')
    // RANKED, NOT MERELY RETURNED — and this is the assertion that makes the two
    // above non-vacuous. A search that handed back the whole corpus in corpus
    // order would satisfy them exactly as well, so what is checked is that the
    // document which answers the question outranks the one that does not.
    expect(answer.indexOf('DOC-Z')).toBeLessThan(answer.indexOf('DOC-Y'))

    // And the corpus reached the model with the stamp the index was built
    // against, rather than `bundleDocReader`'s epoch default.
    expect(answer).toContain(STAMP)
  })

  it('test_UAT_FC_REQ-158_priming_puts_the_map_in_the_session_and_not_the_pile', async () => {
    const deps: RouterDeps = { knowledge: fixtureRuntime }
    const slug = nextSlug('prime')
    await seedSite(slug, deps)

    const session = (await (
      await post('/api/ai/session', { slug }, deps)
    ).json()) as { sessionId: string }

    const client = scriptedClient([says('Noted.')])
    setModelClient(client)
    await frames(
      await post('/api/ai/prompt', { sessionId: session.sessionId, text: 'Hello.' }, deps),
    )

    const system = client.seen[0].system
    // THE MAP IS THERE, and it routes: a territory plus where to start.
    expect(system).toContain('Retention and disposal')
    expect(system).toContain('DOC-Z')
    // THE PILE IS NOT. This is the property the whole design rests on — the
    // corpus can grow without the context growing with it.
    expect(system).not.toContain(PLANTED)

    // And the tools are offered beside the site tools rather than instead of
    // them: composition, so a knowledge call gets the same gating and audit an
    // edit does.
    const tools = client.seen[0].tools.map((t) => t.name)
    expect(tools).toContain('KnowledgeSearch')
    expect(tools).toContain('set_l1')
  })

  it('test_UAT_FC_REQ-158_the_grant_is_read_only_and_scoped_to_the_system_kb', async () => {
    // ENFORCED BY ABSENCE. Nothing the assistant is offered writes to the corpus,
    // and the scope axis is filled from the declaration rather than from a
    // literal here — which is what will make a per-tenant KB safe to add later
    // without revisiting this wiring.
    const deps: RouterDeps = { knowledge: fixtureRuntime }
    const slug = nextSlug('grant')
    await seedSite(slug, deps)
    const session = (await (
      await post('/api/ai/session', { slug }, deps)
    ).json()) as { sessionId: string }

    const client = scriptedClient([says('Noted.')])
    setModelClient(client)
    await frames(
      await post('/api/ai/prompt', { sessionId: session.sessionId, text: 'Hello.' }, deps),
    )

    // An equality rather than a handful of absences, so an operation added
    // upstream cannot slip into the grant unnoticed just because nobody here
    // thought to name it.
    const knowledgeTools = client.seen[0].tools
      .map((t) => t.name)
      .filter((n) => n.startsWith('Knowledge'))
      .sort()
    expect(knowledgeTools).toEqual([
      'KnowledgeChunkSearch',
      'KnowledgeGet',
      'KnowledgeSearch',
    ])

    // And the grant names this KB and only this one.
    const { granted } = knowledgeSurfaceFor(await fixtureRuntime())
    expect(JSON.stringify(granted)).toContain(SYSTEM_KB)
  })

  it('test_UAT_FC_REQ-158_without_a_built_kb_the_session_still_takes_a_turn', async () => {
    // DEGRADATION, NOT FAILURE, and it is the shape a fresh checkout ships in:
    // `1c assets` writes `export const KB = null` when nothing has been built, so
    // this is the ordinary path rather than an error path.
    const deps: RouterDeps = { knowledge: async () => null }
    const slug = nextSlug('nokb')
    await seedSite(slug, deps)

    const session = (await (
      await post('/api/ai/session', { slug }, deps)
    ).json()) as { sessionId: string }

    const client = scriptedClient([says('I had a look.')])
    setModelClient(client)
    const events = await frames(
      await post('/api/ai/prompt', { sessionId: session.sessionId, text: 'Hello.' }, deps),
    )
    expect(events.at(-1)?.kind).toBe('done')

    // The site tools survive; the knowledge tools are simply not offered, and
    // nothing in the priming promises a corpus that is not there.
    const tools = client.seen[0].tools.map((t) => t.name)
    expect(tools).toContain('set_l1')
    expect(tools.filter((n) => n.startsWith('Knowledge'))).toEqual([])
  })

  it('test_UAT_FC_REQ-158_an_absent_ai_binding_degrades_rather_than_throwing', async () => {
    // The second way to get `null`, and it must be as ordinary as the first: no
    // embedder means no search, which is a missing capability. Throwing here
    // would trade it for a missing product.
    expect(await systemKnowledge({}, { bundle: await fixtureBundle() })).toBeNull()
  })
})
