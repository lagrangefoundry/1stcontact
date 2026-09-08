import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  resetChatHost,
  route,
  sessionFidelity,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import {
  browserBudget,
  fidelityDeps,
  SESSION_BROWSER_BUDGET,
  type ShotEnv,
} from '../apps/control-app/src/shot'
import { previewRenderer } from '../apps/control-app/src/router'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import {
  bundleNameFor,
  type ReferenceStore,
} from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult } from '../tools/generate/src/cli/capture/types'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { syntheticCapture } from './support/reference-fixtures'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ScriptedClient } from './support/scripted-model-client'

/**
 * REQ-206 — **the assistant's eyes, mounted on the Worker the client talks to.**
 *
 * WHAT MAKES THIS EVIDENCE. Every claim below goes through `route()` — the
 * Worker's own route table — or through `sessionFidelity`, which is the
 * production assembly itself rather than a second one written here. The session,
 * the role, the tool loop, the manual projection, the picture resolution, the
 * in-process preview fulfilment, the reference store, the adoption and the
 * budget are all the shipped code, over a real D1 database and two real R2
 * buckets inside workerd.
 *
 * TWO DOUBLES, both at boundaries that are genuinely external. The Anthropic
 * client, which is the network and the seam the library's own backend is written
 * to have injected; and the browser, which is a third party reached over a wire
 * protocol and which miniflare has none of. Nothing between them is faked.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. A CONSULTANT SESSION HAS THE SIX WAYS OF LOOKING, and its manual says so.
 *  2. A PICTURE OF ITS OWN DRAFT IS ANSWERED IN PROCESS — the request never
 *     leaves the browser, and the image reaches the model as an image.
 *  3. REFERENCES ARE THE CLIENT'S OWN PRIVATE MATERIAL, held per business.
 *  4. A CAPTURE IS WRITTEN UP AS FINDABLE MATERIAL, because a bundle nothing can
 *     find is half a feature.
 *  5. THE SESSION'S LIVE-PAGE LOOKS ARE BOUNDED.
 *  6. A SPENT BUDGET REFUSES ONE OPERATION AND NO OTHERS.
 *  7. A DEPLOYMENT WITH NO BROWSER STILL OPENS THE CONVERSATION.
 */

const APPLIED = applySchema()

const ORIGIN = 'https://app.test'

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

/**
 * A real PNG, because the fidelity surface DECODES what the browser hands back.
 *
 * The shared fake's default is the signature alone, which every caller before
 * this one wanted — they sniff the type and nothing reads the pixels. Here
 * `screenshot` decodes, downsamples and re-encodes before the model sees the
 * picture, so a fixture that cannot be decoded would fail as "that is not a PNG"
 * and prove nothing about the wiring.
 */
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

/** A business with the schema applied, its tenant registered, and one site. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = scopeOf(id)
  const seed = siteSeed({ slug: `site-${id}` })
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({
          name,
          page: page as Record<string, unknown>,
        })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: seed.slug }
}

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: Parameters<typeof scriptedClient>[0],
  deps: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<{ client: ScriptedClient; frames: { kind: string; content?: string }[] }> {
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
  const session = (await opened.json()) as { sessionId: string }

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
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string; content?: string })
  return { client, frames }
}

/** The two stores a capture crosses, both real, both bound to one business. */
async function stores(id: string): Promise<{ tickets: TicketStore; references: ReferenceStore }> {
  const tickets = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: id },
  )
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(id)
  return { tickets, references }
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
    // A REAL PNG, because a picture of a reference is decoded before the model
    // sees it — the same reason the fake browser is given one.
    screenshot: await realPng(),
    renderedHtml: '<html><body><h1>The old site</h1></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map<string, Uint8Array>(),
  }
  const name = bundleNameFor(capture)
  await writeBundle(references.bundle(name), result)
  return name
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-206 — the builder assistant can see', () => {
  it('test_UAT_FC_REQ-206_a_consultant_session_is_offered_the_six_ways_of_looking', async () => {
    // AC1. The grant was always there and the surface was never mounted, so the
    // assistant did not merely fail to use its eyes — it had never heard of
    // them. The manual is a projection of THIS session's actual grant, so the
    // tools the model is handed are the proof that the surface is composed.
    const { scope, slug } = await business('req206-tools')
    const browser = fakeBrowser({ png: await realPng() })

    const { client } = await turn(scope, slug, [says('Right.')], { launch: browser.launch })

    const offered = client.seen[0].tools.map((t) => t.name)
    for (const op of [
      'capture_site',
      'list_references',
      'describe_reference',
      'screenshot',
      'compare',
      'check_fidelity',
    ]) {
      expect(offered).toContain(op)
    }
    // And the manual SAYS SO — the role text enumerates no tools, so the only
    // way any of this reaches the model is the projection.
    const manual = systemText(client.seen[0])
    expect(manual).toContain('capture_site')
    expect(manual).toContain('check_fidelity')
  })

  it('test_UAT_FC_REQ-206_a_picture_of_the_draft_never_leaves_the_browser', async () => {
    // AC2. Our own previews are served from the in-process renderer, so the
    // request never reaches Access and cannot come back as a challenge page —
    // and what the model receives is an IMAGE, not a description of one.
    const { scope, slug } = await business('req206-draft')
    const browser = fakeBrowser({ png: await realPng() })

    const { client, frames } = await turn(
      scope,
      slug,
      [calls('screenshot', { of: { kind: 'draft' } }), says('That is the draft.')],
      { launch: browser.launch },
    )

    expect(frames.at(-1)?.kind).toBe('done')
    // The page the browser asked for was answered out of our own renderer.
    const fulfilled = browser.log.fulfilled.map((f) => f.url)
    expect(fulfilled.some((u) => u.includes(`/preview/${slug}/draft/`))).toBe(true)
    // And nothing about our own host went to the network.
    expect(browser.log.continued.filter((u) => u.includes('app.test'))).toEqual([])
    // THE PICTURE REACHED THE MODEL AS A PICTURE. An ARRAY of blocks, not a
    // string: a string here is the whole failure the surface exists to avoid —
    // it means the picture was described rather than shown, at the full cost of
    // the image and none of its benefit. Mounting the surface is what made this
    // reachable at all, because the Toolbox renders a result to text and the
    // path this was proved on before had no Toolbox in it.
    const result = client.seen[1].messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => (Array.isArray(m.content) ? (m.content as unknown[]) : []))
      .find((b) => (b as { type?: string }).type === 'tool_result') as {
      content: unknown
    }
    expect(Array.isArray(result.content)).toBe(true)
    const blocks = result.content as { type: string; source?: { type: string; media_type: string; data: string } }[]
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.source).toMatchObject({ type: 'base64', media_type: 'image/png' })
    expect(atob(image!.source!.data.slice(0, 12)).startsWith('\x89PNG')).toBe(true)
    // The label travels with it, so a transcript with the bytes redacted out
    // still says what was looked at.
    expect(blocks.find((b) => b.type === 'text')).toBeDefined()
  })

  it('test_UAT_FC_REQ-206_references_are_the_businesss_own_private_material', async () => {
    // AC3. One business never sees another's references. This falls out of the
    // store the surface is handed — `forTenant` composes every key from that
    // business's prefix — rather than being enforced a second time in the
    // surface, so what is asserted is which store was wired.
    const mine = 'req206-mine'
    const theirs = 'req206-theirs'
    const a = await business(mine)
    const b = await business(theirs)
    const { references } = await stores(mine)
    const bundle = await plantCapture(references, 'ourolds.test')

    // The bytes are in the PRIVATE bucket, under this business's own prefix —
    // never in `SITES`, which is the bucket the public internet is served from.
    const priv = await (env.BLOBS as R2Bucket).list({ prefix: `t/${mine}/ref/` })
    expect(priv.objects.length).toBeGreaterThan(0)
    const published = await (env.SITES as R2Bucket).list({ prefix: `t/${mine}/ref/` })
    expect(published.objects).toEqual([])

    const browser = fakeBrowser({ png: await realPng() })
    const seen = await turn(
      a.scope,
      a.slug,
      [calls('list_references', {}), says('Here is what we have.')],
      { launch: browser.launch },
    )
    expect(JSON.stringify(seen.client.seen[1].messages)).toContain(bundle)

    resetAiHost()
    resetChatHost()
    const stranger = await turn(
      b.scope,
      b.slug,
      [calls('list_references', {}), says('Nothing captured yet.')],
      { launch: browser.launch },
    )
    expect(JSON.stringify(stranger.client.seen[1].messages)).not.toContain(bundle)
  })

  it('test_UAT_FC_REQ-206_a_capture_is_written_up_as_findable_material', async () => {
    // AC4. Without the binding a capture still stores and `capture_site` says
    // the bundle was not written up — and a client who asks the assistant to
    // "make it look like our old site" and is told the capture is unfindable has
    // been given half a feature. So the adoption is part of what this deployment
    // hands the surface, and this asserts the production assembly's own.
    const id = 'req206-adopt'
    const { slug } = await business(id)
    const scope = scopeOf(id)
    const { tickets, references } = await stores(id)
    const bundle = await plantCapture(references, 'oldsite.test')

    const browser = fakeBrowser({ png: await realPng() })
    const factory = await sessionFidelity(
      routerEnv(),
      scope,
      { launch: browser.launch, describeImage: async () => ({ text: 'An old site.\n\nPlain.', model: 'stub/vision-1' }) },
      await storeFor(routerEnv(), scope),
      tickets,
      ORIGIN,
    )
    expect(factory).not.toBeNull()
    const deps = factory!(slug)
    expect(deps.adoptCapture).toBeTypeOf('function')

    const adopted = await deps.adoptCapture!(bundle)
    expect(adopted.created).toBe(true)
    // It landed in THIS business's own corpus, as the type the Library shows.
    const { tickets: found } = await tickets.query({ type: 'reference' })
    expect(found.map((t) => t.uid)).toContain(adopted.uid)
    expect(found.find((t) => t.uid === adopted.uid)?.fields.bundle).toBe(bundle)
  })

  it('test_UAT_FC_REQ-206_the_session_has_a_bounded_number_of_live_page_looks', async () => {
    // AC5. A responsive ladder is eight navigations, so a conversation that
    // looks repeatedly turns a chat into a bill. The ceiling is the deployment's
    // own — read from the production assembly, not chosen here.
    const id = 'req206-budget'
    const { slug } = await business(id)
    const scope = scopeOf(id)
    const { tickets } = await stores(id)
    const browser = fakeBrowser({ png: await realPng() })

    const factory = await sessionFidelity(
      routerEnv(),
      scope,
      { launch: browser.launch },
      await storeFor(routerEnv(), scope),
      tickets,
      ORIGIN,
    )
    const ops = fidelityOperations(factory!(slug))
    const look = () => ops.screenshot({ of: { kind: 'url', url: 'https://example.com/' } })

    for (let i = 0; i < SESSION_BROWSER_BUDGET; i++) await look()
    expect(browser.launches()).toBe(SESSION_BROWSER_BUDGET)

    await expect(look()).rejects.toThrow(/BUDGET/)
    // The refusal cost nothing: a spent budget does not lease.
    expect(browser.launches()).toBe(SESSION_BROWSER_BUDGET)
  })

  it('test_UAT_FC_REQ-206_a_spent_budget_refuses_one_operation_and_no_others', async () => {
    // AC6. Exhausting the budget refuses THAT operation and names what ran out
    // and what is still possible. Every other tool keeps working — a client must
    // never lose their consultant because it looked at their page too often.
    const id = 'req206-spent'
    const { slug } = await business(id)
    const { references } = await stores(id)
    const bundle = await plantCapture(references, 'stillthere.test')
    const store = await storeFor(routerEnv(), scopeOf(id))
    const browser = fakeBrowser({ png: await realPng() })

    const ops = fidelityOperations(
      fidelityDeps(
        {} as ShotEnv,
        previewRenderer(store),
        references,
        ORIGIN,
        slug,
        { launch: browser.launch, budget: browserBudget(1) },
      ),
    )

    await ops.screenshot({ of: { kind: 'draft' } })
    await expect(ops.screenshot({ of: { kind: 'draft' } })).rejects.toThrow(
      /BUDGET: this conversation has spent its 1 live-page looks/,
    )
    // Reading what is already captured spends nothing and still works.
    const listed = (await ops.list_references({})) as { references: { bundle: string }[] }
    expect(listed.references.map((r) => r.bundle)).toContain(bundle)
    const picture = await ops.screenshot({ of: { kind: 'reference', bundle } })
    expect(Array.isArray(picture)).toBe(true)
  })

  it('test_UAT_FC_REQ-206_a_deployment_with_no_browser_still_opens_the_conversation', async () => {
    // AC7. Absent must stay absent-and-fine, the same shape as a deployment with
    // no API key: the session opens, the transcript replays, and the surface is
    // simply not there — so the manual never mentions it and the model cannot
    // propose, apologise for, or probe for an operation it has not got.
    const { scope, slug } = await business('req206-blind')

    const { client, frames } = await turn(scope, slug, [says('I cannot look, but I can build.')], {})

    expect(frames.at(-1)?.kind).toBe('done')
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).not.toContain('screenshot')
    expect(offered).not.toContain('capture_site')
    // The rest of the assistant is untouched.
    expect(offered).toContain('list_pages')
  })
})
