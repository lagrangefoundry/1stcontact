---
uid: report-c3b47722
id: REPORT-12401
type: report
title: 'Report: fix_plan for report-4ada51a8'
created_by: xgd
created_at: '2026-11-10T14:49:31.913785+00:00'
updated_at: '2026-11-10T14:49:31.913785+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-4ada51a8
  items:
  - index: 0
    tests:
    - tests/reconciliation-marked-points.test.ts::test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click
    - tests/reconciliation-marked-points.test.ts::test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render
    dependency_tests: []
    hypothesis: No product or test defect exists; the loop repeats only because xgd
      BUG-1706 (duplicates BUG-1707..1710) files a builder no-op result (status fixed,
      blocked_by null, empty failure set) as a code_frozen hand-off, now report-c7ca3717.
    instructions: 'Verification only. Make no production, test or ticket edits. Run
      tests/reconciliation-marked-points.test.ts at HEAD, confirm AC-2413 and AC-2594
      pass, and finish with status fixed and blocked_by null. Do not raise a hand-off:
      report-c7ca3717 is declined, and the repetition is xgd BUG-1706, outside this
      repository. Wrangler EPERM log-write lines are sandbox noise, not failures.'
    test_scope: test_UAT_AC2413_ or test_UAT_AC2594_
    ladder:
      rung1: No BUNDLE-44 intent conflicts with the Marked Points toggle (AC-2413)
        or with the BUG-83 dimmed hover via .l1-edit-hot (AC-2594), so both ACs stay
        active and unchanged.
      rung2: The code at HEAD behaves as AC-2413 and AC-2594 state; twenty-two consecutive
        hand-offs through report-c7ca3717 each passed both with no edits (14/14 in
        the file), and no product or test file changed since.
      rung3: The tests stand and nothing in this repository changes; the loop is xgd
        tooling defect BUG-1706 (duplicates BUG-1707, BUG-1708, BUG-1709, BUG-1710)
        and is not re-batched as a code change.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2: the code at HEAD already meets AC-2413 and AC-2594 and both
        pass; hand-off report-c7ca3717 proposes no change (no edits, status fixed,
        blocked_by null), so code_frozen stands and the batch is verification only.'
      files:
      - tests/reconciliation-marked-points.test.ts
      intent_basis:
        level: unsettled
        quote: Both tests in this batch pass on the current code, so there was nothing
          to fix.
  fix_iteration: 85
---

# Fix Plan — Iteration 85

## Hypothesis
Nothing in the product or the tests is broken. The loop repeats only because xgd files the builder's no-op result (`status: fixed`, `blocked_by: null`, empty failure set) as a `code_frozen` hand-off. This is xgd BUG-1706; BUG-1707 to BUG-1710 are duplicates. This iteration's hand-off is report-c7ca3717 (REPORT-12400).

## Analysis
- Iteration 85 has 0 failures and an empty capability mapping, the same as every iteration since 6.
- Files changed since iteration 84: `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, report-a6896889 and report-c7ca3717. None is a product file or a test file.
- report-a6896889 is a `no_op_guard_run`: `fix_quality_batch_prompt` run r1283 left the code and tests unchanged (`fingerprint_before == fingerprint_after`, 98dc0e44…, the same fingerprint as iteration 84).
- report-c7ca3717 is a `blocked_by_handoff` with rule `code_frozen` and parent report-2ac8ddeb (iteration 84's plan). In it the builder re-ran AC-2413 and AC-2594 (2/2 passed; the whole file passed 14/14 at the same commit), made no edits, assessed `status: fixed, blocked_by: null`, and raised no hand-off. xgd filed one anyway, with proposed change "(none stated)" and intent resolution "unsettled". This is the 22nd identical hand-off; all 21 before it were declined.
- The hand-off's `resolution` names REQ-229 again. That label is wrong: AC-2413 and AC-2594 belong to STORY-174 (Marked Points, plus BUG-83's dimmed-hover rule in `points.js`).
- Every member of BUNDLE-44 has evidence in the tree: BUG-76, BUG-80, BUG-84, REQ-228 and REQ-229 have their own `test_UAT_FC_*` suites. REQ-217's and BUG-83's tests were folded into reconciliation suites in `9260d85d6b`.
- Hypothesis history: "nothing to fix; xgd re-files the no-op" has been confirmed every iteration since 3. Under option (b) of the repetition rule, the hypothesis is confirmed and the blocker is a mode-rule hand-off, which the ladder rules on below (declined). The plan validator refuses an empty plan, so the one batch is verification only.
- Following the BUG-1067 guidance, the tooling defect is recorded in `ladder.rung3`. The run cannot converge until either BUG-1706 is fixed in xgd or the operator moves BUNDLE-44 to merge-back by hand. Both are outside this repository. Re-planning cannot change the outcome.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- Batch 0: AC-2413 and AC-2594 in `tests/reconciliation-marked-points.test.ts`. This batch is verification only: run them at HEAD, confirm they pass, and finish with `status: fixed` and `blocked_by: null`. Make no edits and raise no hand-off.

## Resolution ladder (REQ-938)
- Batch 0, decided at rung 2: the code at HEAD behaves as AC-2413 and AC-2594 state, and both tests pass with no edits. No BUNDLE-44 intent conflicts with either AC at rung 1. Rung 3: the tests stand, and the loop is xgd tooling defect BUG-1706.
- The `code_frozen` hand-off report-c7ca3717 is declined at rung 2: it proposes no change and there is no failing test to unblock. intent_basis level: unsettled.
