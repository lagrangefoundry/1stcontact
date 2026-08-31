/**
 * story-e674c60a — **the deployed workspace answers for itself**, and a local
 * site can be copied up into the store it serves from.
 *
 * WHY THESE RUN IN workerd. Both criteria are about the *deployed* runtime: one
 * says the workspace serves its document, its listing and both draft-side
 * channels with no local process running anywhere; the other says an import
 * lands through the very store an edit lands through. A node-side test of the
 * same functions would pass while proving nothing about either — the whole
 * claim is "this runs where it will run". So every assertion below goes through
 * the Worker's own `fetch`, inside workerd, against a real D1 database and a
 * real R2 bucket supplied by `@cloudflare/vitest-pool-workers`. Nothing is
 * stubbed except the assets binding, which no assertion here reads.
 *
 * The "local store" the copy-up crosses from is a second tenant on the same
 * port — a real {@link SiteStore}, which is all `1c push` ever reads through.
 * Substituting a hand-written one would prove the substitute.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { pushSite, readSitePayload } from '../tools/generate/src/cli/push'
import { d1r2SiteStore, type TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/** The account this deployment serves, as `TENANT_ID` names it. */
const TENANT = 'story-e674c60a-edge'
/** The account standing in for the operator's own machine. */
const LOCAL = 'story-e674c60a-local'

const ORIGIN = 'https://app.example'

/** The bindings the Worker declares, as `wrangler.toml` declares them. */
function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // The loopback dev server: Access is unconfigured, so the gate would refuse
    // every request. See `index.ts` on why this cannot open a deployed Worker.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      // The build output, which is not built in this environment. Nothing below
      // reads an artifact's bytes — AC-1400 owns those — so a marker is enough
      // to keep an accidental fall-through visible rather than silent.
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit, overrides?: Partial<Env>): Promise<Response> =>
  worker.fetch(new Request(`${ORIGIN}/${path.replace(/^\//, '')}`, init), workerEnv(overrides))

/** `fetch`, as `1c push` takes it, pointed at the deployed runtime in-process. */
function pushThrough(overrides?: Partial<Env>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) =>
    worker.fetch(new Request(String(input), init), workerEnv(overrides))) as typeof fetch
}

/**
 * A site made only of L1, built from the scaffolder's own starter (`1c new`
 * emits it) rather than a fixture written here — a hand-rolled definition would
 * restate the schema, and one that drifted would fail as "this draft does not
 * validate", which is a test asserting its own mistake.
 */
function pureL1Site(slug = nextSlug('edge')) {
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

/** A real store for the operator's own machine, on the same port. */
async function localStore(): Promise<TenantSiteStore> {
  const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await root.createTenant({ id: LOCAL, name: LOCAL })
  return root.forTenant(LOCAL)
}

/** One site in the local store: definition, a page, and an asset's real bytes. */
async function seedLocalSite(
  store: TenantSiteStore,
  assets: Record<string, Uint8Array> = { 'logo.png': new Uint8Array([1, 2, 3, 4, 5]) },
): Promise<string> {
  const seed = siteSeed({ slug: nextSlug('local'), assets })
  await store.createDraft(seed.slug)
  await store.write(seed.slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })
  return seed.slug
}

describe('story-e674c60a — the deployed workspace, with nothing running locally', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC1399_the_deployed_workspace_serves_lists_and_renders_by_itself', async () => {
    // AC-1399. Nothing on an operator's disk is involved: the document is
    // composed by the Worker, the listing is the store's own answer, and both
    // draft-side channels are produced from the stored definition at the moment
    // they are asked for.
    const site = pureL1Site()
    const slug = site.slug
    const imported = await call('/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(site),
    })
    expect(imported.status).toBe(200)

    // The workspace document.
    const chrome = await call('/')
    expect(chrome.status).toBe(200)
    expect(chrome.headers.get('content-type')).toContain('text/html')
    const chromeHtml = await chrome.text()
    expect(chromeHtml).toContain('<script type="importmap">')
    expect(chromeHtml).toContain('/builder/main.js')

    // Exactly the sites the store holds — its own answer, not a directory read,
    // which is what makes it true in a runtime with no directory.
    const listing = await call('/api/sites')
    expect(listing.status).toBe(200)
    const sites = (await listing.json()) as { slug: string }[]
    expect(sites.map((s) => s.slug)).toContain(slug)

    // Both draft-side channels, produced on request from the definition.
    const draft = await call(`/preview/${slug}/draft/`)
    const edit = await call(`/preview/${slug}/edit/`)
    expect(draft.status).toBe(200)
    expect(edit.status).toBe(200)
    expect(draft.headers.get('content-type')).toContain('text/html')
    expect(edit.headers.get('content-type')).toContain('text/html')
    const draftHtml = await draft.text()
    const editHtml = await edit.text()
    // The same production in its two modes, and it must differ: the editable one
    // carries the addresses the editor resolves a click against.
    expect(editHtml).not.toBe(draftHtml)

    // The composed presentation the page references. A page that arrives without
    // it is a page whose styling was assembled somewhere the runtime cannot
    // reach — which is exactly what a filesystem-reading composer would mean.
    expect(draftHtml).toContain('theme.css')
    const css = await call(`/preview/${slug}/draft/theme.css`)
    expect(css.status).toBe(200)
    expect((await css.text()).length).toBeGreaterThan(0)

    // An edit lands in the shared store, and the READ-BACK is what makes the
    // claim: a response can be composed without anything having been written, so
    // the value is fetched again in a separate request that resolves the
    // definition out of D1 afresh.
    const wrote = await call('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'add', name: 'accent', value: '#123456' }),
    })
    expect(wrote.status).toBe(200)

    const readBack = await call(`/api/palette?slug=${slug}`)
    expect(readBack.status).toBe(200)
    const palette = (await readBack.json()) as { entries: { name: string; value: string }[] }
    expect(palette.entries).toContainEqual(
      expect.objectContaining({ name: 'accent', value: '#123456' }),
    )
  })

  it('test_UAT_AC1402_a_local_site_copies_up_idempotently_through_the_serving_store', async () => {
    // AC-1402. The copy crosses through the same store the workspace serves
    // from: `1c push` reads locally and posts, and the Worker writes through the
    // very handle every edit writes through. There is no second writer.
    const source = await localStore()
    const slug = await seedLocalSite(source)
    const held = await readSitePayload(source, slug)

    const first = await pushSite(source, slug, { origin: ORIGIN, fetch: pushThrough() })

    // The reported counts are what the local store actually held, so a silently
    // partial copy cannot report success.
    expect(first.landed.pages).toBe(held.pages.length)
    expect(first.landed.assets).toBe(held.assets.length)
    expect(first.landed.siteJson).toBe(true)
    expect(first.landed.assets).toBeGreaterThan(0)
    expect(first.assets).toEqual(await source.listAssets(slug))

    // The workspace then serves it: it is in the listing and both draft-side
    // channels render from it.
    const sites = (await (await call('/api/sites')).json()) as { slug: string }[]
    expect(sites.map((s) => s.slug)).toContain(slug)
    for (const channel of ['draft', 'edit'] as const) {
      const res = await call(`/preview/${slug}/${channel}/`)
      expect(res.status, channel).toBe(200)
      expect(res.headers.get('content-type'), channel).toContain('text/html')
    }

    // Idempotent: re-running after a local edit is the ordinary way to use it,
    // not an exceptional recovery. Same report, and still one site.
    const second = await pushSite(source, slug, { origin: ORIGIN, fetch: pushThrough() })
    expect(second.landed).toEqual(first.landed)
    const after = (await (await call('/api/sites')).json()) as { slug: string }[]
    expect(after.filter((s) => s.slug === slug)).toHaveLength(1)

    // A refusal is legible: a gated target with no credential says what an
    // unattended caller needs in order to be admitted, not merely a status.
    //
    // Asserted on the CREDENTIAL the refusal names, not on one flag's spelling.
    // This previously pinned `--token`, which BUG-36's second finding replaced:
    // `bin/publish --production` was sending the header the gateway SETS on the
    // forwarded request rather than the credential the edge accepts, so the
    // guidance now names a service token. The criterion's subject is that the
    // message says what an unattended caller needs — which it does, in more
    // detail than before — so the assertion follows the subject rather than the
    // wording that happened to carry it.
    const gated = pushThrough({
      ACCESS_DEV_OPEN: '',
      ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
      ACCESS_AUD: 'aud-tag',
    })
    await expect(pushSite(source, slug, { origin: ORIGIN, fetch: gated })).rejects.toThrow(
      /Cloudflare Access/,
    )
    for (const needed of [
      /CF_ACCESS_CLIENT_ID/, // what to set, unattended…
      /CF_ACCESS_CLIENT_SECRET/,
      /--client-id/, // …or to pass, by hand
      /--client-secret/,
      /bin\/access-token/, // …and how to obtain one
    ]) {
      await expect(pushSite(source, slug, { origin: ORIGIN, fetch: gated })).rejects.toThrow(
        needed,
      )
    }

    // It holds NO PRIVILEGE the other routes lack (BUG-36). A copy lands on a
    // deployment whose store holds only the schema — and, the half that was
    // missing, a plain READ of an equally fresh deployment lands too. While the
    // import route had its own opener, this copy was the only way an account
    // ever came to exist, so a workspace nobody had copied to could not be read.
    const virginPush = `virgin-push-${Date.now().toString(36)}`
    const pushed = await pushSite(source, slug, {
      origin: ORIGIN,
      fetch: pushThrough({ TENANT_ID: virginPush }),
    })
    expect(pushed.landed.siteJson).toBe(true)

    const virginRead = `virgin-read-${Date.now().toString(36)}`
    const read = await call('/api/sites', undefined, { TENANT_ID: virginRead })
    expect(read.status).toBe(200)
    expect(await read.json()).toEqual([])

    // An asset the local store lists but cannot read is a CORRUPT local store,
    // and the copy fails rather than landing it as an empty file that looks
    // deliberate. Arranged by removing the object the listing still names.
    const corruptSlug = await seedLocalSite(source, { 'broken.png': new Uint8Array([9, 9, 9]) })
    const row = await env.DB.prepare(
      'SELECT r2_key FROM site_assets WHERE tenant_id = ? AND slug = ? AND name = ?',
    )
      .bind(LOCAL, corruptSlug, 'broken.png')
      .first<{ r2_key: string }>()
    expect(row?.r2_key).toBeTruthy()
    await env.SITES.delete(row!.r2_key)
    expect(await source.listAssets(corruptSlug)).toContain('broken.png')

    await expect(
      pushSite(source, corruptSlug, { origin: ORIGIN, fetch: pushThrough() }),
    ).rejects.toThrow(/unreadable/)
    // …and nothing landed: the refusal happened before the post.
    const untouched = (await (await call('/api/sites')).json()) as { slug: string }[]
    expect(untouched.map((s) => s.slug)).not.toContain(corruptSlug)
  })
})
