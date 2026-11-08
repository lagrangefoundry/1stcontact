---
uid: report-bc09699f
id: REPORT-11276
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T04:48:47.485137+00:00'
updated_at: '2026-11-08T04:48:47.485137+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  items:
  - index: 0
    tests:
    - a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft
    - a Worker-hosted consultant with no browser still edits test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant
    - AC-2025 (orphaned acceptance criterion)
    dependency_tests:
    - a Worker with a browser but no private bucket still edits test_UAT_AC2024_a_worker_with_a_browser_but_no_private_bucket_opens_an_editing_assistant_with_no_eyes
    - the Worker binds the looking surface to the request business test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route
    - a session has a bounded number of live-page looks test_UAT_AC2373_forty_live_looks_then_one_readable_refusal_while_every_other_tool_keeps_working
    hypothesis: tests/reconciliation-assistant-looking-surface-worker.workers.test.ts
      calls route(request, env, deps) with three args, so the deps object lands in
      route's scope parameter (router.ts:1075-1081), scope.businessId is undefined,
      and /api/ai/session throws a 500.
    instructions: 'Both failures are 500s on the first /api/ai/session call at lines
      164 and 232, caused by the test, not the product. The local chat helpers at
      lines 161 and 228 call route(request(path, body), env, deps), but route''s signature
      is route(request, env, scope, deps, ctx), so the deps object is read as the
      scope and real deps default to {}. Fix the test so it passes a real scope as
      the third argument and the deps as the fourth: route(request(path, body), env,
      { businessId: TENANT }, { launch: browser.launch }) for AC2025, and route(request(path,
      body), blind, { businessId: TENANT }, {}) for AC2024. TENANT (''looking'') is
      the business the Worker''s dev-open scope resolves to (scope.ts: businessId
      = env.TENANT_ID), and it is the one the test seeds through worker.fetch and
      reads back through forTenant(TENANT). Leave every assertion as it is. Production
      code is frozen and already matches the reference (sessionFidelity, and chatHost(env,
      requireScope(), deps, url.origin)). If AC2025 then fails further in, report
      the actual returned values rather than adjusting assertions. The orphan AC-2025
      clears when its UAT passes. Run the sibling business Worker tests to confirm
      they stay green.'
    test_scope: test_UAT_AC2024_ or test_UAT_AC2025_ or test_UAT_AC2372_ or test_UAT_AC2373_
    ladder:
      rung1: The intents in scope (REQ-157, story-58b2cec4) require a Worker-hosted
        consultant to be offered the looking surface when it has a browser and to
        still edit without one; they say nothing about route()'s argument order, so
        rung 1 does not decide.
      rung2: 'Decided here: at reconcile-src-BUNDLE-40, apps/control-app/src/router.ts:3506-3512
        declares route(request, env, scope: Scope | null, deps = {}, ctx?), and scope.ts:392-394
        resolves dev-open scope to { businessId: TENANT_ID }; the test''s three-argument
        call disagrees with the reference, so the test changes.'
      rung3: Not reached; the assertions themselves stand unchanged, and only the
        call shape of route() in the test is corrected.
  fix_iteration: 4
---

# Fix Plan — Iteration 4

## Hypothesis
Both Worker UATs in `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` call `route(request, env, deps)` with three arguments, but `route` is `route(request, env, scope, deps, ctx)`. The deps object lands in the `scope` slot and the real deps default to `{}`. `chatHost` then keys on `scope.businessId === undefined`, building the store and ticket store for no business, and `/api/ai/session` answers 500.

## Analysis
- Failures: AC2025 at line 164 and AC2024 ("worker without a browser binding") at line 232. Both are `expected 500 to be 200` on the first `/api/ai/session` call. Seeding goes through `worker.fetch` (line 126), which resolves scope itself, and returns 200 (line 135 passes). So the break is specific to the direct `route(...)` calls at lines 161 and 228.
- `route` signature on the branch is `apps/control-app/src/router.ts:1075-1081`, and at the reference `reconcile-src-BUNDLE-40:apps/control-app/src/router.ts:3506-3512`: `(request, env, scope: Scope | null, deps = {}, ctx?)`.
  - In AC2025 the injected `{ launch: browser.launch }` becomes the scope. `deps.launch` is then undefined, so even with a business the eyes would not get the fake browser.
  - In AC2024 `{}` becomes the scope, so `businessId` is undefined.
- The passing sibling file `tests/reconciliation-assistant-looking-surface-business.workers.test.ts` (lines 99-113 and 127-136) calls `route(request, env, scope, deps)` correctly. That is why its AC2024 / AC2372 / AC2373 tests pass and these two do not.
- Which business the test must use: in dev-open mode the Worker resolves scope to `{ businessId: env.TENANT_ID }` (`reconcile-src-BUNDLE-40:apps/control-app/src/scope.ts:392-394`). The test seeds through `worker.fetch` with `TENANT_ID: 'looking'`, and AC2024 reads back from `forTenant(TENANT)` (line 252). So the scope passed to `route` must be `{ businessId: TENANT }`, so that seed, chat and read-back all address the same business.
- The production wiring the tests exercise is already on the branch and matches the reference:
  - `sessionFidelity`: `router.ts:283-324` on the branch, `:660-671` at the reference.
  - `chatHost(env, requireScope(), deps, url.origin)`: `router.ts:2312` on the branch, `:8047` at the reference.
  - So no production change is indicated.
- Why this slipped through: the quality build reports "No tsconfig.json — type-check skipped (JS-only project)". The `Scope`-typed argument mismatch would be a `tsc` error, but no gate catches it for the `tests/` tree.
- Prior iterations (REPORT-6785/6788/6791, an earlier pass of this story) chased production-port hypotheses: `contentBlocksFrom`, the router fidelity wiring, and the `logDir` → `junctions` library break. The production ports have since landed. This hypothesis is new and sits in a different layer (the test's call shape), not a repeat.
- The orphan AC-2025 (acceptance_criterion-7cb814b7) has exactly one test, the failing AC2025 UAT. It clears when that test passes. No AC change is needed.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts` — infra-reuse-gap — the file hand-rolls its own `route(...)` caller. The sibling business test's `turn()`/`business()` helpers already pass scope and deps in the right positions. Sharing one helper would stop signature drift from recurring.
- `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts::test_UAT_AC2024_a_worker_without_a_browser_binding_still_opens_an_editing_assistant` — weak-observation — `expect(blind.BROWSER).toBeUndefined()` only proves the test's own destructuring. The real evidence is the absence of the looking ops in `offered` and the read-back, which are fine.

## Batches
One batch: the two failing Worker UATs plus the orphan AC-2025. They share one file and one root cause. The passing sibling Worker tests (AC2024 business variant, AC2372, AC2373) go in `dependency_tests` as blast radius, because they cover the same `chatHost` / `sessionFidelity` path.

Builder brief: in the failing file, pass a real scope `{ businessId: TENANT }` as `route`'s third argument and move the deps object into the fourth. That means `{ launch: browser.launch }` for AC2025 and `{}` for AC2024. Do not change any assertion. Do not touch production code: it is frozen in reconcile mode and already correct. If, after the fix, AC2025 fails further in (on the looking ops, the image block, or the preview URL), report what the code returns. Do not weaken the assertions to match.

## Resolution ladder (REQ-938)
- Batch 0 was decided at **rung 2**. The intents in scope (REQ-157 and story-58b2cec4) say nothing about `route`'s argument order. At the reference, `route` takes `scope` as its third parameter (`router.ts:3506-3512`), and dev-open scope is `{ businessId: TENANT_ID }` (`scope.ts:392-394`). The test disagrees with the reference, so the test changes and the code does not.
