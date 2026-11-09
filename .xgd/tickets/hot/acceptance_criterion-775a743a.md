---
uid: acceptance_criterion-775a743a
id: AC-2577
type: acceptance_criterion
title: list_library is bounded by a default page of 20 and reports total matched and
  whether more were held back
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:39.339023+00:00'
updated_at: '2026-11-09T23:18:39.339023+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

`list_library` is bounded and always says so.
- With no `limit`, it returns at most 20 items.
- With a positive integer `limit` N, it returns at most N items.
- A missing, zero, negative or non-integer `limit` is treated as the default of 20.
- Every response carries `total`, the number of items that matched the filters before the limit, and `more`, which is true exactly when `total` exceeds the number of items returned.

Example: a catalogue of 25 items returns 20 items with `total: 25` and `more: true`. The same catalogue with `limit: 30` returns 25 items with `more: false`.

## Verification

Seed 25 catalogue items. Call `list_library` with no limit, with `limit: 5`, with `limit: 30`, and with `limit: 0`. Assert the item counts are 20, 5, 25 and 20. Assert that `total` is 25 in every case and that `more` is true, true, false and true respectively.
