import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * REQ-289 — `GET /api/export`, and the round trip that proves it is a pair.
 *
 * WHY THE ROUTE EXISTS AT ALL. The sites that actually exist were authored in
 * the builder and live in D1 and R2 — under `wrangler dev` that is a miniflare
 * SQLite file whose layout is an implementation detail, plus a second SQLite
 * and a blob directory beside it. Node cannot open the source, so the Worker
 * reads, through the very store it serves from. That is `/api/import`'s own
 * argument in reverse, and it is why the export is a route rather than a
 * script.
 *
 * SO THESE RUN IN WORKERD, OVER A REAL D1 AND A REAL R2, THROUGH `route()`.
 * Nothing here is stubbed. The claim being made — export followed by import
 * yields a draft identical to the original — is only worth anything if the
 * bytes really went through the store the Worker serves from.
 *
 * THE ROUND TRIP IS THE LOAD-BEARING ASSERTION. Export and import are a matched
 * pair, and a pair that has come apart still answers 200 on both sides: the
 * only way to notice is to send a site through both halves and compare it to
 * what went in.
 *
 * THE REFUSALS ARE PART OF THE ROUTE, not decoration. A business holding two
 * sites has no unambiguous source, exactly as it has no unambiguous
 * destination; a business holding none is a 404 naming it, because "there was
 * nothing to read" must not be expressible as a successful read of nothing —
 * an empty payload is a perfectly legible thing to import over the top of
 * something real.
 */

const ORIGIN = 'https://app.test'

/** An SVG and a PNG-shaped blob: text and binary, so base64 has to survive both. */
const WORDMARK = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
const PHOTO = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 255, 127, 3])

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

/** A registered business to read from or write into. */
async function business(id: string): Promise<Scope> {
  await ensureTenant(id)
  return { businessId: id }
}

/** One import, exactly as the copy commands post one. */
async function importInto(
  scope: Scope,
  body: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

/** One export, exactly as the copy commands read one. */
async function exportFrom(
  scope: Scope,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await route(
    new Request(`${ORIGIN}/api/export`, { method: 'GET' }),
    routerEnv(),
    scope,
    {},
  )
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

/** The payload shape both routes speak, built from the shared seed. */
function payloadFor(slug: string, assets: { name: string; bytes: Uint8Array }[]) {
  const seed = siteSeed({ slug })
  return {
    slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: assets.map((a) => ({ name: a.name, base64: toBase64(a.bytes) })),
  }
}

describe('REQ-289 — the Worker reads a site out of the store it serves from', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-289_export_answers_the_payload_import_accepts', async () => {
    // The pair, asserted as a pair. `/api/export` must answer in the shape
    // `/api/import` takes — `slug`, `siteJson`, `pages` (name + document),
    // `assets` (name + base64 bytes) — because the copy commands feed one
    // straight into the other with nothing in between to translate.
    const scope = await business('req289-shape')
    const sent = payloadFor('lagrange-foundry', [{ name: 'wordmark.svg', bytes: WORDMARK }])
    expect((await importInto(scope, sent)).status).toBe(200)

    const got = await exportFrom(scope)
    expect(got.status).toBe(200)
    expect(Object.keys(got.body).sort()).toEqual(['assets', 'pages', 'siteJson', 'slug'])
    // `slug` NAMES THE SOURCE and addresses nothing. What the payload carried on
    // the way in was a laptop directory name; what comes out is the store's own
    // minted key, which is the same statement in the vocabulary of the side that
    // produced it.
    expect(String(got.body.slug)).toMatch(/^site_/)
    expect(got.body.assets).toEqual([{ name: 'wordmark.svg', base64: toBase64(WORDMARK) }])
  })

  it('test_UAT_FC_REQ-289_export_then_import_reproduces_the_draft', async () => {
    // THE ROUND TRIP — the whole claim of the ticket in one assertion, and the
    // proof the backup is a backup. A site goes into one business, is exported,
    // and is imported into a SECOND business; the second business's site must
    // then read back byte-for-byte identically. Two businesses rather than one
    // because a copy's two ends are two stores, and re-importing over the source
    // would pass even if the export were being ignored entirely.
    const source = await business('req289-source')
    const target = await business('req289-target')
    const sent = payloadFor('lagrange-foundry', [
      { name: 'wordmark.svg', bytes: WORDMARK },
      { name: 'founder-portrait.jpg', bytes: PHOTO },
    ])
    expect((await importInto(source, sent)).status).toBe(200)

    const exported = await exportFrom(source)
    expect(exported.status).toBe(200)
    const landed = await importInto(target, exported.body)
    expect(landed.status).toBe(200)

    const copied = await exportFrom(target)
    expect(copied.status).toBe(200)
    // Everything except the key, which is each store's own name for the site and
    // is MEANT to differ — asserting it equal would be asserting that a copy
    // carries the source's address, which is the one thing it must not do.
    expect(copied.body.siteJson).toEqual(exported.body.siteJson)
    expect(copied.body.pages).toEqual(exported.body.pages)
    expect(copied.body.assets).toEqual(exported.body.assets)
    expect(copied.body.slug).not.toBe(exported.body.slug)
    // And the bytes really survived the trip, binary and text alike.
    const assets = copied.body.assets as { name: string; base64: string }[]
    expect(assets.find((a) => a.name === 'founder-portrait.jpg')?.base64).toBe(toBase64(PHOTO))
  })

  it('test_UAT_FC_REQ-289_a_business_holding_two_sites_is_refused', async () => {
    // The same ambiguity `/api/import` refuses rather than resolves, refused on
    // the read for the mirror-image reason: guessing on the write overwrites a
    // site nobody was pushing to, and guessing here hands back a site nobody
    // asked for — which is then written somewhere by the command that asked.
    const scope = await business('req289-two-sites')
    const store = await tenantStore(scope.businessId)
    await store.createDraft('site')
    await store.createDraft('site')

    const refused = await exportFrom(scope)
    expect(refused.status).toBe(409)
    expect(String(refused.body.error)).toMatch(/holds 2 sites/)
    expect(String(refused.body.error)).toMatch(/Nothing was read/)
  })

  it('test_UAT_FC_REQ-289_a_business_holding_no_site_is_a_404_naming_it', async () => {
    // NOT AN EMPTY PAYLOAD. An export of nothing is a legible thing to import
    // over the top of something real, so the state has to be a refusal — and one
    // that names the business, because an operator running a copy has typed a
    // NAME and needs to know which side had nothing.
    const scope = await business('req289-empty')
    const refused = await exportFrom(scope)
    expect(refused.status).toBe(404)
    expect(String(refused.body.error)).toContain('req289-empty')
    expect(refused.body.business).toBe('req289-empty')
  })
})
