---
uid: acceptance_criterion-a11b6ab8
id: AC-1476
type: acceptance_criterion
title: The ticket store's schema is applied as a migration in the declared location,
  in sequence after the site store's
created_by: xgd
created_at: '2026-09-01T23:56:42.318162+00:00'
updated_at: '2026-09-02T00:13:30.800044+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ab1ecd62
  kind: behavior
  regression_only: false
---

## Criterion

The ticket store's schema is part of the deployment's ordinary schema sequence rather than something
applied by hand or at first use.

- The deployment configuration declares where the schema sequence lives, and that location holds the
  ticket store's schema step alongside the site store's existing steps.
- The step is named into the sequence so that it is applied **after** the site store's first step and
  not before it. The order is load-bearing: the earlier step creates the shared account registry, and
  the ticket store's step is what reconciles it.
- Applying the sequence from empty, in the order it declares, yields a database the ticket store can
  create and read a ticket in — with no further schema work at run time.
- The same sequence, in the same order, is what the runtime acceptance tests apply, so what they prove
  is the schema that will be deployed rather than a fixture's approximation of it.
- Re-applying the sequence against an already-migrated database changes nothing.

## Verification

Inspect the deployment configuration for the declared schema location and confirm the ticket store's
step is present there and ordered after the site store's. Apply the sequence to an empty database, then
create and read back a ticket without any additional setup. Confirm the test harness that drives the
runtime acceptance tests applies the same enumerated sequence including this step.