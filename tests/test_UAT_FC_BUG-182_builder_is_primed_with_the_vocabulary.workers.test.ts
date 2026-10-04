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
import { builderVocabulary } from '../tools/generate/src/cli/ai/l1-vocabulary-core'
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
 * [[BUG-182]] — **a real worker is sent the page vocabulary**.
 *
 * Drives the real route inside workerd with delegation on, exactly as REQ-355's
 * suite does: the consultant's scripted turn delegates, the framework opens a
 * real worker on the builder role, and what is asserted is the SYSTEM PROMPT THE
 * WORKER WAS SENT. Doubles are the Anthropic client and the embedder only.
 *
 * THE ORIGINATING FAILURE: a worker on a blank page spent a third of its budget
 * reading the L1 reference for field names before it wrote anything. Here the
 * vocabulary is already in its prompt, with or without a system KB.
 */

const TENANT = 'bug182'

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

const VOCABULARY_HEADING = '## The page vocabulary'

describe('BUG-182 — a real worker is sent the page vocabulary', () => {
  it('test_UAT_FC_BUG-182_the_worker_prompt_carries_the_vocabulary_with_and_without_a_system_kb', async () => {
    const vocabulary = builderVocabulary()
    for (const [prefix, deps] of [
      ['kb', WITH_KB],
      ['nokb', WITHOUT_KB],
    ] as const) {
      const [first] = await delegateAndCapture(prefix, deps)
      const primed = systemText(first)
      expect(primed).toContain(ROLE_OPENING)
      expect(primed).toContain(VOCABULARY_HEADING)
      // The whole generated list, not a pointer to it.
      expect(primed).toContain(vocabulary)
      expect(primed).toContain('- **layout mode**: `stack` | `row` | `grid`')
      // Before what the worker reads last: its manual / mechanism comes after.
      expect(primed.indexOf(VOCABULARY_HEADING)).toBeGreaterThan(primed.indexOf(ROLE_OPENING))
      resetAiHost()
      resetChatHost()
    }
  })

  it('test_UAT_FC_BUG-182_the_consultant_is_not_sent_the_vocabulary', async () => {
    configureDelegation(ENABLED)
    const sessionId = await openSession('consultant', WITHOUT_KB)
    const client = twoSided([delegates, says('Handed over.')], [reports, says('Reported.')])
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Stack the hero on phones.' }, WITHOUT_KB))
    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    expect(consultant.length).toBeGreaterThan(0)
    for (const req of consultant) expect(systemText(req)).not.toContain(VOCABULARY_HEADING)
  })
})
