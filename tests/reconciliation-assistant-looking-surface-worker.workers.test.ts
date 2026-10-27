import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * **The assistant can see — in the cloud** (story-58b2cec4, AC-2025).
 *
 * REQ-157 names the problem as "in the cloud the assistant has none": the cloud
 * host is where the eyes were missing. So this is asserted where it matters —
 * inside workerd, through the Worker's own `fetch`, its own chat routes and its
 * own chat host, against real D1 and R2 — with a Browser Rendering binding
 * configured.
 *
 * The doubles are the model (the shared scripted client, BUG-39) and the
 * `BROWSER` binding itself, which is the third party on the far side of the
 * deployment's last seam.
 */

const TENANT = 'looking'

const LOOKING_OPS = [
  'capture_site',
  'check_fidelity',
  'compare',
  'describe_reference',
  'list_references',
  'screenshot',
]

/** A Browser Rendering binding: present, which is the configuration under test. */
const BROWSER_BINDING = {
  fetch: async () => new Response('browser rendering stub', { status: 200 }),
} as unknown as Fetcher

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
    BROWSER: BROWSER_BINDING,
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
  } as Env
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

async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('a Worker-hosted consultant with a browser can see', () => {
  it('test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft', async () => {
    const slug = nextSlug('looking')
    await seedSite(slug)

    const client = scriptedClient([
      calls('screenshot', { of: { kind: 'draft' } }),
      says('I can see the draft.'),
    ])
    setModelClient(client)

    const opened = await post('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
    expect(session.error).toBeUndefined()
    expect(session.ready).toBe(true)

    const turn = await post('/api/ai/prompt', {
      sessionId: session.sessionId,
      text: 'Look at the draft.',
    })
    expect(turn.status).toBe(200)
    await turn.text()

    // The six looking operations are offered, beside the site-editing ones.
    expect(client.seen.length).toBeGreaterThan(0)
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('set_l1')
    for (const op of LOOKING_OPS) expect(offered).toContain(op)

    // And `screenshot` of the draft came back as a picture.
    const result = client.seen[1]?.messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .find((b) => (b as { type?: string }).type === 'tool_result') as
      | { content: unknown }
      | undefined
    expect(result).toBeDefined()
    expect(Array.isArray(result!.content)).toBe(true)
    const image = (result!.content as { type: string; source?: { media_type: string } }[]).find(
      (b) => b.type === 'image',
    )
    expect(image?.source?.media_type).toBe('image/png')
  })
})
