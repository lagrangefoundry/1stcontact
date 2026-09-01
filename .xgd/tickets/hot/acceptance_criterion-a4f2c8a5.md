---
uid: acceptance_criterion-a4f2c8a5
id: AC-1484
type: acceptance_criterion
title: A write aimed at another account's ticket is refused, and the target is unchanged
  when re-read
created_by: xgd
created_at: '2026-09-01T23:58:22.156234+00:00'
updated_at: '2026-09-01T23:58:22.156234+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

The account barrier holds on writes as well as reads, and a refused write leaves nothing behind.

- Updating a ticket that belongs to another account fails as **not found**, disclosing no more than a
  read would.
- The target ticket is **unchanged** afterwards: re-read through a handle for its own account, its
  fields and title are exactly what they were before the attempt. The refusal is a refusal, not a write
  that landed somewhere else or a partial application rolled back inconsistently.
- No record of the attempt is created in the attempting account's own material either — the operation
  produces nothing.

## Verification

Obtain handles for two different accounts. Create a ticket through the first with a known title. Through
the second, attempt to update that ticket's title and observe a not-found refusal. Re-read the ticket
through the first account's handle and observe the original title. Confirm the second account's own
listing gained nothing.
