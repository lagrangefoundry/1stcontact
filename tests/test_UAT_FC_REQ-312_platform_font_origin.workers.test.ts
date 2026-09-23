import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/public-site/src/index'
import type { Env } from '../apps/public-site/src/index'
import { platformFontKey } from '../packages/site-schema/src/fonts'
import { applySchema } from './support/d1-site-factory'

/**
 * [[REQ-312]] — the platform font mirror, served on **the site's own domain**
 * (`COMMENT-3711`).
 *
 * WHAT WAS TRUE BEFORE. `public-site` resolved every byte it served against a
 * SITE. There was no path by which shared platform bytes could be reached at all,
 * which is why the catalogue's 1,900 families had nowhere to be served from.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives `worker.fetch` — the real handler
 * with its real route grammar — inside workerd, against the REAL R2 bucket
 * `1c fonts publish` writes to, at the REAL key prefix it writes under
 * (`platformFontKey`, the same function the publisher composes keys with). The
 * objects are put there directly because that is exactly what the publish step
 * does to production: a byte at a key, with no store semantics to simulate.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - a platform font reachable on the platform's own host but not on a customer
 *     domain, which would force a copy per tenant — the arrangement this ticket
 *     exists to avoid;
 *   - a face served without `Access-Control-Allow-Origin`, which a browser
 *     refuses cross-origin whatever its cache headers say, so one shared copy
 *     would silently fail on every customer domain;
 *   - a face served with the 60-second published-page cache, which would re-fetch
 *     a megabyte of immutable font on every visit;
 *   - `LICENSES.txt` unreachable, leaving the OFL notice undistributed;
 *   - `_fonts` resolving through the site grammar, where a bound customer host is
 *     REQUIRED to refuse anything that is not its own site;
 *   - **the second snapshot root going unanswered.** This is the falsifier the
 *     same-origin decision added. A page's `src` names no host, so the renderer
 *     reduces it to a reference against the page's own directory — and the same
 *     bytes are served at `/` on a bound domain AND at `/site/<key>/` on this
 *     product's host. A rule matching only the origin root 404s every font on the
 *     second, which is a whole channel rendering in a fallback face.
 */

/**
 * A site key that exists only as a URL segment. Nothing publishes under it: every
 * case below either asks for a font (which belongs to no site) or asserts the
 * cross-tenant refusal (which never reaches a store).
 */
const SITE_KEY = 'site_0123456789abcdef'

const SLUG = 'headingfont'
const FILE = 'HeadingFont-Regular.woff2'
const FONT_BYTES = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3, 4, 5, 6, 7, 8])
const LICENCE_TEXT = 'Copyright 2026 The Heading Font Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n'
const INDEX_TEXT = '1st Contact — platform font mirror\n\nHeading Font — OFL-1.1\n  Licence: /_fonts/headingfont/OFL.txt\n'

/** The Worker as this deployment runs it: no apex site, no session. */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    APEX_SITE_KEY: '',
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
  } as Env
}

async function call(origin: string, path: string, method = 'GET'): Promise<Response> {
  return worker.fetch(
    new Request(`${origin}${path}`, { method }),
    workerEnv(),
    { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext,
  )
}

beforeAll(async () => {
  await applySchema()
  // Exactly what `1c fonts publish` writes: the face, the family's own licence
  // notice beside it, and the aggregate index at the mirror root.
  await env.SITES.put(platformFontKey(`${SLUG}/${FILE}`), FONT_BYTES)
  await env.SITES.put(platformFontKey(`${SLUG}/OFL.txt`), LICENCE_TEXT)
  await env.SITES.put(platformFontKey('LICENSES.txt'), INDEX_TEXT)

  // `alicesplumbing.com` IS A BOUND CUSTOMER DOMAIN, and it is bound to a site
  // that is NOT `SITE_KEY` — which is what arms the cross-tenant guard for the
  // case below. Written as the row the schema holds rather than through
  // `control-app`'s writer: this suite bundles `public-site`, and what is under
  // test is how the SERVER reads a binding, not how one is made.
  await env.DB.prepare(
    "INSERT OR IGNORE INTO site_domains (id, site_id, host, kind, status, canonical, created_at) " +
      "VALUES ('dom_alice', 'site_alice', 'alicesplumbing.com', 'custom', 'active', 1, ?)",
  )
    .bind(new Date().toISOString())
    .run()
})

describe('REQ-312 — the platform font origin', () => {
  it('test_UAT_FC_REQ-312_one_shared_copy_is_served_to_every_host', async () => {
    // THE WHOLE TIER IN ONE ASSERTION. The same bytes, at the same path, from the
    // platform's own front door AND from a customer's domain — which is what makes
    // a single shared copy enough and a copy-per-tenant unnecessary.
    for (const origin of ['https://1stcontact.io', 'https://alicesplumbing.com']) {
      const res = await call(origin, `/_fonts/${SLUG}/${FILE}`)
      expect(res.status, `${origin} serves the face`).toBe(200)
      expect(new Uint8Array(await res.arrayBuffer())).toEqual(FONT_BYTES)

      // A font is a CORS-restricted subresource, so without this header the
      // cross-origin case above loads nothing however correct the bytes are.
      expect(res.headers.get('access-control-allow-origin')).toBe('*')
      expect(res.headers.get('content-type')).toBe('font/woff2')

      // Immutable, not the 60-second cache a published page carries: a mirrored
      // file's name changes when its content does, so re-fetching it is pure waste.
      const cache = res.headers.get('cache-control') ?? ''
      expect(cache).toContain('immutable')
      expect(cache).toContain('max-age=31536000')
    }
  })

  it('test_UAT_FC_REQ-312_the_licence_travels_with_the_bytes_and_the_index_is_reachable', async () => {
    // OFL requires the notice to travel with the distribution. Both halves are
    // served: the family's own licence beside its face, and the index naming every
    // mirrored family at the origin root.
    const licence = await call('https://1stcontact.io', `/_fonts/${SLUG}/OFL.txt`)
    expect(licence.status).toBe(200)
    expect(await licence.text()).toContain('SIL OPEN FONT LICENSE')
    expect(licence.headers.get('content-type')).toBe('text/plain; charset=utf-8')

    const index = await call('https://1stcontact.io', '/_fonts/LICENSES.txt')
    expect(index.status).toBe(200)
    const body = await index.text()
    expect(body).toContain('Heading Font')
    expect(body).toContain('/_fonts/headingfont/OFL.txt')
  })

  it('test_UAT_FC_REQ-312_a_path_the_mirror_does_not_hold_is_a_404_and_reaches_no_site', async () => {
    // A 404 here means the mirror does not hold it — the serving end of the same
    // absence `1c fonts check` reports as NOT POPULATED. What it must never be is a
    // request that fell through into the site grammar and resolved somewhere.
    const missing = await call('https://1stcontact.io', '/_fonts/absentface/AbsentFace-Regular.woff2')
    expect(missing.status).toBe(404)

    // Traversal is refused by the grammar rather than reasoned about, because the
    // R2 key is built by concatenation.
    const traversal = await call('https://1stcontact.io', '/_fonts/../sites/secret/rev/0001/out/index.html')
    expect(traversal.status).toBe(404)
  })

  it('test_UAT_FC_REQ-312_the_face_is_served_at_every_snapshot_root', async () => {
    // THE SAME-ORIGIN DECISION'S OWN FALSIFIER (`COMMENT-3711`). A page's `src`
    // names no host: it is root-relative, and the renderer reduces it to a
    // reference against the page's own directory so a snapshot is relocatable. So
    // a page served under `/site/<key>/` asks for its face at
    // `/site/<key>/_fonts/…` — a path the origin-root rule never matched, which
    // would leave every font on that channel 404ing.
    const prefixed = await call('https://1stcontact.io', `/site/${SITE_KEY}/_fonts/${SLUG}/${FILE}`)
    expect(prefixed.status, 'the /site/<key>/ channel serves the face').toBe(200)
    expect(new Uint8Array(await prefixed.arrayBuffer())).toEqual(FONT_BYTES)
    expect(prefixed.headers.get('content-type')).toBe('font/woff2')

    // AND THE LICENCE TRAVELS WITH IT THERE TOO, at that root's own `_fonts/`.
    const licence = await call('https://1stcontact.io', `/site/${SITE_KEY}/_fonts/${SLUG}/OFL.txt`)
    expect(licence.status).toBe(200)
    expect(await licence.text()).toContain('SIL OPEN FONT LICENSE')
  })

  it('test_UAT_FC_REQ-312_the_cross_tenant_guard_does_not_refuse_a_platform_font', async () => {
    // A PLATFORM FONT BELONGS TO NO SITE, so the guard that makes a bound customer
    // domain refuse `/site/<somebody else's key>/` must not be asked about it.
    // `alicesplumbing.com` is bound to its own site here; a page of that site still
    // carries `_fonts/…`, and the guard's correct "no" to the site question would
    // be the wrong answer to the font one.
    const guarded = await call(
      'https://alicesplumbing.com',
      `/site/${SITE_KEY}/_fonts/${SLUG}/${FILE}`,
    )
    expect(guarded.status, 'the guard does not reach the font').toBe(200)
    expect(new Uint8Array(await guarded.arrayBuffer())).toEqual(FONT_BYTES)

    // AND IT STILL REFUSES THE SITE ITSELF, which is what proves the exemption is
    // scoped to `_fonts` rather than a hole in the guard.
    const page = await call('https://alicesplumbing.com', `/site/${SITE_KEY}/index.html`)
    expect(page.status, "a bound host still refuses another tenant's page").toBe(404)
  })

  it('test_UAT_FC_REQ-312_a_head_returns_the_headers_without_the_body', async () => {
    // So a client can ask how large a face is without paying for it — which for a
    // 250KB variable font is the difference the question is asked for.
    const res = await call('https://1stcontact.io', `/_fonts/${SLUG}/${FILE}`, 'HEAD')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('font/woff2')
    expect(await res.text()).toBe('')
  })

  it('test_UAT_FC_REQ-312_the_origin_receives_nothing', async () => {
    // `public-site` answers every method but GET/HEAD with 405 by construction, and
    // a new path must not be a new doorway: the font origin is read-only.
    const res = await call('https://1stcontact.io', `/_fonts/${SLUG}/${FILE}`, 'PUT')
    expect(res.status).toBe(405)
  })
})
