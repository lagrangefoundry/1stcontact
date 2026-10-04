import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { says, scriptedClient, turnTailText } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[REQ-388]] — **the width the client is viewing travels with the prompt, through
 * the deployed route.**
 *
 * The builder posts `view: {width, height, mode}` beside the text on
 * `/api/ai/prompt`; this drives that exact request into the real Worker — real
 * router, real host, real D1/R2 store, real priming — and reads what the model
 * was sent. The Anthropic client is the only double.
 *
 *   1  a reported width reaches that turn's digest as a stated fact
 *   2  a malformed report is refused at the front door, before any turn opens
 */

const TENANT = 'req388'

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
  }
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

describe('REQ-388 — /api/ai/prompt carries the client width', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_REQ-388_a_reported_width_reaches_the_turns_digest', async () => {
    const client = scriptedClient([says('Looking at 812.')])
    setModelClient(client)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('width') })
    const { sessionId } = (await (await post('/api/ai/session', { site })).json()) as { sessionId: string }

    const res = await post('/api/ai/prompt', {
      sessionId,
      text: 'the header wraps',
      view: { width: 812, height: 640, mode: 'fit' },
    })
    expect(res.status).toBe(200)
    await res.text()

    expect(turnTailText(client.seen[0])).toContain('Your client is viewing the draft at 812px (Fit pane)')
  })

  it('test_UAT_FC_REQ-388_a_malformed_width_is_refused_before_a_turn_opens', async () => {
    const client = scriptedClient([says('Never sent.')])
    setModelClient(client)
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('bad') })
    const { sessionId } = (await (await post('/api/ai/session', { site })).json()) as { sessionId: string }

    const res = await post('/api/ai/prompt', {
      sessionId,
      text: 'the header wraps',
      view: { width: 812, mode: 'watch' },
    })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { error: string }).error).toMatch(/view must be/)
    expect(client.seen).toEqual([])
  })
})
