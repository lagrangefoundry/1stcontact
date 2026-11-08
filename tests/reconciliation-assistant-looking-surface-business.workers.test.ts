import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  previewRenderer,
  resetChatHost,
  route,
  sessionFidelity,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { browserBudget, fidelityDeps, SESSION_BROWSER_BUDGET, type ShotEnv } from '../apps/control-app/src/shot'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { bundleNameFor, type ReferenceStore } from '../tools/generate/src/store/reference-store'
import { writeBundle, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult, Viewport } from '../tools/generate/src/cli/capture/types'
import type {
  PuppeteerBrowser,
  PuppeteerPage,
  PuppeteerRequest,
} from '../tools/generate/src/cli/capture/cf-driver'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { syntheticCapture, syntheticMultiState } from './support/reference-fixtures'
import { fakeBrowser } from './support/fake-puppeteer'
import { CANNED_HINTS, signalsFor } from './support/fake-capture-driver'
import { calls, says, scriptedClient, type ModelStep, type ScriptedClient } from './support/scripted-model-client'

/**
 * **The assistant's eyes, bound to the business on the Worker** (story-58b2cec4,
 * REQ-206): AC-2372 (bound to the request's business, including a live
 * `capture_site` driven through a turn), AC-2373 (the browser budget) and
 * AC-2024's no-private-bucket branch — where a real Worker opens no chat at all,
 * and the looking surface's own BLOBS check is defence in depth.
 *
 * Everything runs inside workerd through the Worker's own `route()` and chat
 * host, over real D1 and real R2. The two doubles are the external boundaries:
 * the Anthropic client (the shared scripted model double) and the browser (a
 * puppeteer-shaped fake injected through the router's `launch` seam).
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'

const LOOKING_OPS = [
  'capture_site',
  'check_fidelity',
  'compare',
  'describe_reference',
  'list_references',
  'screenshot',
]

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** A real, decodable PNG — the surface decodes what the browser hands back. */
async function realPng(): Promise<Uint8Array> {
  const width = 8
  const height = 8
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 0x20
    data[i * 3 + 1] = 0x40
    data[i * 3 + 2] = 0x80
  }
  return encodePng({ data, width, height, channels: 3 })
}

/** A home page whose L1 holds one addressable headline, so `set_l1` has a target. */
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

/** A business with its tenant registered and one site, imported through the route. */
async function business(id: string, envOver: Partial<RouterEnv> = {}): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = scopeOf(id)
  const slug = `site-${id}`
  const seed = siteSeed({ slug, pages: { 'home.json': homeWithHeadline(slug) } })
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: page as Record<string, unknown> })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(envOver),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug }
}

/** Open a session and take one scripted turn, through the Worker's own chat routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<{ client: ScriptedClient; frames: { kind: string }[]; ready: boolean }> {
  const workerEnv = routerEnv(envOver)
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean; error?: string }
  expect(session.error).toBeUndefined()

  const client = scriptedClient(script)
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, text: 'Have a look.' }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  const text = await streamed.text()
  const frames = text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string })
  return { client, frames, ready: session.ready }
}

/** The tool_result content the model was handed on request `n`. */
function toolResultOf(client: ScriptedClient, n: number): unknown {
  const result = client.seen[n].messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => (Array.isArray(m.content) ? (m.content as unknown[]) : []))
    .filter((b) => (b as { type?: string }).type === 'tool_result')
    .at(-1) as { content: unknown } | undefined
  return result?.content
}

const textOf = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((b) => String((b as { text?: unknown }).text ?? '')).join('\n')
      : ''

const hasImage = (content: unknown): boolean =>
  Array.isArray(content) && content.some((b) => (b as { type?: string }).type === 'image')

/** This business's own reference store — the private bucket, bound by `forTenant`. */
function referencesOf(id: string): Promise<ReferenceStore> {
  return r2ReferenceStore({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }).forTenant(id)
}

/** A bundle written the way `cmdCapturePage` writes one. */
async function plantCapture(references: ReferenceStore, host: string): Promise<string> {
  const capture: Capture = {
    ...syntheticCapture(),
    url: `https://${host}/`,
    host,
    path: '/',
    title: `${host} — the old site`,
  }
  const result: CaptureResult = {
    capture,
    screenshot: await realPng(),
    renderedHtml: '<html><body><h1>The old site</h1></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map<string, Uint8Array>(),
  }
  const name = bundleNameFor(capture)
  await writeBundle(references.bundle(name), result)
  await writeMultiState(references.bundle(name), { ...syntheticMultiState(), url: capture.url })
  return name
}

/**
 * A puppeteer-shaped browser a live `capture_site` can run to completion on.
 *
 * `fakeBrowser` answers every page script with `true`, which the capture
 * pipeline cannot read; this one answers them the way the shared fake capture
 * driver does (as the deployed AC-2080 UAT's browser does). Every request still
 * goes through the production driver's own interception handler, so whether a
 * request was fulfilled in process or sent to the network is observed, not
 * assumed. `alsoRequest` is issued on every navigation after the document — a
 * page naming other addresses, e.g. our own host.
 */
function captureBrowser(png: Uint8Array, alsoRequest: string[] = []) {
  const log = {
    requested: [] as string[],
    fulfilled: [] as { url: string; status: number }[],
    continued: [] as string[],
  }
  let launches = 0
  const issue = (handlers: ((req: PuppeteerRequest) => void)[], url: string) =>
    new Promise<'fulfilled' | 'continued'>((resolve) => {
      const req: PuppeteerRequest = {
        url: () => url,
        respond: async (r) => {
          log.fulfilled.push({ url, status: r.status })
          resolve('fulfilled')
        },
        continue: async () => {
          log.continued.push(url)
          resolve('continued')
        },
      }
      log.requested.push(url)
      for (const h of handlers) h(req)
    })
  const page = (): PuppeteerPage => {
    const handlers: ((req: PuppeteerRequest) => void)[] = []
    let width = 1280
    let doc = ''
    return {
      setViewport: async (v: Viewport) => {
        width = v.width
      },
      emulateMediaFeatures: async () => {},
      setRequestInterception: async () => {},
      on: (event: string, handler: (arg: never) => void) => {
        if (event === 'request') handlers.push(handler as (req: PuppeteerRequest) => void)
        return undefined
      },
      goto: async (url: string) => {
        if ((await issue(handlers, url)) === 'continued') {
          doc = '<html><head><title>The Old Bakery</title></head><body><h1>Fresh bread</h1></body></html>'
        }
        for (const extra of alsoRequest) await issue(handlers, extra)
        return {}
      },
      evaluate: async (script: string) => (script === HINTS_SCRIPT ? CANNED_HINTS : signalsFor(width)),
      addStyleTag: async () => ({}),
      waitForNetworkIdle: async () => {},
      screenshot: async () => png,
      content: async () => doc,
    }
  }
  const launch = async (): Promise<PuppeteerBrowser> => {
    launches += 1
    return {
      createBrowserContext: async () => ({ newPage: async () => page(), close: async () => {} }),
      close: async () => {},
    }
  }
  return { launch, log, launches: () => launches }
}

/** What `capture_site` answers, as the model reads it. */
interface CaptureAnswer {
  bundle: string
  url: string
  reference: { adopted: boolean; uid: string | null; created: boolean; why: string | null }
  refusals: unknown[]
}

/** The JSON object inside a (framed) tool result's text. */
function answerOf(content: unknown): CaptureAnswer {
  const text = textOf(content)
  expect(text.startsWith('Error'), text.slice(0, 300)).toBe(false)
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as CaptureAnswer
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('the Worker binds the looking surface to the request business', () => {
  it('test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route', async () => {
    const A = 'ac2372-a'
    const B = 'ac2372-b'
    const a = await business(A)
    const b = await business(B)
    const describer = async () => ({ text: 'An old bakery site.\n\nCream and brown.', model: 'stub/vision-1' })
    const browser = fakeBrowser({ png: await realPng() })
    const deps: RouterDeps = { launch: browser.launch, describeImage: describer }

    // ── A capture of an outside site, stored through business A's own store. ──
    // A live `capture_site` drives a real page through the guarded driver,
    // which the puppeteer fake cannot answer; so the bundle is written the way
    // `cmdCapturePage` writes one, into the store the production assembly
    // (`sessionFidelity`) binds for A, and adopted through that assembly's own
    // adoption closure — the one `capture_site` calls once a bundle is whole.
    const bundle = await plantCapture(await referencesOf(A), 'oldbakery.example')

    // Its objects are in A's own private bucket area — never in the bucket a
    // site's published bytes are served from, and never under B.
    const priv = await (env.BLOBS as R2Bucket).list({ prefix: `t/${A}/ref/` })
    expect(priv.objects.length).toBeGreaterThan(0)
    const published = await (env.SITES as R2Bucket).list({ prefix: `t/${A}/ref/` })
    expect(published.objects).toEqual([])
    const otherPriv = await (env.BLOBS as R2Bucket).list({ prefix: `t/${B}/ref/` })
    expect(otherPriv.objects).toEqual([])

    // Adopted as a findable, described `reference` in A's corpus, third-party.
    const ticketsA = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: A })
    const factory = await sessionFidelity(
      routerEnv(),
      a.scope,
      deps,
      await storeFor(routerEnv(), a.scope),
      ticketsA,
      ORIGIN,
    )
    expect(factory).not.toBeNull()
    const first = await factory!(a.slug).adoptCapture!(bundle)
    expect(first.created).toBe(true)
    const { tickets: refsA } = await ticketsA.query({ type: 'reference' })
    const adopted = refsA.find((t) => t.uid === first.uid)
    expect(adopted).toBeDefined()
    expect(adopted!.fields.bundle).toBe(bundle)
    expect(adopted!.fields.rights).toBe('third_party')
    expect(JSON.stringify(adopted)).toContain('An old bakery site.')
    // B's corpus does not hold it.
    const ticketsB = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: B })
    const { tickets: refsB } = await ticketsB.query({ type: 'reference' })
    expect(refsB.filter((t) => t.fields.bundle === bundle)).toEqual([])

    // Adopting the same bundle again does not create a second reference.
    const second = await factory!(a.slug).adoptCapture!(bundle)
    expect(second.created).toBe(false)
    expect(second.uid).toBe(first.uid)
    const { tickets: refsAfter } = await ticketsA.query({ type: 'reference' })
    expect(refsAfter.filter((t) => t.fields.bundle === bundle)).toHaveLength(1)

    // A lists it; B neither lists it nor can picture it.
    resetAiHost()
    resetChatHost()
    const listedA = await turn(a.scope, a.slug, [calls('list_references', {}), says('Here.')], deps)
    expect(textOf(toolResultOf(listedA.client, 1))).toContain(bundle!)

    resetAiHost()
    resetChatHost()
    const listedB = await turn(
      b.scope,
      b.slug,
      [calls('list_references', {}), calls('screenshot', { of: { kind: 'reference', bundle } }), says('None.')],
      deps,
    )
    expect(textOf(toolResultOf(listedB.client, 1))).not.toContain(bundle!)
    const pictureB = toolResultOf(listedB.client, 2)
    expect(hasImage(pictureB)).toBe(false)
    expect(textOf(pictureB)).toContain(bundle!)

    // ── A draft picture is rendered in process at the request's own origin. ──
    resetAiHost()
    resetChatHost()
    const draftBrowser = fakeBrowser({ png: await realPng() })
    const drafted = await turn(
      a.scope,
      a.slug,
      [calls('screenshot', { of: { kind: 'draft' } }), says('That is the draft.')],
      { launch: draftBrowser.launch },
    )
    expect(draftBrowser.log.requested[0]).toBe(`${ORIGIN}/preview/${a.slug}/draft/`)
    const page = draftBrowser.log.fulfilled.find((f) => f.url === draftBrowser.log.requested[0])
    expect(page?.status).toBe(200)
    expect(page?.contentType).toContain('text/html')
    // The tenant's draft, not another business's.
    expect(page?.body).toContain('The old headline.')
    expect(draftBrowser.log.continued.filter((u) => u.startsWith(ORIGIN))).toEqual([])
    expect(hasImage(toolResultOf(drafted.client, 1))).toBe(true)

    // ── No new route: no HTTP path exposes the browser or a looking operation. ──
    // Each candidate path gets exactly the router's ordinary answer for a path
    // that is no route at all (whatever its fallback is), and leases nothing.
    const ordinary = async (method: string, path: string) => {
      const res = await route(
        new Request(`${ORIGIN}${path}`, {
          method,
          headers: { 'content-type': 'application/json' },
          ...(method === 'POST' ? { body: JSON.stringify({ of: { kind: 'draft' }, url: 'https://x.example/' }) } : {}),
        }),
        routerEnv(),
        a.scope,
        { launch: draftBrowser.launch },
      )
      return { status: res.status, body: await res.text() }
    }
    const control = {
      GET: await ordinary('GET', '/api/no-such-route-ac2372'),
      POST: await ordinary('POST', '/api/no-such-route-ac2372'),
    }
    for (const path of [
      '/api/ai/screenshot',
      '/api/screenshot',
      '/api/shot',
      '/api/fidelity',
      '/api/fidelity/screenshot',
      '/api/capture',
      '/api/capture_site',
      '/api/references',
      '/api/list_references',
      '/api/compare',
      '/api/check_fidelity',
    ]) {
      for (const method of ['GET', 'POST'] as const) {
        const res = await ordinary(method, path)
        const expected = {
          status: control[method].status,
          body: control[method].body.replaceAll('/api/no-such-route-ac2372', path),
        }
        expect(res, `${method} ${path}`).toEqual(expected)
        expect(res.body).not.toMatch(/image\/png|"references"|BUDGET/)
      }
    }
    // None of those requests leased a browser.
    expect(draftBrowser.launches()).toBe(1)
  })

  it('test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it', async () => {
    // The live path, end to end: the model calls `capture_site` inside a
    // consultant turn on the Worker's own chat routes, and everything from the
    // Toolbox to the adoption closure `sessionFidelity` binds is production code.
    // Only the browser (at the puppeteer seam) and the describer are doubled.
    const A = 'ac2372-live-a'
    const B = 'ac2372-live-b'
    const a = await business(A)
    const b = await business(B)
    const describer = async () => ({ text: 'An old bakery site.\n\nCream and brown.', model: 'stub/vision-1' })
    // The captured page also names OUR host: a capture must not answer it in
    // process out of our store.
    const ourOwn = `${ORIGIN}/preview/${a.slug}/draft/`
    const browser = captureBrowser(await realPng(), [ourOwn])
    const target = 'http://oldbakery.test/'

    const captured = await turn(
      a.scope,
      a.slug,
      [
        calls('capture_site', { url: target }),
        calls('capture_site', { url: target }),
        calls('list_references', {}),
        says('Captured the old site.'),
      ],
      { launch: browser.launch, describeImage: describer },
    )
    expect(captured.frames.at(-1)?.kind).toBe('done')
    expect(browser.launches()).toBeGreaterThan(0)

    // The capture succeeded and was adopted, as the model was told.
    const first = answerOf(toolResultOf(captured.client, 1))
    expect(first.url).toBe(target)
    expect(typeof first.bundle).toBe('string')
    expect(first.bundle.length).toBeGreaterThan(0)
    expect(first.reference.adopted, String(first.reference.why)).toBe(true)
    expect(first.reference.created).toBe(true)
    expect(first.reference.why).toBeNull()
    const bundle = first.bundle

    // Its objects are in A's own private bucket area — never in SITES, never under B.
    const priv = await (env.BLOBS as R2Bucket).list({ prefix: `t/${A}/ref/` })
    expect(priv.objects.length).toBeGreaterThan(0)
    expect((await (env.SITES as R2Bucket).list({ prefix: `t/${A}/ref/` })).objects).toEqual([])
    expect((await (env.BLOBS as R2Bucket).list({ prefix: `t/${B}/ref/` })).objects).toEqual([])
    expect(await (await referencesOf(A)).list()).toContain(bundle)
    expect(await (await referencesOf(B)).list()).not.toContain(bundle)

    // A described, third-party `reference` in A's corpus.
    const ticketsA = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: A })
    const { tickets: refsA } = await ticketsA.query({ type: 'reference' })
    const adopted = refsA.find((t) => t.uid === first.reference.uid)
    expect(adopted).toBeDefined()
    expect(adopted!.fields.bundle).toBe(bundle)
    expect(adopted!.fields.rights).toBe('third_party')
    expect(JSON.stringify(adopted)).toContain('An old bakery site.')

    // Capturing the same page again in the same turn re-adopts, creating nothing.
    const second = answerOf(toolResultOf(captured.client, 2))
    expect(second.bundle).toBe(bundle)
    expect(second.reference.adopted).toBe(true)
    expect(second.reference.created).toBe(false)
    expect(second.reference.uid).toBe(first.reference.uid)
    const { tickets: refsAfter } = await ticketsA.query({ type: 'reference' })
    expect(refsAfter.filter((t) => t.fields.bundle === bundle)).toHaveLength(1)

    // A lists it in the same turn.
    expect(textOf(toolResultOf(captured.client, 3))).toContain(bundle)

    // The capture got no in-process answering: the outside page AND the request
    // naming our own host both went to the network; nothing was fulfilled.
    expect(browser.log.continued).toContain(target)
    expect(browser.log.continued).toContain(ourOwn)
    expect(browser.log.fulfilled).toEqual([])

    // B's corpus does not hold it, and B neither lists it nor can picture it.
    const ticketsB = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: B })
    const { tickets: refsB } = await ticketsB.query({ type: 'reference' })
    expect(refsB.filter((t) => t.fields.bundle === bundle)).toEqual([])
    resetAiHost()
    resetChatHost()
    const listedB = await turn(
      b.scope,
      b.slug,
      [calls('list_references', {}), calls('screenshot', { of: { kind: 'reference', bundle } }), says('None.')],
      { launch: fakeBrowser({ png: await realPng() }).launch },
    )
    expect(textOf(toolResultOf(listedB.client, 1))).not.toContain(bundle)
    const pictureB = toolResultOf(listedB.client, 2)
    expect(hasImage(pictureB)).toBe(false)
    expect(textOf(pictureB)).toContain(bundle)

    // A `screenshot` of an outside address goes over the network: continued, not
    // fulfilled in process.
    resetAiHost()
    resetChatHost()
    const outside = 'https://outside.example/'
    const urlBrowser = fakeBrowser({ png: await realPng() })
    const shot = await turn(
      a.scope,
      a.slug,
      [calls('screenshot', { of: { kind: 'url', url: outside } }), says('That is the outside page.')],
      { launch: urlBrowser.launch },
    )
    expect(hasImage(toolResultOf(shot.client, 1))).toBe(true)
    expect(urlBrowser.log.requested[0]).toBe(outside)
    expect(urlBrowser.log.continued).toContain(outside)
    expect(urlBrowser.log.fulfilled.filter((f) => f.url === outside)).toEqual([])
  })

  it('test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up', async () => {
    // ── Through a Worker turn: adoption is wired but fails (the index is down). ──
    const id = 'ac2372-unadopted'
    const { scope, slug } = await business(id)
    const browser = captureBrowser(await realPng())
    const target = 'http://unadopted.test/'
    const failingIndex: RouterDeps['index'] = async () => async () => {
      throw new Error('the material index is unreachable')
    }
    const captured = await turn(
      scope,
      slug,
      [calls('capture_site', { url: target }), says('Captured, but not written up.')],
      {
        launch: browser.launch,
        describeImage: async () => ({ text: 'A site.\n\nPlain.', model: 'stub/vision-1' }),
        index: failingIndex,
      },
    )
    expect(captured.frames.at(-1)?.kind).toBe('done')
    const answer = answerOf(toolResultOf(captured.client, 1))
    // The capture itself succeeded and is stored in this business's bucket…
    expect(answer.url).toBe(target)
    expect(await (await referencesOf(id)).list()).toContain(answer.bundle)
    expect((await (env.BLOBS as R2Bucket).list({ prefix: `t/${id}/ref/` })).objects.length).toBeGreaterThan(0)
    // …and the model is told it was not written up, and why.
    expect(answer.reference.adopted).toBe(false)
    expect(answer.reference.uid).toBeNull()
    expect(answer.reference.why).toContain('the material index is unreachable')

    // ── The production assembly with no adoption at all (`fidelityDeps` without
    // the closure): the capture still stores, and says it was not indexed. ──
    const store = await storeFor(routerEnv(), scope)
    const references = await referencesOf(id)
    const bare = captureBrowser(await realPng())
    const ops = fidelityOperations(
      fidelityDeps({} as ShotEnv, previewRenderer(store), references, ORIGIN, slug, { launch: bare.launch }),
    )
    const plain = (await ops.capture_site({ url: 'http://nocorpus.test/' })) as CaptureAnswer
    expect(await references.list()).toContain(plain.bundle)
    expect(plain.reference.adopted).toBe(false)
    expect(plain.reference.uid).toBeNull()
    expect(plain.reference.why).toMatch(/stored but not indexed/)
  })
})

describe('a session has a bounded number of live-page looks', () => {
  it('test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working', async () => {
    const id = 'ac2373'
    const { scope, slug } = await business(id)
    const bundle = await plantCapture(await referencesOf(id), 'stillthere.example')
    const browser = fakeBrowser({ png: await realPng() })

    // The ceiling is the fixed constant the AC names.
    expect(SESSION_BROWSER_BUDGET).toBe(40)

    // ── Through a real consultant turn: 40 looks, a 41st, then other tools. ──
    const looks: ModelStep[] = Array.from({ length: SESSION_BROWSER_BUDGET + 1 }, () =>
      calls('screenshot', { of: { kind: 'draft' } }),
    )
    const script: ModelStep[] = [
      ...looks,
      calls('set_l1', {
        page: 'home',
        path: '0.0',
        node: { kind: 'text', text: 'A headline set after the budget ran out.', axes: { fontSizePx: 32 } },
      }),
      calls('list_references', {}),
      calls('screenshot', { of: { kind: 'reference', bundle } }),
      says('I can no longer look at live pages, but everything else still works.'),
    ]
    const { client, frames } = await turn(scope, slug, script, { launch: browser.launch })

    // The turn completed.
    expect(frames.at(-1)?.kind).toBe('done')
    // Exactly forty acquisitions: the 41st was refused before it leased.
    expect(browser.launches()).toBe(SESSION_BROWSER_BUDGET)
    // Each of the forty came back as a picture.
    for (let n = 1; n <= SESSION_BROWSER_BUDGET; n++) {
      expect(hasImage(toolResultOf(client, n)), `look ${n}`).toBe(true)
    }
    // The 41st is a readable BUDGET refusal naming the 40 looks and what still works.
    const refused = toolResultOf(client, SESSION_BROWSER_BUDGET + 1)
    expect(hasImage(refused)).toBe(false)
    const refusal = textOf(refused)
    expect(refusal).toContain('BUDGET:')
    expect(refusal).toContain(`${SESSION_BROWSER_BUDGET} live-page looks`)
    expect(refusal).toMatch(/do not retry/)
    expect(refusal).toMatch(/listing the references/)
    expect(refusal).toMatch(/describing one/)
    expect(refusal).toMatch(/comparing two/)
    expect(refusal).toMatch(/changing the site/)

    // A following set_l1 in the same turn still lands.
    const pages = await (await storeFor(routerEnv(), scope)).readPages(slug)
    const home = pages.find((p) => p.name === 'home.json')
    const root = (home!.page as { l1: { root: { children: { text: string }[] } } }).l1.root
    expect(root.children[0].text).toBe('A headline set after the budget ran out.')
    // list_references and a reference screenshot still return, spending nothing.
    expect(textOf(toolResultOf(client, SESSION_BROWSER_BUDGET + 3))).toContain(bundle)
    expect(hasImage(toolResultOf(client, SESSION_BROWSER_BUDGET + 4))).toBe(true)
    expect(browser.launches()).toBe(SESSION_BROWSER_BUDGET)

    // ── A launch that fails still spends one. ──
    const store = await storeFor(routerEnv(), scope)
    const references = await referencesOf(id)
    let failingLaunches = 0
    const failing = browserBudget(3)
    const failingOps = fidelityOperations(
      fidelityDeps({} as ShotEnv, previewRenderer(store), references, ORIGIN, slug, {
        // Throws synchronously: the metered wrapper turns it into its own
        // rejection, so no stray rejected promise is created here.
        launch: () => {
          failingLaunches += 1
          throw new Error('browser rendering: rate limited')
        },
        budget: failing,
      }),
    )
    for (let i = 1; i <= 3; i++) {
      await expect(failingOps.screenshot({ of: { kind: 'draft' } })).rejects.toThrow()
      expect(failing.spent()).toBe(i)
    }
    expect(failingLaunches).toBe(3)
    await expect(failingOps.screenshot({ of: { kind: 'draft' } })).rejects.toThrow(/^BUDGET: /)
    expect(failingLaunches).toBe(3)

    // ── Reading what is already captured never invokes the launcher. ──
    const second = await plantCapture(references, 'another.example')
    let counted = 0
    const free = browserBudget()
    const freeOps = fidelityOperations(
      fidelityDeps({} as ShotEnv, previewRenderer(store), references, ORIGIN, slug, {
        launch: async () => {
          counted += 1
          return fakeBrowser({ png: await realPng() }).launch()
        },
        budget: free,
      }),
    )
    await freeOps.list_references({})
    await freeOps.describe_reference({ bundle })
    expect(Array.isArray(await freeOps.screenshot({ of: { kind: 'reference', bundle } }))).toBe(true)
    const compared = (await freeOps.compare({
      a: { kind: 'reference', bundle },
      b: { kind: 'reference', bundle: second },
    })) as { size: { width: number; height: number } }
    expect(compared.size.width).toBeGreaterThan(0)
    expect(counted).toBe(0)
    expect(free.spent()).toBe(0)
  })
})

describe('a Worker with a browser but no private bucket opens no chat at all', () => {
  it('test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_refuses_the_session_naming_the_missing_binding', async () => {
    // THE REAL DEPLOYMENT, NO SEAMS REPLACED: a browser is injected, no BLOBS
    // binding is configured, and the chat's transcript store is the production
    // `ticketStoreFor` — which needs BLOBS ([[REQ-160]]). So no session opens at
    // all, and the looking surface's own BLOBS check is never what decides.
    const id = 'ac2024-nobucket-real'
    const { scope, slug } = await business(id)
    const browser = fakeBrowser({ png: await realPng() })
    const client = scriptedClient([says('Never asked.')])
    setModelClient(client)
    const deps: RouterDeps = { launch: browser.launch }
    const noBucket = routerEnv({ BLOBS: undefined })
    const post = (path: string, body: unknown, workerEnv: RouterEnv) =>
      route(
        new Request(`${ORIGIN}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
        workerEnv,
        scope,
        deps,
      )

    // Opening the session is refused with the router's ordinary failure,
    // carrying the transcript store's sentence naming the missing binding.
    const opened = await post('/api/ai/session', { slug }, noBucket)
    expect(opened.status).toBe(500)
    const refused = (await opened.json()) as { error?: string; sessionId?: string; ready?: boolean }
    expect(refused.sessionId).toBeUndefined()
    expect(refused.ready).toBeUndefined()
    expect(refused.error).toContain('The BLOBS binding is not configured')
    // A prompt cannot get a turn either.
    const prompted = await post('/api/ai/prompt', { sessionId: 'any', text: 'Change the headline.' }, noBucket)
    expect(prompted.status).toBe(500)
    expect(((await prompted.json()) as { error?: string }).error).toContain('The BLOBS binding is not configured')
    // Nothing was leased and the model was never asked.
    expect(browser.launches()).toBe(0)
    expect(client.seen).toHaveLength(0)

    // The failure is not cached: once the binding is there, the same business
    // opens a session.
    const repaired = await post('/api/ai/session', { slug }, routerEnv())
    expect(repaired.status).toBe(200)
    expect(((await repaired.json()) as { ready: boolean }).ready).toBe(true)
  })

  it('test_UAT_AC2024_defence_in_depth_the_looking_surface_withholds_its_operations_without_a_private_bucket', async () => {
    const id = 'ac2024-nobucket'
    const { scope, slug } = await business(id)
    const browser = fakeBrowser({ png: await realPng() })
    // DEFENCE IN DEPTH, NOT A DEPLOYMENT: a real Worker with no BLOBS opens no
    // chat at all (the case above). Here the chat's transcript store is supplied
    // through the router's `tickets` seam, so the only BLOBS check left in play
    // is the looking surface's own — `sessionFidelity` — and what is asserted is
    // that it withholds the surface rather than composing one with nowhere
    // private to keep what is looked at.
    const noBucket: Partial<RouterEnv> = { BLOBS: undefined }
    const tickets: RouterDeps['tickets'] = (_env, s, opts) =>
      ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, s, opts)

    // Composed directly, the surface is absent without BLOBS and present with it.
    const realTickets = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, scope)
    const siteStore = await storeFor(routerEnv(), scope)
    expect(
      await sessionFidelity(routerEnv(noBucket), scope, { launch: browser.launch }, siteStore, realTickets, ORIGIN),
    ).toBeNull()
    expect(
      await sessionFidelity(routerEnv(), scope, { launch: browser.launch }, siteStore, realTickets, ORIGIN),
    ).not.toBeNull()

    const { client, frames, ready } = await turn(
      scope,
      slug,
      [
        calls('set_l1', {
          page: 'home',
          path: '0.0',
          node: { kind: 'text', text: 'Edited without eyes.', axes: { fontSizePx: 32 } },
        }),
        says('Changed it.'),
      ],
      { launch: browser.launch, tickets },
      noBucket,
    )

    expect(ready).toBe(true)
    expect(frames.at(-1)?.kind).toBe('done')
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('set_l1')
    for (const op of LOOKING_OPS) expect(offered).not.toContain(op)
    expect(browser.launches()).toBe(0)

    const pages = await (await storeFor(routerEnv(), scope)).readPages(slug)
    const home = pages.find((p) => p.name === 'home.json')
    const root = (home!.page as { l1: { root: { children: { text: string }[] } } }).l1.root
    expect(root.children[0].text).toBe('Edited without eyes.')
  })
})
