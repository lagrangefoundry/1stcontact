---
uid: acceptance_criterion-6168d1ee
id: AC-1543
type: acceptance_criterion
title: No piece of material ever names bytes that are not there, however an ingestion
  is interrupted
created_by: xgd
created_at: '2026-09-04T03:53:43.453553+00:00'
updated_at: '2026-09-04T03:53:43.453553+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-70a922b9
  kind: behavior
  regression_only: false
---

## Criterion

No piece of material ever names bytes that are not there. An ingestion interrupted part-way leaves
one of exactly two states, and never a third:

- a material record with no file attached to it — visible, honestly described, and collectable by a
  later sweep; or
- stored bytes that no record names — collectable by a later sweep.

A record that points at absent bytes is not constructible by interrupting the pipeline at any
point. Where such a state is nevertheless encountered when reading a file back, it is reported as
storage having lost the bytes, not as the material not existing.

## Verification

Drive an ingestion that fails after the material record is created and before the file is stored.
Assert the record exists, that it reports having no file attached, and that reading its bytes
reports the file as missing from storage rather than reporting the material as unknown. Drive an
ingestion that fails after the bytes are stored and before any record names them, and assert the
stored object exists and no record references it. Assert that at no interruption point does a
record exist whose stated attachment address resolves to nothing.
