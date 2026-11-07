---
uid: report-1a48d9a4
id: REPORT-11203
type: report
title: 'Report: fix_plan for report-05835b4c'
created_by: xgd
created_at: '2026-11-07T23:43:24.398369+00:00'
updated_at: '2026-11-07T23:43:24.398369+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-05835b4c
  fix_iteration: 6
  items:
  - index: 0
    tests:
    - tests/reconciliation-identity-accounts.workers.test.ts::the account is a record
      people belong to test_UAT_AC2254_an_account_holding_two_people_makes_both_owners_of_its_new_business
    - AC-2254 (orphaned acceptance criterion)
    dependency_tests:
    - tests/reconciliation-identity-accounts.workers.test.ts::the account is a record
      people belong to test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value
    - tests/test_UAT_FC_REQ-203_signup_provisions_business.workers.test.ts::test_UAT_FC_REQ-203_accepting_the_terms_provisions_a_business_with_a_membership_and_an_open_grant
    hypothesis: tests/reconciliation-identity-accounts.workers.test.ts, the only file
      carrying test_UAT_AC2254_, fails at collection (or kills its workerd isolate)
      in the scoped run, most likely from its module-level eager import.meta.glob
      ?raw load of the whole apps/packages/tools tree, so none of its tests report
      and the suite exits 1 with 0 failures.
    instructions: 'AC-2254 is true of the code (reference identity.ts:793-851: provisionBusiness
      gives every person on the account an owner membership) and its UAT is logically
      correct, but the UAT never reports. In the quality run (report-ddccbb88) no
      test from tests/reconciliation-identity-accounts.workers.test.ts appears, and
      javascript-vitest exited 1 with 0 failed. Establish this first: run the workers
      project with the batch test_scope as the -t filter over the full scoped file
      set (not the file alone) and read the ''Failed Suites'' / collection or worker-crash
      output for that file. The evidence gap to close: AC-2254 must have a test_UAT_AC2254_
      UAT that collects and passes inside the scoped run. The expected root cause
      is the eager whole-product ?raw glob that only the AC2257 source scan needs,
      which is a filesystem concern that vitest.workers.config.mts routes to the node
      project. Fix that root cause rather than the symptom, so the AC2254 behavioural
      test runs on real D1 in workerd unchanged in what it asserts and AC2257 keeps
      a passing UAT. Confirm afterwards that the suite exits 0, not just that 0 tests
      failed. No production code changes; this is reconcile mode and the code is correct.'
    test_scope: test_UAT_AC2254_ or test_UAT_AC2257_ or test_UAT_AC1741_ or test_UAT_AC2255_
      or test_UAT_AC2256_ or test_UAT_FC_REQ-203_
    ladder:
      rung1: No intent in scope retires AC-2254; REQ-203 depends on provisionBusiness
        making every person on the owning account an owner, so the AC stands.
      rung2: 'Decided here: at reconcile-src-BUNDLE-38, apps/control-app/src/identity.ts:793-851
        provisionBusiness reads peopleOnAccount (l.824) and inserts an owner/active
        membership per person (l.851), so the behaviour exists.'
      rung3: The AC2254 test stands as written; only its delivery (the file failing
        to collect in the scoped run) is fixed, with no production change.
---

# Fix Plan — Iteration 6

## Hypothesis
AC-2254's only UAT lives in `tests/reconciliation-identity-accounts.workers.test.ts`, and that file contributes no results to the scoped run. Every one of its tests is missing from the report, while the suite exits 1 with 0 failed tests. So the file fails at collection, or crashes its workerd isolate, rather than failing an assertion. The likeliest cause is the module-level eager `import.meta.glob(['../apps/**','../packages/**','../tools/**'], {query:'?raw', eager:true})` that the AC2257 source scan needs.

## Analysis
- The quality report (report-ddccbb88, commit cf54c3d0) shows lint, build and preflight green, and 204 tests passed with 0 failed. The `javascript-vitest` suite still reports `exit_code: 1`. Vitest returns 1 with zero failed tests when a test FILE fails to collect ("Failed Suites") or its worker dies, and the gate does not count that as a failed test.
- `test_UAT_AC2254_` is in the scoped filter (report line 167). No result name in the report comes from `reconciliation-identity-accounts.workers.test.ts`. Its siblings (`test_UAT_AC1741_business_key_is_opaque…`, `test_UAT_AC2255_…`, `test_UAT_AC2256_…`, `test_UAT_AC2257_only_the_ownership_question_reads_role…`) are absent too. The AC1741/AC1742/AC2115/AC2257 results that DID pass come from other files with different test names. So the whole file is absent, not one test. AC2254 has no other UAT anywhere in `tests/`, which is why it is the lone orphan.
- The file's imports all resolve: `newId` is re-exported at `identity.ts:439`, every other identity/people export exists, and `tests/support/{add-and-invite,contact,invite-account}.ts` exist with matching signatures. That rules out a missing-export failure, which was the failure class story-7b1025b8 fixed earlier (report-72de7cec: `invitePerson` removed).
- The distinguishing feature of this file is the module-level eager `?raw` glob over the entire product tree, loaded into workerd. `vitest.workers.config.mts` itself says filesystem-touching tests belong to the node project. The builder's assessment for the previous batch (comment-64cb8b31) also records that the whole-scope filter run "crashed earlier (exit 137)", and the builder then ran files individually. That run never exercised this file inside the scoped run.
- Rung 2 confirms the behaviour is real. At `reconcile-src-BUNDLE-38`, `apps/control-app/src/identity.ts:793-851`, `provisionBusiness` reads `peopleOnAccount` (line 824) and writes an `owner`/`active` membership for each person (line 851). The AC is true of the reference and the test asserts it correctly, so this is an evidence-delivery defect, not a product or AC defect.
- Not verified locally: workers tests cannot run in this sandbox (`listen EPERM 127.0.0.1`). The collection-failure diagnosis comes from the report's exit code and missing results, not from a traceback. The builder must read the actual "Failed Suites" output first.
- History: AC-2254 is new to this subject. Iterations 1–5 addressed other orphans and the stale-import files (AC-2132–2142, AC-2203–2210). This hypothesis has not been tried before.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-identity-accounts.workers.test.ts::test_UAT_AC2257_only_the_ownership_question_reads_role_and_owner_is_the_only_value` — infra-reuse-gap / wrong pool — a repository source scan via an eager whole-tree `?raw` glob inside workerd. The REQ-190/194 scans' node-project shape (real fs) is the registered pattern, and the scan half belongs there.
- `tests/reconciliation-identity-accounts.workers.test.ts::test_UAT_AC2257_…` — weak-observation — the hard counts (`toHaveLength(3)` `'owner'` literals in identity.ts) break on any comment-free refactor. A behavioural assertion would be sturdier than a literal census.

## Batches
One batch. There is a single orphan, a single file, and the production code is correct. The batch carries the AC2254 UAT plus the sibling ACs that share its file, so whatever restores collection is validated for all of them.

## Resolution ladder (REQ-938)
- Batch 0: decided at rung 2. No intent in scope retires AC-2254: REQ-203 relies on `provisionBusiness` ("an `owner` membership for **every person on the owning account**"). The reference implements it at `identity.ts:793-851`. The test stands; the fix is making it run in the scoped quality pass. No production change, no override.
