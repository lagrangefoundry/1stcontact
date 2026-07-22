---
uid: acceptance_criterion-beb4d907
id: AC-710
type: acceptance_criterion
title: Each probe residual/finding is diagnostic — it identifies the offending leaves
  and the magnitude of the violation
created_by: xgd
created_at: '2026-07-22T20:07:41.211438+00:00'
updated_at: '2026-07-22T20:07:41.211438+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
When a probe does not pass, its report does not stop at a boolean: each reported item
identifies what failed and by how much, so the residual points at a specific framework
gap to feed back.

- A fidelity residual carries the run text, the width, and the per-axis deltas (dx, dy,
  dw), plus a coverage entry (text, width) for any oracle sample with no reproduced run.
- An envelope finding carries its kind (overlap or clip), a human-readable detail
  describing the violation and its magnitude, and the index paths of the leaves
  involved.

## Verification
Force a fidelity residual and assert the reported item names the run and per-axis
deltas. Force an overlap and a clip and assert each finding names its kind, a detail
string with the offending magnitude, and the involved leaf paths.
