---
uid: report-fc083d99
id: REPORT-11400
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T10:48:35.612939+00:00'
updated_at: '2026-11-08T10:48:35.612939+00:00'
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
    hypothesis: 'Nothing fails (report-ca8d211d: 244 passed). The one review gap left,
      5(a), is a production defect: the image plugin''s Provider/Model lines reach
      the session knowledge base through generatedMaterialStore (imagegen.ts). Fixing
      it needs code_frozen, which the validator refused for this batch. In reconciliation
      the code stands. AC-2380 is narrowed back to the tool''s own channels (manual,
      schema, tool results and errors), the divergence is recorded on STORY-172, and
      the fix moves to BUG-381.'
    instructions: 'Verification only; zero edits expected. Run test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
      in tests/reconciliation-consultant-image-generation.workers.test.ts, with AC2381-AC2392
      and the test_UAT_FC_REQ-208_ suite. AC-2380 has been narrowed in place to the
      manual, the schema and the tool results and error text. The current UAT checks
      exactly those, so it should pass unchanged. Do NOT extend it to read the stored
      material body or search the knowledge base: that is BUG-381''s acceptance, and
      that test fails on the frozen code by design. Do NOT edit apps/control-app/src/imagegen.ts
      or anything under node_modules; code_frozen stands. If a listed test is red,
      the only file you may edit is tests/reconciliation-consultant-image-generation.workers.test.ts,
      and only to restore real evidence for the same AC as now worded. Report the
      exact assertion and file:line, and do not widen scope.'
    test_scope: test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor or test_UAT_AC2381_
      or test_UAT_AC2382_ or test_UAT_AC2383_ or test_UAT_AC2384_ or test_UAT_AC2385_
      or test_UAT_AC2386_ or test_UAT_AC2387_ or test_UAT_AC2388_ or test_UAT_AC2389_
      or test_UAT_AC2390_ or test_UAT_AC2391_ or test_UAT_AC2392_ or test_UAT_FC_REQ-208_
    ladder:
      rung1: REQ-208 says the model never learns the vendor, and it says this product
        adapts the plugin's record in its own scoped store. That decides what the
        right code is, but it is a production change, and code_frozen was refused
        for this batch, so rung 1 cannot apply it.
      rung2: 'Reference state (reconcile-src-BUNDLE-40): imagegen.ts stores and indexes
        the plugin body unchanged. Reconciliation treats the code as authoritative,
        so the AC follows the code and the divergence is recorded, not hidden.'
      rung3: AC-2380 is narrowed to the tool's own channels and its UAT stands unchanged.
        STORY-172 gains a Reconciliation Decision naming the body/KB channel as a
        known divergence. BUG-381 (bug-da5f9050) carries the fix and the widened AC.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'The rule stands. The validator refused the code_frozen override for
        batch 0 (''rejected by a review for this batch''), so granting it is no longer
        available, and no AC or test the block concerns changed after the report,
        so the block is not superseded. In reconciliation the code is authoritative.
        The batch is therefore fixed within the rule, at the spec level: AC-2380 is
        narrowed to the channels the code really keeps vendor-free, STORY-172 records
        the stored-body/knowledge-base divergence from REQ-208 as a Reconciliation
        Decision, and the production fix is filed as BUG-381 (bug-da5f9050) for an
        upgrade outside this bundle.'
      files:
      - tests/reconciliation-consultant-image-generation.workers.test.ts
---

# Fix Plan — Iteration 11 (attempt 2)

## Hypothesis
No test fails (report-ca8d211d: 244 passed, 0 failed). The run came back on a `code_frozen` blocked_by handoff (report-ddb736df) for review gap 5(a). The image plugin writes `- Provider:` / `- Model:` lines into a generated picture's material body. `generatedMaterialStore.create` (apps/control-app/src/imagegen.ts) stores that body unchanged, and `attach` indexes it (imagegen.ts:260), so the model can reach the vendor name by search. REQ-208 says it never should.

## Why the first attempt was rejected
Attempt 1 granted a `code_frozen` override for imagegen.ts. The validator refused it: "rule 'code_frozen' was rejected by a review for this batch". The denial on record (override_misjudged REPORT-11385) names story-4cabde9a batch 0, and the validator applies it to this plan's batch 0 too. Granting is therefore off the table at this rung.

## Ruling: declined
- **Grant:** refused by the validator.
- **Supersede:** not available. No AC or test that the block concerns changed after the report.
- **Decline:** the rule stands, and the batch is fixed within it. In reconciliation the code is authoritative, so the spec moves to match the code, and the divergence is recorded rather than hidden.

## Spec Changes Made
- **AC-2380 (acceptance_criterion-07b3ae73) narrowed in place.** Attempt 1 widened it. It now covers the tool's own channels only: manual, schema, and tool results and error text. A scope note explains the exclusion and points to BUG-381. Retitled: "The image tool never tells the model which vendor generates images".
- **STORY-172 (story-39c992d3).** A Reconciliation Decision records the stored-body/knowledge-base channel as a known divergence from REQ-208. The "no contradictions" line now names it, and Technical Context notes the exception.
- **BUG-381 (bug-da5f9050) filed.** This is the upgrade that strips the provenance lines in `generatedMaterialStore.create` and widens AC-2380 again, with a UAT that searches the knowledge base after a generation.

## Batches
**Batch 0, verification only.** The scope is the AC-2380 UAT, with AC-2381 to AC-2392 and the REQ-208 FC suite as blast radius. Zero edits are expected. The existing AC-2380 UAT already checks exactly the narrowed scope. The only file the batch may touch is tests/reconciliation-consultant-image-generation.workers.test.ts, and only to restore evidence for the AC as now worded. imagegen.ts and the plugin are not to be edited.

## Outstanding, not this plan's to fix
Review gap 3(f) needs scoped quality runs for story-3cf3d57b and story-a58a0974 before the next review. That is a test run, not a plan item.
