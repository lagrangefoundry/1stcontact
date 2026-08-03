---
uid: acceptance_criterion-f5a6fc42
id: AC-795
type: acceptance_criterion
title: Re-importing is stable and the bundle's own artifacts are unchanged by the
  import
created_by: xgd
created_at: '2026-08-03T03:46:42.837927+00:00'
updated_at: '2026-08-03T04:01:08.250443+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
Handles that are already site-local are normalised to root-relative form, so
they resolve identically from any page depth, and importing an
already-localized document rewrites nothing further and yields byte-identical
handles (no double-prefixing, no re-resolution). The bundle's own stored
artifacts are not modified by an import: after importing, the bundle's folded
document still carries the handles exactly as the capture recorded them, so the
read-only analytic gate that re-folds the bundle sees the same input as before
the import.

## Verification
Import a bundle, then import the same bundle again and compare the two written
page definitions: the handles are identical and the second import reports zero
newly-bound handles. Separately, read the bundle's folded document before and
after an import and confirm it is unchanged, including its absolute handles.