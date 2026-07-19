---
uid: acceptance_criterion-9b3731cc
id: AC-651
type: acceptance_criterion
title: Aligns repeated identical text occurrence-by-occurrence in document order
created_by: xgd
created_at: '2026-07-19T02:51:04.847297+00:00'
updated_at: '2026-07-19T02:59:24.259643+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
When the same normalized text appears multiple times in the capture, each occurrence aligns to the corresponding occurrence at the other sizes in document order, producing one row per occurrence rather than collapsing them or cross-pairing them across containers.

## Verification
Run against a fixture where an identical text string (e.g. a repeated label) appears N times at each size. Assert the table contains N distinct rows for that text and that each occurrence's per-size cells correspond to the same document-order position, not a scrambled pairing.