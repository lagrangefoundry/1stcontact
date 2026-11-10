---
uid: report-bf8b9f5e
id: REPORT-12423
type: report
title: 'Report: fix_plan for report-4ada51a8'
created_by: xgd
created_at: '2026-11-10T15:59:54.836685+00:00'
updated_at: '2026-11-10T15:59:54.836685+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-4ada51a8
  fix_iteration: 91
  items:
  - index: 0
    tests:
    - tests/reconciliation-marked-points.test.ts::test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click
    - tests/reconciliation-marked-points.test.ts::test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render
    dependency_tests: []
    hypothesis: No product or test defect exists; the loop repeats only because xgd
      BUG-1706 (duplicates BUG-1707..1710) files a builder no-op result (status fixed,
      blocked_by null, empty failure set) as a code_frozen hand-off, now report-35b4ef06.
    instructions: 'Verification only. Make no production, test or ticket edits. Run
      tests/reconciliation-marked-points.test.ts at HEAD, confirm AC-2413 and AC-2594
      pass, and finish with status fixed and blocked_by null. Do not raise a hand-off:
      report-35b4ef06 is declined, and the repetition is xgd BUG-1706, outside this
      repository. Wrangler EPERM log-write lines are sandbox noise, not failures.'
    test_scope: test_UAT_AC2413_ or test_UAT_AC2594_
    ladder:
      rung1: No BUNDLE-44 intent conflicts with the Marked Points toggle (AC-2413)
        or with the BUG-83 dimmed hover via .l1-edit-hot (AC-2594), so both ACs stay
        active and unchanged.
      rung2: The code at HEAD behaves as AC-2413 and AC-2594 state; hand-off report-35b4ef06
        again passed both with no edits, and no product or test file changed since
        the previous iteration.
      rung3: The tests stand and nothing in this repository changes; the loop is xgd
        tooling defect BUG-1706 (duplicates BUG-1707, BUG-1708, BUG-1709, BUG-1710)
        and is not re-batched as a code change.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 2: the code at HEAD already meets AC-2413 and AC-2594 and both
        pass; hand-off report-35b4ef06 proposes no change (no edits, status fixed,
        blocked_by null), so code_frozen stands and the batch is verification only.'
      files:
      - tests/reconciliation-marked-points.test.ts
      intent_basis:
        level: unsettled
        quote: 'Neither test in this batch was failing: both AC-2413 and AC-2594 pass
          at HEAD, and I changed no code, tests or tickets.'
---

# Fix Plan — Iteration 91 (re-plan after validation refusal)

## Why this is a re-plan
`validate_fix_plan` refused REPORT-12422 (report-56f9e793) for one reason: "the `code_frozen` request cannot be declined: blocked_by_ruling.intent_basis is required: cite the `level` ... and a `quote` of the words that settle it". The quote was empty. This plan is the same plan with that field filled in. The level stays `unsettled`, as the hand-off's intent resolution says. The quote is the hand-off's own words, which settle the point: the tests pass and nothing needs to change.

## Hypothesis
Nothing in the product or the tests is broken. The loop repeats only because xgd files the builder's no-op result (`status: fixed`, `blocked_by: null`, empty failure set) as a `code_frozen` hand-off. That is xgd BUG-1706 (BUG-1707 to BUG-1710 are duplicates). This iteration's hand-off is report-35b4ef06 (REPORT-12421).

## Analysis
- Iteration 91 has 0 failures and an empty capability mapping, the same as every iteration since about 6.
- Since the previous iteration, only xgd metadata and reports changed: `.xgd/_changes/*`, report-35b4ef06, report-5a0667d0, report-56f9e793 and comment-d954e195. No product or test file changed.
- report-35b4ef06: the builder ran AC-2413 and AC-2594, and both passed. The whole of `tests/reconciliation-marked-points.test.ts` passed 14 of 14 earlier in that session. The builder made no edits and reported `status: fixed, blocked_by: null`. xgd filed a hand-off anyway, with no proposed change.
- Its `resolution` names REQ-229, which is the wrong label. AC-2413 belongs to Marked Points. AC-2594 is BUG-83's dimmed-hover rule in `points.js`.
- The hypothesis "nothing to fix; xgd re-files the no-op" has held for more than 80 iterations. The run cannot converge until BUG-1706 is fixed in xgd, or the operator moves BUNDLE-44 to merge-back by hand.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
none

## Batches
- **Batch 0 (verification only).** Run AC-2413 and AC-2594 in `tests/reconciliation-marked-points.test.ts` at HEAD, make no edits, and finish with `status: fixed, blocked_by: null`.

## Resolution ladder (REQ-938)
- **Batch 0: decided at rung 2.** The code at HEAD meets AC-2413 and AC-2594, and both pass with no edits. No BUNDLE-44 intent conflicts with either AC (rung 1). The tests stand (rung 3). The repetition is xgd BUG-1706, outside this repository.
- **Hand-off report-35b4ef06 (`code_frozen`): declined.** It proposes no change. intent_basis: level `unsettled`, quoting the hand-off: "Neither test in this batch was failing: both AC-2413 and AC-2594 pass at HEAD, and I changed no code, tests or tickets."
