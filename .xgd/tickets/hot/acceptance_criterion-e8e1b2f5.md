---
uid: acceptance_criterion-e8e1b2f5
id: AC-2038
type: acceptance_criterion
title: compare accepts any two picture kinds and labels each side with what it was
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:57.165254+00:00'
updated_at: '2026-10-27T20:46:57.165254+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`compare` accepts any two picture sources in any combination. Neither side has to be a captured reference: for example, a published revision against the draft. The result labels each side with what it was: the `a` label names the revision number (for example "revision 2") and the `b` label names the draft. The measured difference is the difference between those two pictures.

## Verification
Serve a black draft and a white published revision 2. Call `compare` with `a` set to revision 2 and `b` set to the draft, and no reference involved. Assert the `a` label contains "revision 2", the `b` label contains "draft", and `meanDifference` equals 255.
