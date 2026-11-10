import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { SYSTEM_KB, systemKnowledge, type SystemKbBundle } from '../apps/control-app/src/system-knowledge'
import { buildChunkIndex, buildIndex, memoryIndexSource } from '../apps/control-app/src/generated/knowledge'
import { DocDirStore, bundleDocReader } from '../apps/control-app/src/generated/ticketing'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import {
  CONSULTANT_PURPOSE,
  CONSULTANT_ROLE_TEXT,
  PRODUCT_SYSTEM,
} from '../tools/generate/src/cli/ai/roles'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { STUB_DIM, stubEmbedder, stubVector } from './support/stub-embedder'
import {
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * **The turn's reminder rides the tail of the last user message, not the system
 * field** (story-3cf3d57b — AC-2364 as amended by BUNDLE-44 / BUG-83, both Worker
 * paths). The Node CLI host is in `reconciliation-assistant-reminder-channel.test.ts`.
 *
 * Driven through the Worker's own route table inside workerd against real D1 and
 * R2: `/api/ai/session` then `/api/ai/prompt`. The two Worker paths are a
 * conversation with the client's knowledge open (a Workers AI binding present)
 * and one without it. The doubles are the model boundaries only: the Anthropic
 * client and the Workers AI embedder.
 */

const STAMP = '2026-01-01T00:00:00Z'
const USER_TEXT = 'Hello there, assistant.'

let tenant = ''
let tenants = 0

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
title: How pages are stored
status: active
---

# How pages are stored

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

## Storage and publishing

Where a page lives before anybody else can see it.
`,
}

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

async function conversation(opts: { ai: boolean }): Promise<{ slug: string; sessionId: string }> {
  const slug = nextSlug('channel2364')
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

async function takeTurn(sessionId: string, opts: { ai: boolean }): Promise<ModelRequest> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const events = await frames(await post('/api/ai/prompt', { sessionId, text: USER_TEXT }, opts))
  expect(events.at(-1)?.kind).toBe('done')
  expect(client.seen).toHaveLength(1)
  return JSON.parse(JSON.stringify(client.seen[0])) as ModelRequest
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  tenants += 1
  tenant = `ac2364ch-${tenants}`
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('AC-2364 — both Worker paths carry the reminder at the tail of the last user message', () => {
  it('test_UAT_AC2364_worker_paths_reminder_rides_last_user_message_tail_not_system_field', async () => {
    for (const ai of [true, false]) {
      tenants += 1
      tenant = `ac2364ch-${tenants}`
      resetAiHost()
      resetChatHost()

      const { slug, sessionId } = await conversation({ ai })
      const req = await takeTurn(sessionId, { ai })
      const reminder = `You are working on the site "${slug}"`
      const system = systemText(req)
      const tail = turnTailText(req)

      // The priming is in the system field, in order.
      const product = system.indexOf(PRODUCT_SYSTEM)
      const landscape = system.indexOf('# What exists')
      const purpose = system.indexOf(CONSULTANT_PURPOSE)
      const mechanism = system.indexOf('# How to search')
      expect(system.indexOf(CONSULTANT_ROLE_TEXT)).toBe(0)
      expect(landscape).toBeGreaterThan(product)
      expect(purpose).toBeGreaterThan(landscape)
      expect(mechanism).toBeGreaterThan(purpose)

      // The reminder is absent from the system field…
      expect(system, `reminder leaked into the system field (ai=${ai})`).not.toContain(reminder)
      // …and rides the last user message, after the user's own words.
      const last = req.messages[req.messages.length - 1]
      expect(last.role).toBe('user')
      expect(typeof last.content === 'string' || Array.isArray(last.content)).toBe(true)
      expect(tail).toContain(USER_TEXT)
      expect(tail, `reminder missing from the last user message (ai=${ai})`).toContain(reminder)
      expect(tail.indexOf(reminder)).toBeGreaterThan(tail.indexOf(USER_TEXT))
    }
  })
})
