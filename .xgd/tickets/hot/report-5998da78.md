---
uid: report-5998da78
id: REPORT-11414
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T11:29:33.224057+00:00'
updated_at: '2026-11-08T11:36:47.161574+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  items:
  - index: 0
    tests:
    - tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
    dependency_tests:
    - test_UAT_AC2381_
    - test_UAT_AC2382_
    - test_UAT_AC2383_
    - test_UAT_AC2384_
    - test_UAT_AC2385_
    - test_UAT_AC2386_
    - test_UAT_AC2387_
    - test_UAT_AC2388_
    - test_UAT_AC2389_
    - test_UAT_AC2390_
    - test_UAT_AC2391_
    - test_UAT_AC2392_
    - test_UAT_FC_REQ-208_
    - test_UAT_FC_REQ-209_
    hypothesis: 'Nothing fails (REPORT-11413: 244 passed, 0 failed); iteration 17
      fell through only because its instructions named a frozen production path, so
      the same declined code_frozen ruling is restored with test-only instructions.'
    instructions: 'Verification only; zero edits expected. Run test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
      with AC2381-AC2392, the test_UAT_FC_REQ-208_ suite and the test_UAT_FC_REQ-209_
      suite; all passed in REPORT-11413. code_frozen stands (declined): no production
      file is edited in this batch. If a listed test is red, the only file you may
      edit is tests/reconciliation-consultant-image-generation.workers.test.ts, and
      only to restore real evidence for AC-2380 as currently worded; report the exact
      assertion and file:line. Do not widen AC-2380 to the stored material body or
      knowledge-base search, which is BUG-381 (bug-da5f9050). The REQ-209 font-metrics
      test (fix a5a337c47c) needs Chromium; if it skips for want of a browser, report
      it as skipped-unverified rather than editing it.'
    test_scope: test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_
      or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_
      or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_
      or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_
      or test_UAT_FC_REQ-209_
    ladder:
      rung1: REQ-208 wants the vendor out of everything the model sees, but code_frozen
        stands for this batch because review refused the override (REPORT-11385),
        so rung 1 cannot be acted on here.
      rung2: 'Decides: at reconcile-src-BUNDLE-40, imagegen.ts:354-375 spreads the
        plugin body into tickets.create unchanged and attach (imagegen.ts:377-410)
        indexes it; the code stands, AC-2380 is scoped to the tool''s own channels,
        and the divergence is recorded on STORY-172.'
      rung3: The narrowed AC-2380 UAT stands and passes (REPORT-11413); the production
        fix and the re-widened AC are BUG-381 (bug-da5f9050), outside this bundle.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'The rule stands, decided at rung 2. The code_frozen override was refused
        for this batch by review (override_misjudged, REPORT-11385), so the batch
        is decided at the next rung. The reference state (imagegen.ts:354-375, 377-410)
        stores and indexes the plugin body unchanged, and this mode freezes that code.
        Superseded does not apply (no AC or test changed after the report), and aligned_to_tip
        does not apply (REQ-208 orders the conflict the other way). The batch is fixed
        within the rule: AC-2380 is scoped to the channels the code keeps vendor-free,
        STORY-172 records the divergence as a Reconciliation Decision, and the fix
        is filed as BUG-381 (bug-da5f9050).'
      files:
      - tests/reconciliation-consultant-image-generation.workers.test.ts
  fix_iteration: 18
  batches_pending: false
---

# Fix Plan — Iteration 18

## Hypothesis
Nothing fails (scoped quality REPORT-11413: 244 passed, 0 failed); iteration 17's plan fell through only because its instructions named a production file frozen by code_frozen, so this iteration restores the same declined ruling with instructions that name test files only.

## Analysis
- Failure set for report-d87c1fe2 is empty. The latest scoped quality report (report-7b871496 / REPORT-11413, commit d2c5edb309) passed lint, build and 244 tests with 0 failures.
- Iteration 17 (report-c877f8d0) was a correct verification-only plan carrying a declined code_frozen ruling for AC-2380 (REQ-208 vendor leakage into the stored material body is BUG-381 / bug-da5f9050, outside this bundle). It fell through for one mechanical reason: the instructions text named a frozen production file path while the batch granted no override. The ruling itself was not faulted. This plan keeps the ruling and the ladder unchanged and removes every production path from the instructions.
- Latest builder assessment (report-d5c7cd7a, comment-be867814): AC1054/AC1817/AC1818 are no_change_needed and pass. test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved is fixed_unverified (fix a5a337c47c, a flat-capital fixture, is on HEAD); it cannot launch Chromium in the builder sandbox and skips with its reason. It is added to dependency_tests so the gate, which can run a browser, produces the missing evidence.
- No new hypotheses. The "nothing fails, verify only" hypothesis is not a repeated root-cause guess that keeps failing; there are no failures to clear.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation (environmental) — every case self-skips when Chromium cannot launch. A green run with these skipped is not evidence for STORY-173; the gate report should show them executed (skipped: 0) before sign-off.

## Batches
One verification batch (index 0): the AC-2380 UAT, with AC2381–AC2392, the REQ-208 suite and the REQ-209 suite as dependency tests. Zero edits are expected. One batch is enough because nothing is failing and there is nothing to split.

## Superseded blocked_by request (BUG-1535)
Not applicable. The code_frozen request is ruled **declined** (carried unchanged from iterations 14 and 17); see the ladder.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 2. At reconcile-src-BUNDLE-40 the image-generation store wrapper spreads the plugin body into the material ticket unchanged and indexes it on attach. Review refused the code_frozen override (REPORT-11385), so the code stands. AC-2380 is scoped to the tool's own channels and passes. The divergence is recorded on STORY-172 and the production fix is BUG-381 (bug-da5f9050), outside this bundle.