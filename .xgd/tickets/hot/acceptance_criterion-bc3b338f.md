---
uid: acceptance_criterion-bc3b338f
id: AC-1737
type: acceptance_criterion
title: How a material's description came to be is a declared pair of fields, so material
  needing describing again is selectable rather than guessable
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:50:13.584690+00:00'
updated_at: '2026-09-11T05:50:13.584690+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

How a material's description came to be is part of its declared record, not a convention over its
text, so material worth describing again is found by asking rather than by guessing.

- The vocabulary a material and a reference are validated against names two further parts: the
  **outcome** of describing the material, drawn from a closed, named set covering the successful
  case and every way describing it can fall short, and **what produced the description** — a model
  identifier where a model wrote it, an extractor's own name where code did.
- What produced the description is free text rather than a closed set, because it carries a model
  identifier as the provider returned it; the outcome is the closed set, because being able to
  select on it is its entire purpose.
- Both are **optional**, on both kinds: a reference created by a capture carries neither when its
  bundle lands, and such a record is accepted rather than refused — the same rule as the body's.
- Every material the platform creates from a file carries the outcome, and states what produced the
  description or states explicitly that nothing did, so a reader never has to treat absence as a
  third answer.
- Asking the account for its material returns both values on every row, so the material whose
  description is missing or came from a superseded describer is selectable by a stated field. A
  later pass to describe material again is therefore a query and not a migration.

## Verification

Enumerate the fields the store validates material and reference against, and confirm both parts are
present on both kinds, that the outcome's permitted values are a closed named set, and that neither
is required. Through an account-scoped store create a material supplying neither, and confirm it is
accepted. Then ingest a file, list the account's material, and confirm the row carries the outcome
of describing it and either the name of what produced the description or an explicit nothing — and
that selecting on the outcome returns exactly the material whose description fell short.
