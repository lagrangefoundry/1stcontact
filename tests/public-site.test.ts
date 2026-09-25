import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'
import { declaringBlocks } from './support/wrangler-toml'

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
    // [[REQ-200]] — the held-back string literal is gone: the apex is a real
    // published 1c site, named by `APEX_SITE_KEY`. This dev config names none
    // (a local `wrangler dev` has nothing published until somebody publishes),
    // so the apex answers exactly as an unpublished site does rather than with
    // a placeholder nobody chose.
    const res = await worker.fetch('/')
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toContain('text/plain')
  })
})

describe('public-site routing config', () => {
  const toml = readFileSync('apps/public-site/wrangler.toml', 'utf8')

  it('test_UAT_FC_REQ-1_public_site_serves_apex_and_wildcard_routes', () => {
    // public-site is the generic multi-tenant site server: the apex serves every
    // deployed site under /site/<slug>/ (and later the marketing site at /).
    //
    // REQ-111 made the apex a custom domain rather than a zone route: the zone
    // has no proxied record for it, so a route alone resolves to nothing —
    // `custom_domain` has wrangler provision the record and certificate itself.
    expect(toml).toContain('{ pattern = "1stcontact.io", custom_domain = true }')

    // `*.1stcontact.io/*` WAS ASSERTED HERE AND IS GONE ([[REQ-258]]).
    //
    // It was a ZONE route, declared and — by its own comment — never served:
    // subdomain routing was described as additive and `app.1stcontact.io` is
    // control-app's own, more specific route. What it cost was the whole
    // custom-domain mechanism, because one zone route in this array makes
    // `wrangler deploy` `PUT` the entire route list for this script and delete
    // every route it did not declare — which is every customer's domain, since
    // attaching one is an API call and not a commit.
    //
    // THE CLAIM IS NOT DROPPED, IT IS STRENGTHENED AND MOVED. The rule now is
    // that NO entry here may be a zone route, which is a statement this
    // assertion could not make, and it is held by
    // `tests/test_UAT_FC_REQ-258_runtime_routes_survive_a_deploy.test.ts`.
    expect(toml).not.toContain('"*.1stcontact.io/*"')
  })

  it('test_UAT_FC_REQ-111_public_site_binds_the_snapshot_bucket', () => {
    // The Worker serves bytes `1c deploy` wrote to R2, so the binding must exist
    // in both the dev config and the production environment — a named
    // environment does not inherit top-level bindings, and a missing one is a
    // runtime failure on the first request rather than a deploy-time error.
    expect(toml).toContain('[[r2_buckets]]')
    expect(toml).toContain('[[env.production.r2_buckets]]')
    // One per block that declares the binding ([[REQ-318]]) — the top level plus
    // every named environment, counted rather than written down.
    expect(toml.match(/binding = "SITES"/g)).toHaveLength(declaringBlocks(toml))
    expect(toml.match(/bucket_name = "1stcontact-sites"/g)).toHaveLength(declaringBlocks(toml))
  })
})
