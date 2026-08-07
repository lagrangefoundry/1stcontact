---
uid: acceptance_criterion-48360aec
id: AC-941
type: acceptance_criterion
title: The retrofit writes a palette onto the site, rewrites every colour literal
  as a reference to it, and reports the before/after counts and the files it wrote
created_by: xgd
created_at: '2026-08-06T21:07:37.822422+00:00'
updated_at: '2026-08-07T16:50:09.898046+00:00'
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

Running the retrofit on a stored site:

- adds a site-level palette to the site's definition, whose entry count is
  materially smaller than the site's distinct colour literal count (a palette,
  not a colour list);
- rewrites every colour literal in every page of the site as a reference into
  that palette, leaving no colour literal behind in the pages;
- reports the distinct-literal count before, the palette entry count after,
  each entry by name with its base value and how many steps it carries, and the
  list of files it wrote (every rewritten page plus the site definition).

The palette is also obtainable as a single machine-readable document naming
each entry with its base value and its steps.

## Verification

Census a stored site with a known colour count, run the retrofit, and assert:
the reported entry count is materially below the reported literal count; the
site definition now carries a palette with that many entries; no page contains
a colour literal; and every file named in the report differs from its
pre-retrofit content while no other file does. Re-run requesting machine-
readable output and assert the emitted palette document matches the palette
stored on the site.