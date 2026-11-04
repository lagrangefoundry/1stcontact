---
uid: acceptance_criterion-9906c21e
id: AC-2311
type: acceptance_criterion
title: Re-running bin/seed changes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:16.036481+00:00'
updated_at: '2026-11-04T18:28:59.867134+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
Running `bin/seed` a second time against an already-seeded local store exits 0 and leaves every seeded row byte-for-byte identical. This covers people, accounts, businesses, addresses, names, memberships and grants. The row counts do not change.

## Verification
Seed, snapshot every row of every seeded table, seed again, and assert that the snapshots are equal as whole rows. Passing without an error is not sufficient.