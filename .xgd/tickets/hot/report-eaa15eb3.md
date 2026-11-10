---
uid: report-eaa15eb3
id: REPORT-12091
type: report
title: 'Report: fix_plan for report-4ada51a8'
created_by: xgd
created_at: '2026-11-10T01:26:14.269012+00:00'
updated_at: '2026-11-10T01:26:14.269012+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_plan
  subject_uid: report-4ada51a8
  fix_iteration: 3
  batches_pending: true
  items:
  - index: 0
    tests:
    - story-44d0a572 — Marked Points on the edit render test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click
    dependency_tests:
    - test_UAT_AC2594_
    hypothesis: 'AC-2413 is green at HEAD: the jsdom frame-setup fix in tests/reconciliation-marked-points.test.ts
      (commit 809ee44244) is committed and the file passes 14/14; scoped quality run
      report-d6cba09d passed 269/269. No production root cause exists.'
    instructions: 'Verification only: make no production or test edits. Confirm the
      test-setup fix from 809ee44244 (each frame given the empty page a browser would
      have) is at HEAD and that tests/reconciliation-marked-points.test.ts passes,
      including AC-2594, then finish with no changes. Do not touch frozen production
      code.'
    test_scope: test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click
      or test_UAT_AC2594_
    ladder:
      rung1: No intent in BUNDLE-44 speaks to the jsdom frame setup; AC-2413 is active
        and linked to story-44d0a572.
      rung2: 'Code at HEAD behaves as AC-2413 states: leaving Edit leaves no Marked
        Points flag or overlay in the View document.'
      rung3: The test stands; its jsdom environment gap was fixed in its own setup
        (809ee44244) and it passes at HEAD.
    intent_basis: unsettled
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: Handoff report-0e2d770e proposes no change (builder assessment status
        fixed, upstream_changes none). AC-2413 passes at HEAD from a test-setup-only
        fix (809ee44244), and the scoped quality run report-d6cba09d passed 269/269,
        so code_frozen stands and no production file is edited.
      files: []
---

# Fix Plan — Iteration 3

## Why this replaces iteration 2

Iteration 2's plan (report-65ed0098) filed no batches and was rejected by
validation: it gave no ruling on the builder's `code_frozen` hand-off
(report-0e2d770e). This plan carries the same diagnosis and adds that ruling as a
`blocked_by_ruling` on a batch for the blocked test.

## Hypothesis
Nothing is failing. Iteration 1's only target was AC-2413, flagged orphaned
because its UAT failed under jsdom. It is green at HEAD. The fix was in the test's
setup only (commit 809ee44244), so there is no production root cause.

## Analysis
- Scoped quality run report-d6cba09d (commit 852ea4bbe7): 269 tests, 0 failed,
  lint, build and preflight clean. The batch quality cycle after it (10162abc86)
  also passed.
- `tests/reconciliation-marked-points.test.ts` passes 14 of 14, including AC-2594,
  which the review fix 9260d85d6b added.
- Hand-off report-0e2d770e (`code_frozen`) proposes no change. The builder's
  assessment is `status: fixed` with `upstream_changes: none`.

## Spec Changes Made
None.

## Weak Evidence Flags
none

## Batches

### Batch 0 — AC-2413, verification only
- Test: `test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click`
  (story-44d0a572). Dependency: `test_UAT_AC2594_`.
- Instructions: make no production or test edits. Confirm the jsdom frame setup
  from 809ee44244 is at HEAD and that the file passes, then finish with no changes.

### Ruling on the `code_frozen` hand-off (report-0e2d770e)
**declined.** `code_frozen` stands and no production file is edited. The hand-off
proposes no change. The test passes at HEAD from a test-setup-only fix, so nothing
needs the frozen code to be unfrozen.

## Resolution ladder (REQ-938)
- Rung 1: no intent in scope (BUNDLE-44's members) speaks to the jsdom frame setup.
  AC-2413 itself is active and linked to story-44d0a572.
- Rung 2: the code at HEAD already behaves as AC-2413 states. Leaving Edit leaves
  no Marked Points flag or overlay in the View document.
- Rung 3: the test stands, and its environment gap was fixed in its own setup.
  The hand-off has no level of its own, so it is cited as `unsettled`.
