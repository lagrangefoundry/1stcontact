---
uid: acceptance_criterion-76d82fd2
id: AC-2144
type: acceptance_criterion
title: GET /api/businesses answers the account and every admissible business in one
  call, lapsed ones included and marked unselectable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:49:04.479269+00:00'
updated_at: '2026-11-01T10:49:04.479269+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

`GET /api/businesses` answers, in one call, everything the chrome needs before it
can draw: the signed-in account (name and email) and every business that
account holds a membership on, each with an opaque id, its name, and whether it
is selectable. A business whose grant has lapsed is included and marked not
selectable rather than omitted; a selectable business carries no lapse and an
unselectable one carries its lapse reason, so the two can never disagree.

It reports nothing about anybody else: a business the caller holds no
membership on is simply absent, exactly as one that does not exist would be.
It is answered for the account rather than for a selected business, so it needs
no business prefix and works before any business is chosen. With no verified
identity behind the request (the unconfigured local-development path) it
reports the resolved scope as a single selectable business. The answer is never
cacheable.

## Verification

Through the origin, with an identity holding memberships on two businesses — one
live, one lapsed — and a third business belonging to another account, request
the endpoint. Assert the account fields, that both of the caller's businesses
are present with the lapsed one marked unselectable and carrying a reason and the
live one carrying none, and that the other account's business is absent. Repeat
without an identity and assert exactly one selectable business. Assert the
response is non-cacheable.
