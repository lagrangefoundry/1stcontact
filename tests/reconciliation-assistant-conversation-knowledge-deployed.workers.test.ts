import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { SYSTEM_KB, systemKnowledge, type SystemKbBundle } from '../apps/control-app/src/system-knowledge'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import {
  CARETAKER_PURPOSE,
  resetAiHost,
  setModelClient,
} from '../tools/generate/src/cli/ai/host-core'
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
 * **The knowledge half of one continuing conversation, on the host that is
 * actually deployed** (story-a58a0974 — AC-1317, AC-1319, AC-1320, AC-1517).
 *
 * The companion `reconciliation-assistant-conversation-knowledge.test.ts` proves
 * the same four properties against the host that runs on the operator's machine,
 * where the corpus is two directories on a disk. Until REQ-158 that was the only
 * place they held, and AC-1320 said so outright: on the deployed host the corpus
 * was reachable only from the operator's own machine and so was simply absent.
 * That sentence is now false of the shipped code, and these cases are what makes
 * the criteria's "on either host" clause an observation rather than a hope.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs INSIDE workerd, through the
 * Worker's own route table, against a real D1 database and a real R2 bucket. The
 * corpus is resolved by the knowledge component's own store, both indexes are
 * built by its own builders, the search is its own search, the tool surface is the
 * bridge's `KnowledgeToolbox`, the priming is the bridge's `KnowledgeDocs`, and
 * the session manager, role assembly, tool loop and audit trail are the real
 * thing.
 *
 * TWO DOUBLES, BOTH AT MODEL BOUNDARIES. The embedder — miniflare has no local
 * Workers AI to reach, and no claim here is about embedding quality — and the
 * Anthropic client, which is the network and which speaks the streaming wire
 * protocol the backend really consumes.
 *
 * THE CORPUS IS PLANTED BY THESE CASES AND NOT READ OUT OF THE RELEASE. The
 * built-in `KB` is whatever `1c kb build` exported for this checkout: a release
 * artefact whose contents change when the design documents do, so asserting
 * against it would be asserting against whatever happened to be exported that
 * week. Handing a bundle in through `deps.knowledge` means "answered from the
 * document" is a claim about a document these cases wrote. That the corpus travels
 * in the artifact at all — as values, with no filesystem anywhere on the path — is
 * the other half of AC-1517 and is asserted over the shipped artifact in
 * `reconciliation-assistant-conversation-knowledge-artifact.test.ts`, because a
 * passing turn cannot establish it: `node:fs` resolves in this runtime and answers
 * with a per-instance scratch disk.
 */

const TENANT = 'ac1317-deployed'

/** The fact that exists nowhere but the planted document. */
const PLANTED = 'The Ravensblack Ledger is retained for eleven days and then discarded.'
/** A second document that mentions the territory without answering the question. */
const DISTRACTOR = 'Publishing snapshots the draft into a numbered revision.'
/** The corpus stamp, carried through both halves of the bundle. */
const STAMP = '2026-08-31T00:00:00Z'
/** A territory heading from the map, and the document it routes to. */
const TERRITORY = 'Retention and disposal'

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

${DISTRACTOR}
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

## ${TERRITORY}

*1 document · entry point: The Ravensblack Ledger retention rule (DOC-Z)*

How long things are kept and what happens when they are not.
`,
}

/**
 * A bundle built the way `1c assets` builds one — real component, real indexes.
 *
 * `memoryIndexSource()` is writable and reports its own `files()`, which is
 * precisely the residency the emitter serialises, so this is not a stand-in for
 * the build: it is the build's own final step, run in the runtime that consumes
 * it. Both halves are built from the SAME stamped corpus, because indexing an
 * unstamped corpus and then serving a stamped one produces no error at all — the
 * two simply disagree about how recent every document is, and recency is one of
 * the ranker's own inputs.
 */
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

/** A release carrying a corpus: opened through the Worker's own opener. */
async function releaseWithCorpus(): Promise<unknown> {
  return systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() })
}

/** A release built without a corpus — the shape `1c assets` emits as `KB = null`. */
async function releaseWithoutCorpus(): Promise<unknown> {
  return systemKnowledge({}, { bundle: null })
}

/**
 * A release that DOES carry a corpus, deployed where the embedding binding its
 * searches would run through is not configured. The second of AC-1320's two
 * causes, and it must be as ordinary as the first — reached through the real
 * degradation branch rather than by handing back `null` directly.
 */
async function releaseWithoutEmbedder(): Promise<unknown> {
  // `env` here carries no `AI`, which is exactly the deployment being described.
  return systemKnowledge({}, { bundle: await fixtureBundle() })
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
    ANTHROPIC_API_KEY: 'sk-ant-deploy-secret-not-a-real-key',
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
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string; content?: string })
}

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

interface Turn {
  /** What the model was sent — the priming, and the operations it was offered. */
  request: ModelRequest
  /** The assistant's own words, as the panel would show them. */
  answer: string
  /** Every event kind the stream carried, in order. */
  kinds: string[]
  sessionId: string
}

/** Open a site's conversation on the deployed host and speak one turn in it. */
async function turn(deps: RouterDeps, text: string, script: ModelStep[]): Promise<Turn> {
  const slug = nextSlug('kbdep')
  await seedSite(slug, deps)

  const opened = await post('/api/ai/session', { slug }, deps)
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
  expect(session.ready, session.error).toBe(true)

  const client = scriptedClient(script)
  setModelClient(client)

  const response = await post(
    '/api/ai/prompt',
    { sessionId: session.sessionId, text },
    deps,
  )
  expect(response.status).toBe(200)
  const events = await frames(response)
  expect(client.seen, 'the model was never called').not.toHaveLength(0)

  return {
    request: client.seen[0],
    answer: events
      .filter((e) => e.kind === 'text')
      .map((e) => e.content)
      .join(''),
    kinds: events.map((e) => e.kind),
    sessionId: session.sessionId,
  }
}

const offered = (request: ModelRequest): string[] => request.tools.map((t) => t.name)
const knowledgeOps = (request: ModelRequest): string[] =>
  offered(request)
    .filter((name) => name.startsWith('Knowledge'))
    .sort()

/**
 * An answer composed from what the host actually sent the model.
 *
 * A scripted `says('… eleven days …')` would pass whether or not the search found
 * anything — it would prove this file can type a sentence. Reading the tool result
 * back out of the request means the assertion can only hold if the fact travelled
 * out of the bundled corpus, through the component's search, back through the tool
 * loop and into the model's context.
 */
const quotesToolResult =
  (prefix: string): ModelStep =>
  (req: ModelRequest): WireEvent[] =>
    says(`${prefix}\n\n${JSON.stringify(req.messages)}`)(req)

/** Every audit object the turn's flush wrote, parsed. */
async function auditLines(sessionId: string): Promise<Record<string, unknown>[]> {
  const listed = await env.SITES.list({ prefix: `audit/${TENANT}/${sessionId}/` })
  const out: Record<string, unknown>[] = []
  for (const object of listed.objects) {
    const body = await env.SITES.get(object.key)
    if (body) out.push(JSON.parse(await body.text()) as Record<string, unknown>)
  }
  return out
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-1317 — one granted surface, on the deployed host too ──────────────────

describe('the corpus is reachable from the same granted surface on the deployed host', () => {
  it('test_UAT_AC1317_the_deployed_corpus_is_searched_through_the_granted_surface_and_audited_like_an_edit', async () => {
    const deps: RouterDeps = { knowledge: releaseWithCorpus }
    const spoken = await turn(
      deps,
      'How long do we keep the Ravensblack Ledger?',
      [
        calls('KnowledgeSearch', {
          query: 'how long is the Ravensblack Ledger kept',
          kb: [SYSTEM_KB],
        }),
        quotesToolResult('Here is what the design documents say:'),
      ],
    )

    // COMPOSITION, not replacement. The three read operations are offered ALONGSIDE
    // the site operations, from one granted surface — asserted as an equality so an
    // operation added upstream cannot enter the grant unnoticed.
    expect(knowledgeOps(spoken.request)).toEqual([
      'KnowledgeChunkSearch',
      'KnowledgeGet',
      'KnowledgeSearch',
    ])
    expect(offered(spoken.request)).toContain('set_l1')
    expect(offered(spoken.request)).toContain('describe_page')

    // The corpus is reached by knowledge-base name and document identifier, never
    // by path and never with a site to get wrong.
    for (const tool of spoken.request.tools.filter((t) => t.name.startsWith('Knowledge'))) {
      const params = Object.keys(tool.input_schema.properties ?? {})
      expect(params, tool.name).not.toContain('slug')
      expect(params, tool.name).not.toContain('path')
      expect(params, tool.name).not.toContain('file')
    }

    // ANSWERED FROM THE DOCUMENT — the corpus that travelled with the release, not
    // a disk the deployed host cannot see.
    expect(spoken.answer).toContain('eleven days')
    // AND IT NAMES IT, so the assistant can attribute rather than assert.
    expect(spoken.answer).toContain('DOC-Z')
    // RANKED, not merely returned: the document that answers the question outranks
    // the one that merely mentions the territory. Without this the two assertions
    // above would be satisfied by handing back the whole corpus in corpus order.
    expect(spoken.answer.indexOf('DOC-Z')).toBeLessThan(spoken.answer.indexOf('DOC-Y'))
    // …carrying the document's own last-changed time — the stamp the index it was
    // ranked against was built from, not the reader's epoch default.
    expect(spoken.answer).toContain(STAMP)
    expect(spoken.answer).not.toContain('1970-01-01')

    // GATED, MARKED AND AUDITED EXACTLY AS AN EDIT IS: one policy, one sink, one
    // session identity, differing only in which surface answered.
    const lines = await auditLines(spoken.sessionId)
    const search = lines.find((line) => line.surface === 'knowledge')
    expect(search, `no knowledge call in ${JSON.stringify(lines)}`).toBeDefined()
    expect(search).toMatchObject({ tool: 'KnowledgeSearch', effect: 'read' })
    expect(search!.policy).toEqual({ decision: 'allow', rule: null })
    expect((search!.outcome as { ok: boolean }).ok).toBe(true)

    // A retrieved document is authored text arriving in the model's context, so it
    // reaches the model MARKED as untrusted content. Asserted here on the marking
    // ARRIVING rather than on its exact delimiters: the constants are exported from
    // the library's Node rung and not from the `/workers` one this host reaches, and
    // the companion Node case already holds the declaration and the open/close pair
    // to their literal values.
    const result = JSON.stringify(spoken.request.messages)
    expect(result.toLowerCase()).toContain('untrusted')
  })
})

// ── AC-1319 — the map, then the purpose, then the manual, on the deployed host ─

describe('a deployed conversation is primed with the map and the manual, not the documents', () => {
  it('test_UAT_AC1319_the_deployed_priming_carries_the_map_then_the_purpose_then_the_manual', async () => {
    const spoken = await turn({ knowledge: releaseWithCorpus }, 'Hello.', [says('Noted.')])
    const priming = spoken.request.system

    // THE MAP IS THERE, and it routes: a territory, and where to start reading.
    expect(priming).toContain(TERRITORY)
    expect(priming).toContain('DOC-Z')

    // …AND THE PILE IS NOT. This is the property the whole design rests on: the
    // corpus can grow without the primed context growing with it, because what is
    // primed is a map and the means to pull the rest, never the bodies.
    expect(priming).not.toContain(PLANTED)
    expect(priming).not.toContain(DISTRACTOR)

    // The manual is a projection of the operations this session was ACTUALLY
    // granted, rather than a sentence written by hand about what it might have.
    expect(priming).toContain('KnowledgeSearch')
    expect(priming).toContain('set_l1')

    // THE ORDER IS LOAD-BEARING, asserted on the content: the map, then what this
    // assistant is here to do, then the manual last — so the last thing read is the
    // thing done first.
    expect(priming.indexOf(TERRITORY)).toBeGreaterThanOrEqual(0)
    expect(priming.indexOf(TERRITORY)).toBeLessThan(priming.indexOf(CARETAKER_PURPOSE))
    expect(priming.indexOf(CARETAKER_PURPOSE)).toBeLessThan(priming.indexOf('KnowledgeSearch'))
  })
})

// ── AC-1320 — two ways to have no corpus, and both are silent ────────────────

describe('no knowledge base to open is an ordinary silent state on the deployed host', () => {
  it('test_UAT_AC1320_a_release_with_no_corpus_and_one_with_no_embedder_are_both_silent', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      // ── a release built without a corpus ────────────────────────────────────
      errors.mockClear()
      const unbuilt = await turn({ knowledge: releaseWithoutCorpus }, 'Hello.', [
        says('I had a look.'),
      ])

      // The turn runs to its completion, the site operations are offered, and no
      // knowledge operation is.
      expect(unbuilt.kinds.filter((kind) => kind === 'done')).toHaveLength(1)
      expect(offered(unbuilt.request)).toContain('set_l1')
      expect(offered(unbuilt.request)).toContain('describe_page')
      expect(knowledgeOps(unbuilt.request)).toEqual([])

      // Nothing is reported as missing, because nothing is wrong: a builder that
      // cannot answer a question about the design documents is still a builder.
      expect(
        errors.mock.calls
          .map((call) => call.map(String).join(' '))
          .filter((line) => /knowledge/i.test(line)),
      ).toEqual([])

      // ── a corpus, deployed with no embedding binding ────────────────────────
      // The second cause, and it must look exactly like the first: the release
      // carries a knowledge base, but the model its searches would be embedded
      // through is not configured for this deployment.
      resetAiHost()
      resetChatHost()
      setModelClient(null)
      errors.mockClear()
      expect(await releaseWithoutEmbedder(), 'an absent AI binding must degrade').toBeNull()

      const unbound = await turn({ knowledge: releaseWithoutEmbedder }, 'Hello.', [
        says('I had a look.'),
      ])
      expect(unbound.kinds.filter((kind) => kind === 'done')).toHaveLength(1)
      expect(offered(unbound.request)).toContain('set_l1')
      expect(knowledgeOps(unbound.request)).toEqual([])
      expect(
        errors.mock.calls
          .map((call) => call.map(String).join(' '))
          .filter((line) => /knowledge/i.test(line)),
      ).toEqual([])
    } finally {
      errors.mockRestore()
    }
  })
})

// ── AC-1517 — the surface and the priming arrive together, or neither does ────

describe('the knowledge operations and the priming that describes them are a pair', () => {
  it('test_UAT_AC1517_the_deployed_surface_and_its_priming_arrive_together_or_not_at_all', async () => {
    // A RELEASE CARRYING A CORPUS: both arrive, in the same turn. A session
    // granted the corpus without the map would have no reason to believe there was
    // anything to find, and would never look.
    const knowing = await turn({ knowledge: releaseWithCorpus }, 'Hello.', [says('Noted.')])
    expect(knowledgeOps(knowing.request)).toEqual([
      'KnowledgeChunkSearch',
      'KnowledgeGet',
      'KnowledgeSearch',
    ])
    expect(knowing.request.system).toContain(TERRITORY)
    expect(knowing.request.system).toContain('DOC-Z')
    expect(knowing.kinds.filter((kind) => kind === 'done')).toHaveLength(1)

    // A RELEASE CARRYING NONE: neither arrives. A session primed with the map of a
    // corpus it was not granted would be told to read documents it cannot open.
    resetAiHost()
    resetChatHost()
    setModelClient(null)

    const unknowing = await turn({ knowledge: releaseWithoutCorpus }, 'Hello.', [says('Noted.')])
    expect(knowledgeOps(unknowing.request)).toEqual([])
    expect(unknowing.request.system).not.toContain(TERRITORY)
    expect(unknowing.request.system).not.toContain('DOC-Z')
    // …and the turn still completes on its site operations alone.
    expect(offered(unknowing.request)).toContain('set_l1')
    expect(unknowing.kinds.filter((kind) => kind === 'done')).toHaveLength(1)
  })
})
