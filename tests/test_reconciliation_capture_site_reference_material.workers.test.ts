import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost, route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type Ticket, type TicketStore } from '../apps/control-app/src/tickets'
import { NotACaptureError, adoptCapture } from '../apps/control-app/src/capture-material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import {
  CAPTURE_MEMBER,
  SCREENSHOT_MEMBER,
  bundleNameFor,
  type ReferenceStore,
} from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult, Viewport } from '../tools/generate/src/cli/capture/types'
import type {
  PuppeteerBrowser,
  PuppeteerPage,
  PuppeteerRequest,
} from '../tools/generate/src/cli/capture/cf-driver'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import { fidelityOperations, isContentBlocks } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { encodePng } from '../tools/generate/src/cli/png'
import { CANNED_HINTS, FakeCaptureDriver, signalsFor } from './support/fake-capture-driver'
import { syntheticCapture } from './support/reference-fixtures'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { calls, says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'

/**
 * story-31204812 (STORY-159), REQ-166 half — **a capture becomes client
 * material**: `capture_site` adopts a completed bundle as one `reference`
 * ticket, says whether it did, and never loses the capture when it cannot.
 *
 * WHAT IS REAL. The fidelity operations, the capture pipeline, the egress guard,
 * the R2 reference store, the D1/R2 ticket store, `adoptCapture`, the Worker's
 * route table and — for AC-2080 — the Worker's own chat host and the fidelity
 * composition `router.ts` builds for a request.
 *
 * WHAT IS DOUBLED: the browser (a third party behind a wire protocol, at the
 * `BrowserDriver` / puppeteer seam), the model (the shared scripted client), and
 * the describer (a model boundary). Nothing we own is doubled.
 */

/** A real, decodable PNG — encoded once in `beforeAll`, because encoding is async. */
let PNG: Uint8Array

beforeAll(async () => {
  await applySchema()
  PNG = await encodePng({ data: new Uint8Array(16 * 12 * 3).fill(120), width: 16, height: 12, channels: 3 })
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── shared fixtures ──────────────────────────────────────────────────────────

/** The fake capture driver, but with a screenshot that decodes as a real PNG. */
class PictureDriver extends FakeCaptureDriver {
  override async screenshot(): Promise<Uint8Array> {
    return PNG
  }
}

/** The two real stores a capture crosses, bound to one (registered) tenant. */
async function stores(tenantId: string): Promise<{ tickets: TicketStore; references: ReferenceStore }> {
  await ensureTenant(tenantId)
  const tickets = await ticketStoreFor({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
  })
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(tenantId)
  return { tickets, references }
}

/** Fidelity deps with the browser doubled and adoption optionally wired. */
function fidelity(
  references: ReferenceStore,
  adopt?: (bundle: string) => Promise<{ uid: string; created: boolean }>,
): FidelityDeps {
  return {
    slug: 'site',
    origin: 'https://app.test',
    references,
    driverFactory: async () => new PictureDriver(),
    guardedDriver: () => async () => new PictureDriver(),
    ...(adopt ? { adoptCapture: adopt } : {}),
  }
}

interface ReferenceReport {
  adopted: boolean
  uid: string | null
  created: boolean
  why: string | null
}

interface CaptureAnswer {
  bundle: string
  url: string
  pages: number
  assets: number
  reference: ReferenceReport
  refusals: unknown[]
}

/** A capture result shaped exactly as the pipeline hands one to `writeBundle`. */
function captureResult(over: Partial<Capture> = {}, screenshot: Uint8Array): CaptureResult {
  const capture: Capture = {
    ...syntheticCapture(),
    url: 'https://greenoven.test/',
    host: 'greenoven.test',
    path: '/',
    title: 'Green Oven Bakery',
    theme: {
      ...syntheticCapture().theme,
      colors: [
        { hex: '#f4efe6', usage: 'background', freq: 40 },
        { hex: '#2f5d3a', usage: 'text', freq: 12 },
      ],
      fonts: [{ family: 'Lora', role: 'heading', weights: [700], files: [] }],
    },
    ...over,
  }
  return {
    capture,
    screenshot,
    renderedHtml: '<html><body><h1>Green Oven Bakery</h1></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map([['assets/hero.jpg', new Uint8Array([1, 2, 3, 4])]]),
  }
}

/** Write a bundle the way `cmdCapturePage` writes one; return its name. */
async function captured(
  references: ReferenceStore,
  over: Partial<Capture> = {},
  screenshot?: Uint8Array,
): Promise<string> {
  const result = captureResult(over, screenshot ?? PNG)
  const name = bundleNameFor(result.capture)
  await writeBundle(references.bundle(name), result)
  return name
}

/** Every attachment blob key for one tenant, so residency is counted, not assumed. */
function blobKeys(tenantId: string): Promise<string[]> {
  return keysUnder(`t/${tenantId}/blob/`)
}

/** Every key in the blob bucket under `prefix`, paginated to exhaustion. */
async function keysUnder(prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

const memberOf = (a: Ticket): string => (a.fields.meta as Record<string, unknown>).member as string

/**
 * Whether a record is in the trash: gone from a plain `get`, yet still found by
 * the component's own `include_archived` read (which `TicketStore` does not
 * type). That pair is what "detached, but recoverable" means.
 */
async function inTrash(tickets: TicketStore, uid: string): Promise<boolean> {
  const live = await tickets.get({ uid }).then(
    () => true,
    () => false,
  )
  const get = tickets.get.bind(tickets) as (a: {
    uid: string
    include_archived: boolean
  }) => Promise<{ ticket: Ticket }>
  const kept = await get({ uid, include_archived: true }).then(
    ({ ticket }) => ticket.uid === uid,
    () => false,
  )
  return !live && kept
}

/** Every `reference` ticket that claims this bundle name. */
async function referencesFor(tickets: TicketStore, bundle: string): Promise<Ticket[]> {
  const { tickets: all } = await tickets.list({ type: 'reference', limit: 'all' })
  return all.filter((t) => t.fields.bundle === bundle)
}

function routerEnv(tenantId: string): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

async function memberBytes(tenantId: string, uid: string, member: string): Promise<Uint8Array> {
  const res = await route(
    new Request(`https://app.test/api/material/file?uid=${uid}&member=${encodeURIComponent(member)}`),
    routerEnv(tenantId),
    {},
  )
  expect(res.status).toBe(200)
  return new Uint8Array(await res.arrayBuffer())
}

// ── AC-2044 ──────────────────────────────────────────────────────────────────

describe('AC-2044 — capture_site returns name, address, counts, refusals and the reference report', () => {
  it('test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report', async () => {
    const TENANT = 'ac2044'
    const { tickets, references } = await stores(TENANT)

    // 2. No adoption dependency: the report says nothing was written, and why.
    const bare = fidelityOperations(fidelity(references))
    const plain = (await bare.capture_site({ url: 'http://fixture.test/plain' })) as CaptureAnswer
    expect(typeof plain.bundle).toBe('string')
    expect(plain.bundle.length).toBeGreaterThan(0)
    expect(plain.url).toBe('http://fixture.test/plain')
    expect(Number.isInteger(plain.pages)).toBe(true)
    expect(plain.pages).toBeGreaterThanOrEqual(1)
    expect(Number.isInteger(plain.assets)).toBe(true)
    expect(plain.assets).toBeGreaterThanOrEqual(0)
    expect(plain.refusals).toEqual([])
    expect(plain.reference.adopted).toBe(false)
    expect(plain.reference.uid).toBeNull()
    expect(plain.reference.created).toBe(false)
    expect(typeof plain.reference.why).toBe('string')
    expect(plain.reference.why!.length).toBeGreaterThan(0)

    // 3. With an adoption dependency: the report names the ticket written.
    const wired = fidelityOperations(
      fidelity(references, async (bundle) => {
        const adopted = await adoptCapture(tickets, references.bundle(bundle))
        return { uid: adopted.ticket.uid, created: adopted.created }
      }),
    )
    const first = (await wired.capture_site({ url: 'http://fixture.test/wired' })) as CaptureAnswer
    expect(first.refusals).toEqual([])
    expect(first.reference.adopted).toBe(true)
    expect(typeof first.reference.uid).toBe('string')
    expect(first.reference.created).toBe(true)
    expect(first.reference.why).toBeNull()
    const ticket = (await tickets.get({ uid: first.reference.uid! })).ticket
    expect(ticket.type).toBe('reference')
    expect(ticket.fields.bundle).toBe(first.bundle)

    // A second capture of the same page is an in-place update, and says so.
    const again = (await wired.capture_site({ url: 'http://fixture.test/wired' })) as CaptureAnswer
    expect(again.reference.adopted).toBe(true)
    expect(again.reference.uid).toBe(first.reference.uid)
    expect(again.reference.created).toBe(false)

    // 4. The returned name is the one every other operation takes.
    const listed = (await wired.list_references({})) as { references: { bundle: string }[] }
    expect(listed.references.map((r) => r.bundle)).toContain(first.bundle)
    const described = (await wired.describe_reference({ bundle: first.bundle })) as {
      bundle: string
      url: string
    }
    expect(described).toMatchObject({ bundle: first.bundle, url: 'http://fixture.test/wired' })
    const picture = await wired.screenshot({ of: { kind: 'reference', bundle: first.bundle } })
    expect(isContentBlocks(picture)).toBe(true)
    expect((picture as { type: string }[]).some((b) => b.type === 'image')).toBe(true)
  })
})

// ── AC-2080 ──────────────────────────────────────────────────────────────────

/**
 * A puppeteer-shaped browser at the Browser Rendering seam. Each page sends its
 * navigation through the driver's own interception handler (so the production
 * egress guard decides), and answers page scripts the way the shared fake
 * capture driver does.
 */
function puppeteerBrowser(): () => Promise<PuppeteerBrowser> {
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
        await new Promise<void>((resolve) => {
          const req: PuppeteerRequest = {
            url: () => url,
            respond: async () => resolve(),
            continue: async () => {
              doc = '<html><head><title>Fixture Site</title></head><body><h1>Fluid Headline</h1></body></html>'
              resolve()
            },
          }
          for (const h of handlers) h(req)
        })
        return {}
      },
      evaluate: async (script: string) => (script === HINTS_SCRIPT ? CANNED_HINTS : signalsFor(width)),
      addStyleTag: async () => ({}),
      waitForNetworkIdle: async () => {},
      screenshot: async () => PNG,
      content: async () => doc,
    }
  }
  return async () => ({
    createBrowserContext: async () => ({ newPage: async () => page(), close: async () => {} }),
    close: async () => {},
  })
}

function workerEnv(tenantId: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    BROWSER: { fetch: async () => new Response('stub', { status: 200 }) } as unknown as Fetcher,
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as Env
}

const jsonRequest = (path: string, body: unknown): Request =>
  new Request(`https://app.example/${path.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

/** The text of the first `tool_result` the model was handed back. */
function toolResultText(client: ScriptedClient): string {
  const result = client.seen
    .flatMap((req) => req.messages)
    .filter((m) => m.role === 'user')
    .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
    .find((b) => (b as { type?: string }).type === 'tool_result') as { content: unknown } | undefined
  expect(result).toBeDefined()
  const content = result!.content
  if (typeof content === 'string') return content
  return (content as { text?: string }[]).map((b) => b.text ?? '').join('\n')
}

describe('AC-2080 — capture_site on the deployed host writes one multi-member reference ticket', () => {
  it('test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member', async () => {
    const TENANT = 'ac2080'
    await ensureTenant(TENANT)
    const slug = nextSlug('ac2080')
    const seed = siteSeed({ slug })
    const imported = await worker.fetch(
      jsonRequest('/api/import', {
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      }),
      workerEnv(TENANT),
    )
    expect(imported.status).toBe(200)

    const client = scriptedClient([
      calls('capture_site', { url: 'http://fixture.test/deployed' }),
      says('Captured it.'),
    ])
    setModelClient(client)
    // The Worker's own router and chat host — the production composition of the
    // fidelity surface — with only the browser it would lease injected.
    const launch = puppeteerBrowser()
    const chat = (path: string, body: unknown) =>
      route(jsonRequest(path, body), workerEnv(TENANT), { launch })

    const opened = await chat('/api/ai/session', { slug })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; error?: string }
    expect(session.error).toBeUndefined()
    const turn = await chat('/api/ai/prompt', { sessionId: session.sessionId, text: 'Capture it.' })
    expect(turn.status).toBe(200)
    await turn.text()

    const text = toolResultText(client)
    expect(text.startsWith('Error'), text.slice(0, 300)).toBe(false)
    const answer = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as CaptureAnswer
    // The capture itself succeeded…
    expect(answer.bundle).toBe('fixture.test/deployed')

    // …and on the deployed host it was written up as reference material.
    expect(answer.reference.adopted, String(answer.reference.why)).toBe(true)

    const { tickets, references } = await stores(TENANT)
    const refs = await referencesFor(tickets, answer.bundle)
    expect(refs).toHaveLength(1)
    const ticket = refs[0]
    expect(ticket.uid).toBe(answer.reference.uid)
    expect(ticket.fields.kind).toBe('capture')
    expect(ticket.fields.source_url).toBe('http://fixture.test/deployed')
    expect(ticket.fields.filename).toBeUndefined()

    // One live record per bundle member, each tagged with its member name.
    const bundleMembers = (await references.bundle(answer.bundle).list()).sort()
    const { attachments } = await tickets.attachments({ uid: ticket.uid })
    const live = attachments
    expect(live.map(memberOf).sort()).toEqual(bundleMembers)
    const shot = live.find((a) => memberOf(a) === SCREENSHOT_MEMBER)!
    expect(shot.fields.content_type).toBe('image/png')
    const record = live.find((a) => memberOf(a) === CAPTURE_MEMBER)!
    expect(record.fields.content_type).toBe('application/json')

    // Any single member is readable by name, without the others.
    const bytes = await memberBytes(TENANT, ticket.uid, SCREENSHOT_MEMBER)
    expect(bytes).toEqual(await references.bundle(answer.bundle).read(SCREENSHOT_MEMBER))
  })
})

// ── AC-2081 ──────────────────────────────────────────────────────────────────

describe('AC-2081 — the reference is titled by the page and its body opens with a link', () => {
  it('test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts', async () => {
    const TENANT = 'ac2081'
    const { tickets, references } = await stores(TENANT)
    const describer = {
      describeImage: async () => ({ text: 'A neighbourhood bakery selling sourdough.', model: 'stub/vision-1' }),
    }

    // 1. A titled page, with a describer.
    const titled = await captured(references, { path: '/titled' })
    const one = await adoptCapture(tickets, references.bundle(titled), {}, describer)
    expect(one.ticket.title).toBe('Green Oven Bakery')
    const lines = one.ticket.body.split('\n')
    expect(lines[0]).toBe('[Green Oven Bakery](https://greenoven.test/)')
    expect(one.ticket.body).toContain('#2f5d3a') // the measured palette
    expect(one.ticket.body).toContain('Lora') // the measured type
    expect(one.ticket.body).toContain('A neighbourhood bakery selling sourdough.')
    expect(one.ticket.fields.description_status).toBe('ok')

    // 2. A blank title falls back to the captured host.
    const blank = await captured(references, { path: '/blank', title: '  ' })
    const two = await adoptCapture(tickets, references.bundle(blank), {}, describer)
    expect(two.ticket.title).toBe('greenoven.test')
    expect(two.ticket.body.split('\n')[0]).toBe('[greenoven.test](https://greenoven.test/)')

    // 3. No describer: still the link and the measured facts, and says why.
    const plain = await captured(references, { path: '/plain' })
    const three = await adoptCapture(tickets, references.bundle(plain), {}, {})
    expect(three.ticket.body.split('\n')[0]).toBe('[Green Oven Bakery](https://greenoven.test/)')
    expect(three.ticket.body).toContain('#2f5d3a')
    expect(three.ticket.body).toContain('Lora')
    expect(three.ticket.body).toContain('Captured but not described')
    expect(three.ticket.fields.description_status).toBe('no_describer')

    // A describer but no screenshot: the same degraded body, recorded as no_text.
    const shotless = await captured(references, { path: '/shotless' }, new Uint8Array())
    const four = await adoptCapture(tickets, references.bundle(shotless), {}, describer)
    expect(four.ticket.body.split('\n')[0]).toBe('[Green Oven Bakery](https://greenoven.test/)')
    expect(four.ticket.body).toContain('#2f5d3a')
    expect(four.ticket.body).toContain('Captured but not described')
    expect(four.ticket.fields.description_status).toBe('no_text')
  })
})

// ── AC-2082 ──────────────────────────────────────────────────────────────────

describe('AC-2082 — rights come from provenance', () => {
  it('test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable', async () => {
    const TENANT = 'ac2082'
    const { tickets, references } = await stores(TENANT)

    async function rightsOf(host: string, clientDomain?: string) {
      const name = await captured(references, { host, url: `https://${host}/`, path: `/${clientDomain ?? 'none'}` })
      const adopted = await adoptCapture(tickets, references.bundle(name), clientDomain ? { clientDomain } : {})
      const f = adopted.ticket.fields
      return { rights: f.rights, republishable: f.republishable, exportable: f.exportable }
    }

    const owned = { rights: 'owned', republishable: true, exportable: false }
    const thirdParty = { rights: 'third_party', republishable: false, exportable: true }

    expect(await rightsOf('example.com', 'example.com')).toEqual(owned)
    expect(await rightsOf('www.example.com', 'example.com')).toEqual(owned)
    // A leading `www.` on the declared domain is ignored.
    expect(await rightsOf('shop.example.com', 'www.example.com')).toEqual(owned)

    expect(await rightsOf('notexample.com', 'example.com')).toEqual(thirdParty)
    expect(await rightsOf('other.org', 'example.com')).toEqual(thirdParty)

    // No declared domain: every capture is somebody else's.
    expect(await rightsOf('example.com')).toEqual(thirdParty)
  })
})

// ── AC-2083 ──────────────────────────────────────────────────────────────────

describe('AC-2083 — recapture updates one ticket in place, deduplicated by content hash', () => {
  it('test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members', async () => {
    const TENANT = 'ac2083'
    const { tickets, references } = await stores(TENANT)
    const name = await captured(references, { path: '/recapture' })
    const bundle = references.bundle(name)

    const first = await adoptCapture(tickets, bundle)
    expect(first.created).toBe(true)
    const recordsBefore = (await tickets.attachments({ uid: first.ticket.uid })).attachments
      .map((a) => a.uid)
      .sort()
    const blobsBefore = await blobKeys(TENANT)

    // 1. Unchanged recapture: same ticket, nothing written, every member unchanged.
    const second = await adoptCapture(tickets, bundle)
    expect(second.created).toBe(false)
    expect(second.ticket.uid).toBe(first.ticket.uid)
    expect(await referencesFor(tickets, name)).toHaveLength(1)
    expect([...second.unchanged].sort()).toEqual([...second.members].sort())
    expect(
      (await tickets.attachments({ uid: first.ticket.uid })).attachments.map((a) => a.uid).sort(),
    ).toEqual(recordsBefore)
    expect(await blobKeys(TENANT)).toEqual(blobsBefore)

    // 2. A changed screenshot: one live record with the new bytes; the old one
    // is detached (archived, bytes still held) rather than purged.
    const oldShot = (await tickets.attachments({ uid: first.ticket.uid })).attachments.find(
      (a) => memberOf(a) === SCREENSHOT_MEMBER,
    )!
    const newShot = await encodePng({ data: new Uint8Array(8 * 8 * 3).fill(7), width: 8, height: 8, channels: 3 })
    await bundle.write(SCREENSHOT_MEMBER, newShot)
    const third = await adoptCapture(tickets, bundle)
    expect(third.ticket.uid).toBe(first.ticket.uid)
    expect(third.unchanged).not.toContain(SCREENSHOT_MEMBER)
    expect(third.unchanged).toContain(CAPTURE_MEMBER)
    const liveShots = (await tickets.attachments({ uid: first.ticket.uid })).attachments.filter(
      (a) => memberOf(a) === SCREENSHOT_MEMBER,
    )
    expect(liveShots).toHaveLength(1)
    expect(liveShots[0].uid).not.toBe(oldShot.uid)
    expect(await memberBytes(TENANT, first.ticket.uid, SCREENSHOT_MEMBER)).toEqual(newShot)
    expect(await inTrash(tickets, oldShot.uid)).toBe(true)
    // Recoverable, not purged: restoring the superseded record from the trash
    // brings its bytes back under its own address. Then put it back in the trash.
    expect(await blobKeys(TENANT)).not.toContain(`t/${TENANT}/blob/${oldShot.uid}`)
    const component = tickets as unknown as { unarchive(a: { uid: string }): Promise<unknown> }
    await component.unarchive({ uid: oldShot.uid })
    expect((await tickets.get({ uid: oldShot.uid })).ticket.uid).toBe(oldShot.uid)
    expect(await blobKeys(TENANT)).toContain(`t/${TENANT}/blob/${oldShot.uid}`)
    await tickets.detach({ uid: oldShot.uid })
    expect(await inTrash(tickets, oldShot.uid)).toBe(true)

    // 3. A member the bundle no longer holds is detached.
    const heroRecord = (await tickets.attachments({ uid: first.ticket.uid })).attachments.find(
      (a) => memberOf(a) === 'assets/hero.jpg',
    )!
    // The store has no delete verb; a recapture that no longer mirrors the image
    // leaves the bundle without that key, which is what removing it from R2 models.
    await (env.BLOBS as R2Bucket).delete(`t/${TENANT}/ref/${name}/assets/hero.jpg`)
    expect(await bundle.list()).not.toContain('assets/hero.jpg')
    await adoptCapture(tickets, bundle)
    const live = (await tickets.attachments({ uid: first.ticket.uid })).attachments
    expect(live.map(memberOf)).not.toContain('assets/hero.jpg')
    expect(await inTrash(tickets, heroRecord.uid)).toBe(true)
    // Still exactly one live record per member name.
    const names = live.map(memberOf)
    expect(new Set(names).size).toBe(names.length)

    // 4. A hand-edited body is rewritten by the next recapture.
    await tickets.update({ uid: first.ticket.uid, patch: { body: 'The client wrote this.' } })
    const fifth = await adoptCapture(tickets, bundle)
    expect(fifth.ticket.body).not.toContain('The client wrote this.')
    expect(fifth.ticket.body.split('\n')[0]).toBe('[Green Oven Bakery](https://greenoven.test/)')
    expect(await referencesFor(tickets, name)).toHaveLength(1)
  })
})

// ── AC-2084 ──────────────────────────────────────────────────────────────────

describe('AC-2084 — no ticket store, or a failed adoption, never loses the capture', () => {
  it('test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why', async () => {
    const TENANT = 'ac2084'
    const { tickets, references } = await stores(TENANT)

    // 1. No adoption dependency (the `1c` CLI's shape): captures as before.
    const cli = fidelityOperations(fidelity(references))
    const plain = (await cli.capture_site({ url: 'http://nostore.test/' })) as CaptureAnswer
    expect(plain.reference.adopted).toBe(false)
    expect(plain.reference.uid).toBeNull()
    expect(plain.reference.why).toContain('stored but not indexed')
    expect((await references.bundle(plain.bundle).list())).toContain(CAPTURE_MEMBER)
    const described = (await cli.describe_reference({ bundle: plain.bundle })) as { bundle: string }
    expect(described.bundle).toBe(plain.bundle)

    // 2. Adoption attempted and failing: reported, not raised; bundle kept whole.
    const flaky = fidelityOperations(
      fidelity(references, async () => {
        throw new Error('describer unreachable')
      }),
    )
    const failed = (await flaky.capture_site({ url: 'http://flaky.test/' })) as CaptureAnswer
    expect(failed.reference.adopted).toBe(false)
    expect(failed.reference.uid).toBeNull()
    expect(failed.reference.why).toContain('describer unreachable')
    const listed = (await flaky.list_references({})) as { references: { bundle: string }[] }
    expect(listed.references.map((r) => r.bundle)).toContain(failed.bundle)
    expect(((await flaky.describe_reference({ bundle: failed.bundle })) as { bundle: string }).bundle).toBe(
      failed.bundle,
    )
    const picture = await flaky.screenshot({ of: { kind: 'reference', bundle: failed.bundle } })
    expect(isContentBlocks(picture)).toBe(true)
    expect((picture as { type: string }[]).some((b) => b.type === 'image')).toBe(true)

    // 3. A bundle with no capture record is refused by name as not a capture.
    const notCapture = references.bundle('nothing.test/_')
    await notCapture.write('readme.txt', new TextEncoder().encode('not a capture'))
    const refused = await adoptCapture(tickets, notCapture).then(
      () => null,
      (e: unknown) => e,
    )
    expect(refused).toBeInstanceOf(NotACaptureError)
    expect((refused as Error).message).toContain('nothing.test/_')
    expect((refused as Error).message).toContain('not a capture')
  })
})
