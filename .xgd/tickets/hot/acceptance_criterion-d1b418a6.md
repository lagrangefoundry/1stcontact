---
uid: acceptance_criterion-d1b418a6
id: AC-1480
type: acceptance_criterion
title: The configured account is registered on demand, and an account already recorded
  keeps the status it has
created_by: xgd
created_at: '2026-09-01T23:57:44.477751+00:00'
updated_at: '2026-09-01T23:57:44.477751+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

A freshly migrated database is a working deployment, and registering the account it serves never
changes the standing of an account that is already known.

- An account the registry has never recorded still yields a usable store: obtaining one against a
  database whose registry is empty registers the configured account and returns a handle that can
  create and read tickets immediately. A migrated-but-unregistered database is not a dead builder.
- The account registered can only ever be the one the deployment is configured for. No other account
  is created, and no operation offers a way to name one.
- An account **already** recorded is left exactly as it stands: registration is attempted only after a
  read proves the account absent. In particular, a deployment configured for an account that has been
  deactivated does not reactivate it — after the attempt, the account's recorded status is still
  deactivated, and the attempt to obtain a store for it is refused rather than served.

## Verification

Against a database with an empty registry, obtain a store for the configured account and observe a ticket
can be created and read back. Inspect the registry and observe exactly one account was added and it is
the configured one. Then record that account as deactivated, attempt to obtain a store for it again, and
observe the attempt is refused and the recorded status is still deactivated rather than active.
