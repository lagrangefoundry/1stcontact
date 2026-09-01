---
uid: acceptance_criterion-8903d67a
id: AC-1479
type: acceptance_criterion
title: A ticket created through the deployment's own wiring reads back through a second,
  independently obtained handle
created_by: xgd
created_at: '2026-09-01T23:57:34.801558+00:00'
updated_at: '2026-09-01T23:57:34.801558+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

Material stored through the running application is durable and readable back, proved against the real
database rather than against a fixture.

- A ticket created through the same wiring the application itself uses is assigned a stable identifier
  and persisted.
- A **second, independently obtained** handle for the same account — obtained afresh, not the one that
  wrote — reads the ticket back with its type, title, structured fields and body unchanged. Two handles
  rather than one, because a round trip through a single instance would pass with an in-memory cache and
  no working schema at all.
- The round trip runs against the deployment's real database and real object storage in the runtime the
  application is deployed to, through the schema produced by the declared schema sequence.

## Verification

In the deployed runtime, obtain a store for the configured account, create a ticket with fields and a
body, then obtain a fresh store for the same account and read the ticket by its identifier. Observe the
type, title, fields and body match what was written.
