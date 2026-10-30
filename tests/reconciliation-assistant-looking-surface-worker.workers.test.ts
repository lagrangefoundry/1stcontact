import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost, route } from '../apps/control-app/src/router'
import type { PuppeteerBrowser } from '../tools/generate/src/cli/capture/cf-driver'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import { fakeBrowser } from './support/fake-puppeteer'

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
 * browser, which is the third party on the far side of the deployment's last
 * seam. The `BROWSER` binding is configured — that is what tells the router this
 * deployment can see — and the browser it would launch is injected through the
 * router's `launch` seam, exactly as the REQ-154 cloud-eyes UATs inject theirs: a
 * binding stub cannot speak the Browser Rendering protocol, and a fake that could
 * would prove the fake. The page the fake loads is still answered by the
 * Worker's own preview renderer, and the picture is a real PNG.
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

const request = (path: string, body: unknown): Request =>
  new Request(`https://app.example/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(request(path, body), workerEnv())

/** A browser whose every shot is a real 32×24 PNG, logging what it loaded. */
function eyes() {
  const fb = fakeBrowser()
  const launch = async (): Promise<PuppeteerBrowser> => {
    const browser = await fb.launch()
    return {
      createBrowserContext: async () => {
        const context = await browser.createBrowserContext()
        return {
          newPage: async () => {
            const page = await context.newPage()
            ;(page as unknown as { screenshot(): Promise<Uint8Array> }).screenshot = () =>
              encodePng({ data: new Uint8Array(32 * 24 * 3).fill(99), width: 32, height: 24, channels: 3 })
            return page
          },
          close: () => context.close(),
        }
      },
      close: () => browser.close(),
    }
  }
  return { launch, log: fb.log }
}

/** A home page whose L1 holds one addressable headline, as the Node branch's does. */
function homeWithHeadline(slug: string): Record<string, unknown> {
  const home = structuredClone(siteSeed({ slug }).pages['home.json']) as Record<string, unknown> & {
    l1: { root: unknown }
  }
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: 'The old headline.', axes: { fontSizePx: 32 } }],
  }
  home.modules = []
  return home
}

async function seedSite(
  slug: string,
  pages?: Record<string, Record<string, unknown>>,
): Promise<void> {
  const seed = siteSeed({ slug, pages })
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
    const browser = eyes()
    // The Worker's own router and chat host, with the browser it launches injected.
    const chat = (path: string, body: unknown) =>
      route(request(path, body), workerEnv(), { launch: browser.launch })

    const opened = await chat('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
    expect(session.error).toBeUndefined()
    expect(session.ready).toBe(true)

    const turn = await chat('/api/ai/prompt', {
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
    expect((result!.content as { type: string; text?: string }[])[0].text).toContain('32×24')

    // The draft was rendered by the Worker's own preview renderer, for THIS site.
    expect(browser.log.requested[0]).toBe(`https://app.example/preview/${slug}/draft/`)
    const page = browser.log.fulfilled.find((f) => f.url === browser.log.requested[0])
    expect(page?.status).toBe(200)
    expect(page?.contentType).toContain('text/html')
  })
})

describe('a Worker-hosted consultant with no browser still edits', () => {
  it('test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant', async () => {
    const slug = nextSlug('blind')
    await seedSite(slug, { 'home.json': homeWithHeadline(slug) })

    // THE CONFIGURATION UNDER TEST: no Browser Rendering binding, and no launcher
    // injected through the router's seam — this deployment has nothing to look
    // with. Everything else is the Worker's ordinary environment.
    const { BROWSER: _absent, ...rest } = workerEnv()
    const blind = rest as Env
    expect(blind.BROWSER).toBeUndefined()
    // …while the consultant's grant still names the looking surface.
    expect((L1_INSTANCES.consultant as Record<string, unknown>).fidelity).toBeDefined()

    const client = scriptedClient([
      calls('set_l1', {
        page: 'home',
        path: '0.0',
        node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
      }),
      says('Changed it.'),
    ])
    setModelClient(client)
    const chat = (path: string, body: unknown) => route(request(path, body), blind, {})

    // The session constructs…
    const opened = await chat('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
    expect(session.error).toBeUndefined()
    expect(session.ready).toBe(true)

    // …and takes an editing turn.
    const turn = await chat('/api/ai/prompt', {
      sessionId: session.sessionId,
      text: 'Change the headline.',
    })
    expect(turn.status).toBe(200)
    await turn.text()

    // An editing tool was offered, and no looking operation was.
    expect(client.seen.length).toBeGreaterThan(0)
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('set_l1')
    for (const op of LOOKING_OPS) expect(offered).not.toContain(op)

    // The edit landed: read back out of the tenant's own store.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    const home = (await store.readPages(slug)).find((p) => p.name === 'home.json')
    expect(home).toBeDefined()
    const root = (home!.page as { l1: { root: { children: { text: string }[] } } }).l1.root
    expect(root.children[0].text).toBe('A new headline.')
  })
})
