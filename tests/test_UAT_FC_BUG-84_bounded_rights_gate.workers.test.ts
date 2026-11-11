import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { runMirroredBackfillTick } from '../apps/control-app/src/mirrored-backfill'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { ASSETS_PREFIX } from '../tools/generate/src/store/reference-store'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * BUG-84 — the import route's rights gate is bounded by construction.
 *
 * WHAT IS CLAIMED. `POST /api/import` refuses bytes the business mirrored from a
 * captured page WITHOUT listing a capture bundle or reading any of its members:
 * the answer comes from the hash index written when the capture member was
 * written. So the gate's cost is set by the push, never by how many captures the
 * business has accumulated (Architecture Policy #2, #31, #35).
 *
 * HOW IT IS PROVED. The capture is planted through the production
 * `r2ReferenceStore` write path, over the real R2 bucket. The import then runs
 * against that same bucket behind a guard that FAILS any `get` or `list` that
 * touches a bundle — anything under `t/<tenant>/ref/` other than the index. If
 * the gate walked the bundles, the import would blow up instead of answering 403.
 *
 * AND CAPTURES FROM BEFORE THE INDEX. Those are indexed by the Cron Trigger's
 * bounded backfill, never inline in the import; the last test plants a member
 * the old way (no index), runs the real tick to completion, and shows the
 * import is then refused — still without reading a bundle.
 */

const ORIGIN = 'https://app.test'
const BUNDLE = 'thirdparty.example/index'

const PHOTO = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 4, 2, 4, 2])
const OLD_PHOTO = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 8, 7, 6])
const OWN = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])

/** True for a key or prefix that reaches into a capture bundle (not the index). */
function touchesBundle(key: string | undefined): boolean {
  if (!key) return false
  const m = /^t\/[^/]+\/ref\/(.*)$/.exec(key)
  return m !== null && !m[1].startsWith('.mirrored/')
}

/**
 * The real bucket, refusing every read of a bundle member and every bundle
 * listing. Writes and the index pass through untouched.
 */
function bundleBlindBucket(bucket: R2Bucket, touched: string[]): R2Bucket {
  return new Proxy(bucket, {
    get(target, prop) {
      if (prop === 'get' || prop === 'head') {
        return (key: string, ...rest: unknown[]) => {
          if (touchesBundle(key)) {
            touched.push(key)
            throw new Error(`the rights gate read a bundle member: ${key}`)
          }
          return (target[prop] as (...a: unknown[]) => unknown).call(target, key, ...rest)
        }
      }
      if (prop === 'list') {
        return (options?: R2ListOptions) => {
          if (touchesBundle(options?.prefix ?? 't/')) {
            touched.push(`list:${options?.prefix ?? ''}`)
            throw new Error(`the rights gate listed a bundle: ${options?.prefix}`)
          }
          return target.list(options)
        }
      }
      const value = Reflect.get(target, prop, target) as unknown
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value
    },
  })
}

function routerEnv(blobs: R2Bucket): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: blobs,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

async function importSite(
  scope: Scope,
  slug: string,
  assets: { name: string; bytes: Uint8Array }[],
  blobs: R2Bucket,
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
    routerEnv(blobs),
    scope,
    {},
  )
}

async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

describe('BUG-84 — the import rights gate never walks the capture bundles', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_BUG-84_the_import_route_refuses_mirrored_bytes_without_reading_a_bundle', async () => {
    const scope = await business('bug84-bounded')
    const references = await r2ReferenceStore({
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    }).forTenant(scope.businessId)
    const bundle = references.bundle(BUNDLE)
    await bundle.write('capture.json', new TextEncoder().encode('{"host":"thirdparty.example"}'))
    await bundle.write(`${ASSETS_PREFIX}hero.jpg`, PHOTO)
    // Many more mirrored members: a gate that scaled with the captures would
    // have to touch every one of them.
    for (let i = 0; i < 20; i++) {
      await bundle.write(`${ASSETS_PREFIX}extra-${i}.css`, new TextEncoder().encode(`a{z-index:${i}}`))
    }

    const touched: string[] = []
    const res = await importSite(
      scope,
      'bounded-site',
      [
        { name: 'logo.png', bytes: OWN },
        { name: 'hero.jpg', bytes: PHOTO },
      ],
      bundleBlindBucket(env.BLOBS as R2Bucket, touched),
    )

    expect(touched).toEqual([])
    expect(res.status).toBe(403)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({
      slug: 'bounded-site',
      asset: 'hero.jpg',
      bundle: BUNDLE,
      member: 'assets/hero.jpg',
    })

    // And a clean push through the same blind bucket is admitted.
    const clean = await importSite(
      scope,
      'bounded-clean',
      [{ name: 'logo.png', bytes: OWN }],
      bundleBlindBucket(env.BLOBS as R2Bucket, touched),
    )
    expect(touched).toEqual([])
    expect(clean.status).toBe(200)
  })

  it('test_UAT_FC_BUG-84_captures_from_before_the_index_are_refused_once_the_cron_backfill_runs', async () => {
    const scope = await business('bug84-legacy')
    // Written the way a capture was stored before the index existed: the bytes
    // go straight into the bundle's key, and no index entry is made.
    await (env.BLOBS as R2Bucket).put(
      `t/${scope.businessId}/ref/${BUNDLE}/${ASSETS_PREFIX}old.png`,
      OLD_PHOTO.slice().buffer,
    )

    // The real Cron step, run to completion. Each tick is one bounded page; the
    // bound on ticks only stops a broken cursor from looping the test forever.
    let state = await runMirroredBackfillTick({ BLOBS: env.BLOBS as R2Bucket })
    for (let ticks = 1; !state.done && ticks < 500; ticks++) {
      state = await runMirroredBackfillTick({ BLOBS: env.BLOBS as R2Bucket })
    }
    expect(state.done).toBe(true)

    const touched: string[] = []
    const res = await importSite(
      scope,
      'legacy-site',
      [{ name: 'old.png', bytes: OLD_PHOTO }],
      bundleBlindBucket(env.BLOBS as R2Bucket, touched),
    )
    expect(touched).toEqual([])
    expect(res.status).toBe(403)
    expect((await res.json()) as Record<string, unknown>).toMatchObject({
      asset: 'old.png',
      bundle: BUNDLE,
      member: 'assets/old.png',
    })
  })
})
