---
uid: acceptance_criterion-6a7b61e4
id: AC-1325
type: acceptance_criterion
title: The same starting site answers identically over both stores
created_by: xgd
created_at: '2026-08-20T05:10:32.885949+00:00'
updated_at: '2026-08-20T05:10:32.885949+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

The same starting site, materialised into the filesystem-backed store and into the
filesystem-free store, answers identically.

The identical body of editing assertions — read, write, copy edit, structured subtree
round-trip, palette rules, asset add and remove, change counting, draft render — passes against
both without a single assertion being adjusted for one of them. Reading the assembled definition
from each, after the same sequence of commands, yields the same definition.

Which store a command got is therefore not observable from its result.

## Verification

Seed one definition and materialise it two ways. Run one parameterized suite over both, sharing
its assertions rather than duplicating them. Separately, apply the same sequence of commands to
both and assert the two assembled definitions are equal. A difference in either direction fails
the criterion — this is what makes "no caller depends on the filesystem" a checked property
rather than a reading of a diff.
