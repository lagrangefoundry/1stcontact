---
uid: acceptance_criterion-dab8d017
id: AC-1481
type: acceptance_criterion
title: A deployment that names no account is refused when the store is built, with
  a named error saying where to declare it
created_by: xgd
created_at: '2026-09-01T23:57:52.715939+00:00'
updated_at: '2026-09-01T23:57:52.715939+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

A deployment that does not say which account it serves cannot obtain a ticket store at all.

- Obtaining a store fails when the configured account identifier is absent, empty, or only whitespace.
- The failure happens **when the store is obtained**, before any ticket operation is attempted — not on
  the first read or write.
- The failure is a distinct, named error a program can branch on, not a generic one: it identifies which
  configuration is missing, states that this deployment serves exactly one account and cannot infer
  which, and names both places the configuration must be declared — the default configuration and the
  named production environment, which inherits nothing from it.
- The refusal is not a warning and there is no fallback account: nothing is created, read, or written.

## Verification

Attempt to obtain a store with the account identifier absent, and again with it set to whitespace, and
observe each attempt fails with the named error before any operation is issued. Read the error message
and confirm it identifies the missing configuration and names both declaration sites.
