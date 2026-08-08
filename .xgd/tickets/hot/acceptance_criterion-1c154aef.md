---
uid: acceptance_criterion-1c154aef
id: AC-824
type: acceptance_criterion
title: A node declaring an entrance starts at the offset and opacity it comes from
  and settles at the geometry and opacity it already declares, so an entrance never
  restates the design
created_by: xgd
created_at: '2026-08-06T02:03:54.032804+00:00'
updated_at: '2026-08-08T00:42:52.716893+00:00'
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
A node declaring an entrance (a vertical offset it rises from, an opacity it
fades from, a duration, a timing curve and an optional delay) is presented, on a
page whose motion is running, at that offset and opacity until it first scrolls
into view, and then arrives at its own settled presentation over the declared
duration and curve.

The settled presentation is the node's own authored geometry and opacity — the
entrance names only where the node comes *from*. A node authored at partial
opacity settles at that partial opacity. An entrance declaring no opacity to
come from starts fully transparent; one declaring no duration or curve uses the
substrate's default rather than requiring the author to restate one.

An entrance declaring no vertical offset animates opacity alone, with no
positional movement applied.

## Verification
Render a page with revealing nodes — one with an offset and a from-opacity, one
authored at partial settled opacity, one with opacity-only entrance — and drive
the page's motion with the nodes entering the viewport. Assert each node is
presented at its declared from-values before entry, arrives over the declared
duration and curve, and settles at its own authored geometry and opacity. Assert
the opacity-only node applies no positional movement.