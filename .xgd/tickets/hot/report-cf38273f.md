---
uid: report-cf38273f
id: REPORT-11498
type: report
title: 'Report: fix_plan for STORY-159'
created_by: xgd
created_at: '2026-11-08T15:39:19.499621+00:00'
updated_at: '2026-11-08T15:39:19.499621+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-159
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2044_capture_site_returns_bundle_counts_refusals_and_reference_report
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2080_deployed_capture_site_writes_one_reference_ticket_with_a_record_per_member
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2081_reference_title_is_page_title_and_body_opens_with_link_and_measured_facts
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2082_own_domain_capture_is_republishable_other_domains_are_exportable
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2083_recapture_updates_same_ticket_skips_unchanged_and_detaches_superseded_members
    - tests/test_reconciliation_capture_site_reference_material.workers.test.ts::test_UAT_AC2084_no_store_or_failed_adoption_keeps_bundle_and_reports_why
    dependency_tests:
    - test_UAT_AC2045_
    - test_UAT_AC2046_
    - test_UAT_AC2047_
    - test_UAT_AC2048_
    - test_UAT_AC2049_
    - test_UAT_AC2050_
    - test_UAT_AC2051_
    - test_UAT_AC2052_
    - test_UAT_AC2053_
    - test_UAT_AC2465_
    - test_UAT_AC2466_
    hypothesis: tests/test_reconciliation_capture_site_reference_material.workers.test.ts
      calls ticketStoreFor(env) without the required Scope (stores() at line 75) and
      route(req, env, { launch }) with deps in the scope slot (line 398), so ticketStoreFor
      reads scope.businessId of undefined and /api/ai/session returns 500.
    instructions: 'Production is correct and frozen; the adoption wiring from iteration
      2 is in place (router.ts:286-303). The evidence is broken only by stale call
      shapes in this test file. Both ticketStoreFor (tickets.ts:641) and route (router.ts:1124)
      take a business Scope. In stores() (line 75), pass the scope as the second argument:
      ticketStoreFor({ DB, BLOBS }, { businessId: tenantId }). At line 398, call route(jsonRequest(path,
      body), workerEnv(TENANT), { businessId: TENANT }, { launch }), matching tests/reconciliation-assistant-looking-surface-worker.workers.test.ts:237.
      Grep the file for any other ticketStoreFor/route call with the old shape and
      fix it the same way. Do not change assertions, ACs or production code. All six
      tests must pass on real wiring, with AC-2080 showing reference.adopted === true,
      and AC-2045..2053/2465/2466 must stay green.'
    test_scope: test_UAT_AC2044_ or test_UAT_AC2080_ or test_UAT_AC2081_ or test_UAT_AC2082_
      or test_UAT_AC2083_ or test_UAT_AC2084_ or test_UAT_AC2045_ or test_UAT_AC2046_
      or test_UAT_AC2047_ or test_UAT_AC2048_ or test_UAT_AC2049_ or test_UAT_AC2050_
      or test_UAT_AC2051_ or test_UAT_AC2052_ or test_UAT_AC2053_ or test_UAT_AC2465_
      or test_UAT_AC2466_
    ladder:
      rung1: No intent in scope asks for an unscoped ticket store or route; business
        scoping supersedes the env-var tenant, so rung 1 does not favour the old call
        shape.
      rung2: At reconcile-src-BUNDLE-41, ticketStoreFor (tickets.ts:1088-1094) and
        route (router.ts:3506-3512) both require a Scope argument, so the test call
        sites change to match; this rung decides.
      rung3: The behavioural assertions for AC-2044 and AC-2080..2084 stand unchanged;
        only the fixture call shapes are corrected.
---

# Fix Plan — Iteration 3

## Hypothesis
The six failures are test-side signature drift in `tests/test_reconciliation_capture_site_reference_material.workers.test.ts`. Its `stores()` helper calls `ticketStoreFor(env)` without the required `Scope` argument, and AC-2080 calls `route(request, env, { launch })` with the router deps in the `scope` position. Both functions now take a business `Scope` (`ticketStoreFor(env, scope, opts)` and `route(request, env, scope, deps, ctx)`).

## Analysis
- This is a new hypothesis. Iteration 2's hypothesis was the missing `adoptCapture` wiring in `sessionFidelity`. That wiring is now present in the working tree (`apps/control-app/src/router.ts:286-303` imports and calls `adoptCapture`), and the "no corpus" assertion failure no longer appears.
- Failure signature (report-52ab2658): five tests (AC-2044 :229, AC-2081 :447, AC-2082 :493, AC-2083 :523, AC-2084 :603) throw `TypeError: Cannot read properties of undefined (reading 'businessId') at ticketStoreFor (tickets.ts:646)` from `stores()` at test line 75. The helper passes `{ DB, BLOBS, TENANT_ID }` as the only argument, so `scope` is undefined.
- AC-2080 fails at line 401 with `expected 500 to be 200` on `/api/ai/session`. Line 398 calls `route(jsonRequest(path, body), workerEnv(TENANT), { launch })`. The `{ launch }` object lands in the `scope` parameter, the deps (including the browser launcher) are lost, and the route errors. Line 417 then calls `stores(TENANT)` and would hit the same TypeError.
- Reference state `reconcile-src-BUNDLE-41`:
  - `apps/control-app/src/tickets.ts:1088-1094`: `ticketStoreFor(env: TicketStoreEnv, scope: Scope, opts = {})`, with `const tenantId = scope.businessId`.
  - `apps/control-app/src/router.ts:3506-3512`: `route(request, env, scope: Scope | null, deps: RouterDeps = {}, ctx?)`.
  - The working tree has the same signatures (tickets.ts:641-646, router.ts:1124-1130).
- Precedent in passing tests:
  - `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts:237` calls `route(request(path, body), workerEnv(), { businessId: TENANT }, { launch })`.
  - `tests/test_UAT_FC_REQ-166_capture_site_adopts.workers.test.ts:70-72` calls `ticketStoreFor(env, { businessId: tenantId })`.
- No production change is needed and no mode rule is in the way. This is a UAT-only correction, which reconcile mode permits.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-material-ingestion.workers.test.ts (lines 151, 195, 268, 279, 394, 406, 488, 561) — inter-test signature drift — `ticketStoreFor(routerEnv(...))` passes no scope and will throw the same `businessId` TypeError when these tests run; pass `{ businessId: tenant }`.
- tests/reconciliation-material-content-type-resolution.workers.test.ts:121,167; tests/reconciliation-material-text-comment.workers.test.ts:97,132; tests/reconciliation-guarded-fetch.workers.test.ts:135,480,498,637; tests/reconciliation-site-asset-placement.workers.test.ts:149,307; tests/reconciliation-site-asset-promotion.workers.test.ts:271,436; tests/reconciliation-material-blob-storage.workers.test.ts:126,224,284,285,373 — same one-argument `ticketStoreFor` drift — add the scope argument.

## Batches
One batch with all six failing tests. They share one file and one root cause (the scope parameter added to `ticketStoreFor` and `route`). The other tests in the scoped suite (AC-2045..2053, AC-2465, AC-2466) are kept green as blast radius.

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 2**.
  - Rung 1: no intent in scope asks for an unscoped ticket store or an unscoped route. Business scoping (REQ-168 lineage) supersedes the env-var tenant.
  - Rung 2: the reference state's `ticketStoreFor` (tickets.ts:1088-1094) and `route` (router.ts:3506-3512) both require a `Scope`. That is what the user runs, so the test call sites change. The ACs' behavioural assertions are untouched.
  - Rung 3: the assertions stand; only the fixture call shapes are wrong.
