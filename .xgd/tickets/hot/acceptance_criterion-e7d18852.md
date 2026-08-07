---
uid: acceptance_criterion-e7d18852
id: AC-947
type: acceptance_criterion
title: 'Palette assignment is a separate, re-runnable pass: a site arrives carrying
  literals, and an already-retrofitted site censuses and re-assigns exactly as it
  did the first time'
created_by: xgd
created_at: '2026-08-06T21:08:54.276519+00:00'
updated_at: '2026-08-07T18:44:54.037746+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Assignment is a pass an author runs over a site, never something a site arrives
with:

- a site produced by reproducing a captured reference carries its colours as
  literals and no palette; a palette appears on it only once the retrofit is
  run;
- censusing a site that already carries a palette reports the same distinct
  literals, counts and alpha families it would have reported before the
  retrofit — references are measured as the colours they resolve to, not as a
  new kind of value;
- re-running the retrofit on an already-retrofitted site produces the same
  palette as the first run rather than a palette derived from a palette, so
  adding a page or changing a name is one command rather than a manual
  un-assignment first.

## Verification

Produce a site by the reproduction path and assert its definition carries
colour literals and no palette. Census a site, retrofit it, and census again,
asserting the two censuses report identical distinct-literal sets, counts and
alpha families. Retrofit the already-retrofitted site a second time and assert
the resulting palette is identical to the first run's.