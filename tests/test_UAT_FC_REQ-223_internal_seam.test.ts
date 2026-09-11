import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { missingFromEnv, readWranglerConfig } from './support/wrangler-toml'

/**
 * [[REQ-223]] §3.2 — **the seam between the two Workers is not a URL.**
 *
 * WHY THIS IS A TEST AND NOT A CONVENTION. `control-app` owns identity writes and
 * must keep owning them: `addContact` is the one definition of how a person
 * enters a tenant, and a second implementation in `public-site` would be two
 * answers to that question. So the two Workers need a seam — and the obvious
 * shape for one, an internal HTTP route, is the shape that fails catastrophically
 * and silently. A path is something a request can NAME, so
 * `app.1stcontact.io/internal/lead` is one Access policy — edited by somebody who
 * did not know it was load-bearing — away from being a public write endpoint into
 * every tenant's contact list. That is the specific failure `access.ts` argues
 * against at length.
 *
 * THE ANSWER IS NOT A BETTER-HIDDEN PATH. It is no path: a named
 * `WorkerEntrypoint` is reachable over a service binding and there is no URL that
 * reaches it. This file holds that property, because "we did not add a route" is
 * exactly the kind of fact that stops being true one refactor later.
 *
 * AND THE BINDING HAS TO BE DECLARED IN BOTH ENVIRONMENTS. A named environment
 * inherits NEITHER vars NOR bindings; the failure of forgetting the repeat is a
 * production Worker that refuses every submission — which is the loud failure,
 * chosen over acknowledging leads it cannot record.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a route table naming the lead entrypoint*;
 *   - *a service binding to the default handler*, which would mean an internal
 *     HTTP path on `control-app` after all;
 *   - *a binding declared at the top level and not under `[env.production]`*.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.join(here, '..')
const read = (rel: string): string => readFileSync(path.join(repo, rel), 'utf8')

describe('REQ-223 — the internal seam', () => {
  it('test_UAT_FC_REQ-223_the_write_is_an_entrypoint_and_not_a_route', () => {
    // The entrypoint exists, is named, and extends the platform's own base class
    // — a plain exported object would be a fetch handler and therefore a URL.
    const entry = read('apps/control-app/src/worker.ts')
    expect(entry).toMatch(/export class LeadIntake extends WorkerEntrypoint<Env>/)
    expect(entry).toMatch(/from 'cloudflare:workers'/)
    // …and it is what wrangler loads, or the class would be dead code.
    expect(read('apps/control-app/wrangler.toml')).toMatch(/^main = "src\/worker\.ts"$/m)

    const index = read('apps/control-app/src/index.ts')
    // `index.ts` STAYS FREE OF THE WORKERD BUILT-IN. It is imported by the node
    // project's suites, and `cloudflare:workers` has no package to resolve there
    // — an import here fails ~60 files at load, for a class none of them uses.
    expect(index).not.toMatch(/cloudflare:workers/)

    // AC-14 — and nothing routes to it. The router is the only thing in
    // `control-app` that maps a path to behaviour; a mention of the lead
    // capability there would be a path that reaches this write.
    const router = read('apps/control-app/src/router.ts')
    expect(router).not.toMatch(/captureLead|LeadIntake/)
    expect(router).not.toMatch(/\/api\/lead|\/internal\//)
    // AC-14 — and the `fetch` handler, which is the only thing in this Worker a
    // URL can reach at all, never mentions it. The doorway is the binding; there
    // is no second one behind a path.
    expect(index).not.toMatch(/captureLead|LeadIntake/)
  })

  it('test_UAT_FC_REQ-223_public_site_binds_the_named_entrypoint_in_both_environments', () => {
    const toml = read('apps/public-site/wrangler.toml')

    // `entrypoint = "LeadIntake"` is the whole point: a service binding without
    // it targets the default handler, which is an HTTP path by another name.
    const services = [...toml.matchAll(/\[\[(?:env\.production\.)?services\]\]([\s\S]*?)(?=\n\[|$)/g)]
    expect(services).toHaveLength(2)
    for (const [, block] of services) {
      expect(block).toMatch(/binding\s*=\s*"LEAD_INTAKE"/)
      expect(block).toMatch(/service\s*=\s*"1stcontact-control-app"/)
      expect(block).toMatch(/entrypoint\s*=\s*"LeadIntake"/)
    }

    // The rate limiter is declared on both sides too. It uses `name` rather than
    // `binding`, so the generic inheritance check below cannot see it — which is
    // exactly why it is asserted explicitly here.
    const limiters = [...toml.matchAll(/\[\[(?:env\.production\.)?unsafe\.bindings\]\]([\s\S]*?)(?=\n\[|$)/g)]
    expect(limiters).toHaveLength(2)
    for (const [, block] of limiters) {
      expect(block).toMatch(/name\s*=\s*"LEAD_RATE_LIMIT"/)
      expect(block).toMatch(/type\s*=\s*"ratelimit"/)
    }

    // And the general rule this repository already keeps: a named environment
    // inherits nothing, so everything at the top level is repeated below it.
    const config = readWranglerConfig(path.join(repo, 'apps/public-site/wrangler.toml'))
    expect(config.topLevel.vars).toContain('TURNSTILE_SITEKEY')
    expect(missingFromEnv(config, 'production')).toEqual({ vars: [], bindings: [] })
  })

  it('test_UAT_FC_REQ-223_the_turnstile_secret_is_never_in_a_config_file', () => {
    // The public half is a var — it is printed in the markup of every page that
    // carries a form. The SECRET half is a `wrangler secret` and its presence in
    // a checked-in file would be a credential in git, the same rule
    // `RESEND_API_KEY` is held to.
    for (const rel of ['apps/public-site/wrangler.toml', 'apps/control-app/wrangler.toml']) {
      expect(read(rel)).not.toMatch(/^\s*TURNSTILE_SECRET\s*=/m)
    }
  })
})
