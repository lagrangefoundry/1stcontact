import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { PUBLIC_SITE_SCRIPT } from '../apps/control-app/src/serving'

/**
 * [[REQ-258]] — **a customer's domain survives the next `wrangler deploy`.**
 *
 * THE RISK THE TICKET SAYS TO SETTLE BEFORE BUILDING, SETTLED HERE AND KEPT
 * SETTLED. *"Does `wrangler deploy` reconcile the static `routes` array in a way
 * that removes routes it did not declare? If it does, every deploy of
 * `public-site` silently un-publishes every customer domain, and the symptom is
 * every customer site going dark at once with nothing in the diff to explain
 * it."*
 *
 * **IT DOES.** Wrangler publishes zone routes with
 * `PUT /accounts/<id>/workers/scripts/<name>/routes` carrying the whole list,
 * and its own source comments that line *"Note: PUT will delete previous routes
 * on this script."* So runtime routes are not merely at risk — they are deleted
 * by the next deploy, reliably, if the config declares any zone route at all.
 *
 * WHICH IS WHY THE ANSWER IS A CONFIGURATION RULE AND NOT A MECHANISM CHANGE.
 * Wrangler only performs that `PUT` when the config contains at least one entry
 * WITHOUT `custom_domain = true`; entries with it go to a different resource
 * (`PUT …/domains/records`) that knows nothing about zone routes. So
 * `apps/public-site/wrangler.toml` declares custom domains only, `publishRoutes`
 * is never called for this script, and the route list is only ever added to by
 * `serving.ts`.
 *
 * WHY THIS IS A TEST AND NOT A NOTE IN A TICKET. Both halves of the rule are
 * invisible at the point somebody would break them: adding
 * `{ pattern = "…", zone_name = "…" }` to that array looks like declaring a
 * route and is in fact scheduling the deletion of every customer's address, and
 * the wrangler behaviour it depends on is a dependency's implementation detail
 * that an upgrade can change. Both are read here rather than remembered.
 *
 * READING A DEPENDENCY'S BUNDLE IS DELIBERATE AND IS THE STRONGER EVIDENCE. The
 * alternative the ticket proposes — a twenty-minute experiment against a
 * throwaway zone — answers the question once, for the wrangler that happened to
 * be installed that afternoon, and leaves nothing behind that notices when the
 * answer changes. This notices.
 *
 * THE FALSIFIER THIS FILE EXISTS FOR: *a customer domain added by editing
 * `wrangler.toml`* — and its more dangerous inverse, a `wrangler.toml` edited in
 * a way that removes one.
 */

const require_ = createRequire(import.meta.url)

/**
 * Wrangler's own deploy path, as the bundle this repo actually runs.
 *
 * RESOLVED THROUGH ITS `package.json` AND NOT BY GUESSING A PATH, because
 * `wrangler-dist/` is not an export the package declares — a direct
 * `require.resolve` of the file is refused by Node's exports map. Resolving the
 * manifest and reading `main` beside it gets the same bytes through the door the
 * package does declare, and follows the package if it ever moves its bundle.
 */
function wranglerBundle(): string {
  const manifestPath = require_.resolve('wrangler/package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { main: string }
  const root = manifestPath.slice(0, manifestPath.lastIndexOf('/'))
  return readFileSync(`${root}/${manifest.main}`, 'utf8')
}

const PUBLIC_SITE_TOML = 'apps/public-site/wrangler.toml'

/**
 * The `routes = [...]` array of one `wrangler.toml` section, entry by entry.
 *
 * ENOUGH OF A TOML READER TO ANSWER ONE QUESTION, on `tests/support/wrangler-
 * toml.ts`'s reasoning: the workspace has no TOML parser, this needs one array,
 * and a full parser would be more code to trust for no more answer.
 */
function routeEntries(toml: string): string[] {
  const start = toml.indexOf('\nroutes = [')
  if (start === -1) return []
  const end = toml.indexOf('\n]', start)
  return toml
    .slice(start, end)
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => line.startsWith('{'))
}

describe('REQ-258 — runtime routes survive a deploy', () => {
  it('test_UAT_FC_REQ-258_wrangler_replaces_the_whole_route_list_for_a_script', () => {
    const bundle = wranglerBundle()

    // THE FINDING, READ OUT OF THE THING THAT DOES IT. A `PUT` of the whole list
    // is a replacement, and wrangler says so in the line above the call.
    expect(bundle).toContain('PUT will delete previous routes on this script')
    expect(bundle).toContain('`${workerUrl}/routes`')

    // AND IT IS CONDITIONAL, which is the half that makes the rule below work:
    // no zone route in the config, no call, no deletion.
    expect(bundle).toContain('if (routesOnly.length > 0) {')

    // CUSTOM DOMAINS ARE A DIFFERENT RESOURCE. This is what the apex entry uses
    // and is why keeping it costs nothing.
    expect(bundle).toContain('`${workerUrl}/domains/records`')
  })

  it('test_UAT_FC_REQ-258_public_site_declares_no_zone_route_and_no_customer_domain', () => {
    const toml = readFileSync(PUBLIC_SITE_TOML, 'utf8')
    const entries = routeEntries(toml)
    expect(entries.length).toBeGreaterThan(0)

    // EVERY ENTRY IS A CUSTOM DOMAIN. One that is not makes `routesOnly`
    // non-empty, which makes every deploy a reconciliation, which deletes every
    // customer's route.
    for (const entry of entries) {
      expect(entry).toContain('custom_domain = true')
      // A CUSTOM DOMAIN'S PATTERN IS A HOSTNAME AND CARRIES NO PATH, so an entry
      // that looks like a route pattern cannot hide behind the flag.
      expect(entry).not.toContain('/*')
    }

    // AND NO CUSTOMER DOMAIN IS DECLARED HERE AT ALL — the ticket's own
    // falsifier. Every pattern is under this product's own apex; a customer's
    // domain reaches this Worker through `serving.ts` and an API call, never
    // through a commit.
    for (const entry of entries) {
      const pattern = /pattern = "([^"]+)"/.exec(entry)?.[1] ?? ''
      expect(pattern === '1stcontact.io' || pattern.endsWith('.1stcontact.io')).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-258_the_route_names_the_script_this_repo_deploys', () => {
    const toml = readFileSync(PUBLIC_SITE_TOML, 'utf8')
    // A route naming a script that does not exist is ACCEPTED by Cloudflare and
    // answers every request with an error page — so the failure of getting this
    // wrong is a domain that resolves, presents a valid certificate, and serves
    // nothing. A rename over there would otherwise be silent over here.
    const names = [...toml.matchAll(/^name = "([^"]+)"/gm)].map((m) => m[1])
    expect(names).toContain(PUBLIC_SITE_SCRIPT)

    // The PRODUCTION name specifically, which is the deployment a customer's
    // domain is routed to.
    // SCOPED TO THE SECTION AND NOT TO THE FILE. `name = "…"` also names a
    // binding under `[[env.production.unsafe.bindings]]`, so an unscoped match
    // reads whichever comes first and would pass or fail on line order.
    const from = toml.indexOf('\n[env.production]')
    const rest = toml.slice(from + 1)
    const section = rest.slice(0, rest.indexOf('\n[', 1))
    expect(/^name = "([^"]+)"/m.exec(section)?.[1]).toBe(PUBLIC_SITE_SCRIPT)
  })
})
