---
uid: request-18a48d63
id: REQ-143
type: request
title: 'The Cloudflare SiteStore: definitions in D1, bytes in R2'
created_by: xgd
created_at: '2026-08-15T20:31:46.590606+00:00'
updated_at: '2026-08-15T20:49:28.847668+00:00'
completed_at: null
last_field_updated: ready_since
status: ready_to_implement
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-141
  - REQ-142
  ready_since: '2026-08-15T20:49:28.073616+00:00'
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

The component is already installed in the shared artifact store this repo resolves from,
alongside `ai` and the `webui-*` components.

## 3. What this buys that the filesystem never had

[[REQ-142]] AC-5 requires a multi-file write to be one port call. Here it becomes one
`db.batch()` — so `site.json` plus N pages either all land or none do. The filesystem store is
**not** atomic there today; this is a genuine improvement, not parity.

## 4. Risk to name up front

The ticketing component's D1 code is exercised **inside workerd against a local miniflare D1
binding** — that is what its 69 tests do, and they pass. What is *not* yet proven anywhere in
lagrange-framework is **deployed remote D1**: no `wrangler.toml` and no `d1_databases` binding
exists in that repo, and its showcase runs a `node:sqlite` shim because a browser tab cannot
reach D1. So local confidence is high and first-remote-deploy is a real, if bounded, unknown —
latency, D1 limits, bindings in a live Worker. Budget for it rather than discovering it.

## 5. Deliverables

- D1 schema + migrations under `db/migrations/` for sites, pages and tenancy.
- A `D1R2SiteStore` implementing [[REQ-142]]'s port; definitions to D1, assets to R2.
- Version-CAS conflict surfaced as a typed error the builder can report, not a silent overwrite.
- An import path from the existing on-disk store, so `storage/sites/` seeds D1 rather than being
  retyped. `1c deploy` already ships `source/` to R2, so a site's bytes are largely there.
- `d1_databases` and `r2_buckets` bindings on `control-app`, repeated under `[env.production]`
  (named environments do **not** inherit bindings — `public-site`'s config says so explicitly,
  and see [[REQ-144]] for the live bug caused by forgetting it).

## 6. Acceptance criteria

1. Every UAT proving [[REQ-142]]'s port against the fs adapter passes against this one, from the
   workerd project, unchanged. One port, one contract, two adapters.
2. A concurrent-write UAT proves version CAS: the losing writer gets a typed conflict error and
   the store is left holding exactly one of the two writes.
3. A multi-page write UAT proves atomicity — an injected mid-batch failure leaves *no* partial
   state, which is a behaviour the fs adapter cannot satisfy.
4. A tenant-scoping UAT proves a handle for tenant A cannot read or write tenant B's site, and
   that an unknown tenant is a validation error rather than a silent default.
5. Asset bytes round-trip through R2 with correct content types.
6. A site imported from `storage/sites/` renders byte-identically from the D1/R2 store and the
   filesystem store.
7. Clean `pnpm -r build` and typecheck.

## Origin

[[CHAT-25]]. Supersedes the pre-[[DOC-12]] schema sketch in [[REQ-7]], which should be closed or
rewritten rather than implemented — it carries its own warning that it predates the model.