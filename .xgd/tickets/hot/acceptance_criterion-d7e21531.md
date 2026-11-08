---
uid: acceptance_criterion-d7e21531
id: AC-2360
type: acceptance_criterion
title: The service-token mapping is deployment configuration declared for every environment,
  as name=address pairs, never read from the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T01:41:25.159297+00:00'
updated_at: '2026-11-08T01:41:25.159297+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

Who a service token is, is written by the operator in the deployment
configuration and by nobody else.

- The mapping setting (`SERVICE_TOKEN_IDENTITIES`) is declared explicitly for
  **every environment the application deploys to** — the default environment
  and each named environment — because a named environment inherits none of the
  default's settings. The default declares it empty; the production environment
  declares the documented automation identity's mapping to its operator.
- Its value is comma-separated `name=address` pairs, where the name is the
  machine name the identity gateway signs into the token and the address is an
  existing person's. Every declared entry follows that form.
- The machine name used for lookup is taken only from the token the gateway
  signed, and the mapping only from the deployment's configuration. Nothing the
  caller sends — no header, query parameter, cookie or body field — selects or
  changes which person a token acts as.

## Verification

Read the committed deployment configuration and observe the mapping setting is
declared in the default environment and in every named environment, empty in
the default, and that every non-empty entry is a `name=address` pair. Through
the application's request handling, present an unmapped service token together
with request input naming a mapped machine name or a person's address, and
observe it is still refused with the no-address reason.
