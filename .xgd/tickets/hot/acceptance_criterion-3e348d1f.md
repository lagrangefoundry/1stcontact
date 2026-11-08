---
uid: acceptance_criterion-3e348d1f
id: AC-2445
type: acceptance_criterion
title: 'The run form is closed: nesting, links and axes outside the run subset are
  refused'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:25.671439+00:00'
updated_at: '2026-11-08T13:28:25.671439+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
Validation rejects a text node whose runs (a) nest — a run whose `text` is itself an array of runs, (b) carry any key other than `text` and `axes` (e.g. a link/href), or (c) carry an axis outside the run subset `color`, `sizeScale`, `fontWeight`, `fontStyle`, `baselineShiftEm` (e.g. `fontFamily`, `align`, `letterSpacing`, an absolute pixel size). Each rejection is a validation failure, never a silently ignored value.

## Verification
Validate one document per case (nested run, run with a link key, run with an off-subset axis); assert each fails validation.
