---
uid: acceptance_criterion-a11b6ab8
id: AC-1476
type: acceptance_criterion
title: The ticket store's schema is applied as a migration in the declared location,
  in sequence after the site store's
created_by: xgd
created_at: '2026-09-01T23:56:42.318162+00:00'
updated_at: '2026-11-08T18:40:59.143491+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The ticket store's schema is part of the deployment's ordinary schema sequence rather than something applied by hand or at first use.

- The deployment configuration declares where the schema sequence lives (both the development and the production binding), and that location holds the single schema baseline ([[REQ-190]]) that carries the ticket store's schema step.
- Inside the baseline, the ticket store's step comes **after** the shared account registry and the site store's tables. The registry is created once, already carrying the configuration column the ticket store writes, so the component's own IF NOT EXISTS registry statement is a no-op and no repair step (no ALTER TABLE on the registry) exists.
- Applying the sequence from empty, by the real migration runner, yields a database the ticket store can create and read a ticket in, with no further schema work at run time.
- The same sequence is what the runtime acceptance tests apply, so what they prove is the schema that will be deployed rather than a fixture's approximation of it.
- Re-applying the sequence against an already-migrated database changes nothing.

## Verification

Inspect the deployment configuration for the declared schema location and confirm it holds the one baseline, with the ticket store's tables created after the registry and the site store's. Apply the sequence to an empty database and confirm the ticket store's tables exist and the registry carries its configuration column; re-apply and observe nothing changes. Confirm the test harness that drives the runtime acceptance tests applies the same enumerated sequence.