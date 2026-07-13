---
uid: acceptance_criterion-cc4d16db
id: AC-593
type: acceptance_criterion
title: Report prints a loud STALE-REFERENCE warning counting reference objects with
  no box geometry
created_by: xgd
created_at: '2026-07-13T20:13:41.774210+00:00'
updated_at: '2026-07-13T20:20:48.075566+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-79e068e5
  kind: behavior
  regression_only: false
---

## Criterion
When one or more paired reference objects carry no box geometry while their
reproduction matches do, the comparison report includes a prominent
STALE-REFERENCE warning that states the count of reference objects carrying no
box geometry and advises that the bundle be re-captured because position/width
is not being verified for them. When no such objects exist, the warning is
absent.

## Verification
Run the comparison against a reference bundle whose objects lack per-element box
geometry. Assert the rendered report contains the STALE-REFERENCE warning with
the correct count and the re-capture guidance. Run it against a reference whose
objects all carry geometry and assert the warning does not appear.