---
uid: acceptance_criterion-2bf97625
id: AC-974
type: acceptance_criterion
title: Workspace layout state survives closing and reopening, and every stored value
  is namespaced to this workspace
created_by: xgd
created_at: '2026-08-07T01:44:54.310703+00:00'
updated_at: '2026-08-07T21:19:45.636523+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The divider position, which side is collapsed, the selected site and the active
mode are all restored when the workspace is opened again, reproducing the state
the operator left. Every value the workspace persists is stored under a key
prefixed with the workspace's own namespace, so nothing it writes can collide
with another application sharing the same storage.

## Verification

Mount the workspace, change the divider position, collapse the secondary side,
select a different site and switch mode; discard the workspace and mount a fresh
one against the same storage. Assert all four values are restored. Enumerate
every key written and assert each begins with the workspace's namespace prefix.