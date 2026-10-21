import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { ratesFor } from '../tools/generate/src/cli/ai/spend-core'
import { PROJECT_BACKEND, backendsDocument, cacheTtlOf } from '../tools/generate/src/cli/ai/backends'
import { metered, says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-242]] — **the lifetime the wire asks for is the lifetime the meter
 * prices**, through the real route.
 *
 * A turn taken through `/api/ai/prompt` on the consultant's backend: every
 * `cache_control` marker in the request it sent asks for `cacheTtlOf('claude')` (the hour, both halves),
 * and the row it leaves in D1 settles that turn's cache writes at the one-hour
 * rate — 2x input, not the five-minute 1.25x every write was metered at before.
 */

const TENANT = 'bug242'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as Env
}

function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const post = (path: string, body: unknown, ctx?: ExecutionContext): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    ctx,
  )

async function drain(response: Response): Promise<void> {
  const reader = response.body!.getReader()
  for (;;) {
    const { done } = await reader.read()
    if (done) return
  }
}

/** Every `cache_control` marker anywhere in a request. */
function markers(node: unknown, out: { ttl?: string }[] = []): { ttl?: string }[] {
  if (Array.isArray(node)) node.forEach((n) => markers(n, out))
  else if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    if (record.cache_control) out.push(record.cache_control as { ttl?: string })
    Object.values(record).forEach((v) => markers(v, out))
  }
  return out
}

describe('BUG-242 — the wire asks for the lifetime the meter prices', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-242_a_turn_asking_for_the_hour_is_settled_at_the_hour_rate', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('bug242') })
    const opened = await post('/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const { sessionId } = (await opened.json()) as { sessionId: string }

    const client = scriptedClient([
      metered({ input_tokens: 1000, output_tokens: 50, cache_creation_input_tokens: 10_000 }, says('Done.')),
    ])
    setModelClient(client)
    const { ctx, settled } = collectingCtx()
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Hello' }, ctx))
    await settled()

    // THE WIRE. The request caches, and every marker asks for the lifetime the
    // meter is about to price its writes at.
    expect(client.seen.length).toBeGreaterThan(0)
    const sent = markers(client.seen[0])
    expect(sent.length).toBeGreaterThan(0)
    expect(cacheTtlOf(PROJECT_BACKEND)).toEqual({ system: '1h', messages: '1h' })
    for (const marker of sent) expect(marker.ttl ?? '').toBe('1h')

    // THE METER. Writes at 2x input — the hour's rate — and not the 1.25x of five minutes.
    const { results } = await env.DB.prepare('SELECT * FROM turn_spend WHERE session_id = ?')
      .bind(sessionId)
      .all<{ cost_micros: number | null }>()
    expect(results).toHaveLength(1)
    const rates = ratesFor(PROJECT_BACKEND, backendsDocument.claude.model)!
    expect(results[0].cost_micros).toBe(
      Math.round(1000 * rates.input + 50 * rates.output + 10_000 * rates.input * 2),
    )
  })
})
