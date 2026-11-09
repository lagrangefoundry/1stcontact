---
uid: acceptance_criterion-fe19bf28
id: AC-2513
type: acceptance_criterion
title: The write seam to the control app is a bound RPC entrypoint reachable by no
  URL, in both environments
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:35.421289+00:00'
updated_at: '2026-11-09T00:54:13.620790+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
The write path from the published-site server into the control app has no URL:
- The control app exposes lead capture only as a named RPC entrypoint. No HTTP path on the control app accepts a lead.
- The published-site server reaches that entrypoint through a service binding, declared in both the default and production environments.
- The Turnstile secret appears in no committed configuration file; only the public sitekey does.

## Verification
Inspect the deployed configuration of both Workers. Assert that the binding names the control app's service and the named entrypoint in each environment, and that no Turnstile secret value is present in any config. Then probe the control app's HTTP surface for lead and internal paths and assert that none of them captures a contact.