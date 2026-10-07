import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { ASSETS_PREFIX, RIGHTS_MEMBER } from '../tools/generate/src/store/reference-store'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * REQ-392 — the Worker half of the rights gate reads the same record.
 *
 * `POST /api/import` scans the TENANT's capture bundles in R2, the evidence the
 * laptop never sees. A bundle there carrying a valid `rights.json` — the
 * operator's recorded decision that we may republish that capture — lets its
 * mirrored bytes in; the same bytes from a bundle without one are refused with
 * BUG-84's 403 exactly as before. Real D1, real R2, the production
 * `r2ReferenceStore`, through the route table.
 */

const ORIGIN = 'https://app.test'
const BUNDLE = 'faelan.com/index'
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 2, 0, 2, 6])

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

async function importPhoto(scope: Scope): Promise<Response> {
  const seed = siteSeed({ slug: 'repro-faelan-com' })
  return route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [{ name: 'hero.jpg', base64: btoa(String.fromCharCode(...PHOTO)) }],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
}

async function captureInto(businessId: string, rights?: Record<string, unknown>): Promise<void> {
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(businessId)
  const bundle = references.bundle(BUNDLE)
  await bundle.write('capture.json', new TextEncoder().encode('{"host":"faelan.com"}'))
  await bundle.write(`${ASSETS_PREFIX}hero.jpg`, PHOTO)
  if (rights) await bundle.write(RIGHTS_MEMBER, new TextEncoder().encode(JSON.stringify(rights)))
}

describe('REQ-392 — the import route honours a recorded rights decision', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-392_the_worker_imports_a_capture_carrying_a_rights_record', async () => {
    await ensureTenant('req392-owned')
    await captureInto('req392-owned', {
      republishable: true,
      bundle: BUNDLE,
      assertedBy: 'op@example.test',
      assertedAt: '2026-10-07T18:00:00.000Z',
      basis: "the operator's son's own site",
    })
    const res = await importPhoto({ businessId: 'req392-owned' })
    expect(res.status).toBe(200)
    expect(((await res.json()) as { assets: number }).assets).toBe(1)
  })

  it('test_UAT_FC_REQ-392_the_worker_still_refuses_a_capture_with_no_valid_record', async () => {
    // A record naming another capture is not a record for this one.
    await ensureTenant('req392-unowned')
    await captureInto('req392-unowned', {
      republishable: true,
      bundle: 'someone-else.com/index',
      assertedBy: 'op@example.test',
      assertedAt: '2026-10-07T18:00:00.000Z',
      basis: 'copied from elsewhere',
    })
    const res = await importPhoto({ businessId: 'req392-unowned' })
    expect(res.status).toBe(403)
    expect(((await res.json()) as { bundle: string }).bundle).toBe(BUNDLE)
  })
})
