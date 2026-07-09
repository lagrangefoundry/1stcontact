---
uid: acceptance_criterion-c0354f1a
id: AC-527
type: acceptance_criterion
title: Verbatim text/casing difference is flagged while whitespace-only noise is ignored
created_by: xgd
created_at: '2026-07-09T22:58:29.655688+00:00'
updated_at: '2026-07-09T22:58:29.655688+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When a reference run and an actual run pair on their case-folded text but differ in casing (e.g. small-caps "Gigabyte Alchemy" rendered as literal "GIGABYTE ALCHEMY"), the diff emits a `text` delta reporting the expected verbatim text versus the actual verbatim text — the pair is still counted as matched, not missing. A difference that is only leading/trailing or internal whitespace produces no `text` delta.

## Verification
Diff paired runs that differ only in casing and assert a `text` delta is emitted (with the pair counted as matched); diff paired runs differing only in whitespace and assert no `text` delta is emitted.
