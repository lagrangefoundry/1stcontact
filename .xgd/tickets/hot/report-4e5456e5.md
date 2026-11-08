---
uid: report-4e5456e5
id: REPORT-11401
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T10:49:49.398966+00:00'
updated_at: '2026-11-08T10:49:49.398966+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 11
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
    hypothesis: Nothing fails; the remaining review gap 5(a) is a production defect
      (generatedMaterialStore.create in imagegen.ts stores and indexes the plugin's
      Provider/Model lines) that code_frozen forbids fixing here, so the block is
      declined, AC-2380 is scoped to the channels the code keeps vendor-free, and
      the fix moves to BUG-381.
    instructions: 'Verification only; zero edits expected. Run test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
      in tests/reconciliation-consultant-image-generation.workers.test.ts, with AC2381-AC2392
      and the test_UAT_FC_REQ-208_ suite. AC-2380 has been narrowed in place to the
      manual, the schema and the tool results and error text. The current UAT checks
      exactly those, so it should pass unchanged. Do NOT extend it to read the stored
      material body or search the knowledge base: that is BUG-381''s acceptance, and
      it fails on the frozen code by design. Do NOT edit apps/control-app/src/imagegen.ts
      or anything under node_modules; code_frozen stands. If a listed test is red,
      the only file you may edit is tests/reconciliation-consultant-image-generation.workers.test.ts,
      and only to restore real evidence for the same AC as now worded. Report the
      exact assertion and file:line, and do not widen scope.'
    test_scope: test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_
      or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_
      or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_
      or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_
    ladder:
      rung1: REQ-208 says the model never learns the vendor and that this product's
        scoped store is where the plugin's record is adapted, so the intent wants
        imagegen.ts changed; but code_frozen was refused for this batch, so rung 1
        cannot be acted on in this run.
      rung2: 'Decides for this run: at reconcile-src-BUNDLE-40, imagegen.ts:354-375
        spreads the plugin body into tickets.create unchanged and attach (imagegen.ts:377-410)
        indexes it; the code stands, AC-2380 is scoped to the tool''s own channels,
        and the divergence is recorded on STORY-172.'
      rung3: The narrowed AC-2380 UAT stands unchanged; the production fix and the
        re-widened AC are BUG-381 (bug-da5f9050), outside this bundle.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'The rule stands, decided at rung 2. The code_frozen override was refused
        automatically for batch 0 (''rejected by a review for this batch'', override_misjudged
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

# Fix Plan — Iteration 11

## Hypothesis
Nothing fails. The one remaining review gap, 5(a), is a production defect that `code_frozen` forbids fixing here: `generatedMaterialStore.create` (imagegen.ts) stores the image plugin's `Provider:`/`Model:` lines and `attach` indexes them. So the block is declined, AC-2380 is scoped to the channels the code does keep vendor-free, and the fix moves to BUG-381.

## Analysis
- **Failure set is empty.** report-ca8d211d: 244 passed, 0 failed. Since iteration 10 the only changes are to ticket records (bundle-c0301347, report-ca8d211d).
- **The block.** The run returned on a `code_frozen` blocked_by handoff (report-ddb736df, carried through fix_reconciliation_review report-b37233c7). Its only production item is gap 5(a), REQ-208 property 1 ("the model never learns which vendor drew the image"). The `ai-imagegen` plugin writes `- Provider:`/`- Model:` lines into the material body (toolbox.js:757-758, 810-811). At `reconcile-src-BUNDLE-40`, `generatedMaterialStore.create` (imagegen.ts:354-375) spreads `args` into `tickets.create` and leaves the body unchanged. `attach` (imagegen.ts:377-410) then indexes the material, so the vendor is reachable through knowledge search.
- **Attempt 1 of this iteration (report-a564c80c)** granted a `code_frozen` override for imagegen.ts at rung 1. The validator refused it: "rule 'code_frozen' was rejected by a review for this batch". The denial on record (override_misjudged REPORT-11385 / report-211e1ec6) names story-4cabde9a batch 0, which comes from the misjudged ai.ts override report-7519d965. It is being applied to this plan's batch 0 as well. Per the prompt, a rule a review rejected for the batch must be decided at the next rung.
- **Next rung.** Rung 2 is the reference state, and it shows the body stored and indexed unchanged. In a code-frozen reconciliation the code stands. Rung 1 still says the code is wrong, so `aligned_to_tip` is not available: REQ-208 orders the conflict in the AC's favour. And no AC or test changed after the report, so `superseded` is not available either. The ruling is **declined**, and the divergence is recorded openly rather than absorbed.
- **Hypothesis history.** Iterations 1-10 addressed unrelated failures, and iterations 6-10 repeatedly declined the separate report-7519d965 historical FAIL, which needs an operator waiver. This is the first plan to decline 5(a). It does not repeat attempt 1's grant.
- **Isolation.** No pass-alone/fail-in-suite pattern appears for these tests in any quality or batch_quality_check report for this subject.
- **Outstanding, not this plan's to fix.** Review gap 3(f) needs scoped quality runs for story-3cf3d57b and story-a58a0974. The operator waiver of report-7519d965 is still the only thing that clears that historical FAIL.

## Spec Changes Made
- **AC-2380 (acceptance_criterion-07b3ae73), narrowed in place.** Attempt 1 had widened it. It now covers the tool's own channels: manual, schema, and tool results and error text. A scope note names the excluded body/knowledge-base channel and points to BUG-381. New title: "The image tool never tells the model which vendor generates images".
- **STORY-172 (story-39c992d3).**
  - A new Reconciliation Decision records the body/knowledge-base channel as a known divergence from REQ-208.
  - The line "No contradictions between intent and code were found" now names that divergence.
  - Technical Context notes the exception.
- **BUG-381 (bug-da5f9050), filed.** It is the upgrade that strips exactly the plugin's provenance lines in `generatedMaterialStore.create`, keeps the prompt and `description_model`, and widens AC-2380 again, with a UAT that searches the knowledge base after a generation.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary — weak-observation — it reads the record only after generation completes. Keep the sibling "before its bytes are attached" case green, because it covers the window.

## Batches
**Batch 0, verification only. Zero edits are expected.**
- **Tests:** the AC-2380 UAT, with AC-2381 to AC-2392 and the `test_UAT_FC_REQ-208_` suite as blast radius.
- **Why no edits:** the existing AC-2380 UAT already asserts exactly the narrowed scope, and the test file and imagegen.ts are clean in the working tree.
- **What may be edited:** only tests/reconciliation-consultant-image-generation.workers.test.ts, and only to restore evidence for the AC as now worded.
- **What must not be edited:** imagegen.ts and the plugin.

## Resolution ladder (REQ-938)
**Batch 0.**
- **Rung 1:** REQ-208 says the code should strip the vendor. But `code_frozen` was refused for this batch, so rung 1 cannot be acted on.
- **Rung 2 decides for this run:** the reference (imagegen.ts:354-375 and 377-410 at `reconcile-src-BUNDLE-40`) stores and indexes the body unchanged. The code stands, the AC is scoped to match it, and the divergence is recorded on STORY-172.
- **Rung 3:** the narrowed AC-2380 UAT stands unchanged. The production fix is BUG-381 (bug-da5f9050), outside this bundle.
