---
uid: acceptance_criterion-a50a5a5f
id: AC-996
type: acceptance_criterion
title: A click inside a behavior module's presentation seam names the region relative
  to that instance and seam
created_by: xgd
created_at: '2026-08-07T02:16:28.701293+00:00'
updated_at: '2026-08-07T02:36:30.657848+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

When the clicked region lies inside a behavior module instance's presentation
seam, the region the form opens over is identified relative to that instance and
that seam — not as a region of the page's own layout. An instance's regions and
the page's regions reuse the same short address forms by design, so without the
instance-and-seam qualification a click inside a module would open a form over a
different region of the page and a save would write the operator's words into
the wrong place.

Only a marker inside the instance qualifies the region; the page's own seam that
the instance was mounted into does not, since it names a place in the page
rather than a place in the module.

## Verification

Render a page containing a behavior module that exposes a presentation seam with
copy inside it. Click that copy and assert the form's target names the module
instance and seam. Save a change and assert the words changed inside the module
instance's content, and that the page's own regions are unchanged.