import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { says, scriptedClient } from './support/scripted-model-client'

/**
 * STORY-103 — **the deployed host sends the same model and max_tokens as the
 * CLI host** (AC-2467). The CLI host, and the "edit the document" property, are
 * in `test_reconciliation_assistant_backend_settings.test.ts`.
 *
 * Driven inside workerd through the Worker's own `fetch`, against real D1 and
 * R2. ONE DOUBLE: the Anthropic client. What is read is the request the backend
 * built for that client; the expected values come from the shipped document.
 */

const TENANT = 'ac2467'

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
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  }
}

const post = (p: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${p.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

async function frames(response: Response): Promise<{ kind: string; content?: string }[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()))
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('AC-2467: model requests carry the backend document’s model and max_tokens (deployed host)', () => {
  it('test_UAT_AC2467_deployed_host_first_turn_carries_the_documents_model_and_max_tokens', async () => {
    const declared = backendsDocument.claude
    const slug = nextSlug('ac2467')
    const seed = siteSeed({ slug })
    const imported = await post('/api/import', {
      slug: seed.slug,
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: page as Record<string, unknown> })),
      assets: [] as { name: string; base64: string }[],
    })
    expect(imported.status, await imported.clone().text()).toBe(200)

    // A newly opened session — its first request is the one under test.
    const opened = await post('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const { sessionId, ready } = (await opened.json()) as { sessionId: string; ready: boolean }
    expect(ready).toBe(true)

    const client = scriptedClient([says('Noted.')])
    setModelClient(client)
    const events = await frames(await post('/api/ai/prompt', { sessionId, text: 'Hello.' }))
    expect(events.at(-1)?.kind).toBe('done')

    expect(client.seen).toHaveLength(1)
    expect(client.seen[0].model).toBe(declared.model)
    expect(client.seen[0].max_tokens).toBe(declared.max_tokens)
  })
})
