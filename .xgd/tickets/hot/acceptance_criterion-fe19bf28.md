---
uid: acceptance_criterion-fe19bf28
id: AC-2513
type: acceptance_criterion
title: The write seam to the control app is a bound RPC entrypoint reachable by no
  URL, in both environments
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:35.421289+00:00'
updated_at: '2026-11-09T01:26:39.408110+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
The write path from the published-site server into the control app has no URL:
- The control app exposes lead capture only as a named RPC entrypoint (`LeadIntake`, a `WorkerEntrypoint` whose `captureLead` runs the control app's lead capture against its own `env`). No HTTP path on the control app accepts a lead.
- The published-site server reaches that entrypoint through a service binding, declared in both the default and production environments.
- The Turnstile secret appears in no committed configuration file; only the public sitekey does.

## Verification
Construct the shipped `LeadIntake` entrypoint itself (`new LeadIntake(ctx, controlAppEnv)`), hand that instance to the published-site server as its `LEAD_INTAKE` binding, and POST a real submission through the public endpoint to a site offering an asset. Assert the acknowledgement, that exactly one D1 contact row and its provenance event were written for that tenant, and that the asset went out through the entrypoint's own mailer (built from its `env`), not through a test-supplied port. Inspect the configuration of both Workers and assert that the binding names the control app's service and the `LeadIntake` entrypoint in each environment, and that no Turnstile secret value is present in any config. Then probe the control app's HTTP surface for lead and internal paths and assert that none of them captures a contact.
