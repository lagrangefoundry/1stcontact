---
uid: acceptance_criterion-c63f0d1c
id: AC-1336
type: acceptance_criterion
title: Against a correctly serving origin the smoke check passes all nine checks with
  nothing skipped and exits zero
created_by: xgd
created_at: '2026-08-20T05:31:20.823028+00:00'
updated_at: '2026-08-20T05:31:20.823028+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Against an origin that is serving correctly, and given a site slug and a preview snapshot
identifier, the smoke check runs all nine checks, every one passes, none is skipped, and the
command exits zero with a summary stating how many passed and how many were skipped. The nine
checks are: the apex resolves; an unknown site is not found; a site with nothing published is
indistinguishable from an unknown one; the published channel's trailing-slash redirect holds; the
preview channel's trailing-slash redirect holds; the preview index serves HTML; the preview
channel's caching and robots policy are correct; a miss inside a preview is a non-indexable
not-found; and every asset the preview page references resolves.

The origin under test is a parameter of the run, so the same checks are used against production and
against any other serving origin.

## Verification

Point the check at an origin serving the expected behaviour, supplying a slug and a preview
identifier: the report lists all nine checks as passed, lists none as skipped, and the exit status
is zero. Confirm the asset check reports the number of assets it verified rather than reporting a
pass having verified none.
