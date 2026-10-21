import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, resetChatHost, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument, cacheTtlOf } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import {
  calls,
  says,
  scriptedClient,
  type ModelRequest,
  type ModelStep,
} from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-421]] — **a builder caches its prefix for the hour and its history for
 * five minutes; the consultant keeps the hour throughout.**
 *
 * Drives the real route inside workerd with delegation on: the consultant's
 * scripted turn delegates, the framework opens a real worker on the builder role,
 * and what is asserted is the `cache_control` lifetime on every marker each side
 * sent. The lifetimes are `backends.json`'s `cache_ttl`, which the framework reads
 * when it constructs each backend (lagrange-framework REQ-216) — the host passes
 * none — and which the meter reads through `cacheTtlOf`.
 *
 * Doubles: the Anthropic client only.
 */

const TENANT = 'req421'
const WORKER_MODEL = backendsDocument.claude_builder.model
const deps: RouterDeps = { knowledge: async () => null }

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
    deps,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** Every `cache_control` lifetime anywhere under `node`. */
function lifetimes(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => lifetimes(n, out))
  else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    if (record.cache_control) out.push((record.cache_control as { ttl?: string }).ttl ?? '')
    Object.values(record).forEach((v) => lifetimes(v, out))
  }
  return out
}

/** Whether the last message of a request carries a tool result — i.e. a call came back. */
function answered(req: ModelRequest): boolean {
  const last = req.messages[req.messages.length - 1]
  return (
    Array.isArray(last?.content) &&
    (last.content as { type?: string }[]).some((block) => block?.type === 'tool_result')
  )
}

const delegates = calls('Delegate', {
  scope: ['home.json'],
  note: 'Working on it now.',
  role: BUILDER_ROLE,
  goal: 'Give the hero a heading.',
  accept: ['the hero has a heading'],
})
const reports = calls('ReportResult', { summary: 'Done.', changed: [], decisions: [], passed: [] })

/** Each side calls once, then answers its result in prose. */
const step: ModelStep = (req) =>
  req.model === WORKER_MODEL
    ? (answered(req) ? says('Reported.') : reports)(req)
    : (answered(req) ? says('Handed over.') : delegates)(req)

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  configureDelegation(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-421 — builder prefix for the hour, history for five minutes', () => {
  it('test_UAT_FC_REQ-421_builder_system_asks_an_hour_and_history_five_minutes_consultant_an_hour', async () => {
    // The configuration this asserts the wire against.
    expect(cacheTtlOf('claude_builder')).toEqual({ system: '1h', messages: '5m' })
    expect(cacheTtlOf('claude')).toEqual({ system: '1h', messages: '1h' })

    configureDelegation({ ...delegationDocument, enabled: true })
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('req421') })
    const opened = await post('/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const client = scriptedClient([step])
    setModelClient(client)
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Put a heading on the hero.' }))

    const builder = client.seen.filter((req) => req.model === WORKER_MODEL)
    const consultant = client.seen.filter((req) => req.model !== WORKER_MODEL)
    expect(builder.length).toBeGreaterThanOrEqual(2)
    expect(consultant.length).toBeGreaterThanOrEqual(2)

    for (const req of builder) {
      const system = lifetimes(req.system)
      const history = lifetimes(req.messages)
      // The shared prefix is cached at all, and for the hour.
      expect(system.length).toBeGreaterThan(0)
      expect(new Set(system)).toEqual(new Set(['1h']))
      // Its own history, for five minutes — never the hour it does not use.
      expect(history.length).toBeGreaterThan(0)
      expect(new Set(history)).toEqual(new Set(['5m']))
    }

    // The consultant is unchanged: the hour, on its prefix and its history alike.
    for (const req of consultant) {
      const all = lifetimes([req.system, req.messages])
      expect(all.length).toBeGreaterThan(0)
      expect(new Set(all)).toEqual(new Set(['1h']))
    }
  })
})
