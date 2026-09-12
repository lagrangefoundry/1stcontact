import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { ASSETS_PREFIX } from '../tools/generate/src/store/reference-store'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * BUG-84 — the Worker refuses a capture-mirrored asset at the import door.
 *
 * WHY THE WORKER ENFORCES IT AND NOT ONLY `1c push`. The Worker is the writer:
 * `/api/import` is what actually puts bytes into a site's assets, and a rule
 * only the client applies is not a rule — a request posted by hand never runs
 * the CLI at all. These assertions therefore go through the route table, over a
 * real D1 database and a real R2 bucket, against a capture bundle written
 * through the production `r2ReferenceStore`. Nothing is stubbed; the refusal
 * either comes out of the deployed code path or it does not exist.
 *
 * WHAT THIS HALF SEES THAT THE OTHER DOES NOT. A capture taken in the cloud
 * lives in the tenant's R2 bundles and never reaches an operator's laptop, so
 * the CLI-side gate has no evidence for it. The two halves hold different
 * evidence for one rule, which is why both exist.
 *
 * THE STATUS IS PART OF THE CLAIM. 403 and not 400, because the request was well
 * formed and the answer is no — there is no re-formed push that makes somebody
 * else's photograph publishable. And not 409, which this route already uses for
 * BUG-51's "you would replace builder changes": that one is a question with an
 * answer (`--force`) and this one is a rule with none, so an operator who
 * learned the reflex for the first must not be pointed at a flag that cannot
 * help here.
 */

const ORIGIN = 'https://app.test'

/** The mirrored photograph, as a capture would hold it. */
const PHOTO = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7, 7, 7])
/** A file of the client's own — byte-different from anything captured. */
const OWN = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 1, 1])

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const toBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))

/** One import, exactly as `1c push` posts one. */
async function importSite(
  scope: Scope,
  slug: string,
  assets: { name: string; bytes: Uint8Array }[],
  workerEnv: RouterEnv = routerEnv(),
): Promise<Response> {
  const seed = siteSeed({ slug })
  return route(
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
        assets: assets.map((a) => ({ name: a.name, base64: toBase64(a.bytes) })),
      }),
    }),
    workerEnv,
    scope,
    {},
  )
}

/** Write a capture bundle into this tenant's REAL reference store. */
async function captureInto(businessId: string, members: Record<string, Uint8Array>): Promise<void> {
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(businessId)
  const bundle = references.bundle('gigabytealchemy.ai/index')
  // The capture record, so this is a bundle and not a bag of assets — the gate
  // must reach its `assets/` prefix without depending on reading this.
  await bundle.write('capture.json', new TextEncoder().encode('{"host":"gigabytealchemy.ai"}'))
  for (const [member, bytes] of Object.entries(members)) {
    await bundle.write(`${ASSETS_PREFIX}${member}`, bytes)
  }
}

/** A registered business to import into. */
async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

describe('BUG-84 — the import route gates on rights', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_BUG-84_the_worker_refuses_a_capture_mirrored_asset', async () => {
    // The exposure, at the door that actually writes: a subresource mirrored
    // from a captured third-party page arrives as bare bytes under a bare name,
    // so `promoteToSiteAsset`'s gate has no record to read. The refusal names
    // the asset and the bundle member it mirrors, so the operator is told which
    // file and where it came from rather than that the push failed.
    const scope = await business('bug84-refused')
    await captureInto(scope.businessId, { 'AlchemistLabWithTech.png': PHOTO })

    const res = await importSite(scope, 'repro-site', [
      { name: 'AlchemistLabWithTech.png', bytes: PHOTO },
    ])

    expect(res.status).toBe(403)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.asset).toBe('AlchemistLabWithTech.png')
    expect(body.bundle).toBe('gigabytealchemy.ai/index')
    expect(body.member).toBe('assets/AlchemistLabWithTech.png')
    expect(body.slug).toBe('repro-site')
    expect(String(body.error)).toContain('republish')
  })

  it('test_UAT_FC_BUG-84_a_refused_import_writes_nothing', async () => {
    // A refusal must leave NOTHING behind — not the picture, and not even the
    // empty draft `createDraft` would otherwise have brought into existence on
    // the way past. Both are asked of the routes the builder itself reads: the
    // site list, and the preview the iframe loads. A slug appearing in either
    // would mean a push that was refused had still changed the deployment.
    const scope = await business('bug84-nothing')
    await captureInto(scope.businessId, { 'hero.jpg': PHOTO })

    expect((await importSite(scope, 'blocked', [{ name: 'hero.jpg', bytes: PHOTO }])).status).toBe(
      403,
    )

    const listed = await route(new Request(`${ORIGIN}/api/sites`), routerEnv(), scope, {})
    const sites = (await listed.json()) as { slug: string }[]
    expect(sites.map((s) => s.slug)).not.toContain('blocked')

    const asset = await route(
      new Request(`${ORIGIN}/preview/blocked/draft/assets/hero.jpg`),
      routerEnv(),
      scope,
      {},
    )
    expect(asset.status).not.toBe(200)
  })

  it('test_UAT_FC_BUG-84_the_clients_own_picture_still_imports', async () => {
    // Exactly discriminating, or it is a gate nobody can ship behind. The same
    // tenant holds the same capture; an asset of the client's own goes through
    // and is served from the site afterwards.
    const scope = await business('bug84-clean')
    await captureInto(scope.businessId, { 'AlchemistLabWithTech.png': PHOTO })

    const res = await importSite(scope, 'clean-site', [{ name: 'logo.png', bytes: OWN }])
    expect(res.status).toBe(200)
    expect((await res.json()) as Record<string, unknown>).toMatchObject({ assets: 1 })

    const asset = await route(
      new Request(`${ORIGIN}/preview/clean-site/draft/assets/logo.png`),
      routerEnv(),
      scope,
      {},
    )
    expect(asset.status).toBe(200)
  })

  it('test_UAT_FC_BUG-84_one_tenants_capture_does_not_gate_another', async () => {
    // The reference store is bound per business by `forTenant`, and the gate
    // inherits that barrier rather than re-enforcing it. A capture one business
    // took must not refuse another's push — which would be one client's
    // private material deciding what a different client may publish.
    const captor = await business('bug84-captor')
    await captureInto(captor.businessId, { 'shared-name.png': PHOTO })

    const other = await business('bug84-other')
    const res = await importSite(other, 'other-site', [{ name: 'shared-name.png', bytes: PHOTO }])
    expect(res.status).toBe(200)
  })

  it('test_UAT_FC_BUG-84_a_deployment_with_no_blob_bucket_still_imports', async () => {
    // `BLOBS` is where a capture's bytes live, so a deployment without it cannot
    // be holding any. There is nothing to check against and the gate has nothing
    // to say; turning that into a refusal would block every push on a deployment
    // that never had a capture to republish.
    const scope = await business('bug84-noblobs')
    const res = await importSite(
      scope,
      'noblobs-site',
      [{ name: 'logo.png', bytes: OWN }],
      routerEnv({ BLOBS: undefined }),
    )
    expect(res.status).toBe(200)
  })
})
