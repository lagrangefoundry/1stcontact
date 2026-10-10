---
uid: request-77a257dd
id: REQ-394
type: request
title: '1stc.site: platform hostnames are unreachable in production, and the apex
  site''s should redirect to 1stcontact.io'
created_by: EPIC-16
created_at: '2026-10-10T13:58:27.133219+00:00'
updated_at: '2026-10-10T14:00:23.593596+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
---

## Symptom (2026-10-10)

`https://1stcontact.io/` serves the published 1st Contact site (APEX_SITE_KEY, commit `1e55848d32`). `https://1stcontact.1stc.site/` — the same site's claimed platform hostname (`site_domains` row `dom_9a4ced3e4abf4d82f04dee35c9a6d865`, kind `platform`, canonical) — does not answer at all: the request never reaches a Worker. The operator expects it to redirect to `https://1stcontact.io/`.

## Why — two independent gaps

**1. Nothing routes `*.1stc.site` to the public-site Worker in production.** Production's `zones` table is empty; `apps/public-site/wrangler.toml` declares only `1stcontact.io` (custom domain); no `*.1stc.site/*` route exists. So every `1stc.site` hostname this product has ever issued is unreachable — this is not specific to 1st Contact. The Worker side already exists: `rootSite` (`apps/public-site/src/index.ts`) binds a host with a `site_domains` row and redirects it to the site's canonical host.

The route cannot go in `wrangler.toml`: REQ-258 established that any zone route there makes every deploy `PUT` the whole route list and delete every runtime-attached customer route. It has to be created the way `serving.ts` creates customer routes — out of band, additive, idempotent.

**2. Even when routed, it would serve rather than redirect.** The 1st Contact site's only `site_domains` row is the `1stc.site` one, so it is canonical, and `rootSite` serves a host that is its own canonical. `1stcontact.io` is served through `APEX_SITE_KEY`, which `rootSite` treats as unbound — so the apex is not anybody's canonical host in the data.

## What done looks like

- The `1stc.site` zone is in the Cloudflare account, with a proxied wildcard DNS record and a `*.1stc.site/*` route on `1stcontact-public-site`, provisioned by a repeatable, idempotent step (a deploy hook or a one-shot script beside `bin/access-token`) — never by `wrangler.toml`. Re-running it changes nothing; it never removes a route.
- Any claimed `<label>.1stc.site` serves its site (or redirects to that site's canonical custom domain, as `rootSite` already does).
- **The site named by `APEX_SITE_KEY` treats the apex as its canonical address**: a request for any of its other hostnames (`1stcontact.1stc.site`) is a 301 to `https://1stcontact.io/<same path>`. The implementing session chooses the mechanism and records why — e.g. `rootSite` redirecting when `binding.siteKey === APEX_SITE_KEY`, versus binding the apex as a canonical `site_domains` row. Note the second changes what the apex serves for `/site/<key>/` (a bound host serves exactly one site), which `bin/smoke` and the prefix grammar rely on; prefer the first unless there is a reason.
- An unclaimed `<label>.1stc.site` answers 404 indistinguishably from an unpublished site, as `unknown_site_not_found` already asserts for the apex.
- `bin/smoke` gains a check for a claimed platform hostname (given or derivable), so this cannot regress silently again.

## Test plan

UATs (`test_UAT_FC_<id>_*`): a request for the APEX_SITE_KEY site's platform hostname is a 301 to the apex preserving path and query; a claimed hostname of another site serves that site; an unclaimed one is a 404; the provisioning step is idempotent and issues no route deletion; `wrangler.toml` still declares only custom-domain routes (REQ-258's static UAT stays green).



## Update 2026-10-10: the zone exists

The operator confirms `1stc.site` is registered on the 1st Contact Cloudflare account. So the account side of gap 1 is a DNS record and a route, not a registration. The provisioning step should still verify the zone is in the account and on Cloudflare nameservers, and fail naming it if not, because a fresh environment cannot assume it. Recording the zone in the product's `zones` table is NOT wanted for `1stc.site`: `recordZone` and `serving.ts` deliberately refuse the platform apex (REQ-257), and this route is platform infrastructure, not a customer zone.