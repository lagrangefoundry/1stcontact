import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import type { ProjectKnowledgeEnv } from '../apps/control-app/src/knowledge'
import { applySchema } from './support/d1-site-factory'
import { STUB_DIM, stubVector } from './support/stub-embedder'

/**
 * BUG-117 — **a REST-configured deployment can search its knowledge**.
 *
 * WHAT ACTUALLY BROKE, and it is not what the error said. The assistant was told
 * `corpus_unreadable` — *"an index or a store is missing or damaged… a deployment
 * fault, not something to retry differently"* — and stopped. The index was
 * intact. The audit record for those same calls carries the host's own account,
 * which the model was not shown:
 *
 *     Embedding for the project knowledge base failed over the REST transport:
 *     Illegal invocation: function called with incorrect `this` reference.
 *
 * `WorkersAiEmbedder` keeps its fetch on the instance and calls it as a method —
 * `await this._fetch(url, init)` — so the receiver is the embedder. workerd
 * refuses a native global invoked that way. Every embed over REST therefore
 * failed, which is why `search` was dead while `get`, `outline` and `changes`
 * (none of which embeds) kept answering: exactly the "it worked earlier in the
 * same session" shape the report describes.
 *
 * THE FIX IS THE SEAM UPSTREAM ALREADY DECLARES. `WorkersAiEmbedder`'s `fetch`
 * option is documented *"injected for tests and for hosts that wrap it"*, and a
 * Worker is such a host: `embedderFor` now hands it a fetch bound to the global
 * scope. Nothing else in this repository needs the same treatment — our own
 * fetch seams call bare (`doFetch(url)`), and claim 1 below is what establishes
 * that the bare form is the tolerated one.
 *
 * WHY THE ENDPOINT BELOW POLICES ITS OWN RECEIVER, which is the one thing about
 * this suite that would otherwise look like theatre.
 * `@cloudflare/vitest-pool-workers` overwrites `globalThis.fetch` with a
 * JavaScript wrapper — `(input, init) => originalFetch.call(globalThis, input,
 * init)` — and a JavaScript function does not care what its receiver is. So a
 * test that drove the pool's `fetch` would prove nothing at all: the defect is
 * invisible through it, which is precisely why no existing suite caught this.
 * The rule is still enforced in this runtime on globals the pool has not
 * replaced, so claim 1 establishes it live, quoting the runtime's own message,
 * and the stand-in then applies that same rule to the call the embedder makes.
 */

const APPLIED = applySchema()

const ACCOUNT = 'bug117acct'
const TOKEN = 'bug117-token'
const MODEL = '@cf/baai/bge-small-en-v1.5'
/** Workers AI's width for this model, and therefore what the rows must be. */
const MODEL_DIM = 384

/** Every REST call the embedder made, so the transport is asserted not assumed. */
interface Recorded {
  url: string
  authorization: string | null
  texts: string[]
  /** The receiver the endpoint was invoked with, as the runtime would see it. */
  receiverWasGlobal: boolean
}

let recorded: Recorded[] = []
let original: typeof fetch | null = null

/**
 * A stand-in Workers AI that refuses a foreign receiver the way workerd does.
 *
 * A `function` and not an arrow, because the receiver is the whole subject: an
 * arrow would close over the enclosing `this` and could never observe the fault.
 * `undefined` is accepted alongside the global for the reason claim 1 pins —
 * that is the runtime's own rule, not a convenience.
 */
function installStandIn(): void {
  original = globalThis.fetch
  const passthrough = original
  globalThis.fetch = async function (
    this: unknown,
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    if (this !== undefined && this !== globalThis) {
      throw new TypeError(
        'Illegal invocation: function called with incorrect `this` reference. ' +
          'See https://developers.cloudflare.com/workers/observability/errors/' +
          '#illegal-invocation-errors for details.',
      )
    }
    const url = String(input)
    if (!url.includes('api.cloudflare.com')) return passthrough(url, init)
    const headers = new Headers(init?.headers)
    const texts = (JSON.parse(String(init?.body ?? '{}')) as { text?: string[] }).text ?? []
    recorded.push({
      url,
      authorization: headers.get('authorization'),
      texts,
      receiverWasGlobal: this === globalThis,
    })
    return Response.json({
      success: true,
      result: { shape: [texts.length, MODEL_DIM], data: texts.map(wideVector) },
    })
  } as typeof fetch
}

/**
 * One row of the stand-in's response, at the model's real width.
 *
 * REUSES `stubVector` rather than inventing a second fake model: the retrieval
 * claim needs a vector space where a query that shares words with a document
 * outscores one that does not, and that is exactly what the shared stub already
 * is. Padding to the model's declared width is what makes it a *Workers AI*
 * response rather than a stub of a different shape — the embedder reads
 * `shape[1]`, and an index built at the wrong width would be wrong silently.
 */
function wideVector(text: string): number[] {
  const narrow = stubVector(text)
  const row = new Array<number>(MODEL_DIM).fill(0)
  for (let i = 0; i < STUB_DIM; i++) row[i] = narrow[i]
  return row
}

/** The deployment shape that selects REST: both halves of the credential, no `AI`. */
function restEnv(): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
    CLOUDFLARE_API_TOKEN: TOKEN,
  }
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  if (original !== null) globalThis.fetch = original
  original = null
  recorded = []
})

describe('BUG-117 — the receiver rule this runtime actually enforces', () => {
  it('UAT_FC_BUG-117 a native global refuses a foreign receiver and accepts a bare call', () => {
    // THE CLAIM THE WHOLE SUITE RESTS ON, made against the runtime rather than
    // asserted in prose. `btoa` is a native global the test pool has not
    // replaced, so it still carries workerd's receiver check — the one
    // `globalThis.fetch` would carry too if the pool had left it alone.
    const bare = btoa
    const holder = { encode: btoa }

    // The shape upstream's embedder uses: the function reached as a property of
    // something that is not the global scope.
    expect(() => holder.encode('hi')).toThrow(/Illegal invocation/)
    // And the message the audit recorded for the failing search, verbatim, so
    // this test is pinned to that incident and not to a lookalike.
    expect(() => holder.encode('hi')).toThrow(
      /function called with incorrect `this` reference/,
    )

    // The two forms that are fine — and the first is why nothing else in this
    // repository is affected: `fetch-guard.ts`, `mail.ts`, `resend.ts`,
    // `cloudflare.ts` and `resolver.ts` all default a seam to the bare global
    // and then call it bare.
    expect(bare('hi')).toBe('aGk=')
    expect(bare.bind(globalThis)('hi')).toBe('aGk=')
  })
})

describe('BUG-117 — a REST-configured knowledge base answers a search', () => {
  it('UAT_FC_BUG-117 a material indexed over the REST transport is found by search', async () => {
    installStandIn()
    // No `embedder` handed in: `projectKnowledgeFor` resolves one from the env
    // through `embedderFor`, which is the production path and the thing under
    // test. Real D1, real R2, the real shared knowledge component.
    const kb = await projectKnowledgeFor(restEnv(), { businessId: 'bug117-rest' })

    await kb.store.create({
      type: 'material',
      title: 'Positioning note',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
      },
      body: 'We are the only postpartum meal service in the county.',
    })
    await kb.refreshIndex()

    // The call that came back `corpus_unreadable` in the report. Before the fix
    // this rejects with `Illegal invocation` wrapped in `EmbeddingFailedError`;
    // the index and the store were never the problem.
    const hits = await kb.search('postpartum meal service county')
    expect(hits.map((hit) => hit.title)).toContain('Positioning note')
  })

  it('UAT_FC_BUG-117 the embedding request went to Workers AI over REST, credential and all', async () => {
    installStandIn()
    const kb = await projectKnowledgeFor(restEnv(), { businessId: 'bug117-transport' })
    await kb.store.create({
      type: 'material',
      title: 'Transport check',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
      },
      body: 'Something to embed.',
    })
    await kb.refreshIndex()

    // A pass that never left the building would be worthless: this is what says
    // the vectors came from the REST endpoint for THIS account with THIS
    // credential, rather than from a silent fall back to some other transport.
    expect(recorded.length).toBeGreaterThan(0)
    for (const call of recorded) {
      expect(call.url).toBe(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${MODEL}`,
      )
      expect(call.authorization).toBe(`Bearer ${TOKEN}`)
      // The receiver the host handed the endpoint. The defect was that this was
      // the embedder instance; the fix is that it is the global scope.
      expect(call.receiverWasGlobal).toBe(true)
    }
    expect(recorded.flatMap((call) => call.texts).join(' ')).toContain('Something to embed.')
  })
})
