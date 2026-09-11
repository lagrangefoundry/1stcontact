import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  route,
  resetChatHost,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type WireEvent,
} from './support/scripted-model-client'

/**
 * **The knowledge half of one continuing conversation, on the DEPLOYED host**
 * (story-a58a0974 — AC-1651, AC-1652, AC-1653).
 *
 * WHY A SEPARATE FILE FROM `reconciliation-assistant-conversation-knowledge`.
 * That file asserts the host-neutral knowledge criteria (AC-1317 … AC-1320) and
 * evidences them on the operator's own machine, where the corpus is two
 * directories on a disk. The three criteria here are the same properties pinned
 * *in the deployed runtime*, and the reconciliation decision that created them
 * says why they are not simply folded into the existing four: **the two hosts
 * construct the surface through different code and can fail independently.**
 * A criterion evidenced only where a filesystem exists says nothing about the
 * runtime that has none.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own `route()`, over the real `@lagrangefoundry/knowledge` component:
 * the corpus is resolved by its own resolver, both indexes are built by its
 * `buildIndex` and `buildChunkIndex`, the ranking is its own search, the tool
 * surface is the bridge's `KnowledgeToolbox` and the priming is the bridge's
 * `KnowledgeDocs`. The bundle handed in is the exact shape `1c assets` emits.
 * There is no filesystem on the query path, which is what makes reaching the
 * documents here evidence that a *packed* corpus is what was read.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES. The embedder ({@link stubEmbedder} —
 * miniflare has no local Workers AI to reach, and no claim here is about
 * embedding quality) and the Anthropic client (`scripted-model-client` — it is
 * the network). The story's Technical Context records both, in the same words.
 *
 * THE CORPUS IS PLANTED BY THIS FILE AND NOT READ OFF DISK, deliberately. The
 * built-in corpus is whatever `1c kb build` last exported for this checkout — a
 * release artefact whose contents change when the design documents do — so a
 * test asserting against it would assert against whichever documents happened to
 * be exported that week. Planting means "answered from the document" is a claim
 * about a document this file wrote.
 *
 * AND THE MODEL DOUBLE IS NOT TOLD THE ANSWER. {@link quotesToolResult} reads the
 * tool result back out of the request the host sent it. Scripting the answer as a
 * literal would prove only that this file can type a sentence; reading it back
 * proves the fact travelled out of the corpus, through the component's search,
 * back through the tool loop and into the model's context.
 */

const TENANT = 'ac165x'

/** The fact that exists nowhere but the planted document. */
const PLANTED = 'Ravensblack Ledger is retained for eleven days and then discarded.'

/** The corpus stamp, carried through both halves of the bundle. */
const STAMP = '2026-08-31T00:00:00Z'

/** The knowledge base this grant is confined to, as `kb/knowledge_bases.json` declares it. */
const SYSTEM_KB = 'system'

/**
 * The read set, in full.
 *
 * Asserted as an equality rather than as a handful of absences, because that is
 * what AC-1652 and AC-1318 both ask for in the same words: *an operation added
 * upstream cannot enter the grant unnoticed*. A list of `not.toContain` checks
 * passes for every operation nobody here thought to name.
 */
const READ_SET = ['KnowledgeChunkSearch', 'KnowledgeGet', 'KnowledgeSearch']

const CORPUS: Record<string, string> = {
  'DOC-Z.md': `---
id: DOC-Z
type: doc
title: The Ravensblack Ledger retention rule
fields:
  system_kb: true
---
# The Ravensblack Ledger retention rule

${PLANTED}
`,
  'DOC-Y.md': `---
id: DOC-Y
type: doc
title: Storage and revisions
fields:
  system_kb: true
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

// ── the capability under test, reached by name ───────────────────────────────

/** The bundle shape `1c assets` inlines: two indexes and the corpus text. */
interface SystemKbBundle {
  index: Record<string, string>
  chunks: Record<string, string>
  docs: Record<string, { text: string; updated_at: string }>
}

interface SystemKnowledgeModule {
  systemKnowledge(
    env: { AI?: unknown },
    opts?: { bundle?: SystemKbBundle | null; embedder?: unknown },
  ): Promise<unknown | null>
  knowledgeSurfaceFor(runtime: unknown): { surface: unknown; granted: Record<string, unknown> }
}

/**
 * The Worker-side opener, or a failure that says which criterion cannot be met.
 *
 * REACHED AT RUN TIME RATHER THAN STATICALLY, for the reason the packed-module
 * suite gives next door: a static import of a module a checkout does not carry is
 * a *resolution* failure, which takes the whole file down and says nothing useful
 * about which criterion is unmet. Resolved here, a checkout missing the
 * implementation fails these three tests — by name, with the reason — and leaves
 * every other suite reporting for itself.
 */
async function systemKnowledgeModule(): Promise<SystemKnowledgeModule> {
  const where = 'apps/control-app/src/system-knowledge'
  // Built rather than written literally, so the specifier is resolved at RUN time
  // by the runtime that will consume it, not at typecheck time by a compiler that
  // would otherwise report a checkout without the capability as a project-wide
  // type error rather than as these three criteria going unmet.
  const specifier = ['..', 'apps', 'control-app', 'src', 'system-knowledge'].join('/')
  let module: Record<string, unknown>
  try {
    module = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>
  } catch (cause) {
    throw new Error(
      `\`${where}\` cannot be resolved. This checkout does not carry the Worker-side ` +
        `system knowledge base — the packed-corpus opener, the model binding and the ` +
        `router wiring that let a conversation on the deployed runtime reach the design ` +
        `documents — so the criterion cannot be satisfied against it. (${String(cause)})`,
    )
  }
  for (const name of ['systemKnowledge', 'knowledgeSurfaceFor']) {
    if (typeof module[name] !== 'function') {
      throw new Error(
        `\`${name}\` is not exported by ${where}. This checkout does not carry the ` +
          `Worker-side system knowledge base, so the criterion cannot be satisfied ` +
          `against it.`,
      )
    }
  }
  return module as unknown as SystemKnowledgeModule
}

// ── the embedder double ──────────────────────────────────────────────────────

/** The stub's vector width. Small: it is a bag of words, not a model. */
const STUB_DIM = 64

function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/**
 * A deterministic embedder: a hashed bag of words, L2-normalised.
 *
 * The dot product the component takes as a cosine similarity is therefore a real
 * overlap measure — a query sharing words with a document scores above one that
 * does not — which is exactly enough for AC-1651's *ranked, not merely returned*
 * and honestly less than a real model, because it has no synonymy.
 *
 * INLINE RATHER THAN SHARED, deliberately: the equivalent fixture arrives with
 * the project knowledge base (REQ-159) and this file must not depend on a second
 * unlanded ticket to say what it is about.
 */
function stubEmbedder(): { name: string; dimension: number; embed(t: string[]): Promise<Float32Array[]> } {
  return {
    name: 'stub/hashed-bag-of-words-64',
    dimension: STUB_DIM,
    async embed(texts: string[]): Promise<Float32Array[]> {
      return texts.map((text) => {
        const vector = new Float32Array(STUB_DIM)
        const tokens = String(text ?? '')
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
        for (const token of tokens) vector[fnv1a(token) % STUB_DIM] += 1
        let sum = 0
        for (const value of vector) sum += value * value
        if (sum === 0) {
          vector[0] = 1
          return vector
        }
        const norm = Math.sqrt(sum)
        for (let i = 0; i < STUB_DIM; i++) vector[i] /= norm
        return vector
      })
    },
  }
}

// ── the fixture corpus, built the way the application build builds one ───────

/**
 * A bundle built by the component's own index builders.
 *
 * `memoryIndexSource()` is writable and reports its own `files()`, which is
 * precisely the residency the emitter serialises — so this is not a stand-in for
 * the build, it is the build's own final step, run in the runtime that consumes
 * it.
 */
async function fixtureBundle(): Promise<SystemKbBundle> {
  // Stamped, and the SAME stamped corpus both halves are built from — the
  // property AC-1651's last clause is about. Indexing an unstamped corpus and
  // then serving a stamped one produces no error at all: the two simply disagree
  // about how recent every document is, and recency is one of the ranker's inputs.
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

/** A knowledge runtime over the fixture, opened through the WORKER's own opener. */
async function fixtureRuntime(): Promise<unknown> {
  const { systemKnowledge } = await systemKnowledgeModule()
  return systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() })
}

// ── the deployed origin ──────────────────────────────────────────────────────

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
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

/**
 * An answer composed from what the host actually sent back.
 *
 * THE POINT OF THE INDIRECTION, and AC-1651 names it explicitly: *compose the
 * answer from what the host actually retrieved rather than from a scripted
 * sentence*. A scripted `says('… eleven days …')` would pass whether or not the
 * search found anything.
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

/** Open a conversation for a fresh site and return its identifier. */
async function openConversation(prefix: string, deps: RouterDeps): Promise<string> {
  const slug = nextSlug(prefix)
  await seedSite(slug, deps)
  const opened = await post('/api/ai/session', { slug }, deps)
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-1651: the sentence the whole mechanism exists to make true ────────────

describe('a conversation on the deployed runtime reads the design documents', () => {
  it('test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it', async () => {
    // Resolved BEFORE the turn is driven, not lazily inside it. `deps.knowledge`
    // is only reached once the route table knows to ask for it, so a checkout
    // without the capability would otherwise fail somewhere downstream and report
    // whatever broke there instead of the reason this criterion cannot be met.
    await systemKnowledgeModule()
    const deps: RouterDeps = { knowledge: fixtureRuntime } as RouterDeps
    const sessionId = await openConversation('kb', deps)

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
      { sessionId, text: 'How long do we keep the Ravensblack Ledger?' },
      deps,
    )
    expect(turn.status).toBe(200)
    const events = await frames(turn)
    expect(events.at(-1)?.kind).toBe('done')

    const answer = events
      .filter((event) => event.kind === 'text')
      .map((event) => event.content)
      .join('')

    // FROM THE DOCUMENT: the fact reached the model, and the only path it could
    // have taken is the packed corpus → search → tool loop. There is no
    // filesystem in this runtime to have read it from instead.
    expect(answer).toContain('eleven days')
    // AND IT NAMES IT: the hit carries the document's identity, so the operator
    // gets an attribution rather than an assertion.
    expect(answer).toContain('DOC-Z')
    // RANKED, NOT MERELY RETURNED — the clause that keeps the two above from
    // being vacuous. A search handing back the whole corpus in corpus order
    // would satisfy them exactly as well, so what is checked is that the
    // document which answers the question outranks the one that does not.
    expect(answer.indexOf('DOC-Z')).toBeLessThan(answer.indexOf('DOC-Y'))
    // And the corpus reached the model carrying the stamp it was INDEXED under,
    // rather than the doc reader's epoch default.
    expect(answer).toContain(STAMP)
  })
})

// ── AC-1652: primed with the map, granted the read set, on the deployed host ─

describe('the deployed session is primed with the map and granted the read set', () => {
  it('test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes', async () => {
    // Resolved before the turn, for the reason AC-1651's case gives.
    const { knowledgeSurfaceFor } = await systemKnowledgeModule()
    const deps: RouterDeps = { knowledge: fixtureRuntime } as RouterDeps
    const sessionId = await openConversation('prime', deps)

    const client = scriptedClient([says('Noted.')])
    setModelClient(client)
    const events = await frames(await post('/api/ai/prompt', { sessionId, text: 'Hello.' }, deps))
    expect(events.at(-1)?.kind).toBe('done')

    const system = client.seen[0].system
    // THE MAP IS THERE, and it routes: a territory heading, and the identifier of
    // the document that territory says to start at.
    expect(system).toContain('Retention and disposal')
    expect(system).toContain('DOC-Z')
    // THE PILE IS NOT. This is the property the whole design rests on — the
    // corpus can grow without the primed context growing with it.
    expect(system).not.toContain(PLANTED)

    const tools = client.seen[0].tools.map((tool) => tool.name)
    // BESIDE the site operations rather than instead of them: one surface, so a
    // knowledge call is gated, marked and audited by the machinery an edit is.
    expect(tools).toContain('set_l1')
    // READ-ONLY BY ABSENCE, asserted as an equality so an operation added
    // upstream cannot enter the grant unnoticed.
    expect(tools.filter((name) => name.startsWith('Knowledge')).sort()).toEqual(READ_SET)

    // And the grant the surface travels with names this knowledge base and no
    // other — filled from the declaration rather than from a literal here, which
    // is what will make a second knowledge base safe to add later.
    const { granted } = knowledgeSurfaceFor(await fixtureRuntime())
    expect(JSON.stringify(granted)).toContain(SYSTEM_KB)
  })
})

// ── AC-1653: the second route to no knowledge operations ────────────────────

describe('no embedding model is a second route to no knowledge operations', () => {
  it('test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations', async () => {
    const { systemKnowledge } = await systemKnowledgeModule()

    // ASKING FOR THE KNOWLEDGE BASE ANSWERS THAT THERE IS NONE, and does not
    // raise: a packed corpus IS present, and the only thing missing is the model
    // to search it with. Deferring the failure to the first question the operator
    // asks would be the same mistake in a later place.
    const bundle = await fixtureBundle()
    await expect(systemKnowledge({}, { bundle })).resolves.toBeNull()

    // AND THE CONVERSATION STILL TAKES A TURN. A deployment merely missing a
    // binding is a configuration mistake, not a broken build — so what is traded
    // away is an assistant that cannot look something up, never one that cannot
    // be talked to at all.
    const deps: RouterDeps = {
      knowledge: () => systemKnowledge({}, { bundle }),
    } as RouterDeps
    const sessionId = await openConversation('noai', deps)

    const client = scriptedClient([says('I had a look.')])
    setModelClient(client)
    const events = await frames(await post('/api/ai/prompt', { sessionId, text: 'Hello.' }, deps))

    // The turn reaches its completion…
    expect(events.at(-1)?.kind).toBe('done')
    expect(events.filter((event) => event.kind === 'done')).toHaveLength(1)

    const tools = client.seen[0].tools.map((tool) => tool.name)
    // …the site-changing operations are offered…
    expect(tools).toContain('set_l1')
    // …and the set of knowledge operations offered is EMPTY, asserted as an
    // emptiness: a session that failed to build its surface and one that
    // correctly built an empty one are indistinguishable to a test that only
    // checks the turn completed.
    expect(tools.filter((name) => name.startsWith('Knowledge'))).toEqual([])
  })
})
