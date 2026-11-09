import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DescribedEmbedder,
  EmbeddingFailedError,
  PartialAiCredentialError,
  BINDING_ADVICE,
} from '../apps/control-app/src/embedder'
import {
  AiNotConfiguredError,
  PROJECT_KB,
  indexPrefix,
  projectKnowledgeFor,
} from '../apps/control-app/src/knowledge'
import {
  SYSTEM_KB,
  knowledgeSurfaceFor,
  systemKnowledge,
  type SystemKbBundle,
} from '../apps/control-app/src/system-knowledge'
import { sessionKnowledgeFor } from '../apps/control-app/src/session-knowledge'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import {
  MODEL_NAME,
  WorkersAiEmbedder,
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { applySchema } from './support/d1-site-factory'
import { STUB_DIM, stubEmbedder, stubVector } from './support/stub-embedder'

/**
 * Reconciliation UATs for story-5281f009 — **how the deployment reaches the
 * embedding model, and what it says when it cannot** ([[BUG-73]], reconciled in
 * BUNDLE-42: AC-2468 … AC-2470, AC-2472 … AC-2474).
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * database and a real R2 bucket, through the same openers the Worker calls —
 * `projectKnowledgeFor`, `systemKnowledge`, `sessionKnowledgeFor`, and the
 * `/api/material` route for the upload indexer. Configuration is the only input:
 * each case hands the deployment an env, and asserts which transport the real
 * `WorkersAiEmbedder` then used.
 *
 * TWO DOUBLES, AND BOTH ARE THE MODEL'S TWO TRANSPORTS. The `AI` binding is a
 * recording stand-in (miniflare has no local Workers AI), and the REST transport
 * is reached through a stubbed global `fetch` — the true network boundary to
 * api.cloudflare.com. Both answer in Workers AI's own `{shape, data}` payload with
 * stub vectors zero-padded to the model's width, which preserves unit norm, so
 * ranking still means something. Nothing of ours is replaced.
 *
 * The file-reading half of the same reconciliation — that one module decides
 * (AC-2471) and that the credential is never committed (AC-2475) — is in
 * `reconciliation-client-knowledge-embedder-transport.test.ts`, because it needs
 * a filesystem.
 */

/** The library is untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const APPLIED = applySchema()

/** bge-small-en-v1.5's vector width — the shipped model's dimension. */
const MODEL_DIM = 384

/** One Workers AI row per text: the stub's vector, zero-padded to the model width. */
function rows(texts: string[]): number[][] {
  return texts.map((text) => {
    const row = new Array<number>(MODEL_DIM).fill(0)
    const narrow = stubVector(text)
    for (let i = 0; i < STUB_DIM; i++) row[i] = narrow[i]
    return row
  })
}

/** A Workers AI binding that answers and records every call it receives. */
function recordingBinding(): {
  calls: { model: string; texts: string[] }[]
  run(model: string, input: unknown): Promise<unknown>
} {
  const calls: { model: string; texts: string[] }[] = []
  return {
    calls,
    async run(model: string, input: unknown) {
      const texts = ((input as { text?: string[] }).text ?? []) as string[]
      calls.push({ model, texts })
      const data = rows(texts)
      return { shape: [data.length, MODEL_DIM], data }
    },
  }
}

/** A binding whose every call fails the way an expired preview session does. */
function failingBinding(reference: string): { run(): Promise<never> } {
  return {
    async run() {
      throw new Error(`internal error; reference = ${reference}`)
    },
  }
}

/** Every outbound request the REST transport made, as the network saw it. */
interface RestRequest {
  url: string
  authorization: string | null
  texts: string[]
}

let restRequests: RestRequest[] = []
/** When set, every outbound request fails with this error instead of answering. */
let restFailure: Error | null = null

/**
 * The network boundary to api.cloudflare.com.
 *
 * Installed as the global `fetch` before any embedder is constructed, which is
 * when `WorkersAiEmbedder` binds the fetch it will use. Answers Workers AI's REST
 * envelope — `{success, result: {shape, data}}` — and records URL, bearer token
 * and texts so a case can assert WHERE the request went and WITH WHAT.
 */
async function fakeNetwork(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input as RequestInfo, init)
  const raw = await request.text()
  let texts: string[] = []
  try {
    const parsed = JSON.parse(raw) as { text?: string[] | string }
    texts = Array.isArray(parsed.text) ? parsed.text : parsed.text ? [parsed.text] : []
  } catch {
    texts = []
  }
  restRequests.push({
    url: request.url,
    authorization: request.headers.get('authorization'),
    texts,
  })
  if (restFailure) throw restFailure
  const data = rows(texts)
  return new Response(
    JSON.stringify({ success: true, errors: [], result: { shape: [data.length, MODEL_DIM], data } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

let accounts = 0
/** A fresh business per case: the store is a hard barrier, so cases cannot leak. */
function freshScope(label: string): Scope {
  accounts += 1
  return { businessId: `${label}-${accounts}` }
}

/** The deployment's env for one business, with whatever embedding config the case gives. */
function deployment(scope: Scope, embedding: Record<string, unknown>): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: scope.businessId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...embedding,
  } as unknown as RouterEnv
}

/** A material that satisfies [[DOC-38]] §9 — the happy shape, stated once. */
async function addMaterial(kb: Untyped, title: string, body: string): Promise<void> {
  await kb.store.create({
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
}

/** The fact that exists nowhere but the planted shipped document. */
const SHIPPED_FACT = 'A page is a tree of typed elements held in the draft store.'

/**
 * A system KB bundle indexed under the SHIPPED model's identity.
 *
 * Built by the component's own index builders with an embedder that names
 * `MODEL_NAME` at the model's width, so a query embedded by the deployment's
 * transport is comparable with it — search refuses an index built by another
 * model, so a stub-named bundle could not prove a REST query reached it.
 */
async function shippedBundle(): Promise<SystemKbBundle> {
  const docs: SystemKbBundle['docs'] = {
    'doc-storage.md': {
      text: `---\nuid: doc-storage\ntype: doc\ntitle: How pages are stored\nstatus: active\n---\n\n# How pages are stored\n\n${SHIPPED_FACT}\n`,
      updated_at: '2026-01-01T00:00:00Z',
    },
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
  const embedder = {
    name: MODEL_NAME,
    dimension: MODEL_DIM,
    async embed(texts: string[]) {
      return rows(texts).map((row) => Float32Array.from(row))
    },
  }
  const sources = { shipped: store }
  const index = memoryIndexSource()
  const chunks = memoryIndexSource()
  await buildIndex(store, kbs, index, { embedder, sources })
  await buildChunkIndex(store, kbs, chunks, { embedder, sources })
  return { index: index.files(), chunks: chunks.files(), docs }
}

/** A text upload through the Worker's own route, with a describer wired. */
async function uploadThroughRoute(routerEnv: RouterEnv, scope: Scope): Promise<Response> {
  const form = new FormData()
  form.append(
    'file',
    new File(['Our studio restores oxblood leather armchairs.'], 'studio.md', {
      type: 'text/markdown',
    }),
  )
  // Only the describer is supplied: the INDEXER is left to the route's own
  // default, which is the gate under test.
  const deps: RouterDeps = {
    describeText: async () => ({ text: 'A furniture restoration studio.', model: 'stub/digest-1' }),
  }
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv,
    scope,
    deps,
  )
}

beforeAll(async () => {
  await APPLIED
})

beforeEach(() => {
  restRequests = []
  restFailure = null
  vi.stubGlobal('fetch', fakeNetwork)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('story-5281f009 — configuration selects the transport', () => {
  it('test_UAT_AC2468_with_both_rest_credentials_set_every_kb_embeds_over_rest_and_never_touches_the_binding', async () => {
    // BOTH SET, WITH SURROUNDING WHITESPACE — the trimmed values are what must
    // reach the network. The binding is declared too, as it always is under
    // `wrangler dev`, and must still receive nothing.
    const scope = freshScope('ac2468')
    const binding = recordingBinding()
    const restEnv = deployment(scope, {
      AI: binding,
      CLOUDFLARE_ACCOUNT_ID: '  acct-2468  ',
      CLOUDFLARE_API_TOKEN: '\ttok-2468 ',
    })

    // The project knowledge base: open, index, search.
    const project = await projectKnowledgeFor(restEnv, scope)
    await addMaterial(project, 'Studio brief', 'We restore oxblood leather armchairs.')
    await project.refreshIndex()
    const projectHits = await project.search('oxblood leather armchairs')
    expect(projectHits.map((hit) => hit.title)).toContain('Studio brief')

    // The system knowledge base: open over the shipped bundle and search it.
    const system = await systemKnowledge(restEnv, { bundle: await shippedBundle() })
    expect(system, 'a REST-configured deployment opens the system KB').not.toBeNull()
    const { surface } = knowledgeSurfaceFor(system)
    const systemHits = (await (surface as Untyped).search({
      query: 'how pages are stored in the draft store',
      kb: [SYSTEM_KB],
      top_k: 1,
    })) as { uid: string }[]
    expect(systemHits.map((hit) => hit.uid)).toEqual(['doc-storage'])

    // EVERY EMBED WENT TO THE CONFIGURED ACCOUNT'S REST ENDPOINT, WITH THE TOKEN.
    expect(restRequests.length).toBeGreaterThan(0)
    for (const request of restRequests) {
      expect(request.url).toContain('/acct-2468/ai/run/')
      expect(request.url).toContain(MODEL_NAME)
      expect(request.url).not.toContain(' ')
      expect(request.authorization).toBe('Bearer tok-2468')
    }
    // Both the project's documents and the system query travelled this way.
    const embedded = restRequests.flatMap((request) => request.texts).join('\n')
    expect(embedded).toContain('oxblood')
    expect(embedded).toContain('draft store')
    // AND THE BINDING, DECLARED ALONGSIDE, WAS NEVER CALLED.
    expect(binding.calls).toEqual([])

    // EVERY GATE AGREES, WITH NO BINDING AT ALL: the session opens its project
    // half, and an upload is indexed rather than stored-and-invisible.
    const noBinding = deployment(scope, {
      CLOUDFLARE_ACCOUNT_ID: 'acct-2468',
      CLOUDFLARE_API_TOKEN: 'tok-2468',
    })
    const session = await sessionKnowledgeFor(noBinding as Untyped, scope, { system: null })
    expect(session, 'the session opens').not.toBeNull()
    expect([...session!.perKb.keys()]).toContain(PROJECT_KB)

    const before = restRequests.length
    const uploaded = await uploadThroughRoute(noBinding, scope)
    expect(uploaded.status, await uploaded.clone().text()).toBe(200)
    expect(((await uploaded.json()) as { indexed: boolean }).indexed).toBe(true)
    expect(restRequests.length).toBeGreaterThan(before)

    // A BLANK VALUE COUNTS AS UNSET. Both blank: the binding is used, as unset.
    const blankScope = freshScope('ac2468-blank')
    const blankBinding = recordingBinding()
    const blankRequestsBefore = restRequests.length
    const blank = await projectKnowledgeFor(
      deployment(blankScope, {
        AI: blankBinding,
        CLOUDFLARE_ACCOUNT_ID: '',
        CLOUDFLARE_API_TOKEN: '   ',
      }),
      blankScope,
    )
    await addMaterial(blank, 'Blank brief', 'Blank values are not a credential.')
    await blank.refreshIndex()
    expect(blankBinding.calls.length).toBeGreaterThan(0)
    expect(restRequests.length).toBe(blankRequestsBefore)

    // One real, one blank: the blank half is unset, so this is half a pair —
    // not a configured REST transport sending an empty bearer token.
    await expect(
      projectKnowledgeFor(
        deployment(blankScope, {
          AI: recordingBinding(),
          CLOUDFLARE_ACCOUNT_ID: 'acct-2468',
          CLOUDFLARE_API_TOKEN: '  ',
        }),
        blankScope,
      ),
    ).rejects.toThrow(PartialAiCredentialError)
    expect(restRequests.length).toBe(blankRequestsBefore)
  })

  it('test_UAT_AC2469_with_neither_rest_credential_set_embedding_uses_the_ai_binding_exactly_as_before', async () => {
    // Production's shape: a binding and no credential.
    const scope = freshScope('ac2469')
    const binding = recordingBinding()
    const kb = await projectKnowledgeFor(deployment(scope, { AI: binding }), scope)
    await addMaterial(kb, 'Production brief', 'The binding carries every embed in production.')
    await kb.refreshIndex()
    const hits = await kb.search('binding carries every embed')
    expect(hits.map((hit) => hit.title)).toContain('Production brief')

    // The binding received the calls, for the SHIPPED model.
    expect(binding.calls.length).toBeGreaterThan(0)
    for (const call of binding.calls) expect(call.model).toBe(MODEL_NAME)
    expect(binding.calls.flatMap((call) => call.texts).join('\n')).toContain('Production brief')
    // And nothing went out over the network.
    expect(restRequests).toEqual([])
  })

  it('test_UAT_AC2470_half_the_rest_credential_pair_is_a_named_error_with_no_fallback_to_the_binding', async () => {
    const halves = [
      {
        set: { CLOUDFLARE_ACCOUNT_ID: 'acct-2470' },
        present: 'CLOUDFLARE_ACCOUNT_ID',
        missing: 'CLOUDFLARE_API_TOKEN',
      },
      {
        set: { CLOUDFLARE_API_TOKEN: 'tok-2470' },
        present: 'CLOUDFLARE_API_TOKEN',
        missing: 'CLOUDFLARE_ACCOUNT_ID',
      },
    ]
    const bundle = await shippedBundle()

    for (const half of halves) {
      const scope = freshScope('ac2470')
      // A binding IS declared: falling back to it is exactly what is refused.
      const binding = recordingBinding()
      const halfEnv = deployment(scope, { AI: binding, ...half.set })

      const refusals: unknown[] = []
      // The project knowledge base.
      refusals.push(await projectKnowledgeFor(halfEnv, scope).catch((e: unknown) => e))
      // The system knowledge base — whose "nothing can embed" path answers null,
      // and which must not absorb a configuration mistake into that silence.
      refusals.push(await systemKnowledge(halfEnv, { bundle }).catch((e: unknown) => e))
      // The session's project-half gate.
      refusals.push(
        await sessionKnowledgeFor(halfEnv as Untyped, scope, { system: null }).catch(
          (e: unknown) => e,
        ),
      )

      for (const refusal of refusals) {
        expect(refusal, `${half.present} alone`).toBeInstanceOf(PartialAiCredentialError)
        const message = (refusal as Error).message
        expect(message).toContain(`${half.present} is set but ${half.missing} is not`)
        expect(message).toContain('Both are needed together')
        expect(message).toMatch(/Set both .* or neither to use the AI binding/s)
      }

      // The upload indexer's gate, through the Worker's own route: the refusal
      // reaches the caller as the named mistake rather than as an upload stored
      // unindexed on the binding.
      const uploaded = await uploadThroughRoute(halfEnv, scope)
      expect(uploaded.status).toBe(500)
      const body = (await uploaded.json()) as { error: string }
      expect(body.error).toContain(`${half.present} is set but ${half.missing} is not`)

      // NO FALLBACK: the binding stub received nothing, and nothing went out.
      expect(binding.calls).toEqual([])
      expect(restRequests).toEqual([])
    }
  })
})

describe('story-5281f009 — what the embedder is, and what its failure says', () => {
  it('test_UAT_AC2473_the_embedder_handed_out_reports_the_models_name_and_dimension_and_returns_its_vectors_untouched', async () => {
    // THE DECORATOR OVER A KNOWN INNER: same name, same dimension, same vectors.
    const vectors = [Float32Array.from([0.6, 0.8, 0])]
    const inner = { name: 'known/model-3', dimension: 3, embed: async () => vectors }
    const wrapped = new DescribedEmbedder(inner, 'binding', PROJECT_KB)
    expect(wrapped.name).toBe('known/model-3')
    expect(wrapped.dimension).toBe(3)
    await expect(wrapped.embed(['q'])).resolves.toBe(vectors)

    // THE EMBEDDER A KNOWLEDGE BASE ACTUALLY RECEIVES reports what the
    // underlying Workers AI embedder reports, and returns the model's rows.
    const scope = freshScope('ac2473')
    const binding = recordingBinding()
    const kb = await projectKnowledgeFor(deployment(scope, { AI: binding }), scope)
    const underlying = new WorkersAiEmbedder({ binding })
    expect(kb.embedder.name).toBe(underlying.name)
    expect(kb.embedder.dimension).toBe(underlying.dimension)
    expect(kb.embedder.name).toBe(MODEL_NAME)
    expect(kb.embedder.dimension).toBe(MODEL_DIM)
    const viaKb = (await kb.embedder.embed(['oxblood'])) as ArrayLike<number>[]
    expect(viaKb).toHaveLength(1)
    expect(Array.from(viaKb[0])).toEqual(rows(['oxblood'])[0])

    // AN INDEX BUILT THROUGH IT RECORDS THE SHIPPED MODEL'S NAME AND DIMENSION.
    await addMaterial(kb, 'Width brief', 'The index records what built it.')
    await kb.refreshIndex()
    const prefix = indexPrefix(scope.businessId, PROJECT_KB, 'index')
    const listed = await (env.BLOBS as R2Bucket).list({ prefix })
    expect(listed.objects.length).toBeGreaterThan(0)
    const recorded: string[] = []
    for (const object of listed.objects) {
      const body = await (env.BLOBS as R2Bucket).get(object.key)
      if (body) recorded.push(await body.text())
    }
    const meta = recorded
      .map((text) => {
        try {
          return JSON.parse(text) as Record<string, unknown>
        } catch {
          return null
        }
      })
      .find((parsed) => parsed !== null && JSON.stringify(parsed).includes(MODEL_NAME))
    expect(meta, 'an index object names the model').toBeDefined()
    expect(JSON.stringify(meta)).toContain(MODEL_NAME)
    expect(JSON.stringify(meta)).toMatch(new RegExp(`\\b${MODEL_DIM}\\b`))
  })

  it('test_UAT_AC2472_an_embedding_failure_is_a_named_error_carrying_transport_and_kb_with_binding_advice', async () => {
    const reference = '6knvuijid52gaa1eks2l9jl5'

    // ON THE BINDING: the embedder the project knowledge base receives.
    const bindingScope = freshScope('ac2472-binding')
    const viaBinding = await projectKnowledgeFor(
      deployment(bindingScope, { AI: failingBinding(reference) }),
      bindingScope,
    )
    const bindingError = (await viaBinding.embedder
      .embed(['q'])
      .catch((e: unknown) => e)) as EmbeddingFailedError
    expect(bindingError).toBeInstanceOf(EmbeddingFailedError)
    expect(bindingError.transport).toBe('binding')
    expect(bindingError.kb).toBe(PROJECT_KB)
    expect(bindingError.message).toContain('binding transport')
    expect(bindingError.message).toContain(`${PROJECT_KB} knowledge base`)
    expect(bindingError.message).toContain(`reference = ${reference}`)
    expect((bindingError.cause as Error).message).toBe(`internal error; reference = ${reference}`)
    // The operator advice rides the binding failure.
    expect(bindingError.message).toContain(BINDING_ADVICE)
    expect(BINDING_ADVICE).toContain('preview session')
    expect(BINDING_ADVICE).toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(BINDING_ADVICE).toContain('CLOUDFLARE_API_TOKEN')
    // THE ADVICE SAYS WHAT RESTORES THE SESSION: a worker reload, which touching
    // a source file triggers. Asserted on the message the operator reads, in the
    // advice's own words, so dropping the reload clause fails here.
    expect(bindingError.message).toMatch(/refreshes it\s+on worker reload/)
    expect(bindingError.message).toContain('touching a source file restores it')

    // ON THE BINDING, FOR THE SYSTEM KNOWLEDGE BASE: the embedder the real
    // `systemKnowledge` opener hands its runtime, over a failing binding. The
    // failure names the system KB — not the project KB — with the same advice.
    const viaSystem = (await systemKnowledge(
      deployment(freshScope('ac2472-system'), { AI: failingBinding(reference) }),
      { bundle: await shippedBundle() },
    )) as Untyped
    expect(viaSystem, 'a binding-configured deployment opens the system KB').not.toBeNull()
    const systemError = (await viaSystem.embedder
      .embed(['how pages are stored'])
      .catch((e: unknown) => e)) as EmbeddingFailedError
    expect(systemError).toBeInstanceOf(EmbeddingFailedError)
    expect(systemError.transport).toBe('binding')
    expect(systemError.kb).toBe(SYSTEM_KB)
    expect(systemError.kb).not.toBe(PROJECT_KB)
    expect(systemError.message).toContain(`${SYSTEM_KB} knowledge base`)
    expect(systemError.message).toContain('binding transport')
    expect(systemError.message).toContain(`reference = ${reference}`)
    expect(systemError.message).toMatch(/refreshes it\s+on worker reload/)
    expect(systemError.message).toContain('touching a source file restores it')

    // ON REST: the network call itself fails.
    const restScope = freshScope('ac2472-rest')
    restFailure = new Error(`internal error; reference = ${reference}`)
    const viaRest = await projectKnowledgeFor(
      deployment(restScope, { CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_API_TOKEN: 'tok' }),
      restScope,
    )
    const restError = (await viaRest.embedder
      .embed(['q'])
      .catch((e: unknown) => e)) as EmbeddingFailedError
    expect(restError).toBeInstanceOf(EmbeddingFailedError)
    expect(restError.transport).toBe('REST')
    expect(restError.kb).toBe(PROJECT_KB)
    expect(restError.message).toContain('REST transport')
    expect(restError.message).toContain(`${PROJECT_KB} knowledge base`)
    expect(restError.message).toContain(`reference = ${reference}`)
    expect(restError.cause).toBeDefined()
    // No preview-session advice on REST: there is no session to expire.
    expect(restError.message).not.toContain(BINDING_ADVICE)

    // ALREADY NAMED STAYS NAMED: an inner embedding-failed error passes through.
    const named = new EmbeddingFailedError('REST', SYSTEM_KB, new Error('first failure'))
    const layered = new DescribedEmbedder(
      {
        name: 'm',
        dimension: 1,
        async embed() {
          throw named
        },
      },
      'binding',
      PROJECT_KB,
    )
    const passed = (await layered.embed(['q']).catch((e: unknown) => e)) as EmbeddingFailedError
    expect(passed).toBe(named)
    expect(passed.transport).toBe('REST')
    expect(passed.kb).toBe(SYSTEM_KB)
    expect(passed.message).toBe(named.message)
  })

  it('test_UAT_AC2474_when_nothing_can_embed_project_kb_refuses_system_kb_answers_null_and_a_session_still_opens', async () => {
    const scope = freshScope('ac2474')
    // No binding, no credential.
    const nothing = deployment(scope, {})

    // The project knowledge base refuses by name.
    const refusal = await projectKnowledgeFor(nothing, scope).catch((e: unknown) => e)
    expect(refusal).toBeInstanceOf(AiNotConfiguredError)

    // The system knowledge base answers null and does not throw.
    await expect(systemKnowledge(nothing, { bundle: await shippedBundle() })).resolves.toBeNull()

    // A session still opens with whatever it can reach — here a pre-opened
    // system runtime — and contains no project knowledge base.
    const systemRuntime = await systemKnowledge(
      {},
      { bundle: await shippedBundle(), embedder: stubEmbedder() },
    )
    const session = await sessionKnowledgeFor(nothing as Untyped, scope, { system: systemRuntime })
    expect(session, 'the session opens').not.toBeNull()
    expect([...session!.perKb.keys()]).toEqual([SYSTEM_KB])
    expect(session!.perKb.has(PROJECT_KB)).toBe(false)
    // And with nothing reachable at all, opening completes without raising.
    await expect(
      sessionKnowledgeFor(nothing as Untyped, scope, { system: null }),
    ).resolves.toBeNull()
    expect(restRequests).toEqual([])
  })
})
