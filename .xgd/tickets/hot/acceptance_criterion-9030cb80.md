---
uid: acceptance_criterion-9030cb80
id: AC-1296
type: acceptance_criterion
title: Every document left out of the corpus is named individually, never counted
  and never silent
created_by: xgd
created_at: '2026-08-20T04:16:46.169184+00:00'
updated_at: '2026-08-20T04:37:26.737010+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Every document left out of the corpus is reported individually, by its human id, and the report says why they are out — that they carry no opt-in. It is never a bare count, and never silence.

When nothing was left out, no such line appears at all.

## Verification

Export against a store holding a mixture of opted-in and opted-out documents; assert that each excluded document's id appears in the reported set of exclusions and that the set equals exactly the excluded documents. Assert that the reported exclusions and the reported exports are disjoint and together account for every document in the store, and that an export with nothing excluded reports no exclusion line.