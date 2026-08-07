---
uid: acceptance_criterion-53c66f17
id: AC-978
type: acceptance_criterion
title: A request that tries to escape any served file tree is refused rather than
  answered
created_by: xgd
created_at: '2026-08-07T01:45:12.257776+00:00'
updated_at: '2026-08-07T01:45:12.257776+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Each file tree the workspace origin serves — the rendered channels, the
installed components, and the workspace's own browser source — refuses a request
that resolves outside it, returning a forbidden status instead of the file's
contents. The refusal is identical across all three trees; no tree lacks the
guard.

## Verification

For every served tree, request a path that escapes the tree's root using
traversal segments (including percent-encoded forms) and assert the response is
a forbidden status and its body contains none of the targeted file's contents.
Assert the same outcome for all three trees, so the guard cannot be present on
one and missing on another.
