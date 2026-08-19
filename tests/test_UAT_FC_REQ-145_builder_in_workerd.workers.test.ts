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

/** The bindings the Worker declares, as `wrangler.toml` declares them. */
function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: 'req145',
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

const call = (path: string, init?: RequestInit, overrides?: Partial<Env>): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv(overrides))

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

async function importSitePayload(payload: ReturnType<typeof pureL1Site>): Promise<Response> {
  return call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
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
    const site = pureL1Site()
    const slug = site.slug
    expect((await importSitePayload(site)).status).toBe(200)

    const draft = await call(`/preview/${slug}/draft/`)
    expect(draft.status).toBe(200)
    expect(draft.headers.get('content-type')).toContain('text/html')
    const html = await draft.text()
    expect(html).toContain('theme.css')

    const css = await call(`/preview/${slug}/draft/theme.css`)
    expect(css.status).toBe(200)
    expect((await css.text()).length).toBeGreaterThan(0)

    // The edit channel is the same render in its other mode, and it must differ:
    // it stamps addresses the editor resolves clicks against.
    const edit = await call(`/preview/${slug}/edit/`)
    expect(edit.status).toBe(200)
    expect(await edit.text()).not.toBe(html)
  })

  it('test_UAT_FC_REQ-145_the_site_listing_comes_from_the_store', async () => {
    // AC-1's "lists sites". The listing is the store's own answer rather than a
    // directory read, which is what makes it true in a runtime with no directory.
    const site = pureL1Site()
    const slug = site.slug
    await importSitePayload(site)

    const res = await call('/api/sites')
    expect(res.status).toBe(200)
    const sites = (await res.json()) as { slug: string; latest: number | null }[]
    expect(sites.map((s) => s.slug)).toContain(slug)
    // `latest` is null because this store holds no revisions. Saying so is
    // better than implying one; minting them is REQ-149.
    expect(sites.find((s) => s.slug === slug)?.latest).toBeNull()
  })

  it('test_UAT_FC_REQ-145_an_edit_through_the_worker_lands_in_the_store', async () => {
    // AC-2. The assertion that matters is the READ-BACK: the response could be
    // composed without writing anything, so the palette is re-fetched through a
    // second request, which resolves the definition out of D1 again.
    const site = pureL1Site()
    const slug = site.slug
    await importSitePayload(site)

    const wrote = await call('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'add', name: 'accent', value: '#123456' }),
    })
    expect(wrote.status).toBe(200)

    const read = await call(`/api/palette?slug=${slug}`)
    const palette = (await read.json()) as { entries: { name: string; value: string }[] }
    expect(palette.entries).toContainEqual(expect.objectContaining({ name: 'accent', value: '#123456' }))
  })

  it('test_UAT_FC_REQ-145_a_malformed_edit_is_refused_as_the_callers_mistake', async () => {
    // The op vocabulary is closed. A 400 rather than a 500, because the client
    // is a second producer of edits and a malformed one deserves to be told so
    // rather than shown "the builder broke".
    const site = pureL1Site()
    const slug = site.slug
    await importSitePayload(site)

    const res = await call('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'nonsense', name: 'x' }),
    })
    expect(res.status).toBe(400)
    expect((await res.json()) as { error: string }).toMatchObject({
      error: expect.stringContaining('nonsense'),
    })
  })

  it('test_UAT_FC_REQ-145_importing_the_same_site_twice_is_idempotent', async () => {
    // AC-7. `bin/publish` is run after every local edit, so re-import is the
    // ordinary case rather than the exceptional one.
    const site = pureL1Site()
    const slug = site.slug
    const first = await importSitePayload(site)
    const second = await importSitePayload(site)
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual(await first.json())

    const sites = (await (await call('/api/sites')).json()) as { slug: string }[]
    expect(sites.filter((s) => s.slug === slug)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-145_every_response_is_uncacheable_including_refusals', async () => {
    // The directive the Node origin set once before routing, kept as a property
    // of the Worker rather than of each route. It is asserted on a REFUSAL and a
    // 404 as well as on a success, because the hole it closes opened exactly
    // there: `json()` carried its own headers and never carried this one, so
    // `/api/sites` was cacheable and a new site could stay invisible.
    for (const path of ['/', '/api/sites', '/api/publish', '/nothing-here']) {
      const res = await call(path, path === '/api/publish' ? { method: 'POST' } : undefined)
      expect(res.headers.get('cache-control'), path).toBe('no-store, must-revalidate')
    }
  })

  it('test_UAT_FC_REQ-145_deferred_capabilities_answer_501_naming_their_ticket', async () => {
    // AC-9. A 404 would read as a routing bug and send someone hunting for a
    // handler that was lost; these routes exist and their capability does not.
    //
    // `/api/ai/*` USED to be asserted here, deferred to lagrange-framework
    // REQ-103. REQ-146 landed it, so the deferral is gone and asserting it would
    // now pin the absence of a capability that exists. The invariant this test
    // states is about the SHAPE of a deferral, not about any particular route
    // staying deferred forever — so a route graduating is expected to leave here.
    const publish = await call('/api/publish', { method: 'POST' })
    expect(publish.status).toBe(501)
    expect((await publish.json()) as { ticket: string }).toMatchObject({ ticket: 'REQ-149' })

    // `published` is the same deferral seen from the preview route.
    const published = await call('/preview/anything/published/')
    expect(published.status).toBe(501)
  })

  it('test_UAT_FC_REQ-145_build_artifacts_are_served_behind_the_gate_not_ahead_of_it', async () => {
    // The security property behind `run_worker_first = true`. If the assets
    // binding answered first, `/builder/*` and `/webui/*` would be served to
    // anyone — the Access gate lives in `fetch`, and bytes that never enter
    // `fetch` are never gated. So an asset must arrive by FALLING THROUGH this
    // router, and an unauthenticated one must be refused.
    const asset = await call('/builder/main.js')
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe('asset:/builder/main.js')

    const refused = await call('/builder/main.js', undefined, {
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
    const res = await call('/api/sites', undefined, { ACCESS_DEV_OPEN: '' })
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('Access is not configured')
  })

  it('test_UAT_FC_REQ-145_a_page_mounting_a_behavior_names_the_ticket_that_renders_it', async () => {
    // The REQ-148 boundary, stated rather than discovered. Every site in
    // `storage/sites/` mounts `contact-form`, so this is the failure an operator
    // meets first — it must name what is missing instead of failing as an
    // undefined component three frames down.
    const payload = pureL1Site()
    const slug = payload.slug
    const page = payload.pages[0].page as {
      modules: unknown[]
      l1: { root: { children: unknown[] } }
    }
    // A behavior must name the L1 seam it mounts into (REQ-93), so the slot is
    // declared as well as bound — otherwise the draft fails VALIDATION and never
    // reaches the render, which would make this test assert its own mistake.
    page.l1.root.children.push({ kind: 'slot', name: 'form' })
    page.modules = [
      {
        id: 'form',
        type: 'contact-form',
        version: 4,
        slot: 'form',
        config: {
          action: 'https://example.com/submit',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        },
        slots: {
          form: {
            kind: 'container',
            layout: 'stack',
            children: [{ kind: 'control', control: 'email' }],
          },
        },
      },
    ]
    await importSitePayload(payload)

    const res = await call(`/preview/${slug}/draft/`)
    expect(res.status).toBeGreaterThanOrEqual(500)
    expect(await res.text()).toContain('REQ-148')
  })

  it('test_UAT_FC_REQ-145_no_tenant_configured_is_a_loud_failure_not_an_empty_answer', async () => {
    // A deployment that cannot name its tenant serves nothing, and says which
    // key is missing. Defaulting to a well-known name would let a misconfigured
    // Worker read and WRITE into whichever tenant happened to carry it.
    const res = await call('/api/sites', undefined, { TENANT_ID: '' })
    expect(res.status).toBe(503)
    expect(await res.text()).toContain('TENANT_ID')
  })
})
