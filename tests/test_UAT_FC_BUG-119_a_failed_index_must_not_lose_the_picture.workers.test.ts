import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { IMAGE_SECRET, generatedMaterialStore } from '../apps/control-app/src/imagegen'
import { listMaterial, readMaterial } from '../apps/control-app/src/material'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { bytesOf } from './support/material-fixtures'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[BUG-119]] — **a failed index must not lose the picture that was paid for**.
 *
 * WHAT WAS REPORTED. The builder assistant generated the same image twice and was
 * told both times that it *"was generated but could not be stored, so there is no
 * ticket to hand on. This is a deployment fault."* It stopped, correctly, rather
 * than spend more of the operator's money into a void.
 *
 * WHAT HAD ACTUALLY HAPPENED. Nothing failed to store. Both pictures were in the
 * Library — record, vocabulary, bytes and all — for the whole conversation. What
 * threw was the step AFTER the store: the knowledge index refresh this product
 * folds into the plugin's store handle, over an embedder that was broken all
 * session ([[BUG-117]]). The plugin can only read a throw out of a store handle
 * as `store_unavailable`, so a recoverable, self-healing index miss was reported
 * as an unrecoverable deployment fault and the uid of the stored picture was
 * discarded with the error.
 *
 * WHAT MAKES THIS EVIDENCE. The end-to-end claims go through `route()` — the
 * Worker's own route table — over a real D1 database and real R2 buckets inside
 * workerd, with the real ticket store, the real type pack, the real plugin, the
 * real tool loop and the real normalisation. Two doubles, both genuinely
 * external: the Anthropic client and the image provider's REST endpoint, exactly
 * as [[REQ-208]]'s suite argues. The index seam is not doubled to avoid work —
 * it is MADE TO FAIL, because the failure is the subject.
 *
 * THE CLAIMS:
 *
 *   1. A FAILING INDEX DOES NOT COST THE PICTURE. The model is handed the
 *      record, not a deployment fault, and the material is in the Library with
 *      its bytes.
 *   2. AND THE LOSS OF SEARCHABILITY IS LOUD, naming the uid, so a window of
 *      invisibility is never silent.
 *   3. A REAL STORE FAILURE IS STILL A REAL STORE FAILURE. Swallowing the index
 *      error must not have swallowed the thing `store_unavailable` is for.
 *   4. THE SAME RULE ON THE UPLOAD PATH, which awaits the same seam after
 *      storing the client's own file.
 */

const APPLIED = applySchema()

const ORIGIN = 'https://app.test'

/** A real 3×2 PNG, so the component measures real dimensions off real bytes. */
const PNG_3x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

/** A recording `fetch` that answers one image in the provider's own shape. */
function fakeProvider(): typeof fetch & { calls: unknown[] } {
  const impl = async (_url: unknown, init: { body: string }) => {
    impl.calls.push(JSON.parse(init.body))
    return { status: 200, ok: true, json: async () => ({ data: [{ b64_json: PNG_3x2 }] }) }
  }
  impl.calls = [] as unknown[]
  return impl as unknown as typeof fetch & { calls: unknown[] }
}

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    [IMAGE_SECRET]: 'test-image-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** A business with the schema applied, its tenant registered, and one site. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = scopeOf(id)
  const seed = siteSeed({ slug: `site-${id}` })
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({
          name,
          page: page as Record<string, unknown>,
        })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: ((await imported.json()) as { site: string }).site }
}

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps,
): Promise<ScriptedClient> {
  const workerEnv = routerEnv()
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string }

  const client = scriptedClient(script)
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, text: 'We have no photographs.' }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  return client
}

/** The tool name the model is offered — the declaration's `tool`, not its `op`. */
const IMAGE_TOOL = 'CreateImage'

/** One image call, then prose — the ordinary shape of a turn. */
const generates = (prompt: string): ModelStep[] => [
  calls(IMAGE_TOOL, { prompt }),
  says('I have made one — tell me if it is close.'),
]

/**
 * Every tool result the model was handed back, read off the LAST request alone.
 *
 * Each turn of the tool loop re-sends the whole conversation, so summing across
 * every request would count the first result once per subsequent round. The last
 * request carries the complete history exactly once.
 */
function toolResults(client: ScriptedClient): string[] {
  const out: string[] = []
  const last = client.seen[client.seen.length - 1]
  for (const message of last.messages) {
    const content = message.content
    if (!Array.isArray(content)) continue
    for (const block of content as Record<string, unknown>[]) {
      if (block.type === 'tool_result') out.push(JSON.stringify(block.content))
    }
  }
  return out
}

/** This business's real ticket store, for reading back what the tool wrote. */
async function ticketsFor(id: string): Promise<TicketStore> {
  return ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: id },
  )
}

/** An index seam that fails the way a broken embedder does. */
const INDEX_FAILURE = 'Embedding for the project knowledge base failed over the REST transport'
const failingIndex: NonNullable<RouterDeps['index']> = async () => async () => {
  throw new Error(INDEX_FAILURE)
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
  vi.restoreAllMocks()
})

describe('BUG-119 — a failed index must not lose the picture that was paid for', () => {
  it('test_UAT_FC_BUG-119_a_failing_index_does_not_cost_the_generated_picture', async () => {
    // THE REPORTED FAILURE, REPRODUCED AND ANSWERED. The index refresh throws
    // exactly as it did in the session, and the model is handed the picture
    // rather than `store_unavailable` — which is the whole of what was lost.
    const id = 'bug119-generated'
    const { scope, slug } = await business(id)
    const provider = fakeProvider()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const client = await turn(scope, slug, generates('a warm bakery at dawn'), {
      imageFetch: provider,
      index: failingIndex,
    })

    // The provider was paid exactly once, so this is the expensive case.
    expect(provider.calls).toHaveLength(1)

    const [result] = toolResults(client)
    // NOT A DEPLOYMENT FAULT. The two sentences the report quoted must not
    // appear — the operation succeeded and the model must be told so.
    expect(result).not.toContain('store_unavailable')
    expect(result).not.toContain('could not be stored')
    expect(result).not.toContain('deployment fault')

    // AND THE PICTURE IS IN THE LIBRARY, with its bytes, carrying this product's
    // own vocabulary — everything the store handle wrote before the index ran.
    const tickets = await ticketsFor(id)
    const rows = await listMaterial(tickets)
    expect(rows).toHaveLength(1)
    expect(rows[0].origin).toBe('generated')
    expect(rows[0].content_type).toBe('image/png')
    const { attachments } = await tickets.attachments({ uid: rows[0].uid })
    expect(attachments).toHaveLength(1)
    // The body is the prompt, which is what makes the description free.
    expect((await readMaterial(tickets, rows[0].uid)).body).toContain('a warm bakery at dawn')

    // THE MODEL CAN NAME IT. A result that does not carry the uid is a picture
    // nobody can ask for again, which is the loss this ticket is about.
    expect(result).toContain(rows[0].uid)

    // AND THE LOSS OF SEARCHABILITY IS LOUD. [[DOC-39]] §4: unindexed is
    // INVISIBLE, not stale, so a silent skip would be indistinguishable from a
    // working deployment.
    const said = warn.mock.calls.map((c) => String(c[0])).join('\n')
    expect(said).toContain(rows[0].uid)
    expect(said).toMatch(/NOT indexed/)
    // Carrying the cause, so the next occurrence diagnoses itself rather than
    // being as opaque as this one was.
    expect(said).toContain(INDEX_FAILURE)
  })

  it('test_UAT_FC_BUG-119_a_real_store_failure_is_still_a_real_store_failure', async () => {
    // Swallowing the index error must not have swallowed the thing
    // `store_unavailable` is FOR. The store here is the real one — real D1, the
    // real type pack, the real `attach` — over an R2 bucket that refuses the
    // blob write, which is a genuinely external failure and the actual shape of
    // a store that is unavailable.
    const id = 'bug119-storefail'
    await APPLIED
    await ensureTenant(id)

    const refuses = {
      ...(env.BLOBS as R2Bucket),
      put: async () => {
        throw new Error('R2 refused the write')
      },
    } as unknown as R2Bucket
    const store = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: refuses }, scopeOf(id))

    // An index that WORKS, so nothing about this case is about the index.
    const indexed: string[] = []
    const handle = generatedMaterialStore(
      store,
      () => 'stub/image-1',
      async (uid: string) => {
        indexed.push(uid)
      },
    )

    const { ticket } = await handle.create({ type: 'material', title: 'a shopfront', body: 'p' })
    await expect(
      handle.attach({
        uid: ticket.uid,
        bytes: bytesOf('not really a png'),
        filename: 'shopfront.png',
        content_type: 'image/png',
      }),
    ).rejects.toThrow()
    // The bytes never landed, so the index was never reached — the handle fails
    // at the store, which is what makes `store_unavailable` mean what it says.
    expect(indexed).toEqual([])
  })

  it('test_UAT_FC_BUG-119_an_upload_survives_a_failing_index_too', async () => {
    // THE SAME SEAM, THE OTHER CALLER. The client's file is stored before the
    // refresh runs, so failing the upload over it would lose their file to a
    // problem they cannot see — and the retry would leave a duplicate.
    const id = 'bug119-upload'
    await APPLIED
    await ensureTenant(id)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const form = new FormData()
    form.append(
      'file',
      new File([bytesOf('a bakery brand guide') as unknown as BlobPart], 'brand.txt', {
        type: 'text/plain',
      }),
    )
    const response = await route(
      new Request(`${ORIGIN}/api/material`, { method: 'POST', body: form }),
      routerEnv(),
      scopeOf(id),
      {
        index: failingIndex,
        describeText: async () => ({ text: 'A bakery brand guide.', model: 'stub/digest-1' }),
      },
    )

    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    // SAID, NOT SWALLOWED. The envelope carries the honest answer so a surface
    // can tell the client their file is here but not yet findable.
    expect(body.indexed).toBe(false)
    const said = warn.mock.calls.map((c) => String(c[0])).join('\n')
    expect(said).toContain(String(body.uid))
    expect(said).toMatch(/NOT indexed/)

    // Stored regardless, with its bytes.
    const tickets = await ticketsFor(id)
    const rows = await listMaterial(tickets)
    expect(rows).toHaveLength(1)
    expect((await tickets.attachments({ uid: rows[0].uid })).attachments).toHaveLength(1)
  })
})
