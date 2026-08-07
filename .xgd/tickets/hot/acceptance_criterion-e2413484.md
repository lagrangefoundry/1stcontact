---
uid: acceptance_criterion-e2413484
id: AC-997
type: acceptance_criterion
title: One confirmed form is one change, however many fields were edited in it
created_by: xgd
created_at: '2026-08-07T02:16:33.376825+00:00'
updated_at: '2026-08-07T02:16:33.376825+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

Confirming the form produces exactly one change to the draft and one
re-rendering, regardless of how many of its fields the operator altered.
Editing fields within the open form writes nothing; the confirm is the single
moment anything is applied.

## Verification

Open a form over a region exposing more than one field where available, alter
several fields, and observe that nothing is written or re-rendered until the
form is confirmed, and that confirming applies all altered fields together as a
single change.
