import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DRAFT_AT_TIMING,
  PREVIEW_STILL_PARAM,
  route,
  SITE_CHANGES_PATH,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { L1_REVEAL_SCRIPT } from '../packages/framework/src/l1/render'
import { editAlternativesMake, editPageUpdate } from '../tools/generate/src/cli/edit'
import { applySchema, seedTenantSite, tenantStore } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * [[BUG-248]] — **the origin half: a change says which pages it touched, and the
 * builder preview can be asked for a page with its entrances off.** In workerd,
 * against real D1.
 *
 * The preview used to reload whatever page it showed on every write, because
 * the draft feed said only *that* the draft moved. Now each `draft` frame names
 * the pages written and whether anything every page renders moved — so a
 * preview of the home page can leave itself alone while the prices page is
 * built, and a look (a page of its own) is not its page. And a refresh asks for
 * `?still`, which serves the page without the script that runs its entrances.
 *
 * ONE DOUBLE, THE CLOCK: `draftChangePollMs` runs the poll fast.
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

type Frame = { kind: string; at: number; pages?: string[]; site?: boolean }

/** Read SSE frames until `want` arrive; `during` runs once the feed has opened. */
async function frames(res: Response, want: number, during: () => Promise<unknown>): Promise<Frame[]> {
  const reader = (res.body as ReadableStream<Uint8Array>).getReader()
  const decoder = new TextDecoder()
  const out: Frame[] = []
  let buffer = ''
  let started = false
  const deadline = Date.now() + SETTLE_MS
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
        if (dataLine) out.push(JSON.parse(dataLine.slice(5).trim()))
      }
      if (!started && out.length > 0) {
        started = true
        await during()
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return out
}

/** A two-page site whose home page has an entrance on its heading. */
let n = 0
async function siteOf(): Promise<{ business: string; site: string }> {
  const business = `bug248-biz-${++n}`
  const home = structuredClone(siteSeed().pages['home.json']) as {
    l1: { root: { children: Array<Record<string, unknown>> } }
  }
  home.l1.root.children[0].reveal = { fromOpacity: 0, yPx: 24, durationMs: 500 }
  const prices = { ...structuredClone(home), id: 'prices', slug: 'prices', title: 'Prices' }
  const { site } = await seedTenantSite(business, { pages: { 'home.json': home, 'prices.json': prices } })
  return { business, site }
}

const feedOf = (business: string, site: string) =>
  call(business, `${SITE_CHANGES_PATH}?site=${encodeURIComponent(site)}`)

beforeAll(async () => {
  await applySchema()
})

describe('BUG-248 — a change says which pages it touched', () => {
  it('test_UAT_FC_BUG-248_a_write_to_one_page_names_that_page_and_nothing_site_wide', async () => {
    const { business, site } = await siteOf()
    const store = await tenantStore(business)

    const got = await frames(await feedOf(business, site), 2, () =>
      editPageUpdate(site, 'prices', { store, title: 'Our prices' }),
    )

    expect(got[1]).toEqual({ kind: 'draft', at: await store.counter(site), pages: ['prices'], site: false })
  })

  it('test_UAT_FC_BUG-248_a_style_change_is_site_wide', async () => {
    const { business, site } = await siteOf()
    const palette = () =>
      call(business, '/api/palette', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ site, op: 'add', name: 'bug248', value: '#123456' }),
      }).then(async (res) => expect(res.status, await res.clone().text()).toBe(200))

    const got = await frames(await feedOf(business, site), 2, palette)

    expect(got[1]).toMatchObject({ kind: 'draft', pages: [], site: true })
  })

  it('test_UAT_FC_BUG-248_setting_up_looks_names_the_look_pages_not_the_page_they_are_for', async () => {
    const { business, site } = await siteOf()
    const store = await tenantStore(business)

    const got = await frames(await feedOf(business, site), 2, () =>
      editAlternativesMake(site, 'home', { store, looks: [{ label: 'Heavy duty' }] }),
    )

    // The look is a page of its own; the home page itself was not written.
    expect(got[1]).toMatchObject({ kind: 'draft', pages: ['home-heavy-duty'], site: false })
  })
})

describe('BUG-248 — the builder preview without entrances', () => {
  it('test_UAT_FC_BUG-248_a_still_preview_carries_no_entrance_script_and_the_plain_one_does', async () => {
    const { business, site } = await siteOf()
    const page = `/preview/${encodeURIComponent(site)}/draft/`

    const plain = await call(business, page)
    expect(plain.status).toBe(200)
    expect(await plain.text()).toContain(L1_REVEAL_SCRIPT)

    const still = await call(business, `${page}?${PREVIEW_STILL_PARAM}=1`)
    expect(still.status).toBe(200)
    const body = await still.text()
    // Without the script nothing sets the motion marker, so the page renders
    // settled — and it is still the page, stamped with its change count.
    expect(body).not.toContain(L1_REVEAL_SCRIPT)
    expect(body).toContain('data-l1-')
    expect(still.headers.get('server-timing')).toMatch(new RegExp(`^${DRAFT_AT_TIMING};desc="\\d+"$`))
  })
})
