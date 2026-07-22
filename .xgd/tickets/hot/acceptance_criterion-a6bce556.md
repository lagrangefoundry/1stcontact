---
uid: acceptance_criterion-a6bce556
id: AC-693
type: acceptance_criterion
title: A node present only across a subrange of widths carries a visibility rule from
  its presence
created_by: xgd
created_at: '2026-07-22T19:42:32.898389+00:00'
updated_at: '2026-07-22T19:49:50.470619+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A node present at only a subrange of the sampled widths carries a visibility rule
bounding it to that range (a lower bound when absent below its first present width,
an upper bound when absent above its last present width). A node present at every
sampled width carries no visibility rule.

## Verification
Fold a fixture with a node present only above a breakpoint and another present at
all widths; assert the first carries a bounded visibility rule and the second
carries none.