---
uid: acceptance_criterion-9fb5f244
id: AC-2279
type: acceptance_criterion
title: From address is configured as no-reply@1stcontact.io in default and production;
  a missing or blank From refuses with no default
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:15.344182+00:00'
updated_at: '2026-11-04T17:32:15.344182+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
The sending address is deployment configuration, not a literal at a call site: the control app's deployment configuration declares the From address as exactly `no-reply@1stcontact.io` both at the top level and under the production environment. Resolving the From address for a deployment where it is absent or blank refuses with a not-configured error that names the missing setting — it never falls back to a default address.

## Verification
Parse the control app's deployment configuration and assert the From setting equals `no-reply@1stcontact.io` in both the default and production sections. Resolve the From address from an environment with the setting absent and with it whitespace-only; assert both raise a not-configured error mentioning the setting name, and that a configured value is returned trimmed.
