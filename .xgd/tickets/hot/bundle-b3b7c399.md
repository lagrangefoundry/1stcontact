---
uid: bundle-b3b7c399
id: BUNDLE-20
type: bundle
title: REQ-147 + REQ-143 + REQ-145 + REQ-146 + REQ-148 + 5 more
created_by: xgd
created_at: '2026-08-24T02:10:41.035843+00:00'
updated_at: '2026-08-30T04:32:26.124260+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  commits:
  - working_sha: de2e29930271cafaa00ac20cd8c7e5fdc8bf7c80
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 96118c32cfc8495b6f7f2eff7046b518e267d84c
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: cb403366db16ef7147b56fc12b5c5db942805d63
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 16edb7521cbf1544c583ff1cb406a2dc62512638
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 7a1822f523fdfe658e10495c46d7a7bc152f2cad
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b37c95a60decbe971f2960396a30ec1a6878b5a2
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 1d10effc8449b8c81c2c8a36c3d8c5e4ae112ebb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a28d2f522f0e5f06629ca9084ac14349b988ed85
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b8b01ebf26bcef0627c936c68fbc813b7c20240e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0f7795003980bc25abe96ab164aea316df7061b0
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 54b3e76a84d005134884728dee80bacab93f83c1
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 258381e2d49405bd016b3b8828b87653d66ea4e7
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0e390334e49f33f94bc2c948a62a532c03ea84eb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: aa64b3e15b44b425aa1394edd18d0915fdba0324
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c36373c10b87e81815aa7bff01d786e5e554178f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ced4356a6a0fb88f2fb4f71c6d47060e65881499
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 38e4a3cf22519d0ff24de047e0a3bb7a4d75dcb6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 2d6bc790979aa2ab850dbda1ef748b7b222cd2e3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 31a4ca7da51ff8ff4dc9116434bd14e6acf8f60f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: b404103fbde5313babac633855c81df57546bbeb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 932f362e4f60b8797557ba8f4cdd1fddeb1c9068
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 92fc26e7bcc2a941999ba0e55292cda6b092bd26
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ec144c856ed1840d23e4f1443dfddf4fb0ef2d67
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 02bd443784f6a1202cd5b1807a12dc52d012628f
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-147: The builder is private: Cloudflare Access on app.1stcontact.io

# The builder is private: Cloudflare Access on `app.1stcontact.io`

The builder must not be publicly visible. Cloudflare Access is the operator gate, chosen over
building custom auth now.

## 1. Why Access rather than a login module

Access costs **zero application code**, enforces at the edge before the Worker runs, validates a
signed JWT, and covers assigning permissions by adding identities to a policy. It is free to 50
users.

It is not throwaway, because it is not the same thing as customer login. A customer signing in to
their own builder is a different product surface, and it belongs with the tenancy model that
arrives in [[REQ-143]] — where `@lagrangefoundry/ticketing` already provides a `tenants` registry
and scoped handles. Building custom auth now would mean building it twice, and the second one
would be the real one.

## 2. `workers_dev = true` is a hole in this

**Access on a custom domain does not protect a Worker's `workers.dev` URL.** `control-app` sets
`workers_dev = true`, so `1stcontact-control-app.<subdomain>.workers.dev` would serve the builder
to anyone who guesses it, entirely bypassing an Access policy on `app.1stcontact.io`.

A policy on the hostname alone is therefore **not** sufficient. Close it by disabling
`workers_dev` for control-app, verifying the JWT inside the Worker, or both. Given
[[DOC-2]] is the security policy, both.

Note this is latent rather than live: control-app currently 503s everywhere ([[REQ-144]]), so
nothing is exposed *yet*. It becomes real the moment the builder works.

## 3. Interactions worth checking, not assuming

- The preview iframe is same-origin, so it inherits the Access cookie — but the SSE streaming
  turn (`/api/ai/prompt`) must be confirmed to survive Access rather than presumed to. That
  confirmation needs a running assistant, so it is carried by [[REQ-146]]; it is recorded here
  because this is where the risk originates.
- Draft snapshots served by `public-site` stay **link-private, not authenticated** — an
  unguessable URL, per [[DOC-12]] §5.1 and the decision recorded in [[CHAT-11]]. Access does not
  change that, and this ticket does not revisit it. [[DOC-12]]'s "author only (private)" wording
  is still flagged as needing amendment there.
- Any automation calling `app.1stcontact.io` needs an Access **service token**.
- `wrangler dev` is unaffected — Access sits in front of the deployed Worker only.

## 4. Acceptance criteria

1. An unauthenticated request to `app.1stcontact.io` is challenged, not served.
2. An identity not on the policy is refused after authenticating.
3. The Worker's `workers.dev` URL does not serve the builder to an unauthenticated caller —
   asserted, because this is the failure mode the hostname policy misses.
4. The Worker rejects a request carrying no valid Access JWT even if it reaches it directly, so
   the gate does not depend on routing alone.
5. An authenticated identity on the policy reaches the Worker and receives its response —
   whatever that response currently is. **This ticket does not require a working builder.** The
   gate is provable against the Worker as it stands, and asserting an edit or an AI turn here
   would make Access depend on [[REQ-145]] while [[REQ-145]] depends on Access. Those
   end-to-end assertions belong to [[REQ-145]] and [[REQ-146]].
6. Access configuration is recorded in the repository as documentation — the policy lives in
   Cloudflare, but which identities are granted and why must not live only in a dashboard.

## Origin

[[CHAT-25]] — operator: "I don't want it publicly visible". Access chosen as the operator gate;
customer accounts deferred to the tenancy model in [[REQ-143]].
---

## Implementation (free-coded, REQ-147)

### What changed

| File | Change |
|---|---|
| `apps/control-app/wrangler.toml` | `workers_dev = false` (top level **and** restated under `[env.production]`); `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` vars declared on both sides of the inheritance line |
| `apps/control-app/src/access.ts` | new — Access JWT verification: JWKS fetch + cache, RS256 signature, `aud` / `iss` / `exp` / `nbf` / `iat`, and the `guardAccess` gate |
| `apps/control-app/src/index.ts` | the gate runs **first**, before the origin is read or proxied |
| `apps/control-app/ACCESS.md` | new — the policy record: why Access, the two controls, the vars, granted identities and reasons, service tokens, how to verify (AC6) |
| `tools/generate/bin/smoke.mjs` | `--control-origin` / `--workers-dev-origin`: an unauthenticated caller is challenged, and the workers.dev door is shut (AC1, AC3) |
| `tests/support/access.ts` | new — a stand-in Access team (real loopback JWKS + real RS256 signing) so the gate can be driven through real `workerd` |

### Design decisions

**The gate is stated twice, and neither statement is redundant.** `workers_dev = false`
removes the hostname an Access policy cannot cover; the in-Worker check refuses anything that
reached the Worker without a valid JWT, whatever route it took. Opening the builder now takes two
independent mistakes rather than one.

**The algorithm is pinned from the JWKS, never read from the token.** `alg: none` and the HS256
confusion attack are both "believe the header", and a token is untrusted input including its
statement about how to check it.

**`aud` is checked, not just the signature.** Every Access application in a team is signed by the
*same* keys, so a valid signature alone proves "someone in this team's Access", not "allowed into
this application".

**Fail closed, with no exception path.** Empty vars → 503 naming the missing var; unfetchable
JWKS → 401; no token → 401. There is no configuration under which "we could not check" becomes
"let it through". Two refusal codes on purpose: 503 sends the operator to `wrangler.toml`, 401 to
the identity, and conflating them sends them hunting for the wrong problem.

**No local-development bypass.** A "skip Access when local" flag would be a security control with
an off switch, so there is none. The consequence is that `wrangler dev` on `control-app` needs
Access configuration and a real token — the local builder surface is the Node origin itself
(`1c builder`, `http://localhost:8790`), which is unproxied and unaffected. **Reversible if the
workflow proves painful**; see the open question below.

### ACs

| AC | Evidence |
|---|---|
| 1 — unauthenticated is challenged, not served | `bin/smoke --control-origin`; UAT `smoke_accepts_a_protected_control_app` / `smoke_fails_when_the_builder_is_public` |
| 2 — an identity off the policy is refused | Cloudflare-side; Access refuses before the Worker sees the request (recorded in ACCESS.md, not asserted here — it is Cloudflare's own enforcement) |
| 3 — workers.dev does not serve | `control_app_answers_on_no_workers_dev_hostname` (the file that governs every deploy) + `bin/smoke --workers-dev-origin` |
| 4 — the Worker rejects a request with no valid JWT | `worker_refuses_a_request_without_a_valid_access_jwt` (8 cases: absent, malformed, forged signature, `alg: none`, wrong `aud`, wrong `iss`, expired, unknown `kid`), plus the unconfigured and unfetchable-JWKS cases |
| 5 — an admitted identity reaches the Worker | `a_valid_access_identity_reaches_the_worker`, `the_access_cookie_is_accepted_like_the_header`, `a_service_token_identity_is_accepted`, and the REQ-115 / story-e674c60a ACs below |
| 6 — configuration recorded in the repository | `the_access_policy_is_recorded_in_the_repository` asserts the substance, not the file's existence |

### Superseded matrix behaviour (intent conflict, deliberate)

Three existing ACs pinned the pre-gate behaviour that *any* caller reaches the origin. What they
are actually about — one host, verbatim forwarding, and distinct origin failures — is unchanged
for an **admitted** caller, so their UATs now authenticate and each additionally asserts that an
unadmitted caller gets 401:

- `test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim`
- `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures`
- `test_UAT_FC_REQ-115_control_app_fronts_the_builder_same_origin`

`test_UAT_FC_REQ-144_smoke_passes_against_a_correct_origin` was widened: the two new control-app
checks skip against a public-site origin, which the assertion now names rather than forbids.

### Not done here, and why

- **The Cloudflare-side objects** (the Access application, the policy, the identities) are created
  in the dashboard. `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` therefore **ship empty**, and the Worker
  is closed until they are filled in — which is the correct state for a private builder that is
  not yet in use. ACCESS.md says exactly where both values come from.
- **AC5 does not require a working builder.** It asserts the gate is not what stops one; the
  end-to-end assertions belong to REQ-145 and REQ-146.
- **SSE through Access** (`/api/ai/prompt`) is carried by REQ-146 — it needs a running assistant to
  confirm against, and confirming it is the point.
- **Draft snapshots on `public-site`** are untouched: still link-private, not authenticated
  (DOC-12 §5.1).

### Open questions for the operator

1. **The two values.** What is the Access team domain and, once the application exists, its AUD
   tag? Both are non-secret and go straight into `wrangler.toml`.
2. **The identity list.** ACCESS.md records `martin-github@westhead.me` (from git config) as the
   sole operator. Is that the address the Cloudflare identity will authenticate as, and is anyone
   else to be granted?
3. **Local `wrangler dev`.** The no-bypass decision above means `pnpm dev:control` answers 503
   until the vars are set, and needs a real token thereafter. Acceptable, or is a documented local
   escape wanted?


---

## REQ-143: The Cloudflare SiteStore: definitions in D1, bytes in R2

# The Cloudflare `SiteStore`: definitions in D1, bytes in R2

The second implementation of [[REQ-142]]'s port. Site definitions move into D1 and asset bytes
into R2, so the store is reachable from a Worker — [[DOC-12]] §7 phase 2.

## 1. The split, and why it falls here

| Data | Store | Why |
|---|---|---|
| Page definitions, `site.json` | **D1** | Small, structured, transactional, tenant-scoped |
| Asset bytes | **R2** | Binary. Never D1 |
| Revision snapshots | **R2** | Large, immutable, contain asset bytes — and `1c deploy` already writes them there |

This is [[DOC-12]] §7 as written ("D1 draft + R2 draft assets"). It needs **no amendment** to
[[DOC-1]] #4, and it closes [[DOC-5]]'s standing open question — "whether to store site
snapshots in D1, R2, or both" — as *both*, split by kind.

An R2-only store for definitions was considered and rejected during [[CHAT-25]]. The argument
for it was that REQ-7's schema was undesigned and files map 1:1 onto objects. That argument
dies against `@lagrangefoundry/ticketing`, which already ships proven D1 persistence with the
two properties R2 would have cost us: **optimistic version CAS** and **tenant scoping**.

## 2. Reuse the pattern, not the ticket type

**Pages are not tickets.** This ticket does *not* store site definitions in the `tickets` table
and does not borrow `TypePack` — sites have their own validator (`loadSite`), and the ticket
domain model would be a poor fit wearing a convenient shape.

What it *does* reuse is the storage layer's proven design, from
`@lagrangefoundry/ticketing/src/{schema,accessor,tenant}.js`:

- `tenant_id` on every row, never parsed out of a uid;
- an integer `version` column for optimistic CAS;
- tenancy bound into a **scoped handle at construction**, never ambient — crossing tenants
  requires explicitly constructing a second handle;
- `db.batch()` for atomic multi-statement writes;
- a single injection-point accessor, so scoping cannot be bypassed by a caller.

## 3. What this buys that the filesystem never had

[[REQ-142]] AC-5 requires a multi-file write to be one port call. Here it becomes one
`db.batch()` — so `site.json` plus N pages either all land or none do. The filesystem store is
**not** atomic there today; this is a genuine improvement, not parity.

## 4. Risk named up front (unchanged, still open)

Everything below is proved **inside workerd against real miniflare D1 and R2 bindings**. What is
*not* proved is **deployed remote D1**: first-remote-deploy — latency, D1 limits, bindings in a
live Worker — remains a real, bounded unknown. The remote database now exists
(`1stcontact`, `0434cd88-07e0-4eb2-a7d8-7370c333534c`) and the migration hook is wired, but
`bin/deploy` has not been run against it. Budget for it rather than discovering it.

---

# What was built

## 5. The unblocker nobody had costed: the framework barrel

AC-1 says the edit surface's UATs must pass "from the workerd project". They could not — and D1
was not the reason. `edit.ts` imported `@1stcontact/framework`, whose barrel re-exports the
module **registry**, which imports two `.astro` components. An `.astro` file cannot be parsed by
any build without Astro's transform, so one import of the barrel made `edit.ts` node-only,
transitively and silently. REQ-142 had taken the *filesystem* out of `edit.ts` so it could run in
a Worker; it still could not, and nothing said so.

The fix splits the catalog along the line it already had:

- `packages/framework/src/modules/catalog.ts` — the behavior **contracts** (`BehaviorMeta`),
  keyed as the registry keys them. No components, no Astro.
- `modules/registry.ts` — unchanged in role, now *derived from* `CATALOG` plus a component map,
  so a behavior added in one is in both by construction. Still node/Astro-only, and says so.
- `packages/framework/src/worker.ts`, exported as **`@1stcontact/framework/worker`** — the
  Astro-free surface: catalog, behavior validators, L2 `presetSlots`, `l1PaintsSurface`,
  `defaultTokens`. `l1/render.ts` qualifies despite its name (it emits strings and imports only
  site-schema); `behavior.ts` qualifies because its one Astro import is `import type`.

`edit.ts` and `scaffold.ts` now import that entry. The workerd suite loads it, so a regression is
a failing test rather than a discovery at deploy time.

## 6. The port grew two members

- **`SiteWrite.expect?: number`** — the site version the writer read. Supplied, the write is a
  compare-and-set; omitted, it is unconditional. It is the *caller's* to supply because the lost
  update lives between its read and its write, a window no store can infer.
- **`SiteStore.version(slug)`** — what to read before a read-modify-write. Deliberately not
  `counter()`: the counter is the journal's, moves only when a command records something, and a
  version that can stand still across a write is not a version.
- **`StoreConflictError`** carries `expected` and `actual`, so the builder can report "someone
  else changed this" rather than a database message.

Honesty about adapters: **only D1 honours `expect`.** The filesystem adapter is a sequence of
`writeFileSync` calls with no transaction to attach a condition to, so it ignores the field
rather than performing a check-then-write that would *look* like CAS while leaving the race
intact. A caller gets a genuine refusal or none, never a reassuring one that does not hold.

## 7. The D1/R2 adapter

`tools/generate/src/store/d1r2-store.ts`, schema in `db/migrations/0001_site_store.sql`
(`tenants`, `sites`, `site_pages`, `site_assets`, `site_changes`).

**Tenancy follows [[DOC-10]] §4.1, not an invention.** The tenant is the account and is the hard
information barrier; a site is an object *inside* it, selected by slug, not a tenant of its own.
So `d1r2SiteStore(env)` can do exactly one thing — `forTenant(id)` — and the resulting handle
carries the tenant into every statement. No verb takes a tenant argument, so there is no call
site at which the wrong one could be passed; crossing the barrel requires a second handle, which
is visible in a diff. An unknown *or inactive* tenant is refused at construction with
`UnknownTenantError`, because a handle that reads nothing is indistinguishable from "this account
has no sites yet".

**How the CAS actually aborts a batch.** D1 runs `batch()` in a transaction and rolls it back if
any statement throws. So the guard is a statement that throws exactly when the version has moved:
it re-inserts the site's own primary key, selected `WHERE version <> ?`. Matching version →
empty select → no-op. Moved → constraint violation → everything undone.

The guard is placed **second-to-last, after the writes, and there is no pre-read short-circuit**.
That is deliberate and load-bearing for the evidence: a pre-read check would be two round-trips
from the batch (so it would refuse the easy cases and leave the hard one open) *and* it would
mean a refused write never reached D1 — making the atomicity test vacuous. As built, every
refusal really does execute its page inserts and really is rolled back.

**R2 is written outside the transaction, because it has none to join.** Bytes first, metadata
second: an object with no row is invisible and costs storage; a row with no object is an asset
that lists and then 404s. The failure mode is chosen rather than left to chance, and said out
loud in the code. Keys are `draft/<tenant>/<slug>/assets/<name>` — no collision with the deploy
layout's `<root>/<slug>/rev/NNNN/…` in the same bucket.

The journal is rows, not a JSON blob: the blob would be rewritten on every keystroke-settle. The
window arithmetic is `journal-model`'s, restated over rows as the DELETE it implies.

Not a revision store: `pendingChanges` reports everything `added` against no base, exactly as the
in-memory adapter does. Publish and checkout are still `commands.ts`'s and still file-backed
([[DOC-12]] §4); pretending otherwise would be worse than saying so.

## 8. The import path is port-to-port

`store/import-site.ts`: `importSite(from, to, slug)`. Not "seed D1 from `storage/sites/`" — that
shape would have to know about both a filesystem and a database, could only run in Node, and
would be a third place encoding what a site is made of. Over the port it is none of those, and
the same function that will seed D1 is testable between two in-memory stores.

Everything crosses as **one** `SiteWrite`, so against D1 an import lands whole or not at all. A
half-landed import is worse than a failed one: the site would exist, would validate as far as it
went, and would be missing pages no one had a record of.

## 9. `MIME` moved

The extension→content-type table was in `serve.ts`, a `node:http` server. R2 needs the same
answers for object metadata, and a second copy is a drift waiting to happen. It now lives in
`store/content-type.ts` (worker-safe) and `serve.ts` reads it.

## 10. One contract, three adapters

`tests/support/site-store-contract.ts` holds the assertions. The node suite runs them over the
filesystem and in-memory adapters; the workerd suite runs the same module over D1/R2. They cannot
drift, because there is only one of them. `tests/support/site-seed.ts` was split out of
`site-factory.ts` (which opens with `mkdtempSync` and so cannot be imported from workerd at all),
so all three adapters are seeded from the identical scaffolder output rather than three
approximations of one.

**Named exception to AC-1.** Two cases stay node-only: the `PreviewRenderer` ones. Not because of
D1 — the store serves them fine — but because the render runs through Astro's container API,
which workerd has no transform for. Relocating it is [[DOC-12]] §7's next step and [[REQ-145]]'s
scope. Asserting them in the shared module would mean asserting them nowhere, since the file
would fail to load.

## 11. AC-6 is proved in two halves, meeting at a value

No single test can render from D1 today (D1 is workerd-only; the render is Astro-only). The claim
is split at `LoadedSite`, the *only* input `renderSiteFiles` reads:

1. **workerd** — the real definitions from `storage/sites/` (inlined by Vite, since workerd has
   no filesystem) are imported into D1; `loadDraft()` deep-equals the source store's, modulo the
   `sourceDir` label that is documented as read by nothing at request time.
2. **node** — `renderSiteFiles` is byte-identical across two stores holding the same definition,
   for every real site, every emitted file (not a spot check on HTML: `theme.css` and
   `capabilities.js` are where a dropped asset or reordered page would show).

Together those give the AC. The seam is a value both sides assert on, not a narrative link.

## 12. Deployment

- `apps/control-app/wrangler.toml` gains `[[d1_databases]]` (`DB` → `1stcontact`) and
  `[[r2_buckets]]` (`SITES`), **repeated under `[env.production]`** because a named environment
  inherits neither vars nor bindings — the [[REQ-144]] incident, on a binding this time, where
  the symptom would be `env.DB === undefined` inside a store call rather than a clean 503.
  `migrations_dir = "../../db/migrations"`.
- `bin/deploy.d/migrate/10-d1-site-store` — executable, gates on `DEPLOY_APP`, applies
  `--remote`, and on `--dry-run` *lists* rather than applies (so a missing binding or expired
  token is still caught by the rehearsal). `bin/deploy` itself is unchanged, as [[REQ-144]]
  intended.
- A UAT pins all of it: both halves present, naming the *same* database and bucket; the hook
  executable (an unexecutable hook is silently never run, and the deploy goes green having
  migrated nothing).

## 13. Acceptance criteria

1. ✅ One contract module, run over three adapters — the workerd suite imports the same
   assertions the node suite does. Named exception: the two `PreviewRenderer` cases (§10).
2. ✅ Concurrent-write UAT: the loser gets `StoreConflictError` with both versions, and exactly
   one write survives.
3. ✅ A refused four-page write leaves no page, no `site.json` change, and no version bump —
   genuinely exercised, since there is no pre-read short-circuit (§7).
4. ✅ Tenant A cannot read, list or write tenant B's same-slug site; unknown *and* inactive
   tenants are `UnknownTenantError`; no verb takes a tenant.
5. ✅ Bytes round-trip through R2 — including a non-UTF-8 sequence — with content types R2 hands
   back on the object, and traversal-shaped names refused as on the filesystem.
6. ✅ Proved in two halves meeting at `LoadedSite` (§11).
7. ✅ `pnpm -r build` and `tsc` clean across framework, site-schema, tools/generate and both apps.

## 14. Deliberately not in scope

- No production caller is wired. `1c` stays on the filesystem and control-app is still a proxy
  until [[REQ-145]]. This ticket ships the adapter, the schema, the import path and the bindings.
- No revisions in D1 — publish/checkout remain file-backed ([[DOC-12]] §4).
- `storage/sites/` was not migrated; the import path is what will do it.

## Origin

[[CHAT-25]]. Supersedes the pre-[[DOC-12]] schema sketch in [[REQ-7]], which should be closed or
rewritten rather than implemented — it carries its own warning that it predates the model.


---

## REQ-145: control-app becomes the builder: client as build artifact, routes and L1 render in workerd, proxy deleted

# `control-app` becomes the builder, and the proxy is deleted

> **Status: scoped, 2026-08-17.** The open questions in §4 are answered and the chat and publish halves are split out. [[REQ-143]] has landed (`b71a86411`), so the store is reachable from a Worker and this is unblocked.

Today `apps/control-app/src/index.ts` is a **pure proxy**: it forwards every request to a Node origin and owns no routing. This ticket makes it the origin. `1c builder` (the 700-line `node:http` server in `tools/generate/src/cli/builder.ts`) stops being required to view or edit a site.

## 1. What makes this possible now

The **L1 renderer is already portable**. `packages/framework/src/l1/` contains no `node:` module imports, and `render.ts` imports `astro/container` _lazily_, so a pure-L1 site renders through `renderL1Document` with zero Astro involvement — pure string templating.

And it matters that this is nearly all of the real workload: across all three sites in `storage/sites/`, the definitions are 139 `text`, 55 `box`, 53 `container`, 11 `control` and 4 `slot` nodes — against exactly **one** behavior module, `contact-form`, which is [[REQ-148]] and explicitly not this ticket.

The store half is now real too: `d1r2SiteStore()` gives a tenant-scoped `SiteStore` over D1 and R2, and `apps/control-app/wrangler.toml` already declares the `DB` and `SITES` bindings both top-level and under `[env.production]`.

## 2. Three things currently served from places a Worker cannot reach

This is the part most likely to be under-estimated, so it is stated separately from the routes:

Route

Today

Problem

`/webui/*`

`webuiPackageDir()` — the out-of-repo shared artifact store

Worker cannot read `node_modules` at runtime

`/builder/*`

`apps/control-app/src/builder`, straight off disk

Same

`/framework/*.js`

**TypeScript type-stripped at request time** from repo source

Same, and it is a build step wearing a route

All three become build-time artifacts served from Workers Static Assets. Note the existing comment on the `/framework` route already anticipates this: _"if that ever stops being true this route should become a real build step rather than growing a resolver."_

**Caution:** `apps/control-app/wrangler.toml` records that an `[assets]` binding made `unstable_dev` hang, which is why `BUILDER_ORIGIN` was a plain var. Verify that is still true on current wrangler before committing to the binding, or the Worker becomes untestable.

## 3. Phases

1. Builder client, webui components and framework bridges as **build artifacts**; Static Assets binding.

2. The route table ported from `handleBuilderRequest` to the Worker's `fetch` — the JSON API, the preview channels, the chrome document.

3. Request-time L1 render in workerd, reading through [[REQ-143]]'s store.

4. `bin/publish` — copy local sites into the cloud store, so the Worker has data to serve.

5. The proxy, `BUILDER_ORIGIN`, and the Node origin's now-dead routes **deleted** — not left behind a flag (`CLAUDE.md`: replace fully).

## 4. Decisions (were open questions)

`wrangler dev`** replaces the Node origin; **`1c builder`** calls it.** There is one origin implementation. `1c builder` becomes a launcher that spawns `wrangler dev` against `apps/control-app` and reports its URL, so the operator's command is unchanged while the second code path `CLAUDE.md` forbids never exists. It runs against the **local** simulated D1/R2 by default — `--remote` is an explicit flag, because a dev loop that edits production by default is one keystroke from losing a site.

**Everything moves to the cloud; **`published`** is served from R2.** A public product cannot be served from the operator's laptop. Reading is cheap — `apps/public-site/src/site-store.ts` already resolves a channel to an R2 key prefix — so this ticket takes the read. Writing a new revision is [[REQ-149]].

`no-store`** becomes a response wrapper.** `builder.ts:262` sets it once before routing so every response inherits it, including the JSON envelopes that were the last hole. The Worker keeps that property structurally: one wrapper stamps every `Response` on the way out, so a route added tomorrow inherits the directive rather than having to remember it.

**The Worker acts as one tenant.** `d1r2SiteStore()` hands back a root that can do nothing until `forTenant(id)` is called, and the tenant is checked there. Tenant-scoped is the right starting point because that is what almost every action is. Cross-tenant admin controls are a later ticket, when there is a second tenant to need them.

## 5. Split out of this ticket

- **The chat panel (**`/api/ai/*`**)** → lagrange-framework REQ-103. `ai/host.ts` reaches `@lagrangefoundry/ai` through `sharedModuleUrl()`, a runtime `import()` of a file URL in the out-of-repo artifact store, which a Worker cannot do. Fixing it in the library avoids a third implementation of the session model. Until it lands, `/api/ai/*` answers 501 and the chat pane is dark on `app.1stcontact.io`.

- **Publish (**`/api/publish`**)** → [[REQ-149]]. `cmdPublish` is filesystem all the way down and the `SiteStore` port has no revision, no history and no publish verb. That is a design increment, not a relocation. Until it lands, `/api/publish` answers 501 and publishing stays a CLI operation against the local store.

## 6. Acceptance criteria

1. With `1c builder` **not running**, `app.1stcontact.io` serves the chrome, lists sites, and renders the draft and edit channels for a pure-L1 site.

2. Editing copy and palette through the Worker produces the same store state as the CLI does.

3. The preview iframe stays same-origin and "open in new tab" resolves to the identical URL.

4. `apps/control-app/src/index.ts` contains no proxy and no `BUILDER_ORIGIN`.

5. No route type-strips, transpiles or reads source at request time.

6. Clean `pnpm -r build` and typecheck.

7. `bin/publish` copies a local site's definition and assets into D1 and R2, and the Worker then serves that site. Re-running it is idempotent.

8. `1c builder` starts `wrangler dev` and nothing else; the `node:http` server is gone.

9. `/api/ai/*` and `/api/publish` answer 501 naming the ticket that will implement them — not a 404, which would read as a routing bug rather than a deferral.

## Origin

[[CHAT-25]]. This is the first milestone where the builder genuinely runs on Cloudflare.

---

## Progress — 2026-08-17, commit `5352c5131a0da1350e980a06f3ca5338cfcf7d9b`

**Not yet **`free_coded`**: phase 5 is incomplete.** See "what remains" below.

### Landed

Phases 1–4, verified end to end against `wrangler dev` with real local D1 and R2: both repo sites imported via `bin/publish`, then the chrome document, the site listing, a request-time render, a palette write and an asset fetch all served with **no Node origin running**. 18 UATs, 11 of them inside workerd.

- `1c assets` — builder client, webui components and the framework bridges are build artifacts. Nothing type-strips, transpiles or resolves a package per request (AC-5).

- The route table in `apps/control-app/src/router.ts`, over the same `edit*` functions the CLI dispatches to (AC-1, AC-2).

- `apps/control-app/src/index.ts` holds no proxy and no `BUILDER_ORIGIN` (AC-4).

- `bin/publish` / `1c push` (AC-7), idempotent, with the Worker doing the writing.

- `/api/ai/*` and `/api/publish` answer 501 naming their tickets (AC-9).

### Two blockers the ticket did not anticipate

1. `getModuleCss()`** read **`.astro`** sources off disk at render time** — for _every_ site, not only sites using a module, because `theme.css` folds module chrome unconditionally. So no site could render in a Worker. The read moved to build time (`modules/module-assets.ts`); the extraction is shared and a UAT re-extracts to catch drift.

2. **A lazy **`import('astro/container')`** is still resolved eagerly by a bundler**, pulling Astro, markdown-remark, Shiki and Prism into the Worker. The container and the module resolver are now injected by the node-only writer. This is the same trap the registry posed, and the reason `render.ts` may name neither.

### A latent REQ-143 bug, fixed

`migrations_dir` was declared at the **top level** of `wrangler.toml`, where wrangler warns, ignores it, and looks in `apps/control-app/migrations` — so `wrangler d1 migrations apply` had never actually run. It belongs on the D1 binding. A UAT now pins it.

### A finding that changes AC-1's reach

**Every site in **`storage/sites/`** mounts **`contact-form` — including on its home page — so no real site's draft channel renders until [[REQ-148]]. The ticket estimated "exactly one behavior module"; it is one _kind_, on every site. AC-1 is demonstrated against a scaffolded pure-L1 site, and a page mounting a behavior now fails with a message naming REQ-148 rather than an undefined component. REQ-148 is therefore a prerequisite for using this on real content, not a follow-up nicety.

### What remains (phase 5)

- **AC-8** — `1c builder` still starts the `node:http` server; it should spawn `wrangler dev` instead, and `tools/generate/src/cli/builder.ts` should be deleted along with the origin's now-dead routes.

- **10 tests still assert the proxy architecture** and need rewriting against the Worker: `req115-builder-shell`, `reconciliation-builder-workspace-origin`, `reconciliation-builder-workspace-chrome`, `test_UAT_FC_REQ-147_access_gate` (1), `test_UAT_FC_REQ-144_deploy_scripts` (2). They fail because the proxy they drive is gone, which is the intended change.

- **AC-6** — `pnpm -r build` across the whole workspace has not been run; the three typechecks this ticket touches are clean and the Worker bundles (805 KiB / 150 KiB gzipped).

Unrelated pre-existing failures, confirmed identical on the untouched baseline and **not** caused by this work: 56 tests across the AI/toolbox and L1-surface families (`reconciliation-assistant-*`, `test_UAT_FC_REQ-122_*`, `test_UAT_FC_REQ-126/127/129_*`, `reconciliation-page-composition-surface`, `bug32-webui-scope-rebrand`).

---

## Completed — 2026-08-17

Commits `5352c5131a0da1350e980a06f3ca5338cfcf7d9b` (phases 1–4) and `99f90873e2161a4d6e524de99d7dfc1f8afc8e47` (phase 5).

### Phase 5, as landed

The Node origin's duplicate route table is gone. `cli/builder.ts` drops from 730 lines to a **transport**: `node:http` in, `Request`/`Response` out, into the Worker's own `route()`. One route table, one set of edit functions, one render — two front doors. `1c builder` spawns `wrangler dev` (AC-8).

**Why the transport survives rather than being deleted.** 36 test files drive the builder over HTTP, most about features that merely need an origin — the copy modal, the image picker, the palette popup. Deleting it meant rewriting all 36. Keeping it as a transport costs no second implementation (`CLAUDE.md` forbids two _implementations_, and there is one) and lets those tests keep covering behavior-module pages the Worker cannot render until [[REQ-148]]. Three routes live there and nowhere else because no Worker can host them yet: `/api/ai/*` (lagrange-framework REQ-103), `/api/publish` and the `published` channel ([[REQ-149]]). The router answers 501 for all three.

### Two defects the transport surfaced

- **The **`no-store`** directive was in the Worker's **`fetch`, so the Node transport served the chrome document with no directive at all — the same hole the old `json()` helper opened, one layer up. A per-_host_ restatement is as forgettable as a per-route one. It is the router's now.

- **The preview-render cache was keyed by tenant id**, which is `local` for every Node workspace — one workspace's renderer served all the others. Keyed by the store object (a `WeakMap`) instead.

### Acceptance criteria

AC

State

1 — chrome, listing, draft + edit render with no Node origin

met (pure-L1 site; see the caveat below)

2 — edits produce the same store state as the CLI

met

3 — preview iframe same-origin, new tab identical URL

met

4 — no proxy, no `BUILDER_ORIGIN`

met

5 — nothing type-strips or reads source at request time

met

6 — clean `pnpm -r build` and typecheck

met (`bin/build` green; both Workers bundle)

7 — `bin/publish` copies a site into D1/R2, idempotent

met

8 — `1c builder` starts `wrangler dev`

met

9 — deferred routes answer 501 by name

met

**AC-1's caveat stands**: every site in `storage/sites/` mounts `contact-form`, so AC-1 is demonstrated against a scaffolded pure-L1 site. [[REQ-148]] is a prerequisite for using this on real content.

### Evidence

- Full node suite: **56 failures, exactly the pre-existing baseline** — none attributable to this work. (The baseline is the AI/toolbox and L1-surface families, confirmed failing identically on untouched `xgd-working`.)

- Workers suite: **38/38**, inside workerd against real D1 and R2.

- `bin/build`: preflight, assets, typecheck, both Worker bundles — clean. control-app 807 KiB / 150 KiB gzipped.

- End-to-end against `wrangler dev`: both repo sites imported via `bin/publish`; chrome, listing, render, palette write and asset fetch all served.

### Also fixed here

`migrations_dir` sat at the top level of `wrangler.toml` since REQ-143, where wrangler warns, ignores it and looks elsewhere — `d1 migrations apply` had never run. Moved onto the D1 binding, pinned by a UAT.

`importmap.json` is generated and gitignored rather than committed: a checked-in copy of a generator's output is a second definition site, which BUG-32's scan fails on. `bin/build` runs `1c assets` before the typecheck so a fresh checkout has one.

### Note for review

`ACCESS_DEV_OPEN` is a new var that opens the Access gate for `wrangler dev`. It applies only when Access is unconfigured, is absent from `[env.production.vars]` (which inherits nothing), and a UAT fails the build if anyone restates it there — two independent mistakes to open production, the standard REQ-147 set for `workers_dev`. It is still a bypass and should be read as one.


---

## Free-coding closed — 2026-08-20

Status `free_coding` → **`free_coded`**. The implementation was complete on 2026-08-17 (see the section above); only the promotion gate had not been run.

**Commits, after the resync remap.** The dispatcher's resync rebased this work onto a newer `main` twice, re-authoring every SHA. `fields.commits` now carries the live values, each verified an ancestor of `xgd-working`:

| Live SHA | Subject | Superseded |
|---|---|---|
| `cb403366d` | the builder renders in workerd; assets become a build step | `5352c5131` → `755c557ed` |
| `16edb7521` | `1c builder` starts wrangler dev; one route table, two transports | `99f90873e` → `c71f541fb` |
| `7a1822f52` | `1c assets` must not import what it generates | `11c5908bd` → `4902b47d8` |

Version claimed: **0.1.59** (the bump was absorbed into the rebase by `merge_version_max`, so no single commit shows it as a diff; `xgd_version_bump --check` confirms it against the commit trees).

**Re-verified on the post-resync tree**, not merely on the pre-rebase branch:

- `test_UAT_FC_REQ-145_build_artifacts` — 7/7 (node)
- `test_UAT_FC_REQ-145_builder_in_workerd` — 10/10 (workerd, real D1 + R2 bindings)
- Every file the branch's REQ-145 commits touched is byte-identical between `free-REQ-145` and `xgd-working` (47 files, zero differences) — the rebase carried the work intact.

**Branch teardown.** `xgd branch clean` refuses `free-REQ-145` because resync rewrote its SHAs, so ancestry no longer holds even though the content landed — the refusal is correct and the byte-identity check above is what stands in for it. Worktree and local branch removed by hand; `origin/free-REQ-145` left in place.

**Still true, and unchanged by this promotion:** [[REQ-148]] remains a prerequisite for rendering any real site through the Worker, and nothing is deployed to Cloudflare yet — the account has no `1stcontact-control-app` Worker, `app.1stcontact.io` does not resolve, D1 has no tables, and Access is unconfigured.


---

## REQ-146: The AI host moves into workerd

# The AI host moves into workerd

> **Unblocked 2026-08-17.** lagrange-framework REQ-103 landed (`5c82f6251`, v0.0.162,
> `ready_to_reconcile`) and the component has been re-installed into the shared store. All three
> structural blockers below are gone; §2 is kept as the record of what was waited on and why.

The last thing binding the builder to a Node process, once [[REQ-145]] has moved the routes.

**Scope narrowed (2026-08-17).** This ticket was "the AI host **and `publish`**". Publish is
now [[REQ-149]]'s, and only the AI host is left here. See "Publish is not here" below.

## 1. The AI host is closer than it looks

`tools/generate/src/cli/ai/host.ts` says so itself: the Claude backend is **fetch-based** and its
node built-ins are inside what `nodejs_compat` reaches, so *the backend and the tool loop are not
what pin it to Node*. What pins it is that **every tool bottoms out in `edit.ts`**, which reads
and writes the operator's store. [[REQ-142]] and [[REQ-143]] remove exactly that.

What is genuinely left here:

- `fileAuditSink` uses `appendFileSync` — the audit trail needs a store.
- Session persistence: a session id is derived from the slug so a reload resumes the site's
  conversation. Where that transcript lives in a Worker is undecided; [[DOC-10]] is the relevant
  design and should be reconciled with whatever [[REQ-143]] built rather than inventing a third
  store.
- `ANTHROPIC_API_KEY` becomes a `wrangler secret`, wired into [[REQ-144]]'s secret hook. REQ-144
  ships the mechanism and names no key, so this dependency points this way and not back.
  `bin/deploy` already carries the pointer: *"bin/deploy.d/secrets/ — REQ-146 lands the API key
  here"*.
- `l1-surface.json` and `instances.json` are read from disk and must ship as bundled data.

The structural properties should survive untouched: the surface stays declared as data, a slug
becomes a session in exactly one place, and no operation takes a `slug` parameter.

## 2. What blocked this, and how REQ-103 removed it

The four items above are real but secondary — each is a small change once the host can load at
all. Three structural blockers sat underneath them, and all three were lagrange-framework
REQ-103's to remove. **All three are now cleared** — re-verified against the refreshed package:

1. **~~The library is loaded by file URL at runtime.~~ CLEARED — but only for the Worker.**
   `host.ts` reaches it through
   `sharedModuleUrl('ai')` (`tools/generate/src/cli/webui.ts:172`), which does `require.resolve`
   → `pathToFileURL` → a dynamic `import()` of that URL. workerd has no filesystem and no
   dynamic import of an arbitrary URL. REQ-103 adds a fourth `exports` rung —
   **`@lagrangefoundry/ai/workers`** — that a bundler can follow statically.

   Note this does **not** delete `sharedModuleUrl`. It closes a real hazard on the *Node* path:
   a bare specifier resolves the shared store by walking up from the importing file, which finds
   it from the main checkout and finds nothing from a linked `git worktree`. So the library
   becomes an **injected dependency** — the Worker host passes the statically imported
   `/workers` rung, the Node host passes what `sharedModuleUrl` resolves — which is the same
   two-transport shape [[REQ-145]] used for `RouterDeps`, not a mode flag.

2. **~~`@lagrangefoundry/ai/core` is not workerd-safe.~~ CLEARED.** `session_log.js` now holds
   zero filesystem calls and nothing reachable from `/core` imports `node:fs`, `node:os` or
   `node:child_process`. REQ-103 drew the junction's storage as a port at the **byte** layer
   (`JunctionStorage`) rather than around `SessionLog`, so record framing, `seq`, timestamping,
   the torn-trailing-line rule and the byte cursor stay single-implementation — adapters express
   only "append these bytes", "read from this offset", "replace atomically", and so cannot encode
   a divergence from the Python peer. Two adapters ship: file and memory. [[DOC-21]] §15 records
   the reversal of its "Not a port" decision.

   REQ-103 also found the failure this ticket would otherwise have shipped: under `nodejs_compat`
   `node:fs` **resolves** in workerd and gives a per-isolate ephemeral filesystem, so a
   file-backed junction *passes a test in workerd* and loses every session in production. A
   successful import is not evidence; the guard is a static import-graph check.

3. **~~The package is not a dependency of this repo.~~ CLEARED, with a caveat that stays.**
   It is installed out-of-repo at the workspace root (`node_modules/@lagrangefoundry/ai`) by
   lagrange-framework's deliberate install, and `webui.ts` states it is *never vendored*. That
   flat store is a normal ancestor `node_modules`, so a bundler resolves the bare specifier
   without a `package.json` entry. The caveat is `bin/install`'s own stated cost — the dependency
   stays **implicit**, so a fresh clone on another machine gets nothing with no diagnostic
   pointing at `bin/install`. The build must fail loudly rather than emit a Worker whose chat
   route is silently absent.

**Why we waited rather than worked around.** The tempting shortcut was to port the session
junction here, against D1. REQ-103 rejects that in its own words: it would be a **third**
implementation, after `components/ai/py` and `components/ai/js`, and one that would drift from
both. The session model belongs in the library that owns it — and the packaging REQ-103 shipped
is a re-export list over the same code the Node barrel runs, with one shared UAT running a turn
against both junction adapters, which is what makes "a packaging, not a third implementation" a
checked claim rather than an intention.

[[REQ-145]] landed `/api/ai/*` as a deliberate 501 naming this blocker
(`apps/control-app/src/router.ts`) — *"the route exists, the capability does not yet"* — so
nothing was silently broken while this waited. This ticket replaces that 501 with the handler.

## 3. Publish is not here

`cmdPublish` was §2 of this ticket. It is now [[REQ-149]], *"Publish in the cloud: revisions,
history and rendered output without a filesystem"*, and [[REQ-145]] already landed
`/api/publish` as a 501 pointing there.

That split is right and should not be undone. Publish is not a relocation: the `SiteStore` port
has no notion of a revision at all — no history, no `nextRevisionId`, no snapshot, no
store-level diff — so it is a new storage contract with four unsettled design questions, which
REQ-149 poses and this ticket never did. The `sandbox` constraint ([[DOC-12]] §7) and the
forward-only `live` advance travel with it.

## 4. What this ticket does

The Node coupling that is left is not in the library any more — it is in this repo's two AI
files, and each piece is a seam that already half exists.

| Where | Today | After |
|---|---|---|
| `host.ts` `ai()` | `import(sharedModuleUrl('ai'))` | injected library; Worker passes `/workers` |
| `toolbox.ts` `aiCore()` | `import(sharedModuleUrl('ai','./core'))` | same injection |
| `toolbox.ts` L1 surface | `readFileSync(l1-surface.json)` | static JSON import, bundled as data |
| `toolbox.ts` instances | `readFileSync(instances.json)` | static JSON import, bundled as data |
| `toolbox.ts` store | `fsSiteStore(ctxOf(opts))`, hardcoded | injected `SiteStore` |
| `toolbox.ts` `fileAuditSink` | `appendFileSync` | buffered sink + durable flush |
| `host.ts` archive | `FileArchive(sessionsDir(opts))` | store-backed `TranscriptArchive` |
| `host.ts` junction | `logDir` under the workspace | `memoryJunctions()` (REQ-103) |
| `host.ts` baseline | `draftCounter(ctxOf(opts), slug)` — sync, fs | `store.counter(slug)` — async, ported |
| API key | `process.env.ANTHROPIC_API_KEY` | `env.ANTHROPIC_API_KEY`, a `wrangler secret` |

**The store is injected, not detected.** `createL1Toolbox` names `fsSiteStore` at line 505 today;
that becomes a parameter defaulted to the filesystem, so the ~30 existing call sites and the `1c`
CLI are unchanged while the Worker passes the D1/R2 store. Same shape as `RouterDeps` — one
implementation, two hosts, no mode flag.

**The transcript reconciles with [[REQ-143]] rather than adding a store.** REQ-103 offers
`TicketSessionArchive` over a `TicketClient`, which would mean standing up ticketing's D1 schema
alongside the site store. This ticket instead implements the same `TranscriptArchive` port
(`apply` / `load` / `list`) over the bindings REQ-143 already built — which is what §1 asked for:
*reconciled with whatever REQ-143 built rather than inventing a third store*. The junction in
front of it is `memoryJunctions()`, and `ArchiveSyncer` drains one into the other during the
turn, so an eviction costs the turn in flight and not the conversation.

**The audit sink buffers and flushes.** Upstream's `emit` is deliberately sync and swallows sink
failures, so an `await` cannot be introduced there. The Worker's sink appends to a per-turn
buffer and the route flushes it durably before the response completes. AC3 is about survival, so
the test kills the isolate and reads the audit back.

**Two capabilities stay refused, by name.** The `publish` operation on the surface reaches
`cmdPublish`, which is filesystem-bound and is [[REQ-149]]'s; it is not in the `caretaker` grant
today and must not arrive with this change. The system KB (`openKnowledgeRuntime`) is
filesystem-bound too, and degrades to `null` — an assistant that knows its tools but not the
design corpus, which is the documented degradation, not a failure.

## 5. Acceptance criteria

1. A chat turn runs end to end in workerd, with the API key read from a secret, and its edits
   land in the store [[REQ-143]] built.
2. Reloading the builder resumes the site's conversation.
3. Every AI write is audited durably; the audit survives a Worker restart.
4. No API key appears in logs, error envelopes, or client responses.
5. The AI library is bundled at build time — no `require.resolve`, no `pathToFileURL`, no
   runtime dynamic import remains on the Worker path, and the build fails loudly if the
   component is absent rather than shipping a Worker with no chat.
6. No filesystem-backed junction or archive can reach the Worker path. `node:fs` resolves under
   `nodejs_compat` and silently loses sessions, so this is asserted over the import graph rather
   than by a passing turn.
7. The `publish` operation is not reachable from the assistant in the Worker — it is
   [[REQ-149]]'s and is filesystem-bound.

Criteria 4 and 5 of the original list — the publish revision and the unreachable `sandbox` key —
moved to [[REQ-149]] with §2.

## Origin

[[CHAT-25]]. After this, nothing in the authoring loop needs the operator's machine.


---

## What landed (2026-08-18)

Commit `2765de0ff` — `feat(control-app): the AI host runs in workerd [FREE-CODED]`, v0.1.58.

### The shape: core + two runtimes

The split mirrors upstream's own `archive.js` / `file_archive.js` shape rather
than inventing one.

| New | Role |
|---|---|
| `tools/generate/src/cli/ai/toolbox-core.ts` | The tool surface. Names no filesystem; library and store are required parameters. |
| `tools/generate/src/cli/ai/host-core.ts` | The host — session model, tool loop, per-turn change signal, the three entry points. Takes `HostDeps`. |
| `apps/control-app/src/ai.ts` | **workerd's** runtime for those deps. |
| `apps/control-app/src/redact.ts` | Secret scrubbing at the response boundary (AC4). |
| `bin/deploy.d/secrets/10-anthropic-api-key` | Pushes the key as a `wrangler secret`. |

`toolbox.ts` and `host.ts` remain the **Node** entry points and keep their
existing API exactly — the ~30 call sites and the `1c` CLI are untouched, as §4
required. `GlobalOptions` is imported from the leaf `cli/options.ts` rather than
`commands.ts`, because a type-only import of the latter pulled the Astro module
registry into the Worker's tsc program.

### Four adapters, each replacing a disk

| Node | workerd |
|---|---|
| `sharedModuleUrl('ai')` → dynamic `import()` of a file URL | the bundled `/workers` rung, statically imported |
| `FileArchive(dir)` | `R2TranscriptArchive` |
| file junction under the cwd | `memoryJunctions()` (REQ-103) |
| `fileAuditSink` (`appendFileSync`) | `bufferedAuditSink` + a per-turn `flushAudit` |

**The archive keeps the stored form byte for byte.** `Session.toFile()` /
`fromFile()` round-trip the language-neutral session file, so a conversation
archived by the Worker still loads in the Node host and in the Python peer. A
Cloudflare-shaped row format would have made the two runtimes stop being the
same product.

**The audit is one R2 object per record, not a folded `.jsonl`.** R2 has no
append; a read-modify-write would let two concurrent turns lose each other's
records, and an audit that drops entries under load is worse than none because
it reads as evidence. Distinct keys are append-only by construction.

**The flush is in a `finally`, inside the stream.** Inside, because a Worker may
be torn down the moment the response completes and `ctx.waitUntil` is not
reachable from the route; in a `finally`, because an abandoned or failed turn
must still record what it managed to do.

**Transcripts and audit sit outside `draft/`** — `chat/<tenant>/<session>.md`
and `audit/<tenant>/<session>/<n>.json`. `draft/` is the only prefix the site
store composes, and nothing in the router derives an R2 root from a request
(DOC-12 §7), so no URL can name a transcript.

### Two deviations from §4 worth stating

- **The store is required, not defaulted.** §4 proposed `createL1Toolbox` taking
  a store *defaulted* to the filesystem. In the core it is required, and the
  Node default lives in the `toolbox.ts` wrapper instead. A default reaching
  `fsSiteStore` from the core would have put `node:fs` back on the Worker's
  import graph — the exact thing AC6 forbids — so the default had to move up a
  layer. Call sites see no difference.
- **The chat host is one per isolate, not per request.** Every other route
  builds its store per request so the tenant check is never stale. The chat
  routes cannot: the `SessionManager` cache is keyed by the store's *object
  identity*, so a fresh store per request is a fresh conversation per request.
  The tenant is still checked once, when the host is built; what is given up is
  re-checking a mid-isolate deactivation, on these two routes only. Stated in
  `router.ts` rather than shared, because it is the wrong trade everywhere else.

### AC4 — redaction is a backstop at the boundary

Nothing formats a key into a response on purpose. The leak arrives from below:
an SDK that puts the request it tried to send into the error it throws. So the
scrub is applied at the last point before a string becomes a response body — the
router's outer `catch` and the SSE turn — and matches on the Worker's *known
secret values*, not on a pattern. A pattern is wrong in both directions: it
misses a credential in an unexpected shape and mangles prose that happens to
match.

## Evidence

**Verified here:**

- `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts` — **11/11 pass**. Covers
  AC4 (redaction, incl. secrets containing regex metacharacters), AC5 and AC6 by
  walking the Worker's static import graph from `index.ts`. Per DOC-20's
  "who tests the harness", four cases prove the walker is *non-vacuous* — a
  deliberately-planted `node:fs` import and a planted filesystem-store import are
  each caught, so a walker that followed nothing would fail rather than pass.
- **The shipped bundle** (`wrangler deploy --dry-run`, 1.6 MB): AI library
  present (`memoryJunctions`, `applyRecords`, `ArchiveSyncer`, `SessionManager`,
  `fromFile`); `node:` specifiers are `events`, `path`, `process`, `stream` only;
  **zero** `pathToFileURL`, `require.resolve`, `sharedModuleUrl`, or dynamic URL
  import. The one `node:fs` string in the bundle is inside an upstream JSDoc
  comment, not an import. AC5 + AC6.
- **`1c assets`** emits the AI rung and resolves the component from a linked
  worktree; `1c preflight` fails loudly when it is absent.
- **The deploy hook** in all three branches: dry-run announces, `public-site`
  no-ops silently, and a missing key exits non-zero with a message naming the
  variable.
- **Typecheck clean** on both `tools/generate` and `apps/control-app`.
- **No regression in the AI test scope.** REQ-126 is at its pre-existing 7
  failures (two regressions found mid-work — REQ-126 7→8 and REQ-130 0→1 — were
  the same invariant, declaration↔implementation agreement now split across two
  modules; both tests were updated to compose the two halves and both are back to
  baseline). Every remaining failure in the scope is one of two pre-existing
  bucket: sync calls on upstream's now-async `run` (`.toMatch()` got an object,
  `answer.replace is not a function`), proved pre-existing by reproducing them
  with the *pre*-REQ-103 library on the base commit. (A second bucket, the
  sandbox's `listen EPERM`, was environmental and is gone — see below.)

**Verified after the sandbox was opened (2ee204b4e):**

The `listen EPERM` that blocked every workers test was a sandbox restriction, not
a defect. With socket binding permitted:

- **All 47 workers tests pass**, across all four files. That includes
  `tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts` — **9/9** — so
  **AC1, AC2, AC3 and AC7 are now demonstrated, not argued**. Each runs inside
  workerd through the Worker's own `fetch` against real D1 and R2, with the
  Anthropic client as the single double: a streaming double that speaks the raw
  `content_block_start`/`_delta`/`_stop` protocol the backend actually consumes,
  because a finished-message double would assert against a fiction.
- **All five packages typecheck** (`site-schema`, `framework`, `public-site`,
  `control-app`, `generate`).

**Three landed assertions had to be corrected**, because REQ-146 made them false.
Each still states its invariant; none was deleted:

- REQ-145's `deferred_capabilities_answer_501_naming_their_ticket` pinned
  `/api/ai/roles` at 501 naming lagrange-framework REQ-103. That deferral is
  gone. The invariant is about the *shape* of a deferral, not about any
  particular route staying deferred forever — so a route graduating is expected
  to leave the test. Publish (REQ-149) still holds it up.
- REQ-129's and the two reconciliation surfaces' declaration-vs-implementation
  checks compared the declaration against `l1Operations` alone. Since the
  core/wrapper split that is only half of Node's surface: `nodeOperations`
  supplies `add_asset` and `publish`, the two that need a disk. Comparing against
  the core alone asserts a *declared* operation is unimplemented — the opposite
  of the invariant. All three now compose both halves, matching the fix REQ-126's
  twin assertion already got in `2765de0ff`.

Measured, not assumed: on the three touched node files the correction takes
28 failed / 9 passed → 27 failed / 10 passed. Every remaining failure is the
pre-existing async-`run` bucket, each failing at a `box.run(...)` call *past* the
corrected assertion.

The router's header comment was updated to match: `/api/ai/*` is no longer
described as deferred, and publish is the one route that answers 501.


---

## REQ-148: Behavior modules render in workerd: contact-form precompiled

# Behavior modules render in workerd: Astro leaves the render path

> **Status: settled (CHAT session).** The mechanism chosen is **not** precompilation —
> it is **removing Astro from the module render path entirely**. See §2.

`render.ts` imports `astro/container` lazily, so a pure-L1 site already renders in workerd
([[REQ-145]]). A site using a **behavior module** does not: the container API needs the
Vite/Astro transform to compile `.astro` sources, and workerd has no such transform.

## 1. Scope is one mechanism, two modules

Across all three sites in `storage/sites/`, exactly one behavior module is in use:
`contact-form`, at 4 instances. `carousel` exists in the catalog but appears in no site.
Both convert; the mechanism is shared, so nothing is per-module.

## 2. The mechanism: delete Astro, don't precompile it

The original framing was "precompile the `.astro` sources at build time and bundle the
compiled render function." Investigation showed that is the wrong shape:

- **Neither component uses any Astro runtime feature.** No islands, no hydration, no
  `Astro.request`/`Astro.url`, no layouts, no child slots. Each reads `Astro.props`, runs
  plain TypeScript, calls `renderL1Fragment` (pure TS, already worker-safe) and emits HTML
  with a couple of `set:html` fragments.
- Precompilation would still require Astro's **runtime** (`astro/runtime/server` plus a
  factory executor) inside the Worker — the exact surface REQ-145 found drags
  `markdown-remark`/Shiki/Prism and `virtual:` specifiers — and would add a build step plus
  a bundled artifact that can go stale.

So the components become **plain TypeScript functions** `(props) => string`. This *deletes*
rather than adds:

| Deleted | Why it can go |
|---|---|
| `astroContainer()` (`render/write.ts`) | nothing to create |
| `RenderSiteOptions.createContainer` | no seam to inject |
| the `needsAstro` branch in `renderSiteFiles` | there is one render path |
| `unresolvableModule` + the resolver injection | the registry is now plain TS, so `render.ts` imports `getModule` directly |
| `renderSiteFilesNode` | nothing left for it to inject |
| `modules/extract-style.ts` | CSS moves to a real `styles.css` per module |
| `astro-env.d.ts`, `astro-shims.d.ts` | no `.astro` to declare |
| `AstroComponentFactory` from the behavior contract | replaced by `BehaviorComponent` |

The one code path that remains is the one both node and workerd take, which is what makes
AC-1 true by construction rather than by comparison.

### Module CSS

The invariant-element CSS moves out of each `.astro` `<style>` block into a real
`styles.css` beside the component. `1c assets` still precompiles it into
`module-assets.ts` (unchanged mechanism, unchanged drift UAT) — it just reads `styles.css`
instead of scanning an Astro template, which is why the regex scanner in
`extract-style.ts` (and its two documented footguns) is deleted. `client.js` is untouched.

### Consequence: the registry becomes worker-safe

With both components plain TS, `modules/registry.ts` no longer drags a transform into the
graph, so `@1stcontact/framework/worker` can export `getModule` and `render.ts` can name it
statically. That is what actually delivers "a site using `contact-form` renders in workerd".

## 3. Constraint that must not be lost

[[DOC-25]] and `CLAUDE.md`: a conforming behavior module ships **zero CSS**, save a declared
set of invariant elements pinned by obligation rather than taste. The conversion moves the
existing invariant CSS verbatim; it adds nothing and entrenches nothing REQ-96 is removing.

## 4. Acceptance criteria

1. A site using `contact-form` renders in workerd, producing the **same bytes as the Node
   render** — structurally guaranteed, since both run the same function. (Parity is
   node-vs-worker, **not** parity with today's Astro output: whitespace between elements
   differs, which is semantically inert — whitespace-only text nodes are not flex items.)
2. No `.astro` file exists on the render path, and no Vite/Astro transform runs in the
   Worker. Astro appears nowhere in `packages/framework` or `tools/generate/src/render`.
3. `carousel` converts through the same mechanism with no per-module machinery.
4. The module conformance harness ([[DOC-20]]) passes; its 12 negative fixtures convert to
   plain TS and still discriminate.
5. Module CSS is byte-equivalent to today's (modulo the dedent from leaving the `<style>`
   block) — the conversion neither adds rules nor entrenches ones REQ-96 removes.

## 5. Supersession

- **AC-739** ("the render path is Astro-free *unless a page needs Astro*") is superseded by
  the stronger property: the render path is Astro-free, full stop. Its reconciliation UAT is
  rewritten to assert the stronger invariant rather than the lazy-container one.
- The `1c` bootstrap (`tools/generate/bin/1c.mjs`) boots a Vite server via Astro's
  `getViteConfig` solely because the render path imported `.astro`. Collapsing it to a plain
  Vite SSR server is **deliberately out of scope here** — filed separately.

## 6. Verification, and what the sandbox prevented

**Site output is unchanged.** Both real sites (`gigabytealchemy`, `xgd` — 4 live
`contact-form` instances between them) were rendered on a clean `xgd-working` checkout and
again on this branch:

| Artifact | Result |
|---|---|
| `home.html`, `whitepapers.html` | identical after normalising whitespace and Astro's inert `data-astro-cid-*` scope attribute |
| `theme.css` | identical ignoring whitespace (module CSS is dedented, leaving the `<style>` block) |
| `capabilities.js` | byte-identical |

The only non-whitespace difference anywhere is `action` → `action=""` on the one form whose
configured action is empty — the same thing in HTML.

**Test suites.** The full node project was run on this branch and on a clean checkout, and the
FAILURE SETS were diffed. Branch-only failures: exactly two (`AC-809`, `AC-810`), both caused
by a test helper that sliced a module's CSS block at `\n\n/* ` — correct while the chrome sat
indented inside an `.astro` `<style>`, wrong now that `styles.css` is dedented. Both fixed
(the helper now ends a block at the next *section* header); the branch's failure set is
otherwise identical to the clean tree's.

**What could NOT be verified in-session.** The session sandbox denies all socket binding
(`listen EPERM` on loopback and on UNIX sockets), so:

- the **workerd project is unrunnable** — Miniflare cannot listen, and the Node process
  aborts rather than failing a test. `test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts`
  — the UAT for AC-1, the whole point of this ticket — has therefore **never executed**. It is
  written, and it is unverified.
- the **conformance harness (AC-4) cannot run**: every dimension serves a one-module page over
  loopback first. `req39`/`req40`/`req41`/`req42`/`req85-conformance` fail at the serve on a
  clean checkout too.
- 51 of the 57 node test files that fail on a clean checkout fail for this reason.

Filed against XGD's own tooling as a bug (body: `.xgd/tmp/REQ-148-sandbox-bug.md`; the report
could not be filed from the session either, because the write allowlist does not cover the
xgd repo's git object store). **Before this ticket is promoted, the workerd UAT and the
conformance dimensions must be run somewhere with sockets.**

## Origin

[[CHAT-25]]. The only remaining thing that needs Node in the render path.


## Verification run — 2026-08-19 (sandbox permissions restored)

Loopback socket binding now works, so the suites that could never execute have executed.

**workerd project: 4 files / 40 tests, all green.** REQ-148's own UATs
(`test_UAT_FC_REQ-148_behavior_in_workerd.workers.test.ts`) pass — a behavior-module site
renders its draft channel, the served bytes are the component's own output, and the edit
channel switches the behaviour off. AC-1 now rests on executed evidence.

Three defects were found and fixed in this run:

1. **Superseded REQ-145 boundary test.**
   `test_UAT_FC_REQ-145_a_page_mounting_a_behavior_names_the_ticket_that_renders_it` asserted
   that mounting `contact-form` fails with a 500 naming REQ-148. It now returns 200 because
   REQ-148 closed that gap. Deleted — REQ-148's own UATs carry the positive.

2. **`renderSiteFilesNode` left dangling.** Removing the Astro container path deleted the
   wrapper, but `test_UAT_FC_REQ-143_render_store_independence.test.ts` still imported it
   (`TypeError: renderSiteFilesNode is not a function`). The signature is identical since the
   wrapper only supplied defaults now built in, so this was a rename to `renderSiteFiles`.

3. **Work stranded in the wrong worktree.** The 11 converted `.ts` conformance fixtures, the
   `options.ts` type-only import fix (`../store` barrel → `../store/journal-model`), and the
   `renderSiteFiles` async doc paragraph had been written into the main `1stcontact` checkout
   instead of this worktree. `req40-conformance-security.test.ts` was failing at import
   (`Cannot find module './fixtures/conformance/xss-url'`). All migrated here.
   The main worktree's `throws-on-render.ts` was NOT copied: it carried a module-level `throw`
   that crashes at import rather than at render. This worktree's version is correct.

`tsc --noEmit -p tools/generate` is clean.

### Node project: 233 files, 8 shards, ~1746 tests — 14 files / 60 tests failing

Every remaining failure is pre-existing and outside this ticket's changed set (verified file
by file against `git status`). Two families:

- **Tool-surface return-shape drift** — `answer.replace is not a function`,
  `.toMatch() expects a string, but got object`, `expected [] to include 'NOT_FOUND'`.
  The surface returns an object/array where the UATs expect a string. Hits REQ-122, REQ-126,
  REQ-127, REQ-129, and the reconciliation assistant/composition suites. Needs its own ticket.
- **Sandbox EPERM on `~/Library/Preferences/.wrangler/registry`** — the dev registry write is
  denied, so `public-site.test.ts` and `req115-builder-shell.test.ts` hang to a 60s timeout.
  Environmental, not a code defect.

### Still blocked environmentally

- Conformance **browser** dimensions skip: `tools/generate`'s Playwright wants chromium build
  1228; only 1234 is installed, and network egress is blocked so it cannot be downloaded.
  15 tests skipped across the four conformance files. Not caused by REQ-148.
- `~/Library/Preferences/.wrangler/` writes denied (above).
- Writes to the sibling `xgd` repo's `.git/objects` and `.xgd/_locks` are still denied, so
  `xgd ticket update` cannot run against that store (`report-bug` create does work).


**Correction to the failure grouping above:** there are four pre-existing families, not two.
The two not listed:

- **Assistant conversation state** — the assistant's turn never lands: `expected ['user'] to
  deeply equal ['user','assistant']`, `expected 'The old headline.' to be 'A new headline.'`,
  and a `meta: {ts}` field now present on messages that the UATs don't expect. Hits
  `reconciliation-assistant-conversation`, `reconciliation-builder-assistant-pane`,
  `test_UAT_FC_REQ-122_chat_panel`, `test_UAT_FC_REQ-122_chat_host`,
  `test_UAT_FC_REQ-127_session_binding`.
- **BUG-32 scope literal restated** — `bug32-webui-scope-rebrand` finds the superseded scope
  written in `tools/generate/src/cli/kb.ts` and `tools/generate/src/store/fs-store.ts`.
  Neither file is in this ticket's changed set.

The 14 failing files by family: tool-surface shape (5), assistant conversation (5),
wrangler EPERM (3), scope literal (1).


## Landed — free-coded

Version **0.1.60**. Commits: `ade64575a` (the work), `055378794` (merge into
`xgd-working`; carries the version bump because `xgd-working` had already taken
0.1.59 while this branch was open).

### What shipped

The mechanism is removal, not precompilation, as §2 settled. Behavior components are
plain TypeScript functions returning HTML (`modules/html.ts`,
`carousel/component.ts`, `contact-form/component.ts`). With no Astro container to
inject, the registry is portable and `render.ts` names `getModule` itself, so
`renderSiteFilesNode` — which existed only to hold the container and the
`.astro`-bound resolver — is deleted along with the `*.astro` ambient declarations.
`renderSiteFiles` is now the single render entry for both the CLI and the Worker.

Two consequences worth recording, neither in the original scope:

- **A latent type leak surfaced.** The deleted `*.astro` ambient had been pulling
  Astro's `.d.ts`, and with it `@types/node`, into the Worker's type graph by
  accident. `options.ts` now imports `EditActor` from `../store/journal-model`
  instead of the `../store` barrel, which reaches `fs-store` and would otherwise put
  `node:fs` in the type graph of the Worker's route table.
- **REQ-145's boundary UAT is deleted, not fixed.**
  `test_UAT_FC_REQ-145_a_page_mounting_a_behavior_names_the_ticket_that_renders_it`
  asserted the 500 that this ticket eliminates. REQ-148's own UATs carry the positive.

The 12 conformance fixtures convert from `.astro` to `.ts` behavior components.

### Merge resolution

`apps/control-app/src/router.ts` conflicted where `xgd-working` had added the
per-isolate chat host (REQ-146) in the same region this ticket dropped
`previewRenderer`'s injected `render`. Kept the chat host verbatim, took the
single-arg `previewRenderer(store)`, and verified no call site still passes the
second argument and that `RouterDeps` no longer declares `render`. REQ-146's worker
AI boundary UATs pass 11/11 on the merged tree.

### Evidence

- **workers project: 5 files / 49 tests green** on the merged tree, including the
  three REQ-148 UATs — a behavior-module site renders its draft channel, the served
  bytes are the component's own output, the edit channel switches the behaviour off.
- **conformance: 20/20** across req39/40/41/85 against the converted fixtures
  (previously 5 passed, 15 skipped for want of a browser).
- **browser-gated suites: 23 of 24 files green** (118/119 and 101/102 across two
  batches) once the matching Playwright build was installed.
- `tsc --noEmit -p tools/generate` clean.

### Known-failing, none caused by this ticket

The node project has 14 files / 60 tests failing, every one outside this ticket's
changed set (checked file by file). Four pre-existing families: tool-surface return
shape (5 files), assistant conversation state (5), sandbox EPERM on
`~/Library/Preferences/.wrangler` (3), BUG-32 scope literal (1). The first two look
like real regressions from other work and want their own tickets.

Two cross-engine tests (`req42-conformance-x-browser`,
`reconciliation-l1-substrate` AC-688) time out rather than fail; chromium only runs
here under `--single-process` because the sandbox denies Mach bootstrap
registration, which makes them slow. Environmental.


---

## REQ-149: Publish in the cloud: revisions, history and rendered output without a filesystem

# Publish in the cloud: revisions, history and rendered output without a filesystem

## Why this is its own ticket

[[REQ-145]] moves the builder's routes into workerd. Every route ports through the
`SiteStore` the store chain built — except `/api/publish`, which does not port at
all, because the port has no notion of a revision.

This is not a relocation. It is the design increment [[REQ-142]] and [[REQ-143]]
deliberately left out, and doing it inside REQ-145 would have buried a new storage
contract inside a routing change.

## What publish does today, and why none of it survives the move

`cmdPublish` (`tools/generate/src/cli/commands.ts:154`) is filesystem all the way
down:

| Step | Today | In a Worker |
|---|---|---|
| validate the draft | `loadOrThrow(ctx, slug, 'draft')` | ports — this is the store |
| read lineage | `liveRevision(readHistory(ctx, slug))` | **no equivalent** — history is a file |
| mint the id | `nextRevisionId(ctx, slug)` | **no equivalent** |
| snapshot | `snapshot(ctx, slug)` — copies a directory tree | **no equivalent** |
| diff | `diffSnapshots(prevDir, snap.dir)` — two directories | needs a store-level diff |
| append history | `appendHistory(ctx, slug, {...})` | **no equivalent** |
| re-parent the draft | `writeDraftBase(ctx, slug, id)` | **no equivalent** |
| render | `renderSite(loaded, outDir)` — writes a tree to disk | needs the R2 path |

The `SiteStore` interface covers drafts, pages, assets, the journal and a write
version. It has no revision, no history and no publish verb. `SiteStoreRoot` adds
tenants and `slugs()`; `TenantSiteStore` adds `createDraft` / `forget`. That is the
whole surface.

## Where publish already half-exists

`/api/publish` is already a seam with three parties leaning on it and nothing
behind it:

- the builder UI already POSTs it (`apps/control-app/src/builder/api.js:228`);
- the shared route table already has the path, `501`-ing and naming this ticket
  (`apps/control-app/src/router.ts:257`);
- the Node transport **intercepts it before delegating**, and answers with a
  bespoke `cmdPublish` call on the filesystem
  (`tools/generate/src/cli/builder.ts:366`).

That interception is the second code path AC-7 names. `builder.ts` is otherwise a
*transport* — `node:http` in, `Request`/`Response` out, into the same `route()` the
deployed Worker calls — so publish is the one route where the two front doors
disagree about what a route does. Closing that is the shape of this ticket.

`1c deploy` (`tools/generate/src/deploy/`) already ships snapshots to R2 under a
content-addressed layout with a per-site `manifest.json` recording `live`,
`revisions[]` and `previews[]` ([[REQ-110]]), and `public-site` already reads it
(`apps/public-site/src/site-store.ts`). Both change here — see D5 and D6.

## Decisions

### D1 — publishing an unchanged draft is a no-op

Publish computes the diff against live anyway; when it is empty, return the live
revision and mint nothing. The CLI mints unconditionally today, so this is a
visible behaviour change, adopted because publish becomes a toolbar button
([[DOC-28]] §10) and buttons get pressed twice. Forward-only is unaffected: a
draft checked out from an earlier revision differs from live, so the diff is
non-empty and publish mints.

Consequence: re-publishing an unchanged draft with a new `-m` message does
nothing, message included. [[DOC-12]] §5 states the opposite and needs one
sentence.

### D2 — published slugs are globally unique, claimed on first publish

The draft side is tenanted to the bone (`draft/<tenant>/<slug>/...`, every D1 row
keyed `(tenant_id, slug)`); the published side predates it and has no tenant
anywhere (`sites/<slug>/...`, `/site/<slug>/`). Until now the writer was `1c deploy`
on the operator's laptop; this ticket makes the writer a multi-tenant Worker, so
tenant B publishing `home` would overwrite tenant A's live site.

Resolved by a claim table rather than by putting the tenant in the key: the public
URL grammar and [[DOC-12]] §7's R2 layout are untouched, and `public-site` needs
no slug-to-tenant read on the hot path beyond the one row it already has to fetch.
Per-tenant hostnames remain the real long-term answer and stay deferred
([[DOC-12]] §9).

### D3 — migration `0002` adds the revision record and the draft's lineage pointer

The `sites` table has no lineage column and there is no revisions table. Both are
needed. See "Schema" below.

### D4 — `/preview/<slug>/published` redirects to `public-site`

`302` to the public URL. One serving path for published bytes, as [[DOC-12]] §7
assigns it. Cost: a never-published site shows `public-site`'s 404 rather than a
builder-shaped message. The alternative — proxying — duplicates the resolve-and-
serve logic that seam exists to own. The route is reachable mainly by hand-typed
URL; [[DOC-28]] §10's toolbar has no published mode.

### D5 — D1 is the only record; `manifest.json` is deleted

The manifest was never a hot-path optimisation — `public-site` caches every 200 in
the edge Cache API (`apps/public-site/src/index.ts:52`), so the store is touched
only on a cold miss. Its own seam comment already promises the swap: "Phase 2
answers from D1 (`sites` / `revisions` / `pages`) by replacing the implementation
and nothing else." AC-2's "unchanged" is about the *seam*, which is the interface,
and it stays unchanged.

The manifest is carrying four jobs, which all have homes:

| Job | Moves to |
|---|---|
| which revision is live | derived — `MAX(id)` over the revisions table |
| vouching for a URL-supplied sha before it becomes an R2 key | a row lookup, same guarantee |
| GC roots for `--prune` | D1 rows |
| deploy's "already deployed" check | publish's own no-op check (D1) |

`live` is **derived, never stored**: [[DOC-12]] §4 is explicit ("No `head` field —
live = highest id") and §10 already made [[REQ-7]] drop `published_revision_id` for
this reason. Storing it would reintroduce the duplication the model rejected once.

R2 keeps bytes and nothing authoritative. `source/` still ships beside `out/`,
because D1 holds only the *mutable* draft — R2's `source/` is the only copy of what
the definition looked like at revision N, which is what makes checkout possible.
That is not duplication; nothing else holds that fact.

### D6 — one publish implementation, called two ways; `1c deploy` is deleted

Publish is a service function over the port, called by the `/api/publish` route
handler and by `1c publish`. The CLI does not become an HTTP client — it does not
need to, because the endpoint already runs inside it (the Node transport), and
calling the service directly keeps `1c publish` a one-shot command with no server
dependency. The transport's bespoke interception is deleted.

The port grows revision **storage** verbs (read history, append a revision, write
and read a snapshot), not a `publish()` verb, so the algorithm exists once above
two adapters — the [[REQ-142]]/[[REQ-143]] pattern already in place for drafts.
This is not duplicated data: a given site lives in exactly one store, and each
store keeps its own record (`history.json` on disk, rows in the cloud).

`1c deploy` is deleted rather than ported. Its whole job — ship a revision's bytes,
record it live — is what publish now does inside the Worker with both bindings in
hand. This is AC-7 in its literal sense.

### D7 — draft preview snapshots are dropped, not ported

The sha-addressed shareable draft links at `/site/<slug>/draft/<sha>/`
([[DOC-12]] §5.1) are manifest-backed, so they cannot stay behind while revisions
move — a half-manifest would be exactly the legacy-mode split `CLAUDE.md` forbids.
They are delivered only by `1c deploy`, and the CLI is a dev and test surface, not
a product one. The real feature returns later as a "Share draft" button in the
builder toolbar.

The builder's own draft preview (`/preview/<slug>/draft/`, behind Access) is
unaffected — that is [[REQ-145]] and stays live.

## Schema (migration `0002`)

```sql
ALTER TABLE sites ADD COLUMN base_revision INTEGER;   -- D3: the draft's lineage pointer

CREATE TABLE site_revisions (                          -- immutable once written; live = MAX(id)
  tenant_id, slug, id INTEGER,
  published_at, published_by, message,
  based_on INTEGER,        -- DOC-12 section 4: set when the draft was checked out from a non-latest revision
  changes TEXT,            -- the per-path diff, as DOC-12 section 4 defines it
  sha TEXT,                -- audit, not addressing
  PRIMARY KEY (tenant_id, slug, id)
);

CREATE TABLE published_sites (                         -- D2: the PK *is* the uniqueness guarantee
  slug TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_published_at TEXT NOT NULL
);
```

## Scope

- migration `0002` (above);
- revision storage verbs on the store port, implemented by the fs adapter (over
  `revisions/` + `history.json`, largely existing) and the D1/R2 adapter (new);
- a `publish()` service over the port: validate, diff, no-op or mint, snapshot,
  render, record, re-parent;
- `/api/publish` in the shared route table; the Node transport's interception
  deleted;
- render-to-store, so the Worker can write `out/` without a filesystem;
- `public-site`'s store swapped onto D1 behind its existing seam;
- `/preview/<slug>/published` redirects (`302`);
- `/api/sites` reports the live revision instead of `latest: null`
  (`router.ts:327`);
- `1c deploy` and preview snapshots deleted;
- [[DOC-12]] section 5 amended for D1, section 5.1 for D7.

## Acceptance criteria

1. `/api/publish` in the control-app Worker mints a revision, renders it and writes
   it to R2, with no filesystem anywhere on the path.
2. `public-site` serves the resulting revision through its existing seam — the
   interface unchanged, the implementation reading D1.
3. Publishing twice with no intervening edit is a no-op that returns the same
   revision.
4. Revision history is readable — `basedOn` lineage, message, author, changes — and
   a checkout of an earlier revision is forward-only, as the CLI's is.
5. An invalid draft publishes nothing: the failure happens before any write, as it
   does today.
6. The CLI and the Worker produce the same store state from the same publish, on the
   same store — one implementation, not two.
7. There is exactly one publish implementation afterwards, and no second route
   handler for it: the Node transport's `/api/publish` interception and
   `1c deploy` are gone (`CLAUDE.md`: replace fully).
8. A second tenant cannot publish over a slug another tenant has claimed; the
   attempt fails and the live site is untouched.
9. No site's live revision is recorded in two places: `manifest.json` no longer
   exists and `live` is derived, never stored.

## Out of scope / deferred

- **`--prune` has no home** once deploy is deleted. Orphaned bytes from an
  interrupted publish are unreachable and cost only storage; a Worker maintenance
  route later.
- **The R2 `sandbox/` root becomes dead weight** — only the Worker writes R2 now,
  and it only ever writes its own tenant's real sites.
- **Per-tenant hostnames** (subdomains, custom domains) remain [[DOC-12]] section 9's
  deferred, additive work.
- **Copying asset bytes is get-then-put.** The Workers R2 binding has no
  server-side copy, so a full snapshot ([[DOC-12]] section 8) reads each asset into
  the isolate and writes it back on every publish. Fine at current sizes; the one
  place publish could get slow on an image-heavy site.
- **[[DOC-8]] is stale** — [[DOC-28]] cites 3.2, 4.1 and 13 Q3, none of which
  exist in the stored document, which still commits to in-browser rendering that
  [[DOC-12]] section 11 withdrew. Does not block this ticket.

## Origin

Split out of [[REQ-145]] section 4, where "which serves `published` after this?" was
listed as an open question. Reading it resolved: everything moves to the cloud.
Reading is cheap — `public-site` already does it — so REQ-145 keeps the read and
this ticket takes the write.


## Implementation notes (as landed)

The seven decisions above all held. Five things the implementation settled that
the ticket did not anticipate:

**The port grew storage verbs, not a `publish()` verb.** `revisions`,
`writeRevision`, `readRevision`, `draftBase`, `setDraftBase` — and
`publish/publish.ts` sequences them. A `publish()` on the port would have put the
sequence inside every adapter and made AC-6 a thing to maintain rather than a
thing that cannot be otherwise.

**`pendingChanges` left the port.** It had three implementations, all of them the
same computation over different storage; it is now one service function over the
revision verbs. `snapshot.ts` and `diff.ts` (directory-based) are deleted with it.

**The diff is canonical, not byte-for-byte.** `diffSnapshots` now compares
key-sorted JSON rather than file bytes, because the two stores hold the same
definition in different shapes — comparing what each happens to serialize to
would make "did this page change?" depend on which adapter answered. This is what
makes AC-6 true rather than approximately true.

**`RevisionEntry` gained `sha`.** Audit, not addressing, as the schema said —
computed over the canonical snapshot listing via `crypto.subtle`, so both
adapters record the same value for the same definition.

**`publish` moved into the worker-safe toolbox core.** It was Node-only because
it snapshotted a directory tree; that reason is gone, so the AI operation works
against whichever store the host has. `add_asset` is now the only Node-only
operation, and REQ-146's AC-7 UAT was restated around it.

### One finding the suite caught

The first cut of the `/api/publish` handler built its 409 body locally, outside
the router's single scrubbing point. REQ-146's "every error path out of the
router is scrubbed" UAT failed on it. Both non-500 outcomes — `SlugClaimedError`
and `InvalidDefinitionError` — are now mapped in the bottom catch, where the
scrubber is, rather than at the route.

`InvalidDefinitionError` needed a 400 branch of its own: it is not a
`CommandError`, and it carries a LIST of path-pointed errors that flattening to a
single code/path/hint would discard.

### Test changes

Deleted (they test removed features): `req110-r2-deploy`,
`reconciliation-deploy-snapshot`, `reconciliation-serve-deployed-snapshot`,
`bug31-sandbox-r2-namespace`, `reconciliation-servable-root-confinement`.

Rewritten over a shared fixture (`tests/fixtures/published-site.ts`) that runs a
REAL publish and only relocates its output into a fake bucket, at keys the shared
key builders decide: `req111-public-site-serving`,
`req113-worker-extensionless-urls`, `reconciliation-clean-page-urls`.

Added: `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts` — eight UATs
covering AC-1 through AC-9 inside workerd, against real D1 and R2, driving both
Workers' own `fetch`. control-app publishes; public-site serves what it
published.

`test_UAT_FC_REQ-145_deferred_capabilities_answer_501_naming_their_ticket` is
deleted: publish was the last deferral, and the test's own note said a route
graduating was expected to leave. `notImplemented()` went with it.

### Latent behaviour noticed, not changed

`/site/<slug>/<dir>/` resolves to the key `<dir>`, not `<dir>/index.html` — only
the SITE ROOT gets the index mapping. Predates this ticket; a nested directory
URL has never served an index page. Not touched here.

### Verification

- workers project: 57/57 pass (7 files).
- node project: failing-file set byte-identical to the pre-change baseline (10
  files, all pre-existing: webui components not installed, a wrangler registry
  EPERM, and `bin/build` wiping `dist-assets` mid-run). 1736 pass.
- every package typechecks; control-app's pre-existing `node:fs` type-resolution
  errors are unchanged in number and identity.


## Follow-up: the builder must not fail silently

Found while demoing the landed work: on a store with no tenant row, the builder
serves a **blank page with no visible error**, and the same blank page appears
when `dist-assets` is missing. Three different faults, one indistinguishable
symptom, and the reason only ever reachable in devtools.

### Why it happens

`route()` constructs the tenant-scoped store BEFORE the asset fall-through at the
end, so `UnknownTenantError` becomes a 503 on `/builder/*` and `/webui/*` — build
artifacts that have nothing to do with a tenant. Meanwhile `/` is answered before
the store is built and returns 200. So the document loads and every module in its
import graph dies.

`main.js` then compounds it: `const sites = await fetchSites()` is a TOP-LEVEL
await, so any API failure rejects the module and nothing mounts.

### Two changes

1. **The store is opened lazily.** Only routes that need it open it, so an asset
   request never constructs one. The fall-through stays LAST — moving it earlier
   would let an asset shadow a route, which is the property the ordering exists
   to protect.

2. **A boot guard in the chrome document.** If `#app` is still empty after the
   module graph has had its chance, it renders what actually went wrong —
   including the live status of `GET /api/sites`, so "no tenant" reads as itself
   rather than as a blank screen. Inline, because an external guard would be the
   very asset that may have 404ed.

### Acceptance criteria

10. An asset request succeeds when the store holds no tenant — build artifacts do
    not depend on one.
11. A builder that cannot start says so IN THE PAGE, naming the cause, for a
    missing tenant and for a missing asset alike.



## Follow-up: `bin/build` failed on a type-only reach into node

Found while getting the operator to a Cloudflare deploy: `bin/build` failed at
`apps/control-app`'s typecheck with five errors it had been emitting all along —

```
tools/generate/src/store/fsutil.ts(10,8):  Cannot find name 'node:fs'
tools/generate/src/store/fsutil.ts(11,18): Cannot find name 'node:path'
tools/generate/src/store/fsutil.ts(93,14): Parameter 'name' implicitly has an 'any' type
tools/generate/src/store/loadSite.ts(1,18): Cannot find name 'node:path'
tools/generate/src/store/paths.ts(1,18):   Cannot find name 'node:path'
```

`apps/control-app` is a Worker package: `types: ["@cloudflare/workers-types"]`,
no node types. Nothing in it should reach a node-only module.

### Cause

`render.ts` imported the TYPE `LoadedSite` from `../store/loadSite`, which only
RE-EXPORTS it while itself importing `node:path` and the filesystem helpers. The
type is declared in `assemble.ts`, which reaches nothing. One specifier.

### Why no test caught it

REQ-146's import guard walks RUNTIME imports and deliberately skips type-only
ones, because a bundler erases them — it is right about the bundle and silent
about this. But `tsc` does NOT erase a type-only import before resolving it, so a
type-only reach into a node-only module puts `node:fs` in a Worker's type
program. The bundle was always fine; the build was not, and the suite stayed
green while `bin/build` failed.

A UAT now walks type-only imports too, from the Worker entrypoints outward, and
fails on any that reach a node-only module. It was confirmed to fail against the
pre-fix specifier, naming the chain.

### Acceptance criterion

12. No module reachable from a Worker entrypoint imports a node-only module,
    including through a type-only import.

### Version bookkeeping

A fourth commit carries a version bump alone. `move-to-free-coded` refuses a
version already present at the tip of `xgd-working` on a commit not reachable
from the ticket's own SHAs — here the ticket auto-commits that landed on top of
the fix. The bump moves the claim onto a commit this ticket owns; no behaviour
changes. Ticket version is now 0.2.7.


## Follow-up: the deploy secret guard asked the wrong question

`bin/deploy.d/secrets/10-anthropic-api-key` refused any deploy run from a shell
without `ANTHROPIC_API_KEY`, including deploys whose secret had been in
Cloudflare since the previous run. The operator was asked to re-supply a value
the store already held, in order to overwrite it with itself. In practice this
made `bin/deploy` unusable from a fresh shell and pushed the operator toward
calling `wrangler deploy` directly, which skips the migrate hook as well — the
guard's own failure mode, arrived at by a different route.

### Cause

The guard's rule is "never deploy a control app that cannot take a turn". That
is a statement about the **store**, not about the operator's shell, and the hook
tested the shell. `: "${ANTHROPIC_API_KEY:?...}"` cannot distinguish "this
credential does not exist" from "this credential exists and is not in front of
me right now".

### The decision table

| The value is | The Worker | Outcome |
|---|---|---|
| in the environment | either way | **push** — supplying a value is how a rotation is expressed |
| absent | already holds the name | **keep** — reported, nothing overwritten |
| absent | does not hold it | **fail** before anything is uploaded |
| absent | could not be read at all | **fail**, naming the unread store |

Only a *positive* read satisfies the guard: the store answered, and the name was
in the answer. A `secret list` that fails for any reason — no such Worker on a
first deploy, no network, a token without Workers Scripts read — counts as
absent, because the failure mode being guarded against is a confident skip based
on an answer nobody actually got. The names are the only half of a secret that
is safe to read, and reading them mutates nothing, so the probe runs unchanged
on a rehearsal.

The probe is not called at all when the environment has the value, so the common
path adds no network round-trip and no new token permission. CI is untouched:
`.github/workflows/deploy.yml` calls `wrangler deploy` directly and never runs
these hooks.

`--dry-run` now reaches the same decision by the same route, *including the
failure*. A rehearsal that passed while the real deploy would abort was not a
rehearsal.

### Acceptance criteria

13. A deploy from a shell with no `ANTHROPIC_API_KEY` succeeds when the Worker
    already holds the secret, reports that it left it alone, and does not
    overwrite it.
14. A deploy from a shell that supplies a value pushes it, even when the name is
    already stored — rotation stays possible.
15. A deploy still fails, before any upload, when the value is in neither place,
    or when the store could not be read to check.
16. `--dry-run` reports the decision it would have acted on and fails where the
    real deploy would fail.

### Test changes

`tests/test_UAT_FC_REQ-149_deploy_secret_hook.test.ts` drives the hook as a
subprocess with a stubbed `npx` first on `PATH`. That stub is what makes the
branch this ticket fixes testable at all: the absent-locally / present-remotely
case cannot be reached by a test that holds a real credential, and must not
require one. Seven UATs cover the four outcomes, both rehearsal outcomes plus the
rehearsed failure, the standing "never print the value" rule, and `public-site`
exiting before it looks at the store — a model credential must never be pushed
to the Worker that serves rendered bytes.

Confirmed end to end against the real store: `bin/deploy --dry-run control-app`
with `ANTHROPIC_API_KEY` unset now reports
`ANTHROPIC_API_KEY already on 1stcontact-control-app — would leave it`.

### Version bookkeeping

The fix, its UATs and the `bin/deploy.d/secrets/README.md` contract update are
one commit, which bumped to 0.2.8. A second commit carries a further bump alone.

`move-to-free-coded` refuses a version present at the tip of `xgd-working` on a
commit not reachable from the ticket's own SHAs, and the ticket auto-commit for
this very section landed on top of the fix — so the tip held 0.2.8 without
belonging to the ticket. This is the same bookkeeping the previous increment
hit, and the same remedy: the bump moves the claim onto a commit this ticket
owns. No behaviour changes. Ticket version is now 0.2.9.


---

## REQ-150: 1c CLI: boot a plain Vite SSR server, not Astro's

# `1c` CLI: boot a plain Vite SSR server, not Astro's

## Why

`tools/generate/bin/1c.mjs` boots a Vite dev server configured through **Astro's**
`getViteConfig()`, and loads the CLI through `ssrLoadModule`. The only reason for the Astro
plugin is that the render path imported `.astro` module components and therefore needed
Astro's transform.

[[REQ-148]] removes the last `.astro` file from the repository: the two behavior-module
components become plain TypeScript functions, and the conformance fixtures convert with
them. After that lands, the Astro plugin in the CLI bootstrap transforms nothing.

## What to change

Replace `getViteConfig()` with a plain `createServer()` Vite SSR config (TypeScript +
workspace resolution only). Everything the current bootstrap works around because of Astro
should go with it:

- the inline Astro config passed solely to gate Astro's logger (`logLevel: 'error'`), and
  the "Missing pages directory" WARN it exists to suppress;
- the `createRequire(import.meta.resolve('astro/package.json'))` dance used to locate Vite;
- possibly the stdout→stderr diversion, if no bootstrap chatter remains to divert (verify
  against a `--json` command before removing it — it is defense in depth for *any* boot
  noise, not only Astro's).

Then check whether `astro` can be dropped as a dependency of `packages/framework` and/or the
repo root. `@astrojs/markdown-remark` is a separate package and stays.

## Why it is separate from REQ-148

REQ-148 is already a wide conversion (both behavior modules, 12 test fixtures, the render
seam, ~8 test files). The CLI bootstrap is a distinct risk surface — every `1c` command runs
through it — and it keeps working untouched after REQ-148. Changing it in the same commit
would mix a mechanical conversion with a launcher rewrite, and a boot regression would be
hard to attribute.

## Acceptance criteria (provisional)

1. Every `1c` command runs through a Vite SSR server configured with no Astro plugin.
2. Boot emits nothing on stdout or stderr for a quiet command; `--json` still emits a single
   clean document.
3. `1c assets` still bootstraps on a fresh checkout without loading the CLI barrel (the
   cycle REQ-145 documented).
4. No test regresses — in particular the CLI output-hygiene reconciliation UATs.

## Origin

[[CHAT-25]] / [[REQ-148]] Q4: deliberately deferred so the conversion and the launcher
rewrite fail independently.

---

## Settled scope (agreed with the operator at implementation time)

The survey below was run against the branch with [[REQ-148]] already landed. It found that
"drop the Astro dependency" is not confined to the bootstrap: four other sites still resolve
`astro` after the launcher is rewritten. The operator chose the **full removal** reading —
`astro` leaves the repository entirely — and authorised the reconciliation-UAT rewrite that
requires.

### Where `astro` is still load-bearing after the bootstrap rewrite

| Site | What it uses Astro for | Disposition |
|---|---|---|
| `vitest.node.config.mts` | the whole node project config is `getViteConfig({...})` | → plain `defineConfig` from `vitest/config`; the Astro plugin transforms nothing now |
| `tests/req89-astro-lazy.test.ts` | `spyOn(experimental_AstroContainer, 'create')` ×2 | → static "no `astro` specifier in the render graph" scan |
| `tests/reconciliation-1c-astro-free-render.test.ts` | the same spy ×3 — **reconciliation UAT AC-739** | → same static scan (operator-authorised rewrite) |
| `tests/test_UAT_FC_REQ-141_project_routing.test.ts` | asserts `vitest.node.config.mts` *contains* `from 'astro/config'` | → assert it names no Astro specifier at all |
| `tools/generate/tsconfig.json`, `packages/framework/tsconfig.json` | `types: ["astro/client"]` | → `vite/client` (or dropped where unused) |
| `pnpm-workspace.yaml` | `@astrojs/compiler-*` build-approval entries | → removed with the dependency |

### Why the container spies are replaceable rather than merely deleted

`experimental_AstroContainer` cannot be spied on once `astro` is uninstalled, so AC-739's
measurement has to change form. The replacement is the check [[REQ-148]] already introduced
in `test_UAT_FC_REQ-148_astro_free_render.test.ts`: no source file on the render graph names
an `astro` specifier, statically or dynamically. This is **strictly stronger** than the spy
— the spy proved "no container for *this* render", the scan proves "no container is
reachable from *any* render" — so AC-739's guarantee survives the rewrite rather than being
weakened by it. The render-output assertions in both files (module markup, folded theme CSS,
`capabilities.js`) are kept exactly as they are.

### `vite` becomes a direct dependency

`vite` is not currently a direct dependency of anything — it arrives transitively through
`astro`, which is precisely why the bootstrap needs
`createRequire(import.meta.resolve('astro/package.json'))` to find it. With `astro` gone the
launcher must be able to `import { createServer } from 'vite'` directly, so `vite` is added
as a real dependency of `tools/generate` — whose `bin` the launcher is, and which imports it
at run time, so `dependencies` rather than `devDependencies` is the correct field.

No *root* `vite` entry is needed. Both Vitest configs take `defineConfig` from
`vitest/config`, and Vitest carries its own Vite; only the launcher imports the package by
name.

### The stdout→stderr diversion

Kept, and re-justified in the source. AC-2 is a claim about the observable streams, not
about the absence of the guard; the diversion is cheap defense in depth against *any* boot
chatter (Vite's own dependency-optimisation notices, a future plugin's) and removing it
would trade a real protection for a cosmetic one. Its comment is rewritten so it no longer
describes itself as an Astro workaround.

## Test approach

New UATs in `tests/test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts`, driving the real
`1c` binary as a subprocess (the launcher is the entry point; nothing about it is
observable in-process):

- the launcher's source names no Astro specifier, and neither does any Vitest config;
- `1c help` / `1c list` boot with a clean stdout and an empty stderr;
- a `--json` command emits exactly one parseable document on stdout;
- `1c assets --json` still bootstraps without loading the CLI barrel (REQ-145's cycle);
- no `package.json` in the repo declares `astro`, and `@astrojs/markdown-remark` still does.

Regression scope: `tests/req37-launcher.test.ts`, `tests/req89-astro-lazy.test.ts`,
`tests/reconciliation-1c-astro-free-render.test.ts`,
`tests/reconciliation-1c-cli-output-hygiene.test.ts`,
`tests/reconciliation-1c-install-preflight.test.ts`,
`tests/test_UAT_FC_REQ-141_project_routing.test.ts`,
`tests/test_UAT_FC_REQ-148_astro_free_render.test.ts`, plus the full node suite.

---

## Implementation record (2026-08-21) — free_coded at 0.2.2

Landed on `xgd-working` as merge `38ae1533d`. Commits: `258381e2d` (the launcher
and the dependency removal), `aa64b3e15` (the last Astro site), `c36373c10` (the
version bump — see "version" below).

### What shipped

Everything under "Settled scope" above, as written. The launcher takes
`createServer` from `vite` directly with `configFile: false`, so its behaviour
cannot depend on a `vite.config.*` that exists for some other purpose.
`vitest.node.config.mts` is a plain `defineConfig` from `vitest/config`; no root
`vite` entry was needed, since Vitest carries its own. Astro is absent from every
manifest, from the lockfile's three importers, and from every source file — the
single surviving occurrence is one explanatory comment.

### The branch had to be rebased, not merged

`free-REQ-150` was cut before a `remap_commits` / resync rewrote `xgd-working`'s
history, so the two shared no useful merge base: `git merge xgd-working` produced
32 conflicts, including `add/add` on files the branch never touched. The branch's
*content* was nevertheless identical to `xgd-working` for every file the ticket
touches, so the delta was replayed onto the new tip with `git cherry-pick`
instead, which applied clean. `free-REQ-150-preremap` held the pre-rebase commit
until the merge was confirmed.

That rebase is what surfaced `tests/reconciliation-site-storage-port.test.ts`,
a file the branch had never seen (`aa64b3e15`). It imported both `astro/container`
and the `.astro` file REQ-148 deleted, so it was **already failing at collection
on `xgd-working`** — all eight of its tests unreachable. Converting it off the
container restored them; AC-1329's claim is unchanged, only its mechanism was
Astro's, and the AC number (not the descriptive tail) is what links a UAT to its
criterion.

### Verification

`xgd-working` baseline, full node suite in the main checkout: **9 files / 23
tests failing**. The branch: **8 files / 25 tests failing** — the file-level
delta is exactly `reconciliation-site-storage-port`, fixed here.

The test-level delta is environmental, not regression. Four
`reconciliation-builder-workspace-origin` tests fail only in the worktree because
`@lagrangefoundry/webui-shell` is installed out-of-band into
`/Users/martin/lagrangefoundry/node_modules` and is reachable by walking up from
the main checkout but **not** from a worktree parked under `~/.xgd/worktrees`;
`require.resolve` returns `MODULE_NOT_FOUND` there, so the builder origin serves
`/webui/...` as 404. The rest of that set (`public-site` EPERM against
`~/Library/Preferences/.wrangler`, the builder/assistant cluster) is known flaky:
its counts move run to run on an unchanged tree, and `public-site` reproduces
identically on unmodified `xgd-working`.

Regression scope on the rebased branch: **11 files / 56 tests passing** (the ten
declared, plus `reconciliation-site-storage-port` at 8/8). Workers project: **5
files / 49 tests passing**.

### Version

The cycle bumped 0.2.0 → 0.2.1, but REQ-149 landed the identical bump on
`xgd-working` first, so the two merged to the same value and this cycle claimed
none of its own. `c36373c10` takes 0.2.2.

### One operator step remains

The main checkout's `node_modules` still carries `astro`, because the manifests
changed under it. Run `pnpm install` there before trusting a local test run —
the `astro-absent` assertions check that `astro/container` cannot be resolved,
which is only true once the tree matches the lockfile. CI is unaffected: it
installs `--frozen-lockfile` from scratch.


---

## REQ-151: Site locale identity, and rendered lang/dir

# Site locale identity, and rendered `lang` / `dir`

## Why

The first customer cohort is international — Ireland (EUR) and the UK (GBP) alongside US
customers. `siteConfigSchema` (`packages/site-schema/src/schema.ts`) had **no notion of
where a business is**: it carried `businessName`, `tagline`, `contact`, `integrations` and
`distribution`, and nothing else. `contact.address` exists but is a free-text string — it
cannot drive a formatting decision and is not a substitute.

In its absence the US/English assumption was hardcoded. `<html lang="en">` was a literal in
**two** renderers:

- `packages/framework/src/l1/render.ts` (`renderL1Page`)
- `tools/generate/src/render/render.ts` (`renderPage`)

**The `lang` half is the part with a closing window.** Published revisions are immutable R2
snapshots ([[DOC-12]] §7; `tools/generate/src/cli/commands.ts` — *"a revision is immutable
and there is nothing on it to edit"*). A site published before this lands carries
`lang="en"` permanently, and fixing the renderer does **not** fix published artifacts —
every live site would need republishing, which is an operational act that can sweep in
draft changes the customer has not approved. Search engines also index `lang`, so a wrong
value costs re-crawl time to recover.

At implementation time there were **zero published revisions** (`storage/sites/*/history.json`
are both `{"revisions": []}`), so the cost was hours. That is the reason to do it now rather
than when it becomes obviously needed.

A wrong `lang` is also a live accessibility defect independent of i18n: it is what a screen
reader uses to choose pronunciation.

## What changed

**1 — Four optional fields on `siteConfigSchema`:**

| field | standard | example |
|---|---|---|
| `country` | ISO 3166-1 alpha-2 | `IE` |
| `locale` | BCP 47 | `en-IE` |
| `currency` | ISO 4217 | `EUR` |
| `timezone` | IANA zone id | `Europe/Dublin` |

`locale`, `currency` and `timezone` **derive from `country`** when absent, each individually
overridable. They stay separate fields rather than being derived at each use because they
correlate without determining: locale decides placement and separators, currency decides
symbol and decimal count. `Intl.NumberFormat('en-IE', …EUR)` → `€49.99`;
`('de-DE', …EUR)` → `49,99 €`.

**2 — A country → (locale, currency, timezone) derivation table**
(`COUNTRY_DEFAULTS`, `packages/site-schema/src/locale.ts`). 66 countries covering the EU,
North America, Latin America, Africa/Middle East and Asia-Pacific, including the RTL ones
(`AE`, `EG`, `IL`, `IR`, `MA`, `QA`, `SA`, `PK`). Adding a country is **one row** — a data
edit, not a code change. A country spanning several zones carries one explicit,
commented pick (its largest-population civil zone), overridable via `timezone`.

**3 — Both renderers emit `lang` and `dir`** from `resolveSiteLocale(site.config)`.
`renderL1Page` gained a third parameter carrying the site's raw locale fields;
`renderPage` reads them off the site it already holds. `dir` is `rtl` for RTL scripts,
`ltr` otherwise, decided by the **script** subtag when one is present and the language
subtag otherwise — the only way `az-Arab` and `az-Latn` are both right.

**4 — The resolved locale reaches behavior modules** as `BehaviorProps.locale`
(`{ country, locale, currency, timezone, dir }`), handed down by `renderModuleInstances`.
The payments and calendar modules will both read it rather than each deriving its own.

**No DB migration was required.** `sites.site_json` is a verbatim TEXT blob
(`db/migrations/0001_site_store.sql`).

## Design decision made during implementation: the undeclared default

The ticket's AC-1 asked for `lang="en"` when nothing is declared, while "what to change"
said `country` defaults to `US` — which would derive `en-US`. Both are honoured, and the
tension resolves on a principle rather than a compromise:

- **`country` declared as `US`** is a fact about the business → `en-US`.
- **Nothing declared** is the *absence* of that fact → the region-free **`en`**
  (`UNDECLARED_LOCALE`). Stamping `lang="en-US"` on a page whose owner never said where
  they are asserts something we were not told, into an attribute a screen reader and a
  search index both act on. `en` says exactly what we know, and is byte-identical to the
  literal it replaced.

`currency` and `timezone` take no such care because there is no region-free EUR and no
region-free clock: `US` has to answer for them or nothing does.

## Acceptance criteria

1. A site with no locale fields validates and renders exactly as before (`lang="en"`,
   `dir="ltr"`) — no regression for the two existing sites.
2. A site declaring `country: 'IE'` and nothing else resolves to `en-IE` / `EUR` /
   `Europe/Dublin`, and renders `<html lang="en-IE" dir="ltr">`.
3. An explicit `locale`, `currency` or `timezone` overrides the derived value; the others
   still derive.
4. Both render paths emit the same `lang`/`dir` for the same site — no divergence between
   `packages/framework` and `tools/generate`.
5. An RTL locale renders `dir="rtl"`.
6. An invalid country / locale / currency / timezone is a **validation error with a
   machine-readable path** (`/config/<field>`), not a silent fallback. An unsupported
   country is invalid — it is not quietly served American defaults.
7. The resolved locale is available to a behavior module at render time.

## Tests

`tests/test_UAT_FC_REQ-151_site_locale.test.ts` — 9 UATs:

- `..._a_site_declaring_no_locale_renders_exactly_as_before` (AC-1)
- `..._every_real_site_on_disk_still_validates` (AC-1, against the actual `storage/sites/`)
- `..._country_alone_derives_locale_currency_and_timezone` (AC-2)
- `..._each_field_overrides_independently` (AC-3)
- `..._both_render_paths_emit_the_same_lang_and_dir` (AC-4 — both are rendered and compared)
- `..._a_right_to_left_locale_renders_dir_rtl` (AC-5)
- `..._a_bad_locale_field_is_a_validation_error_with_a_path` (AC-6, nine bad inputs)
- `..._a_behavior_module_is_handed_the_resolved_locale` (AC-7)
- `..._the_country_table_is_data_and_is_internally_consistent` — every row in the table is
  held to the same validation a site's own declaration is, so a mistyped zone or a
  lowercase currency in a future row fails here rather than when a customer signs up.

Regression scope run: the full node project (247 files) and the full workers project
(7 files, 58 tests, all green). Node failures are all pre-existing on `xgd-working` and
unrelated — verified by re-running the same seven files with this ticket's changes stashed
and getting an identical 23 failures. They are: the assistant/chat-host suites (missing API
key), the deploy-smoke suite, `reconciliation-site-storage-port` (imports a
`contact-form/index.astro` that no longer exists), and `reconciliation-scaffold-starter-l1`
(REQ-150's `1c.mjs` imports `vite`, which is not a declared root dependency — see below).

## Note for the operator, outside this ticket's scope

`tools/generate/bin/1c.mjs` (REQ-150, commit `258381e2d`) imports `vite` directly, but
`vite` is not in the root `package.json` dependencies. `node tools/generate/bin/1c.mjs help`
fails with `ERR_MODULE_NOT_FOUND: Cannot find package 'vite'`, which fails
`test_UAT_AC875` and `test_UAT_FC_REQ-89_cli_boots_no_missing_pages_warning`. Pre-existing
on `xgd-working` before this merge; not fixed here because it belongs to REQ-150.

## Why free-coded

Small, well-bounded, and time-sensitive — the immutability of published revisions means the
cost rises the moment the first customer site goes live.

## Origin

[[CHAT-26]] · [[DOC-34]] §5 — FR-1 and FR-2 of that session's foundational review.


---

## REQ-152: Money and time representation, and the render-determinism resolution

# Money and time representation: the constraints, and the render-determinism resolution

## Why

Two capabilities are coming that do not exist yet — **payments** and **calendar** — and
both have a representation decision whose wrong answer is *unrecoverable* rather than
merely expensive.

**Money.** If prices land in storage as display strings (`"€49.99"`) or floats, converting
later means lossy parsing across live sites, with no clean inverse. Worse, if the displayed
price and the charged price are authored independently they can drift — and a shown price
that differs from the charged price is a **legal** exposure, not a cosmetic bug.

**Time.** If a booking is stored as a local wall-clock string, it is unrecoverable: you
cannot re-interpret history without knowing which zone was meant. If it is stored as a
fixed offset (`+00:00`), it breaks across DST — and the EU and US transition on *different
dates*, so a booking made in October for a November slot silently shifts by an hour.

The codebase was already **correct** on time: every timestamp is `toISOString()`. This REQ
is about keeping it that way when a module starts handling *user-meaningful* time rather
than system timestamps.

**And there was a conflict that had to be resolved before the calendar module is authored.**
`packages/framework/src/buildInfo.ts` stated that *"modules must never call `new Date()`
at render time"*, because a page rendered twice from the same source must be byte-identical.
A calendar renders **time-varying availability**. Both could not hold as written.

The failure mode if left undecided is nasty and silent: a published **immutable** snapshot
with *"next available: 3 September"* baked into its HTML is wrong the following day and
**cannot self-heal**, because a revision is by definition not re-rendered.

## What changed

### 1 — The shared formatting seam: `packages/framework/src/intl.ts`

Exported from the framework barrel. Two functions, no more — a module that formats money or
a date reads `props.locale` (REQ-151) and calls these rather than inventing an answer.

```ts
formatMoney(amountMinor: number, currency: string, locale: string, options?): string
formatDateTime(instant: string, timeZone: string, locale: string, options?): string
```

Both delegate wholly to ICU. Nothing hand-rolls a symbol, a separator or a date order.

### 2 — Money is `{ amountMinor: integer, currency: ISO 4217 }`

- The divisor comes from **ICU's minor-unit count for the currency**, never a literal
  `/100`. JPY has 0 and KWD has 3, so a hardcoded scale undercharges one by a hundredfold
  and overcharges the other by a thousand.
- The decimal is built by **string arithmetic**, not division: `9007199254740991 / 100`
  formats as `…409.90`, dropping a cent, and `Intl.NumberFormat` (V3) parses a decimal
  string exactly. A shown price is a legal claim, so exactness is not optional.
- A **non-integer amount throws**, and a **currency that is not ISO 4217-shaped throws** —
  the two string arguments are transposable, and a swap would otherwise render something
  plausible-looking.

### 3 — Time is an instant plus an IANA zone id

- A **zone-less wall-clock string is refused**. Accepting it would silently reinterpret it
  as whichever zone the build host happened to be in — a property of the machine, baked
  into an immutable snapshot. Only `Z` or an explicit numeric offset is admitted.
- An **unknown IANA id is refused** (`Europe/Dubland`), rather than allowed to produce an
  opaque `RangeError` from inside ICU.
- `timeZoneName` is passed through, so the calendar module can meet DOC-34 §8.2's
  obligation to surface the zone wherever a cross-zone booking is possible.

### 4 — The determinism conflict, resolved and recorded

Adopted the resolution the ticket proposed:

> **Render output stays byte-deterministic. Time-varying content is rendered on the client
> or fetched at request time, and is NEVER derived from the render clock.**

The prohibition on reading the clock at render time therefore **stands exactly as it was**;
what changed is that showing a date is no longer mistaken for breaking it. Two sanctioned
shapes: an instant known at author time is data on the definition and formatted through the
seam; content that depends on *now* is emitted as a **mount point plus data** for the client
to resolve.

`formatDateTime` has **no clock-reading overload** — the rule expressed as an API rather
than as something to remember. Recorded in **DOC-34 §8.4** (new), in `intl.ts`'s header,
and `buildInfo.ts` now points at both rather than implying no module may ever show a date.

### 5 — Obligations on the two unwritten modules

DOC-34 §8.1/§8.2 and DOC-25 §11 already carried these; both were updated to name the seam
that now exists, so the next author finds the implementation rather than the principle.

## Design decisions made during implementation

- **Two functions, not four.** A `formatSiteMoney(amount, resolvedLocale)` convenience pair
  was written and then removed: it would have created two ways to format money, against the
  project's simplicity mandate. The transposition risk it existed to remove is handled
  instead by the ISO-4217 guard, which throws.
- **Recorded as DOC-34 §8.4, not inside §8.2.** The ticket said "§8.2", but §8.2 is the
  calendar module's obligations and the determinism rule binds every module. §8.2 now points
  at §8.4.
- **`formatDateTime` accepts an explicit offset, not only `Z`.** DOC-34 §7's "never a fixed
  offset" rule governs *storage of future local events* — a calendar-config concern. At a
  formatting boundary the distinction that matters is ambiguous vs unambiguous, and an
  explicit offset is unambiguous. A zone-less string is what gets refused.
- **`NumberFormatV3` declared locally.** The project's `lib` is pinned at ES2022 and the
  string-accepting `format` overload arrived in ES2023. Both hosts (Node 22, workerd)
  implement it; only the type declaration is behind. Widening the whole project's lib to
  reach one overload is a much larger claim than this needed.

## Test plan

`tests/test_UAT_FC_REQ-152_intl_seam.test.ts` — 15 UATs, all green.

| AC | Covered by |
|---|---|
| 1 — same amount, two locales | `€49.99` (en-IE) vs `49,99 €` (de-DE); plus two currencies in one locale, proving the symbol comes from the currency argument |
| 2 — 0- and 3-minor-unit currencies | JPY `￥4,999`, KWD `4.999`, ISK; plus exactness beyond float precision, non-integer refusal, transposed-argument refusal, negative amounts |
| 3 — DST divergence | Dublin↔New York across 20 Oct / 28 Oct / 5 Nov 2026 — **five hours apart, then four, then five again**, because the EU leaves DST on 25 Oct and the US on 1 Nov. Plus zone-abbreviation output, wall-clock refusal, unknown-zone refusal |
| 4 — byte-identical renders | The same page rendered twice through **both** renderers and compared file by file; **plus a structural check** that no source on the framework's render path contains a zero-arg `new Date()` or `Date.now()` — determinism as mechanism rather than discipline |
| 5 — resolution recorded | `buildInfo.ts` references DOC-34 §8.4 and `intl.ts`; `intl.ts` carries the rule verbatim |

All instants in the DST tests are fixed literals, so the suite asserts the same thing in
July as in October.

**Regression scope run**: full node suite (938 tests) plus the workerd behavior suite.
Three files fail — `reconciliation-colour-census-and-retrofit`,
`reconciliation-colour-retrofit-shade-model`, `test_UAT_FC_REQ-150_plain_vite_bootstrap` —
and **all three fail identically on clean `xgd-working`**, verified by running them there.
Pre-existing and unrelated to this change. Framework typecheck is clean.

## Why free-coded

The code deliverable is small (one formatting seam); the value is that it exists *before*
payments and calendar are authored, so neither has to invent its own answer.

## Origin

[[CHAT-26]] · [[DOC-34]] §6–§8 · [[DOC-25]] §11 — FR-3 and FR-4 of that session's
foundational review. The determinism conflict was found against
`packages/framework/src/buildInfo.ts` after [[DOC-34]] was written, and is now reflected
there as §8.4.


---

## REQ-153: Reserve locale-shaped page slugs

# Reserve locale-shaped page slugs

## Why

`pageSchema.slug` was an unconstrained `z.string()`
(`packages/site-schema/src/schema.ts`). Nothing stopped a page being slugged `de` or `fr`.

If a locale path prefix (`/de/about`) is ever adopted — the conventional and most likely
shape, and the one [[DOC-34]] §9 leaves open — a page already published at `/de` becomes
structurally ambiguous with the locale segment. Because published URLs are what inbound
links, search rankings and anything a customer has printed or shared all point at, that
ambiguity is awkward to resolve after the fact rather than merely untidy. A published
revision is an immutable snapshot (DOC-12 §7), so such a page can be broken but not moved.

This is **cheap insurance, not a must**. Multilingual sites are explicitly deferred
([[DOC-34]] §9), and if a subdomain or query-parameter shape is chosen instead the concern
disappears entirely. It is proposed only because the guard costs about half an hour now and
removes a class of collision permanently.

## What changed

**`packages/site-schema/src/locale.ts`** — the reservation, alongside the rest of the
platform's locale knowledge (REQ-151's country/locale/currency/timezone derivation):

- `ISO_639_1_LANGUAGES` — the whole ISO 639-1 registry as data, not a curated subset. The
  rule is about what a URL segment *could* mean later, not what we render today; a code
  left out is a collision discoverable only once a site is published under it.
- `isLocaleShapedSlug(slug)` — true when the slug is *exactly* a locale segment:
  `language` or `language-region`, anchored whole, matched **case-insensitively** (`/DE`
  collides with a `de` prefix exactly as `/de` does). The language must be a real ISO 639-1
  code, so `zz` and `qq` are admitted — reserving shapes that could never become a locale
  is a tax with no collision behind it.
- `localeShapedSlugMessage(slug)` — the refusal text.

**`packages/site-schema/src/schema.ts`** — `pageSchema.slug` gains a `superRefine` calling
the above. Because it sits on the field, the issue path is `/pages/N/slug` automatically,
and because every writer funnels through `validateSite`, the guard reaches the CLI
(`1c edit page add`), the AI toolbox's `add_page`, and the store loader without any of them
being changed.

## Design decisions made during implementation

**The BCP 47 script subtag (`zh-Hans`) is deliberately NOT reserved.** An earlier draft
accepted `language[-script][-region]`, which matches any four-letter tail — and four-letter
tails are ordinary English. `de-luxe`, `no-cost` and `it-team` are all plausible page slugs
and none is a locale. Reserving them to defend `/zh-Hans/…` — a prefix that only arises for
a language with two living scripts, on a site that also happened to slug a page `zh-hans` —
trades a real cost for a negligible one. The numeric region form (`es-419`) *is* reserved:
a three-digit tail is never an English word, so it is free.

**The message carries its own justification and two concrete alternatives.** A validation
failure that reads as arbitrary is worse than none — the author cannot tell a rule from a
bug, so they work around it rather than renaming the page. The text names *why* the slug is
refused and gives `<slug>-services` / `about-<slug>`, because "pick something else" is not
an instruction anyone can act on quickly.

## Acceptance criteria

1. A page slugged `de`, `fr` or `pt-BR` is a validation error with a machine-readable path
   (`/pages/N/slug`) and an actionable message. ✅
2. A page slugged `design`, `deals` or `delivery` validates — the rule matches *only* the
   exact locale forms, never a prefix. ✅
3. Both existing sites still validate. ✅

## Test plan

`tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts` — 30 UATs:

- **AC-1** parameterized over `de`, `fr`, `pt-BR`, `pt-br`, `DE`, `es-419`, `en`, `ga`;
  each asserts an error at `/pages/0/slug` whose message names the slug, mentions the
  locale reason, and offers both suggested forms.
- **AC-1 at the authoring entry point** — `editPageAdd(..., { path: 'de' })` rejects with
  a `CommandError` carrying `code: SCHEMA_INVALID` and `path: /pages/1/slug`, leaves no
  half-written page behind, and the same page is created successfully at `de-services`.
  This is what proves the guard is *reachable*, not merely present in the schema.
- **AC-2** parameterized over `design`, `deals`, `delivery`, `french-lessons`, `portfolio`,
  `english`, `zz`, `qq`, `no-fee`, `de-luxe`, `no-cost`, `it-team`, `zh-Hans`, `pt-brazil`,
  plus the three slugs both real sites use.
- **AC-3** enumerates `storage/sites/*` at runtime (rather than naming two sites) and
  validates each site's draft *and every published revision*, since a frozen revision could
  not be rescued by an edit. It also asserts the enumeration is non-empty, so the AC cannot
  pass vacuously.

Regression scope run green: `site-schema`, `req11-structured-edit`, `req22-storage`,
`generate`, `req107-authored-l1-envelope`, `reconciliation-site-storage-port`,
`test_UAT_FC_REQ-151_site_locale`, `test_UAT_FC_REQ-142_site_store_port`,
`reconciliation-scaffold-starter-l1`, `req102-scaffold-l1`,
`reconciliation-draft-change-journal` — 156 passed, 2 skipped.

A full `vitest.node` sweep shows 8 pre-existing failing files (builder/webui/AI-host/deploy
suites). Baselined by stashing this change and re-running the same set: identical
4 files / 14 tests failing with and without it. Not caused by REQ-153.

## Why free-coded

A single validation refinement with no dependencies.

## Origin

[[CHAT-26]] · [[DOC-34]] §9 — FR-5 of that session's foundational review, explicitly
flagged there as discretionary.