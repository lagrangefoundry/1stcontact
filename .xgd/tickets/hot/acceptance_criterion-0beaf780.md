---
uid: acceptance_criterion-0beaf780
id: AC-1382
type: acceptance_criterion
title: The deployment answers on no address the gate does not front
created_by: xgd
created_at: '2026-08-31T09:32:27.810397+00:00'
updated_at: '2026-08-31T09:32:27.810397+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The deployment answers on no address the gate does not front.

The platform-assigned default hostname — the one issued automatically to any
deployment, which no hostname-attached policy can cover — is disabled in the
deployment configuration that governs every deploy. It is disabled at the top
level **and** restated for the named environment that ships to production, so
the control cannot be lost by someone reasoning incorrectly about which settings
a named environment inherits.

The operator-facing route the gate does front is still declared: a configuration
that closed every door would satisfy the first half and serve nobody.

## Verification

Read the deployment configuration that governs the control application. Observe
that every declaration of the platform-default-hostname setting disables it,
that there are two such declarations (top level and the production environment),
and that the operator-facing hostname route is still declared.
