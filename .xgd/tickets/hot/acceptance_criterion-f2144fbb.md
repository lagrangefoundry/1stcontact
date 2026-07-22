---
uid: acceptance_criterion-f2144fbb
id: AC-695
type: acceptance_criterion
title: The folded L1 document is a complete reproduction independent of the hint sidecar
created_by: xgd
created_at: '2026-07-22T19:42:38.304681+00:00'
updated_at: '2026-07-22T19:49:50.243751+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
The folded L1 document renders as a complete, valid reproduction on its own,
without reference to the structural-hint sidecar. The hints are advisory only:
nothing in the render/reproduction path requires or consumes them.

## Verification
Render the folded L1 document with no hint sidecar present; assert rendering
succeeds and produces a valid reproduction.