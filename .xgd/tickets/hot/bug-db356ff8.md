---
uid: bug-db356ff8
id: BUG-36
type: bug
title: 'control-app: fresh deployment 503s until bin/publish runs, so the builder
  never boots'
created_by: xgd
created_at: '2026-08-23T22:07:49.856675+00:00'
updated_at: '2026-08-23T22:21:09.946754+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-dfe30e11
  severity: high
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

Scope drafted, awaiting operator confirmation before coding.
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
