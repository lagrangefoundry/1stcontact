---
uid: acceptance_criterion-55bc0421
id: AC-692
type: acceptance_criterion
title: Fluid-width transitions fold to interpolate; reflows fold to snap
created_by: xgd
created_at: '2026-07-22T19:42:30.227602+00:00'
updated_at: '2026-07-23T07:16:15.758909+00:00'
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
For a node whose geometry changes smoothly across adjacent sampled widths, the
between-width segment is classified `interpolate`. For a node that reflows between
adjacent widths (a large horizontal jump, or growing narrower as the viewport
grows wider — a column/stacking change), that segment is classified `snap`.

## Verification
Fold a fixture with one fluid-width node and one reflowing node; assert the fluid
node's segments are `interpolate` and the reflowing node's segment is `snap`.