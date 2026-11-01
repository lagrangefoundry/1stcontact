---
uid: acceptance_criterion-08105c13
id: AC-2169
type: acceptance_criterion
title: Inviting an address already a contact of the business promotes that same row
  and inserts no second; the result reports whether a row was created
created_by: xgd
created_at: '2026-11-01T18:27:30.730809+00:00'
updated_at: '2026-11-01T18:57:27.874298+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite is a transition on the one row the business holds for an address, not
a creation. When the business the caller is scoped to already holds a person at
the invited address — for example a captured contact never invited — that same row
(same id) is marked invited and no second row is inserted. Only when no such row
exists is one inserted: active, held against that business, marked invited (an
invitation timestamp is set) and not yet seen. The response reports the person and
a `created` flag that is true only when a row was inserted and false when an
existing row was promoted.

## Verification

Record a contact in a business with no invitation timestamp. As an owner of that
business, invite the same address through the invite route. Assert the response
reports `created` false and the contact's id; read the people for that address in
the business back from storage and assert exactly one row, with the same id and
its invitation timestamp now set. Invite a new address and assert `created` true,
and that the stored row is active, has its invitation timestamp set and no
first-arrival timestamp.