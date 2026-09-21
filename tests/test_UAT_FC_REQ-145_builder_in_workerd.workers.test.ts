import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-145 — `control-app` is the builder, in workerd.
 *
 * WHAT MAKES THESE ASSERTIONS WORTH ANYTHING. Every one runs INSIDE workerd,
 * through the Worker's own `fetch`, against a real D1 database and a real R2
 * bucket supplied by `@cloudflare/vitest-pool-workers`. Nothing is stubbed and
 * no `node:http` server is involved. That matters more here than usual: the
 * whole ticket is the claim "this code can run in a Worker", and a node-side
 * test of the same functions would pass while proving exactly nothing about it.
 *
 * It is also why these are the tests that would have caught the two things the
 * ticket did not anticipate — `getModuleCss()` reading `.astro` sources off disk
 * for every site, and Astro reaching the bundle through an `import()` a bundler
 * resolves eagerly. Both failed here first.
 */

/**
 * ONE BUSINESS PER CASE ([[REQ-236]]).
 *
 * Every case here used to share the tenant `req145` and give itself a private
 * site by pushing a distinct `nextSlug()`, because a payload NAMED its
 * destination. The route resolves the receiving business's single site now, so a
 * shared tenant is a shared site — and one case's palette edit journals a change
 * that makes the next case's import a 409. Separate businesses restore the
 * isolation the slug used to provide.
 */
let businessSeq = 0
const nextBusiness = (): string => `req145-${(businessSeq += 1)}`

/** The bindings the Worker declares, as `wrangler.toml` declares them. */
function workerEnv(tenant: string, overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenant,
    // The loopback dev server: Access is unconfigured, so the gate would refuse
    // every request. See `index.ts` on why this cannot open a deployed Worker.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      // The assets binding is the build output (`1c assets`), which is not built
      // in the test environment. What the ROUTER owes it is the fall-through
      // itself — that an unmatched path reaches it rather than 404ing here — so
      // the double answers recognisably and the assertion is about routing.
      fetch: async (request: Request | string) =>
        new Response(`asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`, {
          status: 200,
        }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (
  tenant: string,
  path: string,
  init?: RequestInit,
  overrides?: Partial<Env>,
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    workerEnv(tenant, overrides),
  )

/**
 * A site made only of L1 — the boundary this ticket delivers up to (REQ-148).
 *
 * Built from `siteSeed`, which is the scaffolder's own starter (`1c new` emits
 * it, REQ-102) rather than a fixture written here. A hand-rolled definition
 * would have to restate the schema, and a fixture that drifts from the validator
 * fails as "this draft does not validate" — which is a test asserting its own
 * mistake, not the render.
 */
function pureL1Site(slug = nextSlug()) {
  const seed = siteSeed({ slug })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  }
}

async function importSitePayload(
  tenant: string,
  payload: ReturnType<typeof pureL1Site>,
): Promise<Response> {
  return call(tenant, '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * Push a site in and hand back the KEY it landed on ([[REQ-236]]).
 *
 * The payload's own `slug` still travels — it names the SOURCE, the directory on
 * the operator's machine the push came from — and means nothing to the store.
 */
async function importAndKey(
  tenant: string,
  payload: ReturnType<typeof pureL1Site>,
): Promise<string> {
  const response = await importSitePayload(tenant, payload)
  expect(response.status).toBe(200)
  return ((await response.json()) as { site: string }).site
}

describe('REQ-145 — the builder runs in workerd', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-145_a_pure_l1_site_renders_its_draft_and_edit_channels', async () => {
    // AC-1, and the substance of the whole ticket: with no Node origin running
    // anywhere, a site's channels are rendered by the Worker from the stored
    // definition. `theme.css` is asserted too, because it is where the
    // precompiled module chrome lands — the file that could not be composed at
    // all while `getModuleCss()` read `.astro` sources off a filesystem.
    const tenant = nextBusiness()
    const slug = await importAndKey(tenant, pureL1Site())

    const draft = await call(tenant, `/preview/${slug}/draft/`)
    expect(draft.status).toBe(200)
    expect(draft.headers.get('content-type')).toContain('text/html')
    const html = await draft.text()
    expect(html).toContain('theme.css')

    const css = await call(tenant, `/preview/${slug}/draft/theme.css`)
    expect(css.status).toBe(200)
    expect((await css.text()).length).toBeGreaterThan(0)

    // The edit channel is the same render in its other mode, and it must differ:
    // it stamps addresses the editor resolves clicks against.
    const edit = await call(tenant, `/preview/${slug}/edit/`)
    expect(edit.status).toBe(200)
    expect(await edit.text()).not.toBe(html)
  })

  it('test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store', async () => {
    // AC-1's "lists sites". The listing is the store's own answer rather than a
    // directory read, which is what makes it true in a runtime with no directory.
    const tenant = nextBusiness()
    const slug = await importAndKey(tenant, pureL1Site())

    const res = await call(tenant, '/api/sites')
    expect(res.status).toBe(200)
    // THE LISTING NAMES SITES BY KEY ([[REQ-236]]) — `site`, not `slug`, because
    // there is no second name for it to report.
    const sites = (await res.json()) as { site: string; latest: number | null }[]
    expect(sites.map((s) => s.site)).toContain(slug)
    // `latest` is null because this store holds no revisions. Saying so is
    // better than implying one; minting them is REQ-149.
    expect(sites.find((s) => s.site === slug)?.latest).toBeNull()
  })

  it('test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store', async () => {
    // AC-2. The assertion that matters is the READ-BACK: the response could be
    // composed without writing anything, so the palette is re-fetched through a
    // second request, which resolves the definition out of D1 again.
    const tenant = nextBusiness()
    const slug = await importAndKey(tenant, pureL1Site())

    const wrote = await call(tenant, '/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug, op: 'add', name: 'accent', value: '#123456' }),
    })
    expect(wrote.status).toBe(200)

    const read = await call(tenant, `/api/palette?site=${slug}`)
    const palette = (await read.json()) as { entries: { name: string; value: string }[] }
    expect(palette.entries).toContainEqual(expect.objectContaining({ name: 'accent', value: '#123456' }))
  })

  it('test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake', async () => {
    // The op vocabulary is closed. A 400 rather than a 500, because the client
    // is a second producer of edits and a malformed one deserves to be told so
    // rather than shown "the builder broke".
    const tenant = nextBusiness()
    const slug = await importAndKey(tenant, pureL1Site())

    const res = await call(tenant, '/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug, op: 'nonsense', name: 'x' }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: expect.stringContaining('nonsense'),
    })
  })

  it('test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent', async () => {
    // AC-7. A copy-up is run after every local edit, so re-import is the
    // ordinary case rather than the exceptional one.
    const tenant = nextBusiness()
    const site = pureL1Site()
    const first = await importSitePayload(tenant, site)
    const second = await importSitePayload(tenant, site)
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    // THE SAME REPLY, INCLUDING THE SAME `site` KEY ([[REQ-236]]) — the second
    // push resolves the business's existing site rather than minting another,
    // which is what "idempotent" has to mean once the payload stops naming a
    // destination.
    const body = (await first.json()) as { site: string }
    expect(await second.json()).toEqual(body)

    const sites = (await (await call(tenant, '/api/sites')).json()) as { site: string }[]
    expect(sites.filter((s) => s.site === body.site)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals', async () => {
    // The directive the Node origin set once before routing, kept as a property
    // of the Worker rather than of each route. It is asserted on a REFUSAL and a
    // 404 as well as on a success, because the hole it closes opened exactly
    // there: `json()` carried its own headers and never carried this one, so
    // `/api/sites` was cacheable and a new site could stay invisible.
    const tenant = nextBusiness()
    for (const path of ['/', '/api/sites', '/api/publish', '/nothing-here']) {
      const res = await call(tenant, path, path === '/api/publish' ? { method: 'POST' } : undefined)
      expect(res.headers.get('cache-control'), path).toBe('no-store, must-revalidate')
    }
  })

  // AC-9 — `test_UAT_FC_REQ-145_deferred_capabilities_answer_501_naming_their_ticket`
  // STOOD HERE, and is gone because the last deferral graduated.
  //
  // It asserted the SHAPE of a deferral: a route that exists while its
  // capability does not answers 501 naming the ticket that will land it, rather
  // than 404ing and sending someone hunting for a handler that was lost. It
  // covered `/api/ai/*` until REQ-146 landed that, then `/api/publish` and the
  // `published` channel until REQ-149 landed those. Its own note said a route
  // graduating was expected to leave — every one now has, so the test has no
  // subject and is deleted rather than kept as an assertion about nothing.
  // `notImplemented()` went with it; the next deferral brings both back.

  it('test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it', async () => {
    // The security property behind `run_worker_first = true`. If the assets
    // binding answered first, `/builder/*` and `/webui/*` would be served to
    // anyone — the Access gate lives in `fetch`, and bytes that never enter
    // `fetch` are never gated. So an asset must arrive by FALLING THROUGH this
    // router, and an unauthenticated one must be refused.
    const tenant = nextBusiness()
    const asset = await call(tenant, '/builder/main.js')
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe('asset:/builder/main.js')

    const refused = await call(tenant, '/builder/main.js', undefined, {
      ACCESS_DEV_OPEN: '',
      ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
      ACCESS_AUD: 'aud-tag',
    })
    expect(refused.status).toBe(401)
    expect(await refused.text()).not.toContain('asset:')
  })

  it('test_UAT_FC_REQ-145_an_unconfigured_access_gate_still_refuses_without_the_dev_var', async () => {
    // The dev bypass is two conditions, and dropping either must deny. Without
    // ACCESS_DEV_OPEN an unconfigured gate answers 503, exactly as REQ-147 left
    // it — the var is what says "this is loopback", not what disables the gate.
    const tenant = nextBusiness()
    const res = await call(tenant, '/api/sites', undefined, { ACCESS_DEV_OPEN: '' })
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('Access is not configured')
  })

  it('test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer', async () => {
    // A deployment that cannot name its tenant serves nothing, and says which
    // key is missing. Defaulting to a well-known name would let a misconfigured
    // Worker read and WRITE into whichever tenant happened to carry it.
    const tenant = nextBusiness()
    const res = await call(tenant, '/api/sites', undefined, { TENANT_ID: '' })
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('TENANT_ID')
  })
  it('test_UAT_FC_REQ-236_every_builder_route_that_names_a_site_names_it_site', async () => {
    // THE WIRE VOCABULARY, ASSERTED AS A CONTRACT RATHER THAN LEFT TO THE ROUTES
    // THAT HAPPEN TO BE EXERCISED ELSEWHERE ([[REQ-236]]). Each of these carried
    // a parameter called `slug` and the value it carried is a KEY now, so the
    // name had to move with it — a wire that still said `slug` would be a word
    // the store no longer uses, kept alive by every client that reads it.
    //
    // BOTH DIRECTIONS, because only the pair is evidence. That `site` is accepted
    // says the rename landed; that `slug` is REFUSED says nothing is quietly
    // reading the old key as a fallback, which is exactly the half-migrated state
    // this ticket must not leave behind.
    const tenant = nextBusiness()
    const site = await importAndKey(tenant, pureL1Site())

    // The site list answers with `site`, and that value is what everything below
    // is addressed by — so the vocabulary is checked from the reply inwards.
    const listed = (await (await call(tenant, '/api/sites')).json()) as { site: string }[]
    expect(listed.map((entry) => entry.site)).toEqual([site])

    for (const path of ['/api/assets', '/api/pages', '/api/revisions', '/api/palette']) {
      expect((await call(tenant, `${path}?site=${site}`)).status, `${path} with site`).toBe(200)
      const refused = await call(tenant, `${path}?slug=${site}`)
      expect(refused.status, `${path} with slug`).toBe(400)
      expect((await refused.json<{ error: string }>()).error, path).toContain('site')
    }

    const jsonPost = (path: string, body: unknown) =>
      call(tenant, path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })

    for (const [path, extra] of [
      ['/api/publish', { message: 'named by key' }],
      ['/api/ai/session', {}],
      ['/api/palette', { op: 'add', name: 'accent', value: '#123456' }],
    ] as [string, Record<string, unknown>][]) {
      // The `slug` form is refused BEFORE anything is written, which is what lets
      // the accepted form below run against an untouched site.
      const refused = await jsonPost(path, { slug: site, ...extra })
      expect(refused.status, `${path} with slug`).toBe(400)
      expect((await refused.json<{ error: string }>()).error, path).toContain('site')
      // And `site` gets past the parameter check. What each route then DOES is
      // its own suite's subject; all this asserts is that the name was read.
      expect((await jsonPost(path, { site, ...extra })).status, `${path} with site`).not.toBe(400)
    }
  })
})
