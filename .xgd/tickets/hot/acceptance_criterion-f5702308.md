---
uid: acceptance_criterion-f5702308
id: AC-995
type: acceptance_criterion
title: A click on nested regions resolves to the innermost region containing it
created_by: xgd
created_at: '2026-08-07T02:16:24.234107+00:00'
updated_at: '2026-08-07T02:16:24.234107+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Where editable regions nest — copy inside a painted box, a box inside a behavior
module — a click resolves to the innermost region that contains the clicked
point. Clicking words opens the form for those words, not for the box drawn
around them.

## Verification

On a page whose rendering nests an editable copy region inside an editable
container region, click within the copy and assert the region the form opens
over is the copy region's, not the container's.
