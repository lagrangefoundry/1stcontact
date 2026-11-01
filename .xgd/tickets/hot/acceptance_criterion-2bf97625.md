---
uid: acceptance_criterion-2bf97625
id: AC-974
type: acceptance_criterion
title: Workspace layout state survives closing and reopening, and every stored value
  is namespaced to this workspace
created_by: xgd
created_at: '2026-08-07T01:44:54.310703+00:00'
updated_at: '2026-11-01T10:48:28.562652+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The divider position, which side is collapsed, the selected business, the
selected site and the active mode are all restored when the workspace is opened
again, reproducing the state the operator left. Every value the workspace
persists is stored under a key prefixed with the workspace's own namespace, so
nothing it writes can collide with another application sharing the same storage;
the business selection is stored under a shell-wide key rather than one named
after a tab, because it is not one tab's.

A remembered business is a hint, not an instruction: if the account can no
longer operate it (removed, or its grant has lapsed), the workspace opens the
first business the account can operate instead, without an error, and the
stored value is rewritten to what was actually opened.

## Verification

Mount the workspace, change the divider position, collapse the secondary side,
select a different business and site and switch mode; discard the workspace and
mount a fresh one against the same storage. Assert all five values are restored.
Enumerate every key written and assert each begins with the workspace's
namespace prefix.

Store a business id the account cannot operate, mount, and assert the first
selectable business is in scope, no error is shown, and the stored value now
names that business.
