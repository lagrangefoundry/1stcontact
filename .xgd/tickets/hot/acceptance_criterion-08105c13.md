---
uid: acceptance_criterion-08105c13
id: AC-2169
type: acceptance_criterion
title: The invite acts only on existing contacts of the business, by id; creating
  a contact is the separate add act
created_by: xgd
created_at: '2026-11-01T18:27:30.730809+00:00'
updated_at: '2026-11-07T07:21:26.191160+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite acts only on contacts the business already holds; it never creates one.
Creating a contact is the separate add act (`POST /api/people/add`). The invite
route (`POST /api/people/invite`) takes the ids of the selected contacts, not an
address, and it has no branch that inserts a row: each id is moved on its own
existing row (same id) and no second row is written. An id that names nobody in
the scoped business — whether it does not exist or belongs to another business —
is answered 404 with the same sentence either way, and nothing is sent to it.
A request with no ids is refused 400 rather than answered as an empty success.

## Verification

Add a contact through the add route and record its id. As an owner, invite that
id through the invite route. Assert the response carries one result for that id,
and that reading the business's people for that address back from storage gives
exactly one row, with the same id. Post the invite with an id from a different
business and with an id that does not exist: assert both are 404 with identical
bodies and that the mail port received no message for either. Post the invite with
an empty id list and assert 400. Assert the invite route's request carries no
address field that creates a contact: posting an address with no ids is refused
400 and no row is written.
