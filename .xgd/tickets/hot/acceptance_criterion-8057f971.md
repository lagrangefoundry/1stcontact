---
uid: acceptance_criterion-8057f971
id: AC-1478
type: acceptance_criterion
title: One account registry serves both stores, and it carries what the ticket store
  writes, so registration against a freshly migrated database succeeds
created_by: xgd
created_at: '2026-09-01T23:57:25.983721+00:00'
updated_at: '2026-09-01T23:57:25.983721+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

There is exactly one record of which accounts exist and whether they are active, and both stores answer
to it.

- The ticket store does not create a rival registry. The registry the site store already established is
  the one it uses, so a deployment can never hold an account one store considers active and the other has
  never heard of.
- That registry carries every field the ticket store records against an account, including the
  configuration field the site store's original definition lacked. Applying the full schema sequence to an
  empty database leaves the registry with that field present, and existing rows written before it carry a
  usable value rather than nothing.
- Consequently, the **first** registration of an account through the ticket store, against a database
  freshly built from the declared schema sequence, succeeds — rather than failing with an error naming a
  column that does not exist, against a schema step that appeared to have applied cleanly.
- This holds when the schema sequence is applied in its declared order and nothing else has run.

## Verification

Apply the full declared schema sequence to an empty database and inspect the account registry: it is a
single table serving both stores and carries the ticket store's configuration field. Register an account
through the ticket store as the very first operation and observe it succeeds and the account is then
readable. Remove the reconciliation from the schema step and observe that the runtime acceptance tests
covering ticket creation and reading fail rather than pass — the reconciliation is load-bearing, not
decorative.
