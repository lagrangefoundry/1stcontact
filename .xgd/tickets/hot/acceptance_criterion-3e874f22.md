---
uid: acceptance_criterion-3e874f22
id: AC-2113
type: acceptance_criterion
title: Each unselectable business says why — expired with its end date, revoked, not_yet
  or never_granted — and a selectable one says nothing
created_by: xgd
created_at: '2026-11-01T09:54:35.181006+00:00'
updated_at: '2026-11-01T09:54:35.181006+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Every business in an admission carries a lapse exactly when it is unselectable,
so selectability and the lapse cannot disagree. The lapse reason is one of:

- `expired` — a grant covered the business and its end has passed; carries the
  date access ended. Where a grant was renewed and several have ended, the latest
  end is reported.
- `revoked` — the business's grants have been withdrawn; carries no date.
- `not_yet` — a grant is written and has not started; carries no date. A pending
  grant is reported in preference to an ended one.
- `never_granted` — no grant was ever made against the business; carries no date.

A selectable business carries no lapse.

## Verification

For each reason, give a person a business in that state and assert admission
lists it unselectable with that reason, with an end date only for `expired`.
Give one business two ended grants and assert the later end date is reported.
Give one business an ended grant and a future grant and assert `not_yet`. Assert
a selectable business beside them carries no lapse.
