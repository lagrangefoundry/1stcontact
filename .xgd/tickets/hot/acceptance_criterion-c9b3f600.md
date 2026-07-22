---
uid: acceptance_criterion-c9b3f600
id: AC-687
type: acceptance_criterion
title: A rejected document returns the full list of per-field errors
created_by: xgd
created_at: '2026-07-22T19:32:29.199138+00:00'
updated_at: '2026-07-22T19:38:51.165780+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
When a document is rejected, validation does not throw or return a single opaque
failure: it returns a machine-readable result containing the full list of
violations, each identifying the offending location (a path into the document,
e.g. `/root/children/0/axes/fontSizePx`) and a human-readable message. Multiple
simultaneous violations are all reported, so a caller can correct the document
in one pass.

## Verification
Submit a document containing several distinct envelope violations at once and
observe the failure result carries a list with one path+message entry per
violation (not a single generic error), each path locating the field at fault.