---
uid: acceptance_criterion-c63f0d1c
id: AC-1336
type: acceptance_criterion
title: Against a correctly serving origin every applicable smoke check passes, and
  any skip is named rather than forbidden
created_by: xgd
created_at: '2026-08-20T05:31:20.823028+00:00'
updated_at: '2026-08-31T12:11:38.678350+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Against an origin that is serving correctly, and given a site slug and a preview snapshot
identifier, the smoke check runs every check applicable to that origin, every one of them passes,
and the command exits zero with a summary stating how many passed and how many were skipped.

The nine public-serving checks are: the apex resolves; an unknown site is not found; a site with
nothing published is indistinguishable from an unknown one; the published channel's trailing-slash
redirect holds; the preview channel's trailing-slash redirect holds; the preview index serves HTML;
the preview channel's caching and robots policy are correct; a miss inside a preview is a
non-indexable not-found; and every asset the preview page references resolves.

A passing run is **not** required to have skipped nothing. The two control-surface checks sit on an
independent axis, selected by their own options, so a run pointed at a public-serving origin has
nothing to point them at. What the run must do is **name** what it skipped: the report lists each
skipped check individually, so "everything applicable passed" and "nothing was left untested" are
distinguishable rather than conflated. A skip is never counted as a pass and never makes the run
fail.

The origin under test is a parameter of the run, so the same checks are used against production and
against any other serving origin.

## Verification

Point the check at a public-serving origin behaving as expected, supplying a slug and a preview
identifier: the report lists all nine public-serving checks as passed, lists exactly the two
control-surface checks as skipped and names them, and the exit status is zero. Confirm the asset
check reports the number of assets it verified rather than reporting a pass having verified none.
