---
uid: acceptance_criterion-28ea782f
id: AC-595
type: acceptance_criterion
title: Unpositioned hero renders in normal flow, unchanged
created_by: xgd
created_at: '2026-07-13T20:23:15.170251+00:00'
updated_at: '2026-07-13T20:23:15.170251+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
A hero whose objects carry no position renders exactly as before: every object
sits in the normal content flow, no full-band absolute placement container is
emitted, and no band-coordinate placement values are present anywhere in the
output. Introducing this capability causes zero change to an existing
unpositioned hero.

## Verification
Render a hero with a heading/subhead but no positions. Confirm the flowed
heading is present, and that the output contains no full-band positioning
container and no band-coordinate placement values.
