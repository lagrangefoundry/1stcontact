import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, sessionFidelity, type RouterEnv } from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { bundleNameFor, type ReferenceStore } from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult } from '../tools/generate/src/cli/capture/types'
import { encodePng } from '../tools/generate/src/cli/png'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { syntheticCapture } from './support/reference-fixtures'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * REQ-286 — **the consultant looks as often as the work needs.**
 *
 * WHAT THIS IS EVIDENCE OF. [[REQ-206]] put a ceiling of forty browser
 * acquisitions on a conversation and proved it with an AC that walked up to the
 * limit and asserted the refusal. This ticket removes the ceiling, so this is
 * that AC inverted: it drives MORE acquisitions than the old limit allowed and
 * asserts that every one of them leases a browser and hands back a picture. It
 * is the difference between a ceiling that was raised and a ceiling that is
 * gone — a raised one would still stop somewhere, and a test that only looked
 * forty-one times could not tell the two apart.
 *
 * THROUGH THE PRODUCTION ASSEMBLY, not a second one written here.
 * `sessionFidelity` is what `router.ts` hands a consultant session, so what is
 * under test is what this deployment actually gives the surface — over a real D1
 * database and two real R2 buckets inside workerd. The browser is the one double
 * and it is a genuine external boundary; nothing between it and us is faked.
 *
 * THE CLAIMS:
 *
 *  1. LOOKING IS NOT RATIONED — more live-page looks than the old ceiling
 *     allowed, every one of them leased and answered with a picture.
 *  2. READING WHAT IS ALREADY CAPTURED STILL NEEDS NO BROWSER. This assertion
 *     comes from REQ-206's own budget UAT, which this ticket deletes: it was
 *     never about the budget, it is about captures being usable without going
 *     back to the web, and it would have been lost with the file it sat in.
 */

/**
 * More looks than [[REQ-206]]'s `SESSION_BROWSER_BUDGET`, which was forty.
 *
 * A CONSTANT THAT OUTLIVES THE THING IT EXCEEDS, deliberately: the ceiling is
 * deleted, so there is nothing left to import and compare against. Forty-eight
 * is six responsive ladders — a consultation that is genuinely working through
 * a site — and it is chosen to be comfortably past the old number rather than
 * one past it.
 */
const LOOKS = 48

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

/** A real PNG, because the fidelity surface DECODES what the browser hands back. */
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
    scopeOf(id),
    {},
  )
  expect(imported.status).toBe(200)
  return { scope: scopeOf(id), slug: ((await imported.json()) as { site: string }).site }
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

describe('REQ-286 — looking is not rationed', () => {
  it('test_UAT_FC_REQ-286_a_conversation_can_look_as_often_as_the_work_needs', async () => {
    const id = 'req286-unrationed'
    const { slug } = await business(id)
    const { tickets, references } = await stores(id)
    const bundle = await plantCapture(references, 'oldsite.test')
    const browser = fakeBrowser({ png: await realPng() })

    const factory = await sessionFidelity(
      routerEnv(),
      scopeOf(id),
      { launch: browser.launch },
      await storeFor(routerEnv(), scopeOf(id)),
      tickets,
      ORIGIN,
    )
    expect(factory).not.toBeNull()
    const ops = fidelityOperations(factory!(slug))

    // CLAIM 1. Past where the ceiling used to be, and still going. Each look is
    // a real lease through the real launcher, and each one comes back as a
    // picture rather than a refusal.
    for (let i = 0; i < LOOKS; i++) {
      const picture = await ops.screenshot({ of: { kind: 'url', url: 'https://example.com/' } })
      expect(Array.isArray(picture)).toBe(true)
    }
    expect(browser.launches()).toBe(LOOKS)

    // CLAIM 2. Reading what is already captured never asks for a browser — the
    // assertion rescued from REQ-206's deleted budget UAT. The lease count is
    // unchanged across both of these, which is the whole of the claim: a capture
    // is a thing you can keep working from without going back to the web.
    const listed = (await ops.list_references({})) as { references: { bundle: string }[] }
    expect(listed.references.map((r) => r.bundle)).toContain(bundle)
    const fromStore = await ops.screenshot({ of: { kind: 'reference', bundle } })
    expect(Array.isArray(fromStore)).toBe(true)
    expect(browser.launches()).toBe(LOOKS)
  })
})
