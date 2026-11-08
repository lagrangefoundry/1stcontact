---
uid: report-c877f8d0
id: REPORT-11409
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T11:17:47.642185+00:00'
updated_at: '2026-11-08T11:17:47.642185+00:00'
completed_at: null
last_field_updated: created_at
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
  fell_through:
  - 'batch 0: the instructions name production files that `code_frozen` freezes in
    reconcile mode (apps/control-app/src/imagegen.ts) and the batch grants no `code_frozen`
    override naming them. Grant the override (the rule is overridable), or change
    the plan so the batch does not edit them'
---

{
  "items": [
    {
      "index": 0,
      "tests": [
        "tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor"
      ],
      "dependency_tests": [
        "test_UAT_AC2381_",
        "test_UAT_AC2382_",
        "test_UAT_AC2383_",
        "test_UAT_AC2384_",
        "test_UAT_AC2385_",
        "test_UAT_AC2386_",
        "test_UAT_AC2387_",
        "test_UAT_AC2388_",
        "test_UAT_AC2389_",
        "test_UAT_AC2390_",
        "test_UAT_AC2391_",
        "test_UAT_AC2392_",
        "test_UAT_FC_REQ-208_"
      ],
      "hypothesis": "Nothing fails; attempt 1 was refused only because batch 0 dropped the structured blocked_by_ruling on the still-open code_frozen report, so iteration 14s declined ruling is restored unchanged.",
      "instructions": "Verification only; zero edits expected. Run test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor in tests/reconciliation-consultant-image-generation.workers.test.ts with AC2381-AC2392 and the test_UAT_FC_REQ-208_ suite; they passed in REPORT-11406. code_frozen stands (declined): do NOT edit apps/control-app/src/imagegen.ts or any production file. If a listed test is red, the only file you may edit is tests/reconciliation-consultant-image-generation.workers.test.ts, and only to restore real evidence for AC-2380 as currently worded; report the exact assertion and file:line. Do not extend AC-2380 to the stored material body or knowledge-base search: that is BUG-381 (bug-da5f9050) and fails on the frozen code by design.",
      "test_scope": "test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_ or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_ or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_ or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_",
      "ladder": {
        "rung1": "REQ-208 wants the vendor out of everything the model sees, but code_frozen stands for this batch because review refused the override (REPORT-11385), so rung 1 cannot be acted on here.",
        "rung2": "Decides: at reconcile-src-BUNDLE-40, imagegen.ts:354-375 spreads the plugin body into tickets.create unchanged and attach (imagegen.ts:377-410) indexes it; the code stands, AC-2380 is scoped to the tools own channels, and the divergence is recorded on STORY-172.",
        "rung3": "The narrowed AC-2380 UAT stands and passes (REPORT-11406); the production fix and the re-widened AC are BUG-381 (bug-da5f9050), outside this bundle."
      },
      "blocked_by_ruling": {
        "blocked_by": "code_frozen",
        "ruling": "declined",
        "reason": "The rule stands, decided at rung 2. The code_frozen override was refused automatically for batch 0 (rejected by a review for this batch, override_misjudged REPORT-11385), so the batch is decided at the next rung. The reference state (imagegen.ts:354-375, 377-410) stores and indexes the plugin body unchanged, and this mode freezes that code. Superseded does not apply (no AC or test changed after the report), and aligned_to_tip does not apply (REQ-208 orders the conflict the other way). The batch is fixed within the rule: AC-2380 is scoped to the channels the code keeps vendor-free, STORY-172 records the body/knowledge-base divergence as a Reconciliation Decision, and the fix is filed as BUG-381 (bug-da5f9050).",
        "files": [
          "tests/reconciliation-consultant-image-generation.workers.test.ts"
        ]
      }
    }
  ]
}