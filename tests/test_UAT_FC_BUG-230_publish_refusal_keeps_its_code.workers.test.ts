/**
 * BUG-230 — a streaming publish of a site with no web address is a 409 with its
 * code, not a sentence in a stream.
 *
 * WHAT HAPPENED. The builder always publishes with `Accept: text/event-stream`
 * (REQ-222). The route committed `200` before `publishSite` ran, so the address
 * check's `NoPublicAddressError` was caught by the stream and written as a
 * terminal frame with no `code` — and the builder's no-address dialog, which
 * opens on that code, never opened. The client read the server's sentence, site
 * id included, in the failure banner.
 *
 * WHAT MAKES THIS EVIDENCE. Every case goes through the deployed Worker's own
 * `fetch` (or `route()` where a ladder has to be injected), inside workerd,
 * against real D1 and R2 — the request the toolbar's Publish button sends.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import { NoPublicAddressError } from '../tools/generate/src/cli/errors'
import type { ImageLadder } from '../tools/generate/src/publish/ladder'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { giveBusinessAnAddress } from './support/site-address'

/** One business per case: a business holds one address (REQ-238). */
let TENANT = 'bug230'
let businessSeq = 0

function controlEnv(): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as ControlEnv
}

/** A valid draft in this case's business, with or without a web address. */
async function draft({ address }: { address: boolean }): Promise<string> {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const seed = siteSeed({ slug: nextSlug('bug230') })
  const site = await store.createDraft()
  if (address) await giveBusinessAnAddress(TENANT)
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [],
  })
  return site
}

const streamingRequest = (site: string): Request =>
  new Request('https://app.example/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ site }),
  })

/** Every `data:` frame of a response, parsed. */
async function framesOf(res: Response): Promise<Record<string, unknown>[]> {
  return (await res.text())
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()))
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  TENANT = `bug230-${(businessSeq += 1)}`
})

describe('BUG-230 — the address check answers before the stream starts', () => {
  it('test_UAT_FC_BUG-230_a_streaming_publish_with_no_address_is_a_409_with_its_code', async () => {
    const site = await draft({ address: false })

    const res = await controlApp.fetch(streamingRequest(site), controlEnv())

    // THE SAME ANSWER THE JSON FORM GIVES — a status and a code, not a frame.
    expect(res.status).toBe(409)
    expect(res.headers.get('content-type')).toContain('application/json')
    const body = (await res.json()) as { error: string; code: string }
    expect(body.code).toBe('NO_PUBLIC_ADDRESS')

    // AND NOTHING WAS WRITTEN, exactly as REQ-238 promises for the JSON form.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    expect(await store.revisions(site)).toEqual([])
  })

  it('test_UAT_FC_BUG-230_a_site_with_an_address_still_streams', async () => {
    // HOLDING THE RESPONSE UNTIL THE PUBLISH SPEAKS changes nothing for a publish
    // that works: it is still an event stream ending in a terminal frame.
    const site = await draft({ address: true })

    const res = await controlApp.fetch(streamingRequest(site), controlEnv())

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const frames = await framesOf(res)
    expect(frames.at(-1)).toMatchObject({ kind: 'done', ok: true, published: true })
  })
})

describe('BUG-230 — a coded refusal after the stream starts keeps its code', () => {
  it('test_UAT_FC_BUG-230_a_late_coded_refusal_carries_its_code_in_the_terminal_frame', async () => {
    const site = await draft({ address: true })
    // A LADDER THAT SPEAKS AND THEN REFUSES: the plan frame commits the stream,
    // so the refusal can only be reported in the terminal frame.
    const ladder: ImageLadder = {
      async build(_source, opts) {
        opts?.onProgress?.({ total: 1, done: 0 })
        throw new NoPublicAddressError(site)
      },
    }
    const routerEnv = {
      DB: env.DB,
      SITES: env.SITES,
      ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    } as unknown as RouterEnv

    const res = await route(streamingRequest(site), routerEnv, { businessId: TENANT }, { ladder: () => ladder })

    expect(res.status).toBe(200)
    const frames = await framesOf(res)
    expect(frames[0]).toMatchObject({ kind: 'progress', total: 1, done: 0 })
    expect(frames.at(-1)).toMatchObject({ kind: 'done', ok: false, code: 'NO_PUBLIC_ADDRESS' })
  })
})
