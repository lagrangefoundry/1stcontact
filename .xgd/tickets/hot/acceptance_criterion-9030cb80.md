---
uid: acceptance_criterion-9030cb80
id: AC-1296
type: acceptance_criterion
title: Every document left out of the corpus is named individually, never counted
  and never silent
created_by: xgd
created_at: '2026-08-20T04:16:46.169184+00:00'
updated_at: '2026-09-10T07:51:47.497901+00:00'
completed_at: null
last_field_updated: body
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

Export against a store holding a mixture of opted-in and opted-out documents; assert that each excluded document's id appears in the reported set of exclusions and that the set equals exactly the excluded documents. Assert that the reported exclusions and the reported exports are disjoint and together account for every document in the store.

Then drive the **command form** an operator actually types, over the same mixture, and assert on its output: the reason is stated, every excluded id is named individually, and no bare count stands in for the names. The command layer is where the reason is said and where the line's emission is conditional — the export function returns only an array of ids, so asserting that array alone leaves the half an operator reads unproven.

With nothing excluded, assert the line is absent entirely from the command's output — not printed empty, and not printed as a zero.
