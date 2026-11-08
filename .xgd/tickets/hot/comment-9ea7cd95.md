---
uid: comment-9ea7cd95
id: COMMENT-8004
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T15:39:30.283429+00:00'
updated_at: '2026-11-08T15:39:30.283429+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cf38273f
  kind: note
---

I filed the iteration 3 fix plan as **REPORT-11498 (report-cf38273f)**: one batch, and it's a fix to the test file only.

**Root cause.** The production code is right; the test file still calls two functions in their old form:
- **Five tests (AC-2044, AC-2081 to 2084):** the `stores()` helper at `tests/test_reconciliation_capture_site_reference_material.workers.test.ts:75` calls `ticketStoreFor(env)` with no `Scope`. `tickets.ts:646` then fails reading `scope.businessId` of undefined.
- **AC-2080:** line 398 calls `route(req, env, { launch })`, so `{ launch }` lands in the `scope` slot and the browser setup is lost. `/api/ai/session` returns 500 instead of 200.

**Why this is new.** Iteration 2's problem was missing `adoptCapture` wiring in the router. That wiring is now in place at `router.ts:286-303`, and the "no corpus" failure no longer appears.

**Ruling.** Decided at rung 2 of the ladder: at `reconcile-src-BUNDLE-41`, both `ticketStoreFor` (`tickets.ts:1088-1094`) and `route` (`router.ts:3506-3512`) require a `Scope`. So the test calls change to match, with no override, AC edits or production changes. The builder is told to follow the existing pattern at `reconciliation-assistant-looking-surface-worker.workers.test.ts:237`. The other tests in the suite (AC-2045 to 2053, AC-2465 and AC-2466) are included as tests that must stay green.

**Same bug elsewhere.** About a dozen other workers test files still call `ticketStoreFor` with one argument (material-ingestion, guarded-fetch, site-asset-placement and site-asset-promotion, among others). They will hit the same TypeError when they run, so I listed them in the plan's weak-evidence flags.

A connection to `github.com:22` was blocked by the sandbox while the report was being filed. The report itself was created; whatever that connection was trying to sync may not have run.