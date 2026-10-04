import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import librarySurface from '../tools/generate/src/cli/ai/library-surface.json'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { bytesOf } from './support/material-fixtures'

/**
 * [[REQ-387]] — **the builder can read the client's Library, and read a
 * document's own words**.
 *
 * THE ORIGINATING FAILURE, restaged. A consultant delegated a page build and
 * told the builder to take testimonials verbatim from a document the client had
 * uploaded. The builder could not see the Library, reported the document "not
 * accessible", and put a placeholder on the page.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the real route inside workerd with
 * delegation on — REQ-355's harness. The document is uploaded through the real
 * material route, so its text lands in the real `material_text` comment; the
 * consultant's scripted turn delegates; the framework opens a real worker session
 * on the builder role; and what is asserted is the REQUEST THE WORKER WAS SENT —
 * its tools, and the tool result its own `get_library_item` produced. The doubles
 * are the Anthropic client and the upload's digest describer, both model
 * boundaries.
 */

const TENANT = 'req387'

/** The words the brief says to use verbatim — deep enough that a digest would not carry them. */
const TESTIMONIAL = '"Best sourdough north of the river, and they remembered my name." — Priya S.'

const DIGEST = 'Customer testimonials for a bakery.'

const TESTIMONIALS = [
  '# What our customers say',
  '',
  ...Array.from({ length: 20 }, (_, i) => `Routine kind word number ${i}.`),
  '',
  TESTIMONIAL,
].join('\n')

const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

const DEPS: RouterDeps = {
  knowledge: async () => null,
  index: async () => async () => {},
  describeText: async () => ({ text: DIGEST, model: 'stub/digest-1' }),
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
    { businessId: TENANT },
    DEPS,
  )

/** The client's upload, through the route their own Library uses. */
async function uploadReference(name: string, text: string): Promise<string> {
  const form = new FormData()
  form.append('file', new File([bytesOf(text) as unknown as BlobPart], name, { type: 'text/markdown' }))
  form.append('role', 'reference')
  const response = await route(
    new Request('https://app.example/api/material', { method: 'POST', body: form }),
    workerEnv(),
    { businessId: TENANT },
    DEPS,
  )
  expect(response.status).toBe(200)
  return String(((await response.json()) as { uid: string }).uid)
}

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** One double, both sides of the hand-off, routed by model — REQ-295's `twoSided`. */
function twoSided(caller: ModelStep[], worker: ModelStep[]): ScriptedClient {
  let atCaller = 0
  let atWorker = 0
  const step: ModelStep = (req) => {
    const [script, index] =
      req.model === WORKER_MODEL ? [worker, atWorker++] : [caller, atCaller++]
    return script[Math.min(index, script.length - 1)](req)
  }
  return scriptedClient([step])
}

const toolNames = (req: ModelRequest): string[] => req.tools.map((tool) => tool.name).sort()

/** The text of every tool result a request carries, in order. */
function toolResults(req: ModelRequest): string[] {
  const out: string[] = []
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as { type?: string; content?: unknown }[]) {
      if (block?.type !== 'tool_result') continue
      out.push(typeof block.content === 'string' ? block.content : JSON.stringify(block.content))
    }
  }
  return out
}

const delegates = calls(DELEGATE_TOOL, {
  note: 'Building the testimonials section now.',
  role: BUILDER_ROLE,
  goal: 'Add a testimonials section to the home page, quoting the client document verbatim.',
  accept: ['the testimonials are quoted word for word'],
})

const reports = calls(REPORT_TOOL, { summary: 'Done.', changed: [], decisions: [], passed: [] })

/** Delegate, and let the worker run `worker` before it reports. */
async function delegateAndCapture(prefix: string, worker: ModelStep[] = []): Promise<ModelRequest[]> {
  configureDelegation(ENABLED)
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = twoSided([delegates, says('Handed over.')], [...worker, reports, says('Reported.')])
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Add the testimonials.' }))
  const turns = client.seen.filter((req) => req.model === WORKER_MODEL)
  expect(turns.length).toBeGreaterThan(0)
  return turns
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-387 — the builder reads the client Library, read-only', () => {
  it('test_UAT_FC_REQ-387_the_builder_is_offered_the_librarys_reads_and_none_of_its_writes', async () => {
    const [first] = await delegateAndCapture('grant')
    const offered = toolNames(first)
    const operations = librarySurface.operations as { op: string; tool?: string; effect: string }[]

    // The reads arrive; every write the declaration names stays with the
    // consultant — derived from the declaration, so a write added later is fenced too.
    const reads = operations.filter((o) => o.effect === 'read').map((o) => o.tool ?? o.op)
    const writes = operations.filter((o) => o.effect !== 'read').map((o) => o.tool ?? o.op)
    expect(reads).toEqual(expect.arrayContaining(['list_library', 'get_library_item']))
    for (const tool of reads) expect(offered).toContain(tool)
    expect(writes.length).toBeGreaterThan(0)
    for (const tool of writes) expect(offered).not.toContain(tool)
    // And nothing about this lets it hand the work on.
    expect(offered).not.toContain(DELEGATE_TOOL)
  })

  it('test_UAT_FC_REQ-387_the_builder_reads_an_uploaded_documents_words_verbatim', async () => {
    const uid = await uploadReference('testimonials.md', TESTIMONIALS)
    const turns = await delegateAndCapture('verbatim', [
      calls('list_library', { kind: 'document' }),
      calls('get_library_item', { item: uid, text: true }),
    ])

    // It FOUND the document — the thing it once reported "not accessible".
    const listed = toolResults(turns[1]).at(-1) ?? ''
    expect(listed).toContain(uid)

    // And it read the client's own words, not the digest written to find them.
    const read = toolResults(turns[2]).at(-1) ?? ''
    expect(read).toContain('Priya S.')
    expect(read).toContain('Best sourdough north of the river')
    expect(read).toMatch(/"text_next": ?null/)
  })
})
