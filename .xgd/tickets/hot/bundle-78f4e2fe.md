---
uid: bundle-78f4e2fe
id: BUNDLE-21
type: bundle
title: BUG-36 + BUG-37 + BUG-38
created_by: xgd
created_at: '2026-08-26T17:36:26.915596+00:00'
updated_at: '2026-08-31T14:23:56.450244+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: ea48502d0d90bb607ac528e34099e71eaab6df40
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2058a16449a8e783bdd655d22bade58fd6b8d0fc
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0fe586d1f67c678efd5a1ff02f5978948a41bb11
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 999579b3fbef0757cf5e715691c9aaa9ecdf329e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 63df97c93542321a3d57d21e2e31a763ed3e4411
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
  orphan_commits:
  - old_sha: 018103eb295c70866b86a050825853276d6de7ac
    new_sha: f695e3fefc513c972737ee865ecd57f2aac02429
  - old_sha: 1d67c633f4208e58d029d0652bb77959e4bb35f4
    new_sha: fe4fba056a6741d05213cf69ed6a37523adb24f1
  - old_sha: deca3aa558c689918940fd8226dcc3a40c6f6bc4
    new_sha: 2589a37af046f6a7260f9a8ed61a85162f6d28c5
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-36: control-app: fresh deployment 503s until bin/publish runs, so the builder never boots

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


---

## BUG-37: control-app: Edit mode dies with Cloudflare 1102 — the preview render cache never hits in the Worker

## Symptom

Switching the builder to **Edit** mode on `app.1stcontact.io` returned
Cloudflare **Error 1102 — Worker exceeded resource limits**. Reported as 100%
reproducible: every switch to Edit produced it. View mode appeared unaffected.

## Root cause — CONFIRMED

**The account was on the Workers Free plan, whose per-invocation CPU ceiling is
10 ms. A preview request costs ~78 ms of CPU.** Every preview request exceeded
the ceiling by ~8x, which is exactly why it reproduced 100% of the time.

Measured inside real workerd (`vitest.workers.config.mts`), driving the actual
Worker `fetch` against a real D1 database holding the real `xgd` definition:

| stage | cost |
|---|---|
| `version` + `readPages` + `assetNames` (D1 I/O) | **2–3 ms** |
| `assembleSite` — schema validation of the definition | **72–89 ms** |
| `renderSiteFiles` | **1–4 ms** |

The operator upgraded to a paid plan (default ceiling 30 s). That removed the
outage. `wrangler.toml` declares no `[limits]` block, so the default applies.

## What this ticket fixes in code

The upgrade raised the ceiling; it did not remove the waste. Two defects remain,
and this ticket closes the expensive one.

**1. The definition is re-validated on every request (~95% of the cost).**
`PreviewRenderer.file()` calls `store.loadDraft(slug)` unconditionally, before
consulting its render cache — deliberately, so the stamp check stays a store
read and a stale render can never be served (`tools/generate/src/cli/preview.ts`).
`assembleSite` runs inside `loadDraft`
(`tools/generate/src/store/d1r2-store.ts`), so no cache in the previous design
could avoid it. Every preview byte — page, `theme.css`, every editor save
round-trip — paid the full ~78 ms.

**FIX: memoise the assembled (validated) definition per isolate, keyed
`(tenantId, slug)`, holding `{ version, result }` and replaced whenever the
version moves.** `siteRow` is still read on every `loadDraft` (~1 ms) and its
`version` is the invalidation key, so currency is still proven per request —
what is skipped is `readPages` + `assembleSite` when the version is unchanged.

Correctness of the key: `write()` ends with
`UPDATE sites SET version = version + 1` for every draft mutation including
asset writes, so any change to what `assembleSite` consumes moves the version.
The check is a live D1 read, so a write from **another isolate or another
process** (`bin/publish` from a laptop) invalidates correctly too.

Bounded by design: keyed by `(tenantId, slug)` and *replaced* on version change
rather than accumulating per version, so the map holds at most one entry per
site — it cannot grow with edit count.

Placed in the D1 adapter rather than the router deliberately. It caches
validated **data**, never a store handle, so the per-request `forTenant` tenant
check in `storeFor` still runs on every request and a deactivated tenant is
still refused. `fsSiteStore` is a separate implementation and is untouched.

**2. The `PREVIEWS` WeakMap render cache is dead in the Worker — NOT fixed
here, deliberately.** `apps/control-app/src/router.ts` keys the cache on the
store OBJECT, and `storeFor` builds a fresh handle per request, so the key is
new every time. Confirmed empirically: five consecutive `/preview/xgd/draft/`
requests at ~77 ms with no amortisation.

It is left in place because re-keying it is **not** safe: a `PreviewRenderer`
cached across requests holds the store handle it was constructed with, so it
would perform reads through a handle whose tenant check predates the request —
the exact staleness `storeFor` documents and refuses. Re-keying would trade a
tenant-deactivation guarantee for ~1–4 ms. After fix 1 the render is ~2% of the
request, so the remaining cost is not worth that trade.

## Result

A preview request drops from **~78 ms to ~5 ms** of CPU (~15x). Scaling was
linear before the fix (~18 ms of validation per page), so the saving grows with
site size.

## Superseded — the original hypothesis, recorded because it was wrong

The first diagnosis blamed the dead `PREVIEWS` WeakMap causing whole-site
re-renders to exhaust **isolate memory**, and proposed re-keying it as the
cheapest falsifying fix. Measurement falsified both halves:

- **The render is ~2% of the request, not the cost centre.** Re-keying the
  WeakMap would have recovered 1–4 ms of a 78 ms request and left the outage
  exactly where it was.
- **Memory was never the mechanism.** A whole `RenderedSite` is 131–210 KB of
  strings and is collectable; reaching the 128 MB isolate ceiling would need
  ~600 concurrent renders. A 12-request concurrent burst returned `200 x12`.
- **"Edit is the larger render" is false — Edit is the cheaper channel.** The
  edit render emits no client bundle at all
  (`render.ts`, `clientJs = edit ? '' : getModuleClientJs()`), drops accent
  rules and reveal handles, and strips `href` targets: 4 files / 131.4 KB and
  2 origin requests per page load, against draft's 5 files / 210.2 KB and 3.
  Nothing at the origin made Edit more expensive than View.

The reported View/Edit asymmetry was most likely browser caching — preview
responses carry no `Cache-Control`, so View's already-loaded document was
reused while Edit was a fresh URL. On the free plan *every* route through
`loadDraft` was over the 10 ms ceiling, including `/api/sites`, `/api/copy` and
publish; the builder was marginal everywhere, not just in Edit.

An intermediate inference — that the recorded victim's "94 ms CPU" proved the
ceiling was above 94 ms and therefore ruled out the free plan — was also wrong.
The plan upgrade resolved the outage, so that figure did not describe the
killed request's CPU.

## Observability — added here

`apps/control-app/wrangler.toml` declared no `[observability]` block, at the top
level or under `[env.production]`. The account therefore retained no
per-invocation logs, only aggregate counters — which is why this was diagnosed
from source plus a billing page rather than from a log read.

Now declared in **both** places with `head_sampling_rate = 1`. `observability`
is on wrangler's inheritable list, unlike vars and bindings, so the production
repeat is redundant today and is written anyway: this file's standing rule is
that nothing depends on remembering which keys inherit, and losing the
production declaration fails silently — the deploy succeeds and the logs are
simply absent.

The production table sits **after** `routes`, and a UAT pins that. A TOML table
header ends the table above it, so `[env.production.observability]` placed before
`routes` captures it: the file still parses, wrangler still deploys, and the
production route silently stops being declared. That mistake was made and caught
during this work; `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`
reproduces it.

Verified with `wrangler deploy --env production --dry-run`.

## Deployment

Neither change is live until `control-app` is redeployed. The store fix is
Worker source that wrangler bundles at deploy time, and the observability block
is deploy-time configuration; `dist/` is evidence, not input.

## Reproduction (historical)

```bash
# needs a Cloudflare Access service token — see apps/control-app/ACCESS.md,
# provision with bin/access-token
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  https://app.1stcontact.io/preview/xgd/edit/
```

## Relationship to BUG-36

Found while verifying BUG-36 and recorded there as COMMENT-1447. **Independent
of it.** `storeFor` was already per-request before BUG-36; that ticket changed
what happens when the tenant row is missing, not when the handle is built.
BUG-36 neither caused this nor fixes it.


---

## BUG-38: Builder chat: every turn fails in the cloud with "conversation is no longer open"

## Symptom

On the cloud deploy of the builder, every chat turn answers with:

> _That conversation is no longer open — reload the builder to start it again._

Reloading and retrying produces the same message. The chat is completely
unusable in workerd; it works locally under `1c builder`.

## Root cause

`tools/generate/src/cli/ai/host-core.ts` resolves a session id back to its slug
through `minted` — a **module-level in-memory `Map`** populated by `openSession`
and read by `streamPrompt`:

```ts
const minted = new Map<string, string>()          // sessionId -> slug
...
minted.set(mintedKey(sessionId, deps), slug)      // openSession
const slug = minted.get(mintedKey(sessionId, deps))
if (!slug) throw new UnknownSessionError(sessionId)   // streamPrompt
```

`/api/ai/session` (which mints) and `/api/ai/prompt` (which resolves) are **two
separate HTTP requests**. In workerd they are not guaranteed to land on the same
isolate, and on a fresh deploy with cold traffic they routinely do not. The
prompt request reaches an isolate whose `minted` map is empty, `streamPrompt`
throws `UnknownSessionError`, and `router.ts` renders it as the message above.

Everything else in the host was already built for isolate churn — the transcript
archive is R2-backed (`R2TranscriptArchive`) and `attach` resumes from it when
the in-memory junction has nothing. `minted` is the one piece of per-isolate
state whose loss is fatal rather than recoverable, and it holds no information
that isn't derivable: `sessionIdFor(slug)` is literally `` `site-${slug}` ``.

The registry existed as an *authority* check — "the host answers only for ids it
issued" — so an arbitrary client string could not become a free-form key into the
session store.

## Fix

Delete `minted` / `mintedKey` and resolve the session id durably instead:
strip the `site-` prefix and confirm the resulting slug is a site **this
tenant's store actually holds**, via `SiteStore.hasDraft(slug)`.

That preserves the authority property (and strengthens it — the check is now
tenant-scoped against real storage rather than against whatever a given isolate
happens to remember) while making resolution independent of which isolate serves
the turn. Per the no-legacy-modes rule the in-memory map is removed outright, not
kept as a fast path.

## Test plan

`tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts` —
runs inside workerd against real D1 + R2:

1. Open a session, drop **all** per-isolate caches (`resetAiHost` +
   `resetChatHost` — this is the new-isolate case), then POST `/api/ai/prompt`
   with the id the client is still holding. The turn must run.
2. A session id naming a site that does not exist must still be refused with the
   "no longer open" message, so the authority check is not merely deleted.

Regression scope: `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`,
`tests/test_UAT_FC_REQ-122_chat_host.test.ts`.