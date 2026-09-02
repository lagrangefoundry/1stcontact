---
uid: report-0e1c0bee
id: REPORT-3293
type: report
title: 'Code Review: request-13a5e206'
created_by: xgd
created_at: '2026-09-02T01:32:36.266723+00:00'
updated_at: '2026-09-02T01:32:36.266723+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: request-13a5e206
  anchor_uid: request-13a5e206
---

# Code Review

**Result**: PASS

**Anchor**: request-13a5e206 (REQ-162) — mode `commits`

**Commits reviewed**: `8a4a23e1d4` (the implementation), `e0c632c535` + `510d408238` (version bumps 0.2.19 → 0.2.20, no behaviour). The two `kb: … prompt -> description` commits also in `main..HEAD` (`393a447a85`, `be4dfeff74`) belong to a different anchor and are out of scope here.

## Summary

The implementation matches the ticket's four deliverables and does so cleanly: the migration is the component's DDL plus the one documented `ALTER`, the store is tenant-scoped at construction with the blob store injected unscoped so `forTenant` binds every port from one validated id, the two buckets are separated at the binding boundary rather than by key convention, and the type pack states DOC-38 §9's fields with `republishable`/`exportable` required rather than defaulted. The security-critical claims (bucket separation, tenant barrier on rows *and* bytes) are asserted against real D1 and real R2 rather than argued from config. Two warnings below, neither a correctness defect in what shipped.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | success (0/0) | quality report `report-5f83e766` |
| Build | success | quality report says *"No tsconfig.json — type-check skipped (JS-only project)"* — **not true of this repo**, so the recorded gate is vacuous. Verified directly instead: `tsc --noEmit` clean in `apps/control-app` and in `tools/generate`. |
| Tests | recorded as `0 tests, 0 failed` — no test evidence in the report | Verified directly (below) |
| Coverage | not reported (0 tests) | — |

**The recorded quality reports carry no test evidence.** Every quality report in the reconcile range reads `Scoped quality: pass (0 tests, 0 failed)`. No gate *failed*, so this is not a gate failure — but it is not evidence either, so verification was performed directly in this session:

- `tests/test_UAT_FC_REQ-162_ticket_store_bindings.test.ts`, `tests/test_UAT_FC_REQ-143_store_bindings.test.ts`, `tests/reconciliation-product-ticket-store-schema.test.ts`, `tests/reconciliation-material-blob-storage.test.ts` → **17 passed, 1 failed**. The single failure is `reconciliation-product-ticket-store-schema.test.ts:111`, which spawns `wrangler d1 migrations apply --local`; wrangler dies with `listen EPERM 127.0.0.1` under this session's sandbox. Environmental, not a defect in the diff.
- `tests/reconciliation-1c-launcher-bootstrap.test.ts`, `tests/test_UAT_FC_REQ-150_plain_vite_bootstrap.test.ts` (the suites that import the modified `cli/assets.ts`) → **8 passed**.
- Full node project: started, ran several hundred tests with zero `FAIL`/`AssertionError` in the log, then had to be killed — it exceeds the time available here and several of its suites need a browser or a wrangler socket the sandbox denies. Reported as incomplete rather than as a pass.
- **The 15 workerd UATs could not be run here at all**: `@cloudflare/vitest-pool-workers` needs to `listen` on `127.0.0.1`, which this sandbox refuses (`EPERM`). The ticket's central evidence is therefore taken on the record of the reconcile run's own test_fix cycles, not re-executed by this review. Stated plainly because it is the one claim this review did not independently reproduce.

## External Interface Accessibility

New entry points wired in: **yes**, with one deliberate and declared exception.

| Surface | Wired | Evidence |
|---------|-------|----------|
| `productTypePack()` / `ticketStoreFor()` | exported | `apps/control-app/src/tickets.ts:88,274` |
| `TicketStoreEnv` in the Worker's env type | yes | `apps/control-app/src/router.ts:159` — `RouterEnv extends StoreEnv, TicketStoreEnv` |
| `BLOBS` binding, both wrangler halves | yes | `apps/control-app/wrangler.toml:165` and `:230` |
| `BLOBS` in the workerd test env | yes | `vitest.workers.config.mts:42` |
| `0003_ticket_store.sql` under `migrations_dir` | yes | `db/migrations/`, pinned by `test_UAT_FC_REQ-162 migrations_dir picks it up beside the existing two` |
| `0003` in the fixture migration list | yes | `tests/support/d1-site-factory.ts:48` |
| `1c assets` emits + reports the shim | yes | ran it: `ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js` |

**No production caller for `ticketStoreFor`** — declared out of scope by the ticket (`/api/tickets/*` belongs to REQ-161, "nothing yet calls one"). Not treated as dead code: the module is exercised end to end through the real env by the workerd UATs, and its wiring, bindings and migration are all reachable. Noted for accuracy: because `router.ts` imports only a *type*, `tickets.ts` and the generated `ticketing.js` shim are erased at build and are **not in the deployed Worker bundle today**, so the shim's resolution path is not yet exercised by a deploy. Checked separately — `esbuild --bundle` on `tickets.ts` resolves `./generated/ticketing` and the whole ticketing graph without error, so the shim works when a route does import it for value.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `apps/control-app/src/tickets.ts:216-225` | `TenantNotConfiguredError` is a verbatim duplicate of `apps/control-app/src/store.ts:37-46` — same class name, same message, different class object. `router.ts:621` already narrows with `err instanceof TenantNotConfiguredError` bound to the `store.ts` class, so when REQ-161 routes call `ticketStoreFor` that guard will not match and a missing `TENANT_ID` will fall through to a 500 instead of the intended handling. Should import or re-export the existing one. | Warning |
| `tools/generate/src/cli/assets.ts:259-270` | `TICKETING_EXPORTS` is documented as "what the Worker reaches for", but `MAX_BLOB_BYTES`, `MemoryBlobStore`, `TicketError` and `blobKey` have no consumer anywhere in `apps/`, `tests/` or `tools/`. The comment's stated protection also does not hold in the direction claimed: the generated `.d.ts` declares each listed name as `any` *from this list*, so an upstream rename would still typecheck and fail at runtime. It does protect the other direction (an unlisted name fails typecheck). Same shape as the pre-existing `AI_WORKER_EXPORTS`, so this is consistency with precedent rather than a new pattern. | Warning (low) |
| `db/migrations/0003_ticket_store.sql:83` | `ALTER TABLE tenants ADD COLUMN config` is not idempotent — a second application errors `duplicate column name`. Safe as used (wrangler applies a migration once; `applySchema()` runs once per workerd test file) and the constraint is documented in the file itself at :64-66. | Note, no action |
| `apps/control-app/src/tickets.ts:72` | `site_slug` on `MATERIAL_FIELDS` is a seventh field beyond DOC-38 §9's six. Optional, documented inline ("Absent = tenant-wide"), and useful to REQ-161's Library. Within the ticket's intent. | Note, no action |
| `apps/control-app/src/tickets.ts`, `db/migrations/0003_ticket_store.sql` | No debug code, no commented-out blocks, no TODO stubs. The hand-written `ProductTypePack` / `TicketStore` / `Ticket` interfaces over the untyped JS component follow the treatment `ai.ts` already establishes, with the rationale stated. | — |
| `tests/test_UAT_FC_REQ-143_store_bindings.test.ts` | The collateral change is correct and correctly motivated: the old `toHaveLength(2)` + one-distinct-value check over every `bucket_name` in the file was a count standing in for a pairing, and became wrong once a second bucket was added properly. Now pairs by binding name. | — |
| `apps/control-app/src/tickets.ts:279-289` | The register-if-absent read before `putTenant` is the right call — `putTenant` upserts and overwrites `status`, so unconditional registration would reactivate a suspended tenant. Blob store passed **unscoped** into the constructor so `forTenant` binds accessor and ports together, which is the component's single wiring point. | — |

## Checklist Compliance

No architecture, security, or design checklist reports exist for this project (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns empty for all three). Sections omitted.

## Smoke Test

Entry points tested:

1. **`1c assets`** (modified CLI) — ran `./bin/1c assets`. Completes and reports the new line: `ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js`. Writes `apps/control-app/src/generated/ticketing.js` (absolute re-export) and `ticketing.d.ts`. Working tree stayed clean, so the generated files are correctly gitignored. All 10 names in `TICKETING_EXPORTS` do exist upstream (verified against the component's `src/index.js`).
2. **`wrangler deploy --env production --dry-run`** — the production Worker bundles successfully and reports the bindings, including `env.BLOBS (1stcontact-material)` alongside `env.SITES (1stcontact-sites)`. The one warning is pre-existing and unrelated (`ACCESS_DEV_OPEN` not repeated under `env.production.vars`).
3. **`tickets.ts` as a bundle entry** (esbuild) — the `./generated/ticketing` shim and the whole ticketing graph resolve. The component's package root pulls no node builtins, confirming the module comment's claim that the root is the Worker-safe surface and `./node` is never named.

No API endpoint to exercise — none was added, by design.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:
- `apps/control-app/src/tickets.ts:216` — duplicate `TenantNotConfiguredError`. Import or re-export the one in `store.ts:37` rather than redeclaring it, so `router.ts:621`'s `instanceof` guard keeps working once REQ-161 wires routes to `ticketStoreFor`. This is the one finding worth carrying forward into REQ-161.
- `tools/generate/src/cli/assets.ts:259` — four names in `TICKETING_EXPORTS` have no consumer, and the list cannot catch an upstream rename the way its comment says it can. Low impact; matches the existing `AI_WORKER_EXPORTS` precedent, so fixing it is a two-list change or nothing.

**Verification gap (not a defect in the diff)**:
- The 15 workerd UATs — the ticket's primary evidence — could not be executed in this session's sandbox (`vitest-pool-workers` needs to bind a local socket; `EPERM`). Everything reachable without workerd was verified directly and passed.
