---
uid: acceptance_criterion-1d600fa2
id: AC-654
type: acceptance_criterion
title: Terminal-fails on an un-captured requested width, listing available widths
created_by: xgd
created_at: '2026-07-19T02:51:36.106239+00:00'
updated_at: '2026-07-19T02:51:36.106239+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
When a requested size maps to a width the persisted ladder never captured, the command fails loudly rather than dropping that column. The error names the requested size and width and lists the widths the ladder does carry, directing the user to re-capture to include the missing width.

## Verification
Run `responsive-diff` requesting a size whose width is absent from a fixture ladder that carries only some widths. Assert the command fails, the message names the missing width and enumerates the widths present in the ladder, and no partial table is emitted for that run.
