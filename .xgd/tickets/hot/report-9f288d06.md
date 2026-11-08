---
uid: report-9f288d06
id: REPORT-11378
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T09:15:03.818481+00:00'
updated_at: '2026-11-08T09:15:03.818481+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 7
  items:
  - index: 0
    tests:
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order
    dependency_tests: []
    hypothesis: Nothing fails; the code_frozen handoff REPORT-11375 is a historical
      misjudged override (report-7519d965) whose production change is correct and
      already at HEAD, so the block is declined and only the AC-2097/AC-2378 evidence
      it served is re-confirmed.
    instructions: 'Verification only. Run the AC-2097 and AC-2378 UATs in tests/reconciliation-material-description-session.workers.test.ts,
      together with tests/test_UAT_FC_REQ-207_image_describer_session.test.ts, which
      imports systemText() from tests/support/scripted-model-client.ts. They pass
      at HEAD (REPORT-11376: 224 passed, 0 failed). Make no edits if they are green.
      Production code is frozen and no production change is demanded. Keep systemText()
      in tests/support/scripted-model-client.ts: the REQ-206, REQ-207 and REQ-208
      FC suites import it. Do not touch tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts.
      If a workers UAT cannot bind a local port (listen EPERM), report that and leave
      its verdict to the gate. Do not count it as passed. The remaining review FAIL,
      the misjudged override report-7519d965, needs an operator waiver and is not
      the builder''s to clear.'
    ladder:
      rung1: 'Decided here: REQ-207 requires the describer to run through the host
        session factory and each describer to register under its own name (AC-2097,
        AC-2378). The production change delivering that is at HEAD and was judged
        correct by the review, so no code change is demanded and code_frozen stands.'
      rung2: Not needed; the behaviour is undisputed and the scoped gate passes 224/224
        at HEAD.
      rung3: The AC-2097 and AC-2378 tests stand unchanged; no production code changes.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: REPORT-11375 hands off the reconciliation review, which finds
        story coverage and evidence sufficient and says the bundle does not need another
        fix pass. Its only FAIL is the historical misjudged override report-7519d965
        (story-4cabde9a batch 0, ai.ts). That override''s production change is correct
        and required by AC-2097/AC-2378, its stray REQ-146 test edit is reverted,
        and systemText() must stay because the REQ-206/207/208 FC suites import it.
        code_frozen is denied for that batch (report-40bf3ba2) and no production change
        is demanded, so the rule stands. Clearing the misjudgment needs an operator
        waiver, not a builder pass.'
      files: []
    test_scope: test_UAT_AC2097_ or test_UAT_AC2378_
---

# Fix Plan — Iteration 7

## Hypothesis
No test is failing. The only open item is the `code_frozen` block handed off as REPORT-11375 (report-07c44384). It reports a historical override that the review judged misjudged (report-7519d965, story-4cabde9a batch 0, `apps/control-app/src/ai.ts`), and no production change is demanded, so this plan declines it. It replaces the earlier iteration-7 filing (REPORT-11377), which was refused because it made no ruling on that block.

## Analysis
- **Failure set is empty.** The latest scoped gates, REPORT-11371 and REPORT-11376 (report-4da11849, commit f3067b509c), both pass 224 tests with 0 failed and 0 skipped, and lint, build and preflight are clean. Since iteration 6, only ticket records changed (bundle-c0301347, report-4da11849). No test or production file moved.
- **Iteration 6 closed out.** Its batch (REPORT-11367, commit 2515c21647) retired the superseded AC-2337 UATs, and both AC-2409 UATs passed. Its gate, report-da0b9b4e, ran 3 tests: 3 passed, 0 failed.
- **The block, REPORT-11375 (`code_frozen`, batch_index -1)**, is the reconciliation review handed off as a block. Its verdict: "The stories accurately and completely document the bundle's behaviour, and the evidence is sufficient. The only failing item is the misjudged code_frozen override report-7519d965 ... It does not need another fix pass." The misjudgment was that the override's diff touched two test files it did not name:
  1. `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts`: already reverted.
  2. `tests/support/scripted-model-client.ts` `systemText()`: still at HEAD. It is imported by `test_UAT_FC_REQ-206_the_assistant_can_see.workers.test.ts:34`, `test_UAT_FC_REQ-207_image_describer_session.test.ts:35`, `test_UAT_FC_REQ-208_the_assistant_can_make_pictures.workers.test.ts:22` and `reconciliation-consultant-image-generation.workers.test.ts:25`. Removing it would break active FC evidence for REQ-206, REQ-207 and REQ-208, so it stays.

  The production change in that override (registering the describer backend with `ClaudeAPIBackend.capabilities`, ai.ts:195) was judged correct and required by AC-2097 and AC-2378. `code_frozen` is denied for that batch (report-40bf3ba2), and the review cannot be re-run to a different verdict by any builder action. Clearing it takes an operator waiver of report-7519d965, which is outside this planner's reach.
- **Hypothesis history.** Iterations 3 and 4 filed "iteration-2 failures are fixed at HEAD", which is closed. Iteration 6 targeted the AC-2337/AC-2409 alignment, which is closed. This iteration's hypothesis is new: a ruling-only decline on the area the misjudged override touched. It is not a retry.
- **Isolation.** No pass-alone/fail-in-suite pattern appears in the history.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- Scoped gate filter — weak-observation — FC prefixes written with underscores (`test_UAT_FC_REQ_205_` etc.) do not match suites named with hyphens (`test_UAT_FC_REQ-205_…`). Gate selection overstates what ran; select by AC token or by the hyphenated prefix.
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation — every case skips itself without Chromium. Treat a non-zero skip count on this file as missing evidence.
- tests/test_UAT_FC_BUG-58_invite_modal_fits — inter-test-dependency — depends on built `dist-assets`, so it fails in branch worktrees. Build the assets in setup, or fail with a named precondition.
- tests/reconciliation-material-description-session.workers.test.ts:40 and tests/reconciliation-assistant-priming-delivery*.test.ts — infra-reuse-gap — each defines a private `systemText()` that duplicates `tests/support/scripted-model-client.ts`. Import the shared helper when next editing these files.

## Batches
One batch, verification only. It covers the two UATs for the ACs the misjudged override served: AC-2097, which describes documents and images in their own toolless, unprimed sessions, and AC-2378, which checks the image and document describers never answer for each other. The REQ-207 FC describer suite, which imports `systemText()`, is named as the blast radius. The builder edits nothing unless one of them fails. It must not touch production code, and it must keep `systemText()`.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 1. REQ-207's "As built" section requires the describer to run through the host session factory with no second path to a model. REQ-207 also says "Each describer registers under its own name ... A UAT pins it", and that is AC-2378. The production change that delivers this is already at HEAD and was judged correct by the review that flagged the override, so no code change is demanded. `code_frozen` therefore stands and the block is **declined**. Rung 2 is not needed: the behaviour is undisputed and the gates pass at HEAD. Rung 3: the AC-2097 and AC-2378 tests stand unchanged.

The remaining FAIL is the historical misjudged override report-7519d965, which needs an operator waiver. No batch can clear it.
