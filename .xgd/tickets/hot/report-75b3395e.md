---
uid: report-75b3395e
id: REPORT-6928
type: report
title: 'Fix reconciliation review: bundle-5607a08d'
created_by: xgd
created_at: '2026-10-30T21:33:02.578717+00:00'
updated_at: '2026-10-30T21:33:02.578717+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-5607a08d
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-b3de4571 (STORY-107):
  - G2: added a "Code issue flagged (not encoded as an AC)" subsection to Technical Context. It records that the `1c` usage line at `tools/generate/src/cli/index.ts:438` still advertises `[--alt <t>]` on `1c asset write`, an option that has been ignored since BUG-44. Removing it needs a mode_override grant, so the line is not edited.
  - G1: added a Reconciliation Decisions section that records the AC-1109 rewrite and why it follows BUG-44 behaviour 5.
- story-58b2cec4 (STORY-157): the stale wording is now past tense.
  - Technical Context no longer says the AC-2067 UATs "fail by design". It now says the rung-1 grant report-d58b23f8 landed and the UATs pass.
  - Reconciliation Decisions now says the change "was made under report-d58b23f8" and BUG-316 "was resolved".
- acceptance_criterion-b2825a04 (AC-1109), G1: rewritten in place. The drawing clause now reads "writing a drawing by supplying its content, with explicit replacement — the written drawing is bytes only and carries no alt text of its own". Verification now also checks that the written asset has no alt.
- bug-d9778adf (BUG-316): added comment COMMENT-5853 recording that its fix landed under report-d58b23f8 and that AC-2067 passes. The status stays `draft` for the operator, since the store has no resolved status for bugs.

## Stories deleted
None

## ACs superseded
None. The review asked for an in-place rewrite of AC-1109, because its other three capability clauses are still valid.

## FC orphans renamed/deleted
None. No fc_orphan_check report exists for this anchor.

## Code changes
- tests/reconciliation-beyond-l1-authoring.test.ts (`test_UAT_AC1109_every_capability_is_reachable_from_the_command_line`):
  - Both `1c asset write` calls no longer pass `--alt`.
  - Added `expect(drawn.data!.asset).not.toHaveProperty('alt')`, the same form already used for the surface path at line 760 of the same file.
  - No production code was changed.

## Confidence
High. G1 and G2 are both addressed exactly as the review prescribed, using its preferred in-place rewrite, and the non-blocking story-58b2cec4 tidy-up is done. Remaining risk: the new no-alt assertion assumes `data.asset` from the CLI write has the same shape as the surface's `written.asset`. Both go through `editAssetWrite`, so they should match.
