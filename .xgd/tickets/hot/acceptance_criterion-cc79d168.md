---
uid: acceptance_criterion-cc79d168
id: AC-1268
type: acceptance_criterion
title: The same command in machine-readable form returns the baseline, the current
  count, truncation and the ordered records
created_by: xgd
created_at: '2026-08-20T02:27:55.301291+00:00'
updated_at: '2026-08-20T02:27:55.301291+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

The same command asked for machine-readable output returns the change slice as structured data: the baseline that was asked about, the site's current count, whether the answer is truncated, and the ordered list of records — each with its count, timestamp, actor, operation, page where applicable, label, and before/after text where words changed.

## Verification

Make a copy edit, run the changes command in machine-readable form and assert the parsed result carries the baseline asked for, the current count, a truncation flag, and one record with every field above populated as expected.

Assert the record ordering is oldest first, and that asking since the current count yields the same structure with an empty record list.
