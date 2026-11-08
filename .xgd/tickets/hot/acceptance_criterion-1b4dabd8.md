---
uid: acceptance_criterion-1b4dabd8
id: AC-2455
type: acceptance_criterion
title: Editing one run's field changes only that run's words
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:32.861653+00:00'
updated_at: '2026-11-08T13:28:32.861653+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
Saving an edit to field `textK` of a multi-run node replaces only run K's words. Run K's axes, and every other run's words and axes, are unchanged, and the node remains a run array of the same length.

## Verification
Apply an edit to `text2` of a three-run node whose runs carry distinct axes; assert run 2's text is the new value and runs 1 and 3 plus all axes are deep-equal to before.
