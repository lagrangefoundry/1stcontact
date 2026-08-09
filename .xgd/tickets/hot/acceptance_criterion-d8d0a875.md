---
uid: acceptance_criterion-d8d0a875
id: AC-813
type: acceptance_criterion
title: A captured form control folds to a control leaf rebased to its form's seam
created_by: xgd
created_at: '2026-08-06T01:45:25.189720+00:00'
updated_at: '2026-08-09T08:19:46.510124+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Each cluster of captured form controls folds to one behaviour seam pinned at the
cluster's union rect per sampled width (widened to contain a submit button matched
to that form), and every control in the cluster folds to a `control` leaf naming the
module-declared element it binds.

A control leaf carries the paint the capture measured on that control and a geometry
track whose origin is **rebased from the page to the seam**: at each width its
keyframe is the captured box minus the seam's own box. Only the origin changes — the
measured width and height are the reference's. The reference's field heights and its
submit button's per-width position therefore survive the fold, instead of being
replaced by whatever a module's own defaults would place, and a submit that sits
beside its field at wide widths and below it at narrow ones reproduces at both
because each control carries its own geometry.

## Verification
Fold a capture of a form whose fields are taller than a module default and whose
submit button is inline with its field at the wide rungs and stacked below it at the
narrow ones. Assert one seam per form with control leaves inside it; assert each
leaf's keyframe equals the captured box offset by the seam's origin at the same
width; assert the captured field heights and the submit's seam-relative offset match
the retained oracle at every width.