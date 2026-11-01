---
uid: report-5b83c2c7
id: REPORT-7843
type: report
title: 'Report: fix_plan for story-e674c60a'
created_by: xgd
created_at: '2026-11-01T20:37:20.615196+00:00'
updated_at: '2026-11-01T20:37:20.615196+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e674c60a
  items:
  - index: 0
    tests:
    - tests/reconciliation-builder-businesses-endpoint.workers.test.ts::story-e674c60a
      — the businesses endpoint test_UAT_AC2144_businesses_endpoint_reports_account_and_every_membership_in_one_call
    dependency_tests: []
    hypothesis: The AC-2144 UAT imports provisionInvite from apps/control-app/src/identity.ts,
      which REQ-186 deleted in favour of the inviteAccount fixture in tests/support/invite-account.ts,
      so the test throws 'provisionInvite is not a function' at line 107 and AC-2144
      shows as orphaned.
    instructions: 'AC-2144''s only evidence never reaches its assertions: tests/reconciliation-builder-businesses-endpoint.workers.test.ts
      imports `provisionInvite` from identity.ts, and production no longer has it
      (REQ-186 removed it on purpose; see the comments at identity.ts:20 and tests/support/invite-account.ts:10-31).
      Re-seed the account through the shipped path: make the file''s `invite()` helper
      call `inviteAccount(identityEnv(), seed)` from `./support/invite-account` (same
      seed fields: email, accountName, displayName, endsAt; it returns user and businessId),
      then keep calling `acceptTerms(identityEnv(), result.user.id)`. tests/test_UAT_FC_REQ-178_businesses.workers.test.ts
      is the precedent for this. Fix the `Parameters<typeof provisionInvite>[1]` type
      to use `AccountSeed`, and update the header comment that names `provisionInvite`.
      Leave every assertion as it is. In particular keep `body.account`: the working-tree
      router returns `account`, and the reference''s rename to `person` belongs to
      REQ-194, which is not in this bundle. Production code is correct and must not
      change. AC-2144 needs no edit, and its orphan flag clears when this test passes.'
    test_scope: test_UAT_AC2144_
    ladder:
      rung1: 'Decided here: REQ-186 (in scope) deleted provisionInvite from production
        and moved the person+first-business composite into the inviteAccount test
        fixture, so the test must change, not the code.'
      rung2: 'Agrees: reconcile-src-BUNDLE-36:apps/control-app/src/identity.ts exports
        no provisionInvite, and tests/support/invite-account.ts at the reference provides
        inviteAccount.'
      rung3: AC-2144's assertions stand unchanged; only the test's seeding call changes.
  fix_iteration: 4
---

# Fix Plan — Iteration 4

## Hypothesis
`tests/reconciliation-builder-businesses-endpoint.workers.test.ts` imports `provisionInvite` from `apps/control-app/src/identity.ts`, a production function REQ-186 deleted (and replaced with the test fixture `inviteAccount` in `tests/support/invite-account.ts`), so the AC-2144 UAT throws `TypeError: provisionInvite is not a function` at line 107 before asserting anything — and AC-2144 is reported orphaned only because its single test never passes.

## Analysis
- Both failures come from one cause. The quality report (report-b2ebc42b) shows the vitest failure message
  `TypeError: (0 , __vite_ssr_import_4__.provisionInvite) is not a function at invite (tests/reconciliation-builder-businesses-endpoint.workers.test.ts:107:24)`.
  The "JUnit XML missing" text is only the runner's synthesised wrapper. The AC-2144 orphan entry (acceptance_criterion-76d82fd2) says "has no passing test in this intent's scope", which is the same failure seen from the capability-matrix side. No second defect.
- `identity.ts` (working tree, and also at `reconcile-src-BUNDLE-36`) exports no `provisionInvite`. Its header comment at `identity.ts:20` and `tests/support/invite-account.ts:10-31` record that REQ-186 (in scope) removed it on purpose. The person and their first business are now two shipped steps (`invitePerson` and then `provisionBusiness`). The composite survives only as the fixture `inviteAccount(env, seed)`, which takes the same seed fields (`email`, `accountName`, `displayName`, `endsAt`, …) and returns `{ user, businessId, siteSlug, created }`. `invitePerson` writes a `users` row only, with no platform-tenant membership, so the test's exact `[live, lapsed]` membership assertion still holds.
- Precedent: `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts` already drives the same endpoint through `inviteAccount`.
- History: iterations 1–3 (report-e5febd9c, report-17b2069d, report-103eb41e, with assessments report-555646dd and report-bd553ac0) were about AC960/964/967/975/1400, which all pass now. AC-2144 is new in this iteration. Its test was added by the UAT-generation commit `b6d4b3ce87`, written against the pre-REQ-186 API. This hypothesis has not been tried before.
- The production code is correct. The working-tree `router.ts:609,659` returns `account: { name: display_name, email }`, which matches AC-2144 and the test. Note: at the reference the field is renamed `person` by REQ-194, but REQ-194 is NOT in this bundle's scope. The builder must NOT rename the field or change the assertion to `person`.
- No isolation/contamination pattern. The failure is deterministic and happens at import/call time.

## Spec Changes Made
none. AC-2144 is correct as written and stays unchanged. Its orphan status clears once its test passes.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-terms-of-service-gate.workers.test.ts::test_UAT_AC2132_* (and AC2133/2134/2139 in the same file) — stale-import (out of this story's scope) — it imports the same deleted `provisionInvite` (lines 6 and 122), so it fails the same way and should move to `inviteAccount` when its owning story is fixed. Do not touch it in this batch.

## Batches
One batch, containing only the AC-2144 UAT. The fix is test-only: replace the `provisionInvite` import and its use in the `invite()` helper with the `inviteAccount` fixture from `./support/invite-account`. Keep `acceptTerms` after it, and keep every assertion. The `stranger` call goes through the same helper.

## Resolution ladder (REQ-938)
- Batch 0: decided at **rung 1**. REQ-186 (in scope) deleted `provisionInvite` from production and moved the composite into the `inviteAccount` test fixture, so the test, not the code, changes. Rung 2 agrees: `reconcile-src-BUNDLE-36:apps/control-app/src/identity.ts` exports no `provisionInvite`, and `tests/support/invite-account.ts` at the reference carries the fixture. The tests' assertions (AC-2144) stand unchanged.
