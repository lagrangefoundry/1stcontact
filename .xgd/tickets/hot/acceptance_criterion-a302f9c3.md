---
uid: acceptance_criterion-a302f9c3
id: AC-2233
type: acceptance_criterion
title: A grant may only be opened on or withdrawn from a business within the caller's
  scope; an id from outside it is refused and nothing is written
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-01T22:20:32.846098+00:00'
updated_at: '2026-11-01T22:20:32.846098+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
A grant can only be opened on, or withdrawn from, **a business within the
caller's scope**. That means a business someone in the scoped business holds a
membership on: the same population as the contact detail's business table.
- **Opening a grant** that names a business outside that population is refused
  with **400** *"No such business among these contacts."* and no grant row is
  written. A grant naming no business is still refused with its own sentence
  (AC-2198).
- **Withdrawing a grant** whose business is outside that population is refused
  with **400** *"No such grant."*, the same answer as an id that names no grant
  at all, so the route is not an existence oracle. The grant's status and
  `revoked_at` are unchanged.

The operator gate (AC-2200) is checked first. This rule is the second check,
and it confines even the operator to the businesses of the people the scoped
business holds.

## Verification
Against real D1, through the Worker with a verified Access token. Take a customer
business with an active capacity grant, and a second business whose people run
no business. As the 1st Contact operator scoped to the second business (through
the hosting bypass):
- open a grant naming the first business, and assert 400 with the sentence and
  an unchanged grant count;
- withdraw the first business's grant, and assert 400 *"No such grant."* with
  the row still `active` and `revoked_at` null.

Then, scoped to the 1st Contact business (where the first business's owner is a
contact), assert that both acts succeed.
