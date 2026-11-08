---
uid: report-ed5966c2
id: REPORT-11277
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T04:56:02.431653+00:00'
updated_at: '2026-11-08T04:56:02.431653+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 4
  items:
  - index: 0
    tests:
    - a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft
    - a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant
    - AC-2025 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes
    - test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route
    - test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working
    hypothesis: tests/reconciliation-assistant-looking-surface-worker.workers.test.ts
      calls route(request, env, deps) with three args, so deps lands in route scope
      parameter (router.ts:1075-1081), scope.businessId is undefined, and /api/ai/session
      returns 500.
    instructions: 'Both failures are 500s on the first /api/ai/session call (lines
      164 and 232), and they are caused by the test, not the product. The local chat
      helpers at lines 161 and 228 call route(request(path, body), env, deps), but
      route takes (request, env, scope, deps, ctx), so the deps object is read as
      the scope and the real deps default to {}. Fix the test to pass a real scope
      third and the deps fourth: route(request(path, body), workerEnv(), { businessId:
      TENANT }, { launch: browser.launch }) for AC2025, and route(request(path, body),
      blind, { businessId: TENANT }, {}) for AC2024. Import the Scope type from apps/control-app/src/scope
      if needed. TENANT (looking) is the business the Worker dev-open scope resolves
      to (scope.ts: businessId = env.TENANT_ID), and it is the one the test seeds
      through worker.fetch and reads back through forTenant(TENANT). Leave every assertion
      unchanged; follow the call shape of reconciliation-assistant-looking-surface-business.workers.test.ts.
      No production change is expected. If either test still fails after the call
      is corrected, report the new failure rather than editing production code. The
      orphan AC-2025 clears when its UAT passes.'
    test_scope: test_UAT_AC2025_ or test_UAT_AC2024_ or test_UAT_AC2372_ or test_UAT_AC2373_
    ladder:
      rung1: No intent in scope addresses how the UAT invokes route; rung 1 does not
        decide.
      rung2: 'Decided: at reconcile-src-BUNDLE-40 route takes scope as its third parameter
        (router.ts:3506-3512), and dev-open scope is { businessId: TENANT_ID } (scope.ts:391-394);
        the three-argument call disagrees, so the test changes.'
      rung3: Assertions stand unchanged; only the call shape is corrected.
---

# Fix Plan — Iteration 4

## Hypothesis
The two Worker UATs in `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` call `route(request, env, deps)` with three arguments, but `route` is `route(request, env, scope, deps, ctx)`. The deps object lands in the `scope` slot, `scope.businessId` is undefined, and `/api/ai/session` answers 500.

## Analysis
- This is the resubmission of iteration 4 attempt 0 (REPORT-11276). The validator rejected that plan only on its `dependency_tests`, which were written as describe-prefixed names containing spaces (`fix_plan_filter_rejected`, seq 1221). It raised no ruling or frozen-path problems. The diagnosis is unchanged. This attempt lists dependency tests by their bare `test_UAT_...` names and scopes by AC tokens.
- The builder has not yet acted on this hypothesis. No `batch_fix_assessment` exists for it; the only assessments, REPORT-6786 and REPORT-6791 (2026-10-27), concern the old `logDir`/AC1057 issue. The test file still holds the three-argument calls at lines 161 and 228.
- Failures: AC2025 at line 164 and AC2024 at line 232. Both are `expected 500 to be 200` on the first `/api/ai/session`. Seeding goes through `worker.fetch`, which resolves scope itself, and line 135 passes, so the break is specific to the direct `route(...)` calls.
- `route` signature: branch `apps/control-app/src/router.ts:1075-1081`; reference `reconcile-src-BUNDLE-40:apps/control-app/src/router.ts:3506-3512`. `Scope` is `{ businessId: string }` (`scope.ts:44-46`).
- In dev-open mode the Worker resolves scope to `{ businessId: env.TENANT_ID }` (`reconcile-src-BUNDLE-40:apps/control-app/src/scope.ts:391-394`). The test seeds with `TENANT_ID: 'looking'` and reads back via `forTenant(TENANT)`. So the scope passed to `route` must be `{ businessId: TENANT }` for seed, chat and read-back to address the same business.
- The sibling file `reconciliation-assistant-looking-surface-business.workers.test.ts` (lines 99-113 and 127-136) passes `route(request, env, scope, deps)` correctly, and its AC2024/AC2372/AC2373 tests pass.
- The orphan AC-2025 is a consequence: its only UAT fails. It clears when that test passes.
- No production change is indicated. No cross-suite contamination: both tests fail deterministically for a signature reason.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-looking-surface-worker.workers.test.ts::test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft — weak-observation — `BROWSER_BINDING` is a stub that is never exercised (the launch seam supplies the browser), so the test does not prove the binding's presence is what enables looking; consider asserting that the same deps without the binding offer no looking ops.

## Batches
One batch: both failing UATs plus the orphan AC share one root cause in one test file. The passing sibling Worker UATs (AC2024 no-bucket, AC2372, AC2373) are dependency tests to guard the router/chat-host path.

## Resolution ladder (REQ-938)
- Batch 0, decided at rung 2. No intent in scope speaks to the test's call shape (rung 1). The reference `route` takes scope as its third parameter (`router.ts:3506-3512`), and dev-open scope is `{ businessId: TENANT_ID }` (`scope.ts:391-394`). The test's three-argument call disagrees with the reference, so the test changes and its assertions stay.
