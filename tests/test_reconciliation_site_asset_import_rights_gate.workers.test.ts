/**
 * STORY-aacb7060 (site-asset promotion), BUG-84 — `POST /api/import` refuses
 * capture-mirrored asset bytes with 403, per business, before any draft exists,
 * distinct from BUG-51's 409.
 *
 * Driven through the route table over a real D1 database and real R2 buckets,
 * with the capture bundle written through the production `r2ReferenceStore`.
 * Nothing internal is stubbed.
 */
import { beforeAll, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { ASSETS_PREFIX } from '../tools/generate/src/store/reference-store'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

const ORIGIN = 'https://app.test'
const BUNDLE = 'thirdparty.example/index'

/** A credential-shaped value configured on the Worker, to prove the scrub. */
const SECRET = 'sk-ant-uat2589-configured-secret'

/** The mirrored photograph, as the capture holds it. */
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x25, 0x89, 1, 2, 3, 4, 5])
/** A file of the client's own, byte-different from anything captured. */
const OWN = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x25, 0x89, 9, 9, 9])

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: SECRET,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

/** One import, in exactly the shape `1c push` posts. */
async function importSite(
  scope: Scope,
  slug: string,
  assets: { name: string; bytes: Uint8Array }[],
  opts: { force?: boolean; title?: string; env?: RouterEnv } = {},
): Promise<Response> {
  const seed = siteSeed({ slug })
  const body: Record<string, unknown> = {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: { ...(page as Record<string, unknown>), title: opts.title ?? 'Imported' },
    })),
    assets: assets.map((a) => ({ name: a.name, base64: toBase64(a.bytes) })),
  }
  if (opts.force !== undefined) body.force = opts.force
  return route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    opts.env ?? routerEnv(),
    scope,
    {},
  )
}

/** Write a capture bundle into this business's REAL cloud reference store. */
async function captureInto(businessId: string, members: Record<string, Uint8Array>): Promise<void> {
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(businessId)
  const bundle = references.bundle(BUNDLE)
  await bundle.write('capture.json', new TextEncoder().encode('{"host":"thirdparty.example"}'))
  for (const [member, bytes] of Object.entries(members)) {
    await bundle.write(member, bytes)
  }
}

async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

/** Everything a refused import must leave untouched, serialised for comparison. */
async function snapshot(businessId: string, slug: string) {
  const store = await tenantStore(businessId)
  if (!(await store.hasDraft(slug))) return null
  const assets: Record<string, string> = {}
  for (const name of (await store.listAssets(slug)).sort()) {
    const bytes = await store.readAsset(slug, name)
    assets[name] = bytes === null ? 'null' : Array.from(bytes).join(',')
  }
  return {
    siteJson: JSON.stringify(await store.readSiteJson(slug)),
    pages: (await store.readPages(slug)).map((p) => `${p.name}:${JSON.stringify(p.page)}`).sort(),
    assets,
  }
}

beforeAll(async () => {
  await applySchema()
})

it('test_UAT_AC2589_import_refuses_capture_mirrored_bytes_403_per_business_before_any_draft_distinct_from_409', async () => {
  const scope = await business('ac2589-captor')
  await captureInto(scope.businessId, {
    [`${ASSETS_PREFIX}AlchemistLab.jpg`]: PHOTO,
  })

  // ── Never-imported slug, mirrored bytes under ANOTHER name: 403, named. ──
  // The asset name embeds the configured secret, so the scrub is observable:
  // the structured `asset` field carries the name, the error text must not.
  const disguised = `${SECRET}.jpg`
  const refused = await importSite(scope, 'ac2589-fresh', [{ name: disguised, bytes: PHOTO }])
  expect(refused.status).toBe(403)
  const body = (await refused.json()) as Record<string, unknown>
  expect(body.slug).toBe('ac2589-fresh')
  expect(body.asset).toBe(disguised)
  expect(body.bundle).toBe(BUNDLE)
  expect(body.member).toBe(`${ASSETS_PREFIX}AlchemistLab.jpg`)
  expect(String(body.error)).toContain('mirrored from a captured page')
  expect(String(body.error)).toContain('republish')
  expect(String(body.error), 'the 403 error text leaked a configured secret').not.toContain(SECRET)
  expect(await snapshot(scope.businessId, 'ac2589-fresh'), 'a refused import created a draft').toBeNull()

  // ── `"force": true` does not get past it, and still no draft. ──
  const forced = await importSite(scope, 'ac2589-fresh', [{ name: 'banner.jpg', bytes: PHOTO }], {
    force: true,
  })
  expect(forced.status).toBe(403)
  expect(((await forced.json()) as Record<string, unknown>).asset).toBe('banner.jpg')
  expect(await snapshot(scope.businessId, 'ac2589-fresh')).toBeNull()

  // ── Distinct from BUG-51: a site with builder changes answers 409 first… ──
  const slug = 'ac2589-built'
  expect((await importSite(scope, slug, [{ name: 'logo.jpg', bytes: OWN }], { title: 'Built here' })).status).toBe(200)
  await (await tenantStore(scope.businessId)).appendChange(slug, {
    op: 'copy.set',
    label: 'headline',
    actor: 'ai',
    summary: 'Wrote the headline.',
  })
  const before = await snapshot(scope.businessId, slug)
  expect(before?.assets).toHaveProperty('logo.jpg')

  const conflict = await importSite(scope, slug, [{ name: 'banner.jpg', bytes: PHOTO }], {
    title: 'Replaced',
  })
  expect(conflict.status).toBe(409)
  const conflictBody = (await conflict.json()) as Record<string, unknown>
  expect(conflictBody.changes).toBe(1)
  expect(String(conflictBody.force)).toContain('--force')

  // …and once `force` answers that, the mirrored bytes are still refused 403,
  // leaving the existing site's pages, site.json and assets unchanged.
  const forcedConflict = await importSite(scope, slug, [{ name: 'banner.jpg', bytes: PHOTO }], {
    force: true,
    title: 'Replaced',
  })
  expect(forcedConflict.status).toBe(403)
  expect(((await forcedConflict.json()) as Record<string, unknown>).member).toBe(
    `${ASSETS_PREFIX}AlchemistLab.jpg`,
  )
  expect(await snapshot(scope.businessId, slug)).toEqual(before)

  // ── Another business's capture never gates this import. ──
  const other = await business('ac2589-other')
  const crossTenant = await importSite(other, 'ac2589-other-site', [{ name: 'banner.jpg', bytes: PHOTO }])
  expect(crossTenant.status, 'one business’s capture refused another’s import').toBe(200)
  expect((await snapshot(other.businessId, 'ac2589-other-site'))?.assets).toHaveProperty('banner.jpg')

  // ── Unaffected cases proceed: no assets, assets matching nothing, no BLOBS binding. ──
  expect((await importSite(scope, 'ac2589-no-assets', [])).status).toBe(200)
  expect(
    (await importSite(scope, 'ac2589-clean', [{ name: 'AlchemistLab.jpg', bytes: OWN }])).status,
    'a name match was treated as a byte match',
  ).toBe(200)
  expect(
    (
      await importSite(scope, 'ac2589-noblobs', [{ name: 'banner.jpg', bytes: PHOTO }], {
        env: routerEnv({ BLOBS: undefined }),
      })
    ).status,
  ).toBe(200)
})
