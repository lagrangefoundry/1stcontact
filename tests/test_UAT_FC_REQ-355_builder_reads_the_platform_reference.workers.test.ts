import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { SYSTEM_KB, systemKnowledge, type SystemKbBundle } from '../apps/control-app/src/system-knowledge'
import {
  buildChunkIndex,
  buildIndex,
  memoryIndexSource,
} from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE, primingText } from '../tools/generate/src/cli/ai/roles'
import ledgerSurface from '../tools/generate/src/cli/ai/ledger-surface.json'
import librarySurface from '../tools/generate/src/cli/ai/library-surface.json'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  type ModelRequest,
  type ModelStep,
  type ScriptedClient,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { stubEmbedder } from './support/stub-embedder'

/**
 * [[REQ-355]] — **the builder can search the platform reference, and looks a
 * limit up before reporting it**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the real route inside workerd with
 * delegation on: the consultant's scripted turn delegates, the framework opens a
 * real worker session on the builder role, and what is asserted is the REQUEST
 * THE WORKER WAS SENT — its tools, its system prompt, and the tool result its own
 * search produced. The two doubles are the ones REQ-158 and REQ-295 already argue
 * for: the Anthropic client (the network) and the embedder (miniflare has no
 * Workers AI). The system KB is planted through `deps.knowledge`, so "found in the
 * reference" is a claim about a document this file wrote.
 *
 * THE ORIGINATING FAILURE, restaged. A worker reported that containers have no
 * per-width layout when the L1 reference says they do. The planted document here
 * is that fact, and the worker's search is shown to reach it.
 */

const TENANT = 'req355'

/** The fact the worker guessed wrong about, planted where the reference keeps it. */
const PLANTED = 'Containers accept responsiveLayout, which sets their layout per declared width.'

const STAMP = '2026-09-30T00:00:00Z'

const CORPUS: Record<string, string> = {
  'DOC-L1.md': `---
id: DOC-L1
type: doc
title: L1 layout reference
---
# L1 layout reference

${PLANTED}
`,
  'awareness.md': `---
type: system
title: 'Awareness map: system'
status: active
fields:
  kind: awareness_report
  kb: system
---
# Awareness map: system

## Layout language

*1 document · entry point: L1 layout reference (DOC-L1)*

What a site definition can express, primitive by primitive.
`,
}

const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model

const KNOWLEDGE_SEARCH = 'KnowledgeSearch'
const DELEGATE_TOOL = 'Delegate'
const REPORT_TOOL = 'ReportResult'

/** The rule the builder gains, read off the words that ship. */
const RULE_HEADING = primingText('builder-reference').split('\n')[0]
const ROLE_OPENING = primingText('builder-role').split('\n')[0]

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

const WITH_KB: RouterDeps = {
  knowledge: async () =>
    systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() }),
}
const WITHOUT_KB: RouterDeps = { knowledge: async () => null }

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

const post = (path: string, body: unknown, deps: RouterDeps): Promise<Response> =>
  route(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    { businessId: TENANT },
    deps,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

async function openSession(prefix: string, deps: RouterDeps): Promise<string> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site }, deps)
  expect(opened.status).toBe(200)
  return ((await opened.json()) as { sessionId: string }).sessionId
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

const workerRequests = (client: ScriptedClient): ModelRequest[] =>
  client.seen.filter((req) => req.model === WORKER_MODEL)

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
  note: 'Working on it now — a few minutes.',
  role: BUILDER_ROLE,
  goal: 'Give the hero container a single-column layout on narrow screens.',
  accept: ['the hero stacks on narrow screens'],
})

const reports = calls(REPORT_TOOL, {
  summary: 'Done.',
  changed: [],
  decisions: [],
  passed: [],
})

/** Delegate, and let the worker run `worker` before it reports. */
async function delegateAndCapture(
  prefix: string,
  deps: RouterDeps,
  worker: ModelStep[] = [],
): Promise<ModelRequest[]> {
  configureDelegation(ENABLED)
  const sessionId = await openSession(prefix, deps)
  const client = twoSided([delegates, says('Handed over.')], [...worker, reports, says('Reported.')])
  setModelClient(client)
  await drain(await post('/api/ai/prompt', { sessionId, text: 'Stack the hero on phones.' }, deps))
  const turns = workerRequests(client)
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

describe('REQ-355 — the builder can search the platform reference', () => {
  it('test_UAT_FC_REQ-355_the_builder_is_offered_knowledge_search_beside_its_construction_tools', async () => {
    const [withKb] = await delegateAndCapture('kb', WITH_KB)
    resetAiHost()
    resetChatHost()
    const [withoutKb] = await delegateAndCapture('nokb', WITHOUT_KB)

    const gained = toolNames(withKb).filter((tool) => !toolNames(withoutKb).includes(tool))
    // BEHAVIOUR 1. The knowledge tools arrive and NOTHING ELSE does: every tool
    // the worker gains is a knowledge read, so the reference is additive to the
    // builder it was, not a different builder.
    expect(gained).toContain(KNOWLEDGE_SEARCH)
    for (const tool of gained) expect(tool.startsWith('Knowledge')).toBe(true)
    for (const tool of toolNames(withoutKb)) expect(toolNames(withKb)).toContain(tool)
  })

  it('test_UAT_FC_REQ-355_a_search_reaches_the_reference_and_nothing_wider', async () => {
    const turns = await delegateAndCapture('search', WITH_KB, [
      calls(KNOWLEDGE_SEARCH, { query: 'can a container change layout per width' }),
      calls(KNOWLEDGE_SEARCH, { query: 'what does the client want', kb: ['project'] }),
    ])

    // THE ORIGINATING FAILURE, CLOSED. The worker's own search came back with the
    // fact it once guessed wrong about — through the real search, the real tool
    // loop, into the worker's own next request.
    const found = toolResults(turns[1]).join('\n')
    expect(found).toContain('DOC-L1')
    expect(found).toContain('responsiveLayout')

    // BEHAVIOUR 4. Naming the client's corpus gets the worker nothing from it —
    // the grant is the system KB, so a search scoped anywhere else is refused
    // rather than answered.
    const wider = toolResults(turns[2]).at(-1) ?? ''
    expect(wider).toMatch(/refused by the 'kb' scope/)
    expect(wider).toMatch(/limited to: system\b/)
    expect(wider).not.toContain('DOC-L1')
  })

  it('test_UAT_FC_REQ-355_the_builder_is_primed_with_the_map_and_the_look_it_up_rule', async () => {
    const [first] = await delegateAndCapture('prime', WITH_KB)
    const primed = systemText(first)

    // BEHAVIOUR 2. Search comes with its priming: the map of what the reference
    // holds, and the mechanism — which carries the worker's own manual.
    expect(primed).toContain(ROLE_OPENING)
    expect(primed).toContain('Layout language')
    expect(primed).toContain('DOC-L1')
    expect(primed).toContain(KNOWLEDGE_SEARCH)
    // THE MAP, NOT THE PILE.
    expect(primed).not.toContain(PLANTED)
    // BEHAVIOUR 3. The rule is in the prompt the worker actually reads.
    expect(primed).toContain(RULE_HEADING)
    expect(primed).toMatch(/look it up/i)
    // And it is still the builder, never the consultant.
    expect(primed).not.toContain('You are a design consultant')
  })

  it('test_UAT_FC_REQ-355_without_a_system_kb_the_builder_is_composed_as_before', async () => {
    const [first] = await delegateAndCapture('none', WITHOUT_KB)

    // BEHAVIOUR 1's other half. No reference, no knowledge tools, no map and no
    // rule telling it to look up something it has no way to look up.
    expect(toolNames(first).filter((tool) => tool.startsWith('Knowledge'))).toEqual([])
    const primed = systemText(first)
    expect(primed).toContain(ROLE_OPENING)
    expect(primed).not.toContain(RULE_HEADING)
    expect(primed).not.toContain('Layout language')
    // Its construction tools are unaffected.
    expect(toolNames(first)).toContain('set_l1')
    expect(toolNames(first)).toContain(REPORT_TOOL)
  })

  it('test_UAT_FC_REQ-355_the_builder_still_has_no_ledger_catalogue_or_delegation', async () => {
    const [first] = await delegateAndCapture('fence', WITH_KB)
    const offered = toolNames(first)

    // BEHAVIOUR 4. Unchanged from before this ticket, and now asserted: the
    // engagement's record and the client's catalogue are not the worker's to read
    // or write, and it cannot hand the work on again.
    const fenced = [
      ...(ledgerSurface.operations as { op: string; tool?: string }[]),
      ...(librarySurface.operations as { op: string; tool?: string }[]),
    ].map((operation) => operation.tool ?? operation.op)
    for (const tool of fenced) expect(offered).not.toContain(tool)
    expect(offered).not.toContain(DELEGATE_TOOL)
  })
})
