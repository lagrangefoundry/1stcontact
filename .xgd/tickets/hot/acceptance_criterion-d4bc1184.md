---
uid: acceptance_criterion-d4bc1184
id: AC-1026
type: acceptance_criterion
title: Choosing an image updates the draft and the rendered page shows it, with its
  alt text landing in the same single diff
created_by: xgd
created_at: '2026-08-07T04:41:14.082548+00:00'
updated_at: '2026-08-10T07:40:32.346423+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Submitting a new choice of image for a region updates the draft definition and
re-renders the page as part of the same operation, so the rendered output on disk
references the newly chosen image and no longer references the previous one, with
no further manual step. The result reports which fields changed and where the
re-rendered output was written; submitting the handle the region already holds
succeeds and reports that nothing changed.

A new image and a new alt text chosen together are **one change, not two**: they
are applied, validated and written in a single operation producing a single diff,
and both are reported as changed. Through the builder's origin, a saved choice
leaves both the editable rendering and the plain draft rendering current.

## Verification

Save a new image handle for a known image region, then read the rendered page
produced by the operation: assert it references the new handle and not the
previous one, and that the draft definition holds the new handle. Re-submit the
identical handle and assert success with an explicit "no change" outcome. Submit
a change map naming both the handle and a new alt text in one call; assert one
operation reports both as changed, and that the draft holds both. Repeat the save
through the builder origin and assert both rendered channels on disk reflect it.