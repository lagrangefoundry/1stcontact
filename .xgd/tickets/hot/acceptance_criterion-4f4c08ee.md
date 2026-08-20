---
uid: acceptance_criterion-4f4c08ee
id: AC-1253
type: acceptance_criterion
title: An accepted write answers with a higher change count; a refused write answers
  with none, advances nothing and records nothing
created_by: xgd
created_at: '2026-08-20T02:26:42.462422+00:00'
updated_at: '2026-08-20T02:26:42.462422+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A mutating operation on the site's write path answers with the site's change count after it, and that count is strictly greater than the count that stood before it.

A write that is **refused** answers with no count at all, leaves the site's change count exactly where it was, and adds no record to the change log.

## Verification

Read the site's current change count. Perform an accepted write; assert the count it answers with is exactly one greater, and that asking for changes since the earlier count returns exactly one record.

Then attempt a write that the write path refuses (an invalid value for a field). Assert the refusal carries no count, that the current count is unchanged from before the attempt, and that asking for changes since that count returns an empty list.
