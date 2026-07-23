---
uid: acceptance_criterion-377af866
id: AC-637
type: acceptance_criterion
title: A text-block authored with a gradient panel renders a padded, rounded panel
  with that gradient surface
created_by: xgd
created_at: '2026-07-19T02:28:47.534345+00:00'
updated_at: '2026-07-23T11:15:40.345088+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a `gradient` content value is authored (a direction plus two or more colour stops), it resolves to a panel/card surface `background-image: linear-gradient(...)` carrying the authored direction and stop colours in painted order — a gradient surface fill, superseding the element's solid fill. Each stop colour is resolved as either an absolute hex literal or a palette-role alias (absolute-or-overlay). When fewer than two stops are supplied the value is under-specified and resolves to no fill, so the caller keeps its solid treatment.

## Verification
Call the shared surface-gradient resolver (`resolveSurfaceGradient`) with a gradient declaring a direction and two stops — one an absolute hex, one a palette role. Assert it returns a `background-image: linear-gradient(<direction>, <hex> 0%, var(--color-<role>) 100%)` declaration carrying the resolved direction and stop colours, and returns an empty declaration (no fill) when given a single stop.