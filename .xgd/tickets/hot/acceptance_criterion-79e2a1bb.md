---
uid: acceptance_criterion-79e2a1bb
id: AC-1483
type: acceptance_criterion
title: A handle sees only its own account's tickets, on the listing path as well as
  the one that needs an identifier
created_by: xgd
created_at: '2026-09-01T23:58:12.762165+00:00'
updated_at: '2026-09-01T23:58:12.762165+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

The account is a hard information barrier on ticket records, and it holds structurally rather than by a
filter each call site remembers.

- A store is obtained *for* one account, and every question the resulting handle answers is already
  scoped to it. **No operation takes an account as an argument**, so there is no call site at which the
  wrong one could be supplied; reaching another account's material requires deliberately obtaining a
  second handle.
- Fetching a ticket belonging to another account by its identifier fails as **not found** — the same
  answer an identifier that was never minted receives. The existence of another account's ticket is never
  disclosed, not even as a distinct refusal.
- The ticket is likewise **absent from listings and queries** made by another account's handle. This is
  the half a fetch-time guard alone would miss: a fetch takes an identifier the caller had to obtain
  somehow, while a listing is handed out freely and would enumerate the barrier away.
- This is asserted for the ticket store's own records against a real database, independently of any
  equivalent claim made about the site store, which holds different rows in different tables.

## Verification

Obtain handles for two different accounts. Create a ticket through the first. Through the second, fetch it
by identifier and observe a not-found result rather than a permission error or the ticket. Through the
second, run a listing that would match the ticket's type and observe its identifier is absent from the
results. Inspect the store's operations and confirm none accepts an account argument.
