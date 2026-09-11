---
uid: acceptance_criterion-df7735b6
id: AC-1681
type: acceptance_criterion
title: An interruption during ingestion never leaves a record naming bytes that are
  not there
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:48.762352+00:00'
updated_at: '2026-09-11T04:07:48.762352+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

No material record ever names bytes that are not there.

If ingestion is interrupted after the bytes have been stored but before the record that
addresses them exists, the observable outcome is a material with **nothing attached** plus
stored bytes **nothing references** — collectable, and costing only storage until they are
collected. The outcome must never be a material, or an attached-file record, that points at
a location holding nothing.

## Verification

Drive the pipeline to the point where bytes are in the private store and then prevent the
record that addresses them from being written. Afterwards assert: the bytes are present and
unreferenced; the material record carries no integrity hash of its own and no attached-file
record; and reading the material back reports it as having no file rather than failing to
resolve a pointer. The criterion is about what is observable after the interruption, not
about the order of the writes, so any implementation that makes a dangling pointer
unconstructible satisfies it.
