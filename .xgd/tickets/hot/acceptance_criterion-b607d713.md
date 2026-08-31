---
uid: acceptance_criterion-b607d713
id: AC-1383
type: acceptance_criterion
title: The gate's configuration is declared for every environment the application
  deploys to
created_by: xgd
created_at: '2026-08-31T09:32:29.970071+00:00'
updated_at: '2026-08-31T09:41:07.465035+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

Both settings the gate reads — the identity gateway's team identifier and this
application's audience identifier — are declared for **every** environment the
control application deploys to, not only the default one.

A named deployment environment inherits no configuration values, so a setting
declared once at the top level is simply absent in production. For this gate
that absence is not a silent degradation: it is the incomplete-configuration
state, in which the deployed builder refuses every request. Declaring both on
both sides of the inheritance line is what makes the deployed gate able to admit
anyone at all.

## Verification

Read the deployment configuration that governs the control application and
observe that each of the two settings the gate reads appears both in the
top-level value block and in the production environment's value block.

## Note

Neither setting is a credential: the team identifier is public and the audience
is an identifier, not a secret. They are declared in readable configuration
rather than in a write-only secret store deliberately — a gate configured out of
sight is a gate nobody can audit.