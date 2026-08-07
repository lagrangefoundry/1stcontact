---
uid: acceptance_criterion-53c66f17
id: AC-978
type: acceptance_criterion
title: A request that tries to escape any served file tree is never satisfied, identically
  on every tree
created_by: xgd
created_at: '2026-08-07T01:45:12.257776+00:00'
updated_at: '2026-08-07T03:36:02.982468+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Each file tree the workspace origin serves — the rendered channels, the
installed components, and the workspace's own browser source — never satisfies a
request that resolves outside it: the response is not a success, and none of the
targeted file's contents come back. The outcome is identical across all three
trees; no tree lacks the confinement.

The criterion deliberately does not pin *which* refusing status. Confinement is
achieved by clamping an escaping path back inside the tree root, so such a
request resolves to a path that does not exist there and is answered as *not
found* rather than singled out as forbidden. What an operator — or an attacker —
can observe is the guarantee: the targeted file is never served, and every tree
behaves the same way.

## Verification

For every served tree, request a path that escapes the tree's root using
traversal segments (including percent-encoded forms) and assert the response is
a non-success status whose body contains none of the targeted file's contents.
Assert that every probe across every tree produced the same status, so the
confinement cannot be present on one tree and missing on another.
