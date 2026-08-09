---
uid: acceptance_criterion-82bdce67
id: AC-825
type: acceptance_criterion
title: 'Motion fails visible: with scripting unavailable, unsupported or erroring,
  the page presents every revealing node fully settled, and a page that reveals nothing
  ships no motion script at all'
created_by: xgd
created_at: '2026-08-06T02:04:08.431628+00:00'
updated_at: '2026-08-09T05:40:57.581109+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A published page whose nodes declare entrances presents all of its content, laid
out and fully visible, whenever the motion cannot run: scripting disabled, no
viewport-observation support in the user agent, an error thrown before the
motion starts, or a reduced-motion preference. In none of those cases is any
node left occupying space while invisible. The pre-entrance appearance only ever
applies once the page has confirmed motion is going to run.

The motion driver is a fixed, site-independent asset: it is byte-identical
across two different sites' pages, carries no values from any site definition,
and is a single driver for every revealing node on the page rather than one per
node.

A page whose nodes declare no entrance carries no motion script whatsoever.

## Verification
Render a page with revealing nodes and evaluate it four ways — scripting not
executed, viewport observation absent, an error raised during setup, and a
reduced-motion preference — asserting in each case that every revealing node is
presented visible and settled. Render two different sites' revealing pages and
assert their motion drivers are identical and contain no site values. Render a
page with no entrance declared and assert no motion script is present in its
output.