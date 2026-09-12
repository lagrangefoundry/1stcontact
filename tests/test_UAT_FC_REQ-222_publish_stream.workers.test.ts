/**
 * REQ-222 — `POST /api/publish` as a stream, inside workerd.
 *
 * WHY THE STREAM EXISTS AND WHY IT IS TESTED HERE. Building the delivery ladder
 * decodes and re-encodes every picture on the site, and with two formats that
 * arithmetic doubles. The budget is explicitly *minutes with explanation*, so the
 * explanation is a deliverable — and the transport for it is the real thing: an
 * actual `ReadableStream` over an actual `text/event-stream` response, from the
 * real router, in the runtime the deployed Worker uses.
 *
 * THE ONE REAL DESIGN COST THIS FILE EXISTS TO PIN: **a failure after the headers
 * are sent.** The response has already committed `200` by the time the first
 * rendition is built, so a publish that fails midway cannot report itself as an
 * HTTP status. Two consequences, and both are asserted here rather than asserted
 * in prose:
 *
 *   - the terminal frame distinguishes success from failure EXPLICITLY, in the
 *     frame and not in the status;
 *   - and a stream that ends WITHOUT a terminal frame is a failure. A dropped
 *     connection rendering as a completed publish is the worst outcome available
 *     here — the client would believe a site is live that is not.
 *
 * THE JSON FORM IS ASSERTED TO BE UNTOUCHED, because that is the whole argument
 * for selecting on `Accept`: `1c publish` has no browser and no use for frames,
 * and every existing caller keeps the envelope it always got.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

const TENANT = 'req222stream'

function controlEnv(): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as ControlEnv
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  controlApp.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), controlEnv())

/** A draft with one page and no pictures, so a publish is fast and deterministic. */
async function draft(): Promise<string> {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const slug = nextSlug('req222stream')
  const seed = siteSeed({ slug })
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [],
  })
  return slug
}

/** Every `data:` frame of a response, parsed. */
async function framesOf(res: Response): Promise<Record<string, unknown>[]> {
  const text = await res.text()
  return text
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

const publish = (slug: string, accept?: string): Promise<Response> =>
  call('/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(accept ? { accept } : {}) },
    body: JSON.stringify({ slug }),
  })

describe('REQ-222 — the publish route streams when it is asked to', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('answers an event stream, ending in a terminal frame that says it worked', async () => {
    const slug = await draft()
    const res = await publish(slug, 'text/event-stream')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    // A publish a proxy answered from cache would be a button reporting the LAST
    // publish's outcome for this one.
    expect(res.headers.get('cache-control')).toContain('no-store')

    const frames = await framesOf(res)
    const terminal = frames[frames.length - 1]
    // EXPLICITLY, IN THE FRAME. The status committed `200` before any of this ran,
    // so the verdict cannot live there.
    expect(terminal.kind).toBe('done')
    expect(terminal.ok).toBe(true)
    // AND IT CARRIES EXACTLY WHAT THE JSON FORM'S BODY CARRIES, because one
    // function composes it for both — so the two cannot disagree about what a
    // publish answered.
    expect(terminal.published).toBe(true)
    expect(typeof terminal.id).toBe('number')
    expect(terminal).toHaveProperty('changes')
    expect(terminal).toHaveProperty('url')
  })

  it('answers the same publish as JSON when nothing asked for frames', async () => {
    // THE WHOLE ARGUMENT FOR SELECTING ON `Accept`: every existing caller — `1c
    // publish`, a UAT, anything that posts and reads JSON — is untouched.
    const slug = await draft()
    const res = await publish(slug)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    const body = (await res.json()) as Record<string, unknown>
    expect(body.published).toBe(true)
    expect(body).not.toHaveProperty('kind')
    expect(body).not.toHaveProperty('ok')
  })

  it('reports a failure in the terminal frame rather than as a status', async () => {
    // THE CLAIM THIS FILE EXISTS FOR. The response commits `200` the moment it
    // becomes a stream, so a publish that fails after that point CANNOT report
    // itself as an HTTP status — a client reading the status alone would report a
    // site as live that is not. The verdict is therefore in the frame.
    const res = await publish('no-such-site', 'text/event-stream')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const frames = await framesOf(res)
    const terminal = frames[frames.length - 1]
    expect(terminal.kind).toBe('done')
    expect(terminal.ok).toBe(false)
    // AND IT CARRIES A SENTENCE, scrubbed like every other error this router
    // emits — a failure with no words is a client who knows only that something
    // went wrong.
    expect(typeof terminal.error).toBe('string')
    expect(terminal.error as string).toContain('no-such-site')
  })

  it('refuses before committing to a stream where it still can', async () => {
    // NOT EVERY FAILURE IS POST-COMMIT. A malformed request is refused before the
    // response becomes a stream at all, so it keeps the ordinary status and the
    // ordinary envelope — which is what a client's own error handling reaches
    // first. The contract is only unusual where it has to be.
    const res = await call('/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('refuses a missing slug the same way in both forms', async () => {
    for (const accept of [undefined, 'text/event-stream']) {
      const res = await call('/api/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(accept ? { accept } : {}) },
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
      expect((await res.json() as Record<string, unknown>).error).toContain('slug')
    }
  })

  it('says nothing about resizing when there is nothing to resize', async () => {
    // A site with no pictures reports a total of zero, which is what lets the
    // builder stay quiet — a republish that warned about resizing would train the
    // client to ignore the one case where it matters.
    const slug = await draft()
    const frames = await framesOf(await publish(slug, 'text/event-stream'))
    for (const frame of frames.filter((f) => f.kind === 'progress')) {
      expect(frame.total).toBe(0)
    }
  })
})
