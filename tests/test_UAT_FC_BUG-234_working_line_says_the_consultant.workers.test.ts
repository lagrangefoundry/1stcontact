import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { groupNames } from '../tools/generate/src/cli/ai/group-core'
import { calls, says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-234]] — **the working line says "The consultant is …"**, not "Your
 * consultant is …", in a one-to-one conversation. Only the determiner changes:
 * the AI still has no personal name there (DOC-66, [[BUG-205]]).
 *
 * Through the Worker's own `route` — `/api/ai/session` and `/api/ai/prompt` —
 * against a real D1 and the real session machinery. The one double is the
 * Anthropic client.
 */

const BUSINESS = 'bug234-business'
const NAMES = groupNames()
/** A capture the guard refuses at once: a private address. Slow tool, fast failure. */
const BAD_URL = 'http://127.0.0.1/admin'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

const scope: Scope = { businessId: BUSINESS }

const post = (path: string, body: unknown): Promise<Response> =>
  route(
    new Request(`https://app.example${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    {},
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )

type Frame = { kind: string; content: string; meta?: Record<string, unknown> }

async function prompt(site: string, text: string, client: ScriptedClient): Promise<Frame[]> {
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  setModelClient(client)
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  const out: Frame[] = []
  for (const block of (await response.text()).split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data: '))
    if (line) out.push(JSON.parse(line.slice('data: '.length)) as Frame)
  }
  return out
}

describe('BUG-234 — the working line says "The consultant"', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-234_a_one_to_one_working_line_begins_the_consultant_and_names_no_member', async () => {
    const { site } = await seedTenantSite(BUSINESS, { slug: nextSlug('bug234') })
    const stream = await prompt(
      site,
      'Look at this site.',
      scriptedClient([calls('capture_site', { url: BAD_URL }), says('That one is private.')]),
    )
    const working = stream.filter((f) => f.kind === 'working')
    expect(working.length).toBeGreaterThan(0)
    for (const frame of working) {
      expect(frame.content.startsWith('The consultant is ')).toBe(true)
      expect(frame.content).not.toContain('Your consultant')
      for (const name of [NAMES.consultant, NAMES.coordinator]) expect(frame.content).not.toContain(name)
    }
  })
})
