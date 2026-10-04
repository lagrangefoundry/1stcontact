import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DRAFT_AT_TIMING,
  DRAFT_CHANGE_POLL_MS,
  route,
  SITE_CHANGES_PATH,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'

/**
 * [[BUG-192]] — **the preview's own feed over the draft, in workerd, against
 * real D1.**
 *
 * The preview reloaded only on `site_changed`, which rides inside the
 * consultant's chat stream — so a delegated builder that wrote and then aborted
 * left the draft moved and the frame stale, with nothing comparing the two. This
 * is the origin half of the fix: a feed over the draft's change count that every
 * structured write moves, whichever session made it, and that a reconnecting
 * client can resume on. And the preview response states the count it was rendered
 * at, so the client can tell a change it is missing from one it already shows.
 *
 * EVERY WRITE HERE GOES THROUGH A REAL WRITE ROUTE (`/api/palette`) — none
 * of them through a chat stream, which is the point: the feed must see a write
 * no conversation reported.
 *
 * ONE DOUBLE, THE CLOCK: `draftChangePollMs` runs the poll fast. The shipped
 * cadence is asserted separately.
 */

const SETTLE_MS = 3000
const TEST_POLL_MS = 10

function routerEnv(tenant: string): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenant,
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) } as unknown as Fetcher,
  } as RouterEnv
}

const deps = (): RouterDeps => ({ draftChangePollMs: TEST_POLL_MS })

async function call(business: string, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await route(
    new Request(`https://control.test/b/${business}${path}`, init),
    routerEnv(business),
    { businessId: business },
    deps(),
  )
  if (!res) throw new Error(`no route answered ${path}`)
  return res
}

/** Read SSE frames off a live response until `want` arrive, or the deadline. */
async function frames(
  res: Response,
  want: number,
  during?: () => Promise<unknown>,
  timeoutMs = SETTLE_MS,
): Promise<Array<{ id: string | null; data: { kind: string; at: number } }>> {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  const out: Array<{ id: string | null; data: { kind: string; at: number } }> = []
  let buffer = ''
  let started = false
  const deadline = Date.now() + timeoutMs
  try {
    while (out.length < want && Date.now() < deadline) {
      const chunk = await Promise.race([
        reader.read(),
        new Promise<{ value: undefined; done: false }>((resolve) =>
          setTimeout(() => resolve({ value: undefined, done: false }), 25),
        ),
      ])
      if (chunk.done) break
      if (chunk.value) buffer += decoder.decode(chunk.value, { stream: true })
      let split: number
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, split)
        buffer = buffer.slice(split + 2)
        const dataLine = block.split('\n').find((l) => l.startsWith('data:'))
        if (!dataLine) continue
        const idLine = block.split('\n').find((l) => l.startsWith('id:'))
        out.push({ id: idLine ? idLine.slice(3).trim() : null, data: JSON.parse(dataLine.slice(5).trim()) })
      }
      // The out-of-band write, once the connection has stated where it opened.
      if (!started && out.length > 0 && during) {
        started = true
        await during()
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return out
}

let n = 0
async function siteOf(): Promise<{ business: string; site: string }> {
  const business = `bug192-biz-${++n}`
  const { site } = await seedTenantSite(business)
  return { business, site }
}

/**
 * A structured write to the draft that no chat stream reports — a palette entry
 * added through the builder's own write route.
 */
let colours = 0
const write = (business: string, site: string) =>
  call(business, '/api/palette', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ site, op: 'add', name: `bug192-${++colours}`, value: '#123456' }),
  }).then(async (res) => expect(res.status, await res.clone().text()).toBe(200))

const counter = async (business: string, site: string) => (await tenantStore(business)).counter(site)

beforeAll(async () => {
  await applySchema()
})

describe('BUG-192 — the draft change feed', () => {
  it('test_UAT_FC_BUG-192_the_feed_opens_at_the_current_change_count', async () => {
    const { business, site } = await siteOf()
    await write(business, site)
    const at = await counter(business, site)
    expect(at).toBeGreaterThan(0)

    const res = await call(business, `${SITE_CHANGES_PATH}?site=${encodeURIComponent(site)}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/event-stream/)
    const got = await frames(res, 1)
    // The count, stated before anything can move it — and as the id, so a
    // reconnect presents it back.
    expect(got[0]).toEqual({ id: String(at), data: { kind: 'ready', at } })
  })

  it('test_UAT_FC_BUG-192_a_write_no_conversation_reported_reaches_the_feed', async () => {
    const { business, site } = await siteOf()
    const before = await counter(business, site)
    const res = await call(business, `${SITE_CHANGES_PATH}?site=${encodeURIComponent(site)}`)

    const got = await frames(res, 2, () => write(business, site))

    const after = await counter(business, site)
    expect(after).toBeGreaterThan(before)
    expect(got.map((f) => f.data)).toEqual([
      { kind: 'ready', at: before },
      { kind: 'draft', at: after },
    ])
    expect(got[1].id).toBe(String(after))
  })

  it('test_UAT_FC_BUG-192_a_reconnect_behind_the_draft_is_told_at_once', async () => {
    // The tester's case: the preview's connection dropped while a worker wrote.
    // The browser comes back presenting the last count it saw, and the gap is
    // reported without waiting for another write.
    const { business, site } = await siteOf()
    const seen = await counter(business, site)
    await write(business, site)
    await write(business, site)
    const now = await counter(business, site)

    const res = await call(business, `${SITE_CHANGES_PATH}?site=${encodeURIComponent(site)}&since=0`, {
      headers: { 'last-event-id': String(seen) },
    })
    const got = await frames(res, 2)
    // `Last-Event-ID` wins over `?since`, and the moves collapse into one frame
    // carrying where the count is now.
    expect(got.map((f) => f.data)).toEqual([
      { kind: 'ready', at: seen },
      { kind: 'draft', at: now },
    ])
  })

  it('test_UAT_FC_BUG-192_the_feed_refuses_a_missing_or_foreign_site', async () => {
    const { business } = await siteOf()
    const other = await siteOf()
    expect((await call(business, SITE_CHANGES_PATH)).status).toBe(400)
    expect(
      (await call(business, `${SITE_CHANGES_PATH}?site=${encodeURIComponent(other.site)}`)).status,
    ).toBe(404)
  })

  it('test_UAT_FC_BUG-192_the_feed_polls_at_the_cadence_the_other_feeds_use', () => {
    expect(DRAFT_CHANGE_POLL_MS).toBe(2000)
  })
})

describe('BUG-192 — the preview response states the count it was rendered at', () => {
  it('test_UAT_FC_BUG-192_draft_and_edit_pages_carry_their_change_count', async () => {
    const { business, site } = await siteOf()
    await write(business, site)
    const at = await counter(business, site)

    for (const channel of ['draft', 'edit']) {
      const res = await call(business, `/preview/${encodeURIComponent(site)}/${channel}/`)
      expect(res.status).toBe(200)
      // A `Server-Timing` metric — the one header the frame's document can read
      // about itself — and NOT a mark in the page, whose bytes are the build's.
      expect(res.headers.get('server-timing'), `${channel} page`).toBe(`${DRAFT_AT_TIMING};desc="${at}"`)
      expect(await res.text()).not.toContain(String(DRAFT_AT_TIMING))
    }
  })
})
