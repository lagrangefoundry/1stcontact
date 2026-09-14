---
uid: acceptance_criterion-16a0f771
id: AC-1769
type: acceptance_criterion
title: A member written a second time replaces the first rather than accumulating
  beside it
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:06.182093+00:00'
updated_at: '2026-09-14T04:49:06.182093+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
Writing a member that already exists replaces it. After a second write, the
bundle holds exactly one member under that key and reading it back yields the
second write's content, on every backing.

This is what makes re-derivation correct: refolding a bundle rewrites its folded
document and its form model in place against a bundle it did not create, so a
store that accumulated would leave the bundle holding two answers to the same
question.

## Verification
Write a folded document into a bundle, write a different one under the same key,
then assert the enumeration contains that key exactly once and the read-back
content is the second one. Run on each backing.
