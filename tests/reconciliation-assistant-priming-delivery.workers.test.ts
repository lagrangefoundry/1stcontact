import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { SYSTEM_KB, systemKnowledge, type SystemKbBundle } from '../apps/control-app/src/system-knowledge'
import { PROJECT_KB } from '../apps/control-app/src/knowledge'
import { buildChunkIndex, buildIndex, memoryIndexSource } from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
// The preamble is two configured entries since REQ-182 — the role text first,
// the product text after it — read here from `priming.json` itself.
import {
  CONSULTANT_PURPOSE,
  CONSULTANT_ROLE_TEXT,
  PRODUCT_SYSTEM,
} from '../tools/generate/src/cli/ai/roles'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { STUB_DIM, stubEmbedder, stubVector } from './support/stub-embedder'
import { modelSaw, says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * **Every host actually sends the model its priming** (story-3cf3d57b — AC-2364,
 * both Worker paths). The Node CLI host is in
 * `reconciliation-assistant-priming-delivery.test.ts`.
 *
 * Driven through the Worker's own route table inside workerd, against real D1 and
 * R2: `/api/ai/session` opens the conversation and `/api/ai/prompt` takes the
 * turn. What is read is the request the model double recorded, never the role.
 * The two Worker paths are a conversation with the client's knowledge open and
 * one without it. Without a Workers AI binding the tenant's half cannot be
 * opened, and the shipped half needs none.
 *
 * TWO DOUBLES, both model boundaries: the Anthropic client and the Workers AI
 * embedder binding.
 */

const STAMP = '2026-01-01T00:00:00Z'
const SHIPPED_TERRITORY = 'Storage and publishing'
const SHIPPED_TITLE = 'How pages are stored'
const CLIENT_TERRITORY = 'Brand and positioning'

let tenant = ''
let tenants = 0

/** Workers AI answering with stub vectors, zero-padded to the declared width. */
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

const CORPUS: Record<string, string> = {
  'doc-storage.md': `---
uid: doc-storage
type: doc
title: ${SHIPPED_TITLE}
status: active
---

# ${SHIPPED_TITLE}

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

## ${SHIPPED_TERRITORY}

*1 document · entry point: ${SHIPPED_TITLE} (doc-storage)*

Where a page lives before anybody else can see it.
`,
}

/** The shipped bundle, built by the component's own index builders. */
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

const deps: RouterDeps = {
  knowledge: async () => systemKnowledge({}, { bundle: await fixtureBundle(), embedder: stubEmbedder() }),
}

function workerEnv({ ai = true }: { ai?: boolean } = {}): RouterEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ...(ai ? { AI: fakeWorkersAi() } : {}),
  } as unknown as RouterEnv
}

const scope = (): Scope => ({ businessId: tenant })

const post = (p: string, body: unknown, opts?: { ai?: boolean }): Promise<Response> =>
  route(
    new Request(`https://app.example/${p.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(opts),
    scope(),
    deps,
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

/** A seeded site with a conversation open on it. */
async function conversation(opts: { ai: boolean }): Promise<{ slug: string; sessionId: string }> {
  const slug = nextSlug('prime2364')
  const seed = siteSeed({ slug })
  const res = await post(
    '/api/import',
    {
      slug: seed.slug,
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: page as Record<string, unknown> })),
      assets: [] as { name: string; base64: string }[],
    },
    opts,
  )
  expect(res.status, await res.clone().text()).toBe(200)
  const opened = await post('/api/ai/session', { slug }, opts)
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { slug, sessionId }
}

/** One turn; the turn must have answered, and the model must have been reached once. */
async function takeTurn(sessionId: string, opts: { ai: boolean }): Promise<ModelRequest> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const events = await frames(await post('/api/ai/prompt', { sessionId, text: 'Hello.' }, opts))
  expect(events.at(-1)?.kind).toBe('done')
  const spoken = events
    .filter((e) => e.kind === 'text')
    .map((e) => e.content ?? '')
    .join('')
  expect(spoken, spoken).toBe('Noted.')
  expect(client.seen).toHaveLength(1)
  return client.seen[0]
}

/** The system prompt as the model reads it: a string, or its cache-split blocks joined. */
function systemText(req: ModelRequest): string {
  if (typeof req.system === 'string') return req.system
  expect(Array.isArray(req.system)).toBe(true)
  for (const block of req.system) {
    expect(block.type).toBe('text')
    expect(typeof block.text).toBe('string')
  }
  return req.system.map((b) => b.text ?? '').join('')
}

/** The criterion's ordering claim, asserted over one joined system prompt. */
function expectFullPriming(system: string, mapsInLandscape: string[]): void {
  const at = (needle: string): number => system.indexOf(needle)
  const preamble = at(CONSULTANT_ROLE_TEXT)
  const product = at(PRODUCT_SYSTEM)
  const landscape = at('# What exists')
  const purpose = at(CONSULTANT_PURPOSE)
  const mechanism = at('# How to search')

  expect(preamble, 'consultant role text missing from what the model was sent').toBe(0)
  expect(product, 'product system text missing from what the model was sent').toBeGreaterThanOrEqual(
    CONSULTANT_ROLE_TEXT.length,
  )
  expect(landscape).toBeGreaterThan(product)
  expect(purpose).toBeGreaterThan(landscape)
  expect(mechanism).toBeGreaterThan(purpose)
  for (const map of mapsInLandscape) {
    expect(at(map), `${map} not inside the landscape`).toBeGreaterThan(landscape)
    expect(at(map)).toBeLessThan(purpose)
  }
  expect(system.slice(mechanism)).toMatch(/KnowledgeSearch/)
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  tenants += 1
  tenant = `ac2364-${tenants}`
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('both Worker paths send the model the whole priming', () => {
  it('test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder', async () => {
    // ── With the client's knowledge open ────────────────────────────────────
    const withClient = await conversation({ ai: true })
    const { ticket } = await (await ticketStoreFor(workerEnv(), scope())).create({
      type: 'system',
      title: `Awareness map: ${PROJECT_KB}`,
      fields: { kind: 'awareness_report', kb: PROJECT_KB },
      body: `# Awareness map: project\n\n## ${CLIENT_TERRITORY}\n\nWhat this client sounds like.\n`,
    })
    expect(ticket.uid).toBeTruthy()

    const open = await takeTurn(withClient.sessionId, { ai: true })
    expectFullPriming(systemText(open), [CLIENT_TERRITORY, SHIPPED_TERRITORY])
    expect(modelSaw(open)).toContain(`You are working on the site "${withClient.slug}"`)

    // ── Without client knowledge (no embedding binding) ─────────────────────
    tenants += 1
    tenant = `ac2364-${tenants}`
    resetAiHost()
    resetChatHost()

    const shippedOnly = await conversation({ ai: false })
    const bare = await takeTurn(shippedOnly.sessionId, { ai: false })
    const bareSystem = systemText(bare)
    expectFullPriming(bareSystem, [SHIPPED_TERRITORY])
    expect(bareSystem).not.toContain(CLIENT_TERRITORY)
    expect(modelSaw(bare)).toContain(`You are working on the site "${shippedOnly.slug}"`)
  })
})
