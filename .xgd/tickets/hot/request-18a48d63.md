---
uid: request-18a48d63
id: REQ-143
type: request
title: 'The Cloudflare SiteStore: definitions in D1, bytes in R2'
created_by: xgd
created_at: '2026-08-15T20:31:46.590606+00:00'
updated_at: '2026-08-24T02:10:41.245869+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-141
  - REQ-142
  ready_since: '2026-08-15T21:31:06.025399+00:00'
  blocked_by: []
  not_blocked_by:
  - request-b18d2056
  - request-7bef34e0
  - request-23fd6e61
  - bundle-d9226698
  dependency_eval_state:
    evaluated_at: '2026-08-15T20:41:13.336513+00:00'
    evaluated_against:
    - request-b18d2056
    - request-7bef34e0
    - request-23fd6e61
    - bundle-d9226698
  commits:
  - working_sha: 96118c32cfc8495b6f7f2eff7046b518e267d84c
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b71a8641182d62dd46b5fa6d0cf78a582cff4eb7
    - 7ebc721b83ab6202fdec600cd0493b69964bac39
    - 761b7fbd0efa55515fdea9a8ddc5f9a38be91c4d
  version: 0.1.54
  chat_comment: comment-8536a49b
  bundled_in: bundle-b3b7c399
---

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