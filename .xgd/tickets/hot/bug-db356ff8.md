---
uid: bug-db356ff8
id: BUG-36
type: bug
title: 'control-app: fresh deployment 503s until bin/publish runs, so the builder
  never boots'
created_by: xgd
created_at: '2026-08-23T22:07:49.856675+00:00'
updated_at: '2026-08-26T17:36:27.054996+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dfe30e11
  severity: high
  story_points: 3
  commits:
  - working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40
    reconcile_sha: null
    main_sha: null
  version: 0.2.10
  bundled_in: bundle-78f4e2fe
---

## Symptom

Logging into `app.1stcontact.io` shows the boot guard, not the builder:

```
The builder did not start.
What failed: Error: GET /api/sites → 503
GET /api/sites: 503 No tenant '1stcontact'.
```

## Diagnosis

The boot guard is working correctly — it named the real cause. The failure is
upstream of it.

`apps/control-app/src/store.ts` has **two** ways to open the store, and they
disagree about a tenant that does not exist yet:

| | behaviour on a fresh D1 |
|---|---|
| `storeFor` (every read/write route) | `forTenant` throws `UnknownTenantError` → 503 |
| `storeForImport` (`POST /api/import` only) | `createTenant` first, then `forTenant` → succeeds |

Both take the tenant from the same place — `TENANT_ID` in
`apps/control-app/wrangler.toml`, currently `"1stcontact"`. So the tenant a
deployment may register is fixed by its own configuration; the write path
registers it and the read path refuses it.

`bin/deploy` applies the D1 migrations (`bin/deploy.d/migrate/10-d1-site-store`)
but seeds no rows, and nothing else creates the `tenants` row. The tenant is
therefore created as a side effect of the first `bin/publish`, which means a
freshly deployed builder is dead on arrival until an operator runs a CLI from a
dev machine.

The `tenants` table exists and is empty — the error is `UnknownTenantError`,
not a SQL error — so the migrations *did* run. Only the row is missing.

Why it takes the whole page down rather than one panel: `main.js` awaits
`/api/sites` at top level, so a refusal rejects the module and nothing mounts.
`apps/control-app/src/builder/app.js:66` already handles an empty list
(`sites[0]?.slug ?? null`), so the builder boots fine against zero sites once
the store opens.

## Immediate unblock (no code change)

```bash
CF_ACCESS_TOKEN=<service-token-jwt> bin/publish --production 1stcontact
```

That registers the tenant and imports the site. See `apps/control-app/ACCESS.md`
for the token.

## Proposed fix

Collapse the two store openers into one. `storeFor` ensures the configured
tenant exists, exactly as `storeForImport` does today, and `storeForImport` is
deleted along with the router's `deps.importStore` seam.

Cold path only: try `forTenant`; on `UnknownTenantError` for the configured
tenant, `createTenant` and retry once. No extra query on the warm path, and no
write on every request.

The library-level barrier is unchanged — `d1r2SiteStore.forTenant` still refuses
an unknown tenant. What changes is the Worker's own bootstrap, which registers
exactly the one tenant its configuration names and can name no other. That is
already the argument `storeForImport`'s own docstring makes; this applies it to
the read path too, where its absence is what produces the dead builder.

## Test plan

- `test_UAT_FC_BUG-36_*` — `GET /api/sites` against a D1 with schema and no
  tenant row returns `200 []`, and the tenant row exists afterwards.
- `test_UAT_FC_BUG-36_*` — an unset/empty `TENANT_ID` still throws
  `TenantNotConfiguredError`; no tenant is created.
- Existing REQ-145 import UATs continue to pass against the single opener.

## Status

Both halves landed and verified (2026-08-23). The tenant fix is implemented as
described under **Proposed fix**; the publish-credential addition is described
under **Approved scope addition** below. See **Implementation — the tenant fix**
at the end.
## Production state — confirmed empirically (2026-08-23)

Queried the deployed D1 directly with `CLOUDFLARE_API_TOKEN` via
`wrangler d1 execute 1stcontact --env production --remote`:

- `d1_migrations` = 2 rows — the schema **is** applied, so the migrate hook works.
- `tenants`, `sites`, `site_pages`, `site_assets`, `site_revisions`,
  `published_sites` — **all zero rows**.

That confirms the diagnosis exactly: schema present, data absent, and the only
thing standing between a fresh deployment and a working builder is one
`tenants` row that nothing in `bin/deploy` creates.

### Interim production patch applied

The configured tenant was registered by hand, with the same values
`createTenant` writes:

```sql
INSERT OR IGNORE INTO tenants (id, name, status, created_at)
VALUES ('1stcontact', '1stcontact', 'active', '2026-08-23T22:19:48.000Z');
```

`/api/sites` now has a tenant to resolve and the builder boots (to an empty
site list — the store still holds no sites). This is a one-off patch of
production state, NOT the fix; the code change above is what stops it
recurring on the next fresh deployment or database.

## Second finding — `bin/publish --production` cannot authenticate as written

Separate from the tenant bug, and not fixed here.

`pushSite` sends the Access credential as the `cf-access-jwt-assertion` header
(`tools/generate/src/cli/push.ts:116`), and `bin/publish`'s help and error text
both call for "a service-token JWT" in `CF_ACCESS_TOKEN`.

But `cf-access-jwt-assertion` is the header Access **sets on the origin
request** — it is not an inbound credential the edge accepts. An Access service
token is a client id + client secret pair, sent as `CF-Access-Client-Id` and
`CF-Access-Client-Secret`, which Access exchanges at the edge for the JWT.
`push` sends neither, so `bin/publish --production` is refused with a 302 to
the login page before the Worker ever runs.

Confirmed: `GET https://app.1stcontact.io/api/sites` → `302` to
`lagrangefoundry.cloudflareaccess.com/cdn-cgi/access/login/...`, and the account
holds **no service tokens at all** (`GET /accounts/{id}/access/service_tokens`
→ empty). `ACCESS.md` § Automation describes the service-token flow correctly;
the CLI does not implement it.

Needs its own ticket.

---

# Approved scope addition — fix the publish credential (option A)

Operator approved 2026-08-23. Folded into this ticket rather than filed
separately, per session scoping; split it out on request.

## Why the API token cannot simply be swapped in

Asked whether `bin/publish` could authenticate with `CLOUDFLARE_API_TOKEN`,
which the operator already has in their environment. It cannot. Cloudflare
Access at the edge accepts exactly three credentials:

- a `CF_Authorization` cookie (a human's browser session),
- a service token's `CF-Access-Client-Id` + `CF-Access-Client-Secret` pair,
- a client certificate (mTLS).

A Cloudflare **API** token authenticates to `api.cloudflare.com`. It is a
different system; presented to `app.1stcontact.io` it gets the same 302 to the
login page as no credential at all.

What it CAN do is **provision** the credential that works — confirmed: the token
carries Access read *and* write. So the API token is the thing that mints the
service token; it is never the thing that publishes.

## The change

**`bin/access-token`** (new) — one-time provisioning, run by the operator.
Uses `CLOUDFLARE_API_TOKEN` to ensure a named service token exists and that the
`app.1stcontact.io` Access application carries a `non_identity` (Service Auth)
policy including it. Prints the client secret ONCE, for the operator's password
manager, and never writes it into the repo.

**`tools/generate/src/cli/push.ts`** — send `CF-Access-Client-Id` and
`CF-Access-Client-Secret`, replacing the `cf-access-jwt-assertion` header the
edge ignores. Per CLAUDE.md's no-legacy-modes rule the old header is deleted,
not kept as a fallback: it never worked against a deployed target.

Also `redirect: 'manual'`, which is a real bug fix rather than tidiness. With
the default `follow`, an unauthenticated push follows the 302 to the Access
login page and comes back `200` with HTML — so `res.ok` is true, the error
branch never runs, and `JSON.parse` throws on `<!DOCTYPE html>`. The operator
sees a JSON parse error instead of "you are not authenticated".

**`tools/generate/src/cli/index.ts`** — `--client-id` / `--client-secret`,
defaulting from `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`. `--token` is
removed.

**`bin/publish`** — same two env vars, and the pre-flight refusal that already
guards production is updated to name them.

**`apps/control-app/ACCESS.md`** — record the provisioning step and the granted
service-token identity in the § Automation table.

No Worker change: `apps/control-app/src/access.ts:256-259` already accepts a
service token's `common_name` claim, reporting it as `service-token:<name>`.

## Note — two service tokens were created and revoked

While probing whether the API token had Access write permission, an empty-body
`POST .../access/service_tokens` was expected to fail validation. Cloudflare
treats an empty body as "create with defaults" and returned 201, twice. Both
were deleted the same minute; the account now holds zero service tokens and its
only policy remains `operator` for `martin-github@westhead.me`. Neither token
was ever attached to a policy, so neither granted anything.

## Implementation — landed and verified end to end (2026-08-23)

Branch `free-BUG-36`.

Provisioned and published for real, not just unit-tested:

```
Token       created '1stcontact-publish'
Policy      created policy 'service token — 1stcontact-publish'
pushed xgd → https://app.1stcontact.io
  pages   2 (home.json, whitepapers.json)
  assets  9
  site.json yes
```

Production D1 afterwards: `tenants=1, sites=1, pages=2, assets=9`. So the
credential path works against the real Access gate, and the builder now has a
site to show rather than an empty list.

### A third finding, met while running it

`bin/publish` failed first with a bare `fetch failed`. That was not Access and
not this change: Node's global `fetch` ignores `HTTP_PROXY`/`HTTPS_PROXY` unless
told, and the assistant's sandbox routes everything through a proxy. With
`NODE_USE_ENV_PROXY=1` the same command reached the edge and completed.

Left OUT of `bin/publish` deliberately. It is a property of one caller's network,
not of publishing, and baking a proxy opt-in into the script would make every
future operator wonder which proxy it meant. Recorded here because the symptom —
`fetch failed`, no status, no URL — is otherwise indistinguishable from the site
being down.

### The client secret was never printed into the session

`bin/access-token` prints the pair to stdout. Rather than let a long-lived Access
credential land in a transcript, provisioning and publishing were run as a single
shell invocation with the secret held in a variable and filtered out of
everything echoed. The operator holds no copy as a result: `bin/access-token
--rotate` issues a fresh one whenever they want it in their password manager.
The client id is not a secret: `29edd0e0ede45619455f21128c7b88ce.access`.

---

# Implementation — the tenant fix

Landed on `free-BUG-36`, the second half of this ticket and the one it was
opened for.

## What changed

| File | Change |
|---|---|
| `apps/control-app/src/store.ts` | `storeFor` registers the configured tenant on the cold path; `storeForImport` deleted |
| `apps/control-app/src/router.ts` | `deps.importStore` removed from `RouterDeps`; the import route opens the store through `deps.store ?? storeFor` like every other route |
| `tools/generate/src/cli/builder.ts` | Node transport no longer supplies `importStore` |
| `tools/generate/src/store/d1r2-store.ts` | `UnknownTenantError` carries `reason: 'unknown' \| 'inactive'` |

`storeFor` now reads:

```ts
const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
try {
  return await root.forTenant(tenantId)
} catch (err) {
  if (!(err instanceof UnknownTenantError) || err.reason !== 'unknown') throw err
  await root.createTenant({ id: tenantId, name: tenantId })
  return root.forTenant(tenantId)
}
```

## Why `reason` had to be exposed

`UnknownTenantError` collapsed two different refusals into one. `unknown` means
there is no row — the state every fresh database is in, and one the caller that
owns the configuration may legitimately resolve. `inactive` means a row exists
and someone deactivated it, which no caller may undo by retrying.

Without the distinction the bootstrap could not tell "not yet" from "no", and
would have had to either refuse a fresh deployment or reopen a closed account.
`createTenant` is `INSERT OR IGNORE`, so an inactive row would in fact have
survived a blind retry — but a guarantee that holds by accident of the insert's
flavour is not one, so the reason is checked explicitly.

## Scope of what the bootstrap may create

Unchanged from the argument `storeForImport` already made. `tenantId` comes from
the deployment's own `TENANT_ID` var, so this can name exactly the account the
configuration already names and can reach no other. The library barrier is
untouched: `d1r2SiteStore.forTenant` still refuses an unknown tenant, and an
unset `TENANT_ID` is still `TenantNotConfiguredError` — there is no name to
register, and inventing one would let a misconfigured Worker write into whichever
account happened to carry it.

Cost on the warm path is nil: the ordinary request finds the row on the first
`forTenant` and pays one indexed lookup by primary key, as before. The create
runs once in a database's life.

## Tests

`tests/test_UAT_FC_BUG-36_tenant_bootstrap.workers.test.ts` — five UATs, in
workerd against a real D1, because the whole claim is about what a real database
with no `tenants` row does to a real Worker's `fetch`:

- `..._a_fresh_database_serves_an_empty_site_list` — the outage itself: schema
  applied, no tenant row, `GET /api/sites` → `200 []` rather than `503 No tenant`.
- `..._reading_registers_the_configured_tenant_and_no_other` — the row exists and
  is active afterwards, and exactly one tenant was added.
- `..._an_import_still_lands_on_a_fresh_database` — the regression guard for
  deleting the second opener, which used to carry the only registration.
- `..._a_deactivated_tenant_stays_refused` — 503, and the tenant is still
  suspended afterwards.
- `..._an_unset_tenant_id_is_still_a_configuration_error` — 503 naming
  `TENANT_ID`.

Each case uses its own tenant id: the database is shared across the file and the
bootstrap is a write, so a shared id would let case order decide whether a tenant
was "fresh" — the one property under test.

## Supersession — one REQ-149 assertion

`test_UAT_FC_REQ-149_build_artifacts_serve_when_the_store_has_no_tenant`
(AC-10) closed with a companion assertion that `GET /api/sites` under
`TENANT_ID: 'nobody'` answers 503. That is exactly the behaviour this ticket
changes, and deliberately: a configured tenant with no row is every NEW
deployment.

AC-10's actual claim — build artifacts serve without opening a store — is
untouched. Only the probe moved, to `TENANT_ID: ''`, which is the case that is
still genuinely unopenable. The companion property ("deferring the store must
not change what an unopenable one means") is preserved intact.

## Verified

- `vitest run --project workers` — 63 passed, 8 files, including the new UAT and
  every REQ-143/145/146/148/149 workerd suite.
- `tsc --noEmit` clean across `site-schema`, `framework`, `public-site`,
  `control-app`, `generate`.
- The interim production `INSERT` recorded above is no longer load-bearing: the
  Worker registers the row itself on the next fresh database or deployment.

## Still open, and NOT this ticket

`app.1stcontact.io` returns Cloudflare **Error 1102 — Worker exceeded resource
limits** when switching the builder to **Edit** mode, reproducibly. Edit mode is
`/preview/<slug>/edit/` — the request-time edit-channel render in workerd, which
stamps segment addresses on top of the ordinary draft render. Unrelated to the
tenant bootstrap or the publish credential; it needs its own ticket.