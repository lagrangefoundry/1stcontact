---
uid: report-348ede47
id: REPORT-11389
type: report
title: 'Report: fix_plan for report-d87c1fe2'
created_by: xgd
created_at: '2026-11-08T09:37:44.633457+00:00'
updated_at: '2026-11-08T09:44:36.376892+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-d87c1fe2
  fix_iteration: 10
  items:
  - index: 0
    tests:
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session
    - tests/reconciliation-material-description-session.workers.test.ts::test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order
    dependency_tests: []
    hypothesis: Nothing fails; REPORT-11387's only FAIL is the historical misjudged
      override report-7519d965, which no grant or edit can clear, and iteration 7's
      decline was dropped only because blocked_by_ruling.files was empty, so this
      plan re-declines with the batch's file set named.
    instructions: Verification only; zero edits expected. Run the AC-2097 and AC-2378
      UATs in tests/reconciliation-material-description-session.workers.test.ts, and
      run tests/test_UAT_FC_REQ-207_image_describer_session.test.ts alongside them.
      All passed at HEAD in REPORT-11380 with no listen EPERM, and the gate passes
      224/224 (REPORT-11388). If they are green, change nothing. If one turns red,
      the only file you may edit is tests/reconciliation-material-description-session.workers.test.ts,
      and only to restore real evidence for the same AC. Production code is frozen
      and none is demanded. Keep systemText() in tests/support/scripted-model-client.ts,
      which 11 test files import. Do not touch tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts.
      The review FAIL on override report-7519d965 is a historical record that needs
      an operator waiver; it is not yours to clear, and no test edit affects it.
    ladder:
      rung1: 'Decided here: REQ-207 requires the describer to be a session on the
        host factory, with each describer registered under its own name (AC-2097,
        AC-2378). The ai.ts:195 change that delivers it is at HEAD and was judged
        correct by REPORT-11387, so no code change is demanded and code_frozen stands.'
      rung2: Not needed; the behaviour is undisputed and the scoped gate passes 224/224
        at HEAD (REPORT-11388).
      rung3: The AC-2097 and AC-2378 tests stand unchanged. The run cannot converge
        without an operator waiver of report-7519d965, which the review names as the
        only remaining action.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: REPORT-11387 hands off the fourth identical reconciliation
        review. It finds coverage, fidelity, supersession, evidence and plan accounting
        clean, and its only FAIL is the historical misjudged override report-7519d965
        (story-4cabde9a batch 0, ai.ts). That override''s production change is correct
        and required by AC-2097/AC-2378, its stray REQ-146 test edit is reverted,
        and systemText() must stay because 11 test files import it. code_frozen is
        already denied for that batch (report-40bf3ba2), and no production change
        is demanded, so the rule stands. The review states that no builder or matrix
        edit can change the historical record; clearing it needs an operator waiver.'
      files:
      - tests/reconciliation-material-description-session.workers.test.ts
    test_scope: test_UAT_AC2097_ or test_UAT_AC2378_
  batches_pending: false
---

# Fix Plan — Iteration 10

## Hypothesis
No test is failing. The run returned on REPORT-11387 (report-ad4b732a), a `code_frozen` blocked_by_handoff carrying the fourth identical reconciliation review. Its only FAIL is the historical override report-7519d965, which the review judged misjudged. A code-freeze grant cannot clear that, and no test or matrix edit can either, so this plan declines the block again. This time the ruling carries a non-empty `files` list, so it is recorded rather than dropped.

## Analysis
- **Failure set is empty.** REPORT-11383 and REPORT-11388 (report-eae6d080, commit 5e4e46fc53) both pass 224 tests with 0 failed, and lint and build are clean. Since iteration 7, only ticket records changed (bundle-c0301347, report-eae6d080). No test, AC, story or production file moved.
- **What happened to iteration 7's ruling.** REPORT-11379 (report-5c5e9f1b) records `fell_through: "the code_frozen request cannot be declined: blocked_by_ruling.files must list every file the batch edits"`. The decline was dropped because `files` was `[]`. The batch then ran as a plain verification batch. REPORT-11380 reports `no_change_needed`: AC-2097 and AC-2378 passed, and `test_UAT_FC_REQ-207_image_describer_session` passed 8/8, with no listen EPERM, so these are real passes. The review re-ran and repeated its verdict as REPORT-11387. This plan fixes the mechanical defect: `files` names the single test file the batch may edit, and no production file.
- **The block itself (REPORT-11387, `code_frozen`, batch_index -1).** The review says coverage, fidelity, supersession, evidence and plan accounting are all clean (34 behaviours, 16 rows Covered, no ungrounded stories). It judges override report-483291fe PASS. It judges report-7519d965 (story-4cabde9a batch 0, `apps/control-app/src/ai.ts`) MISJUDGED on items 4 and 6, because the recorded diff also edited `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts` and `tests/support/scripted-model-client.ts`, which the grant did not name. State at HEAD:
  - The production change at ai.ts:195, registering the describer backend with `ClaudeAPIBackend.capabilities`, is correct and required by AC-2097 and AC-2378.
  - The REQ-146 edit is reverted (0 diff lines against main).
  - `systemText()` is used by 11 test files and must stay.
  
  The review states: "The override report is a historical record, and no builder or matrix edit can change it" and "Operator action required: waive report-7519d965. With that waiver this review would PASS."
- **Why decline rather than grant, supersede or align.**
  - **Grant:** `code_frozen` is already denied for story-4cabde9a batch 0 (report-40bf3ba2), so a re-grant there is refused automatically. No production change is demanded anywhere.
  - **Supersede:** no AC or test the block concerns has changed.
  - **Align to the reference:** no AC conflicts with the reference state, because every test passes.
  - **Decline** is the ladder's answer.
- **Hypothesis history.** Iterations 6, 7 (REPORT-11377, refused for having no ruling) and 7 (REPORT-11378/11379, ruling dropped for empty `files`) all concluded the same thing: decline, and the waiver is the operator's. Under rule (b), that hypothesis is confirmed correct and the blocker is a mode rule, so this plan rules by the ladder instead of inventing a different root cause. It differs from iteration 7 in the one thing that made iteration 7 fall through.
- **This plan cannot converge the run.** The review's FAIL is on a historical record that only an operator waiver of report-7519d965 clears. Every further fix iteration will re-confirm green tests and return the same handoff. That is recorded in the ladder so the diagnostic report shows it.
- **Isolation.** There is no pass-alone/fail-in-suite pattern in any quality or batch_quality_check report for this subject.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- Scoped gate filter — weak-observation — underscore FC prefixes (`test_UAT_FC_REQ_205_` etc.) miss the hyphen-named suites (`test_UAT_FC_REQ-205_…`), so the gate overstates what ran. Select by AC token or the hyphenated prefix.
- tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts — weak-observation — every case self-skips without Chromium. Treat a non-zero skip count on this file as missing evidence.
- tests/test_UAT_FC_BUG-58_invite_modal_fits — inter-test-dependency — needs built `dist-assets`, so it fails in branch worktrees. Build the assets in setup, or fail on a named precondition.
- tests/reconciliation-material-description-session.workers.test.ts:40 — infra-reuse-gap — a private `systemText()` duplicates `tests/support/scripted-model-client.ts:80`. The two flatten system blocks differently (`'\n'` join versus the shared `textOf`), and AC-2097/AC-2378 compare exact strings, so unify them only alongside a deliberate check of those assertions, not as drive-by churn.

## Batches
One batch, verification only: the AC-2097 and AC-2378 UATs, the two ACs the misjudged override served. The REQ-207 FC describer suite, which imports the shared `systemText()`, is the blast radius. Zero edits are expected, because all three passed at HEAD in REPORT-11380. The only file the batch may touch is its own test file, and only if a test turns red. No production file is in scope.

## Resolution ladder (REQ-938)
Batch 0 is decided at rung 1. REQ-207's "As built" requires the image describer to be a session on the host's own session factory, and says "Each describer registers under its own name ... A UAT pins it" (AC-2378). The production change delivering that is at HEAD and was judged correct by the very review that flagged the override. No code change is demanded, so `code_frozen` stands and REPORT-11387 is **declined**. Rung 2 is not needed: the behaviour is undisputed and the gate passes 224/224 at HEAD. Rung 3: the AC-2097 and AC-2378 tests stand unchanged.

Outstanding and outside any batch: the misjudged historical override report-7519d965 needs an operator waiver. With it, the review says it would PASS.