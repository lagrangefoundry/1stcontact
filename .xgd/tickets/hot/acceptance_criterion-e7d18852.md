---
uid: acceptance_criterion-e7d18852
id: AC-947
type: acceptance_criterion
title: Palette assignment is a separate, re-runnable pass, and a second run is a byte-identical
  fixpoint
created_by: xgd
created_at: '2026-08-06T21:08:54.276519+00:00'
updated_at: '2026-08-16T22:25:29.419829+00:00'
completed_at: null
last_field_updated: title
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
- re-running the retrofit on an already-retrofitted site is a **fixpoint**: the
  site definition and every page are left byte-identical to what the first run
  wrote, not merely equivalent. Adding a page or changing a name is one command
  rather than a manual un-assignment first.

The fixpoint is a consequence of the grouping refusing any fit whose painted
result would be classified into a different family than the colour it replaced:
without that refusal a second census reads the shade's own colour, refiles it,
and the palette grows under a command that is supposed to be reproducible.

## Verification

Produce a site by the reproduction path and assert its definition carries colour
literals and no palette. Census a site, retrofit it, and census again, asserting
the two censuses report identical distinct-literal sets, counts and alpha
families. Retrofit an already-retrofitted stored site a second time and assert
the site definition and every page file are byte-identical to before the second
run.
