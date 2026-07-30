import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'

describe('public-site worker', () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev('apps/public-site/src/index.ts', {
      config: 'apps/public-site/wrangler.toml',
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('test_UAT_FC_REQ-1_public_site_returns_placeholder', async () => {
    const res = await worker.fetch('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello from 1stcontact.io')
    expect(res.headers.get('content-type')).toContain('text/plain')
  })
})

describe('public-site routing config', () => {
  const toml = readFileSync('apps/public-site/wrangler.toml', 'utf8')

  it('test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes', () => {
    // public-site is the generic multi-tenant site server: the apex serves every
    // deployed site under /site/<slug>/ (and later the marketing site at /), and
    // *.1stcontact.io is reserved for customer sites by slug subdomain
    // (DOC-7 §9.1). Both production routes must be present.
    //
    // REQ-111 made the apex a custom domain rather than a zone route: the zone
    // has no proxied record for it, so a route alone resolves to nothing —
    // `custom_domain` has wrangler provision the record and certificate itself.
    expect(toml).toContain('{ pattern = "1stcontact.io", custom_domain = true }')
    expect(toml).toContain('"*.1stcontact.io/*"')
  })

  it('test_UAT_FC_REQ-111_public_site_binds_the_snapshot_bucket', () => {
    // The Worker serves bytes `1c deploy` wrote to R2, so the binding must exist
    // in both the dev config and the production environment — a named
    // environment does not inherit top-level bindings, and a missing one is a
    // runtime failure on the first request rather than a deploy-time error.
    expect(toml).toContain('[[r2_buckets]]')
    expect(toml).toContain('[[env.production.r2_buckets]]')
    expect(toml.match(/binding = "SITES"/g)).toHaveLength(2)
    expect(toml.match(/bucket_name = "1stcontact-sites"/g)).toHaveLength(2)
  })
})
