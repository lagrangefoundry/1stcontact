---
uid: acceptance_criterion-57b1fa42
id: AC-1494
type: acceptance_criterion
title: Republishability and exportability must be stated as true-or-false answers,
  never omitted and never inferred
created_by: xgd
created_at: '2026-09-02T00:30:36.972216+00:00'
updated_at: '2026-09-02T00:30:36.972216+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

Whether a piece of material may be republished and whether it may be exported are both **required**
on every material and every reference:

- Creating one that omits either answer fails with a validation error, and no record is stored. The
  platform does not supply a value on the creator's behalf — neither a permissive one nor a
  fail-closed one — because the two answers invert between a client's own site and a third-party
  reference, so any rule deriving them is wrong for half the corpus, and a fail-closed default
  produces no refusal anyone sees: it produces material silently marked unusable and
  indistinguishable from material genuinely marked so.
- Each answer must be a true-or-false value. Text that merely reads as affirmative — the shape a web
  form submits, for example "yes" — is refused as a validation error rather than interpreted.

A record supplying both answers as true-or-false values is accepted and returns them unchanged,
including the combination where one is true and the other false.

## Verification

Through an account-scoped store, attempt to create a material omitting the republish answer, and
again omitting the export answer, and confirm each fails as a validation error. Attempt one
supplying an affirmative *string* in place of a true-or-false value and confirm it too fails as a
validation error. Then create one supplying both as true-or-false values with differing values and
confirm both are returned as supplied.
