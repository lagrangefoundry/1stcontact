---
uid: acceptance_criterion-e7c69b92
id: AC-492
type: acceptance_criterion
title: A stagger motion sequences a group's direct children with increasing delays
created_by: xgd
created_at: '2026-07-09T20:52:28.147383+00:00'
updated_at: '2026-07-09T20:52:28.147383+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
Rendering a module with a `stagger` motion produces a per-site stylesheet in which the direct children of the staggered group animate in sequence: each successive child receives a larger start delay than the previous one, forming a bounded cascade across the group's children.

## Verification
Render a site whose module carries a stagger motion over a multi-child group. Assert the per-site stylesheet contains per-child delay rules whose delay values increase monotonically with child position across the sequenced range.
