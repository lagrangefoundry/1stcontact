---
uid: report-67d5eb6d
id: REPORT-11408
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T11:12:36.609579+00:00'
updated_at: '2026-11-08T11:12:36.609579+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 15
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
    hypothesis: Nothing fails; attempt 1 was refused only because batch 0 dropped
      the structured blocked_by_ruling on the still-open code_frozen report, so iteration
      14s declined ruling is restored unchanged.
    instructions: 'Verification only; zero edits expected. Run test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
      in tests/reconciliation-consultant-image-generation.workers.test.ts with AC2381-AC2392
      and the test_UAT_FC_REQ-208_ suite; they passed in REPORT-11406. code_frozen
      stands (declined): do NOT edit apps/control-app/src/imagegen.ts or any production
      file. If a listed test is red, the only file you may edit is tests/reconciliation-consultant-image-generation.workers.test.ts,
      and only to restore real evidence for AC-2380 as currently worded; report the
      exact assertion and file:line. Do not extend AC-2380 to the stored material
      body or knowledge-base search: that is BUG-381 (bug-da5f9050) and fails on the
      frozen code by design.'
    test_scope: test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_
      or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_
      or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_
      or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_
    ladder:
      rung1: REQ-208 wants the vendor out of everything the model sees, but code_frozen
        stands for this batch because review refused the override (REPORT-11385),
        so rung 1 cannot be acted on here.
      rung2: 'Decides: at reconcile-src-BUNDLE-40, imagegen.ts:354-375 spreads the
        plugin body into tickets.create unchanged and attach (imagegen.ts:377-410)
        indexes it; the code stands, AC-2380 is scoped to the tools own channels,
        and the divergence is recorded on STORY-172.'
      rung3: The narrowed AC-2380 UAT stands and passes (REPORT-11406); the production
        fix and the re-widened AC are BUG-381 (bug-da5f9050), outside this bundle.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'The rule stands, decided at rung 2. The code_frozen override was refused
        automatically for batch 0 (rejected by a review for this batch, override_misjudged
        REPORT-11385), so the batch is decided at the next rung. The reference state
        (imagegen.ts:354-375, 377-410) stores and indexes the plugin body unchanged,
        and this mode freezes that code. Superseded does not apply (no AC or test
        changed after the report), and aligned_to_tip does not apply (REQ-208 orders
        the conflict the other way). The batch is fixed within the rule: AC-2380 is
        scoped to the channels the code keeps vendor-free, STORY-172 records the body/knowledge-base
        divergence as a Reconciliation Decision, and the fix is filed as BUG-381 (bug-da5f9050).'
      files:
      - tests/reconciliation-consultant-image-generation.workers.test.ts
---

# Fix Plan — Iteration 15 (attempt 2)

## Hypothesis
Nothing fails; attempt 1 of this iteration was refused by the validator only because batch 0 dropped the structured `blocked_by_ruling` on the builder's still-open `code_frozen` report, so this plan restores iteration 14's `declined` ruling unchanged.

## Analysis
- Failure set for report-d87c1fe2 is empty. REPORT-11406 (report-24d73c27): 244 passed, 0 failed, lint/build clean. Only xgd bookkeeping changed since iteration 14.
- Attempt 1 (REPORT-11407, report-912967f4) was rejected by `validate_fix_plan` with: "no ruling on the builder's blocked_by `code_frozen` report ... add a `blocked_by_ruling` of `superseded`, `aligned_to_tip` or `declined`". Its analysis said no `blocked_by` report was in play; that was wrong. The builder's `code_frozen` request against the AC-2380 batch is still open, and every plan that schedules those tests must rule on it. The ruling sat only in the `ladder` prose, which the validator does not read as a ruling.
- Iteration 14 (REPORT-11402, report-5715bca5) carried the correct ruling: `declined`. Nothing has changed it. A review had already refused the override (override_misjudged REPORT-11385), so a grant is refused automatically and the batch is decided at the next rung. `superseded` does not apply because no AC or test changed after the report. `aligned_to_tip` does not apply because REQ-208 orders the conflict the other way. This plan therefore restates `declined` with the same reason and the same file.
- This is not a repeated fix hypothesis against a live failure. Nothing is red. The batch is verification only, and it exists so the open block gets its ruling on the surface where it was raised.
- No builder `stuck` diagnosis is outstanding. No BUG-1067 XGD-tooling stuck reason applies.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor — weak-observation (by scope) — AC-2380 is deliberately narrowed. When BUG-381 (bug-da5f9050) lands, re-widen it to assert that the stored material body and the knowledge-base hit carry no vendor or model name.
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation — these cases self-skip when Chromium cannot launch, so a green run without Chromium is no geometry evidence. Quality reports should surface the skip count.
- test_UAT_FC_BUG-58_invite_modal_fits — environment gap — it fails in branch worktrees that lack built `dist-assets`. The harness should build or locate the assets instead of depending on checkout location.

## Batches
One batch, verification only, zero edits expected: AC-2380 together with AC-2381–AC-2392 and the `test_UAT_FC_REQ-208_` suite. This is the surface the open `code_frozen` report concerns. The batch carries the `declined` ruling and edits no production file.

## Resolution ladder (REQ-938)
- Batch 0 — decided at rung 2 (unchanged from iteration 14). Rung 1: REQ-208 wants the vendor kept out of everything the model sees, but `code_frozen` stands for this batch (REPORT-11385 refused the override). Rung 2: at reconcile-src-BUNDLE-40, imagegen.ts:354-375 spreads the plugin body into tickets.create unchanged, and attach (imagegen.ts:377-410) indexes it. The code stands, AC-2380 is scoped to the tool's own channels, and the divergence is recorded on STORY-172. Rung 3: the narrowed AC-2380 UAT stands and passes. The production fix is BUG-381 (bug-da5f9050), outside this bundle.
- `blocked_by` `code_frozen` — ruling: **declined** (see the batch's `blocked_by_ruling`).
