---
uid: acceptance_criterion-bc4eeb69
id: AC-2130
type: acceptance_criterion
title: A business-scoped route for an account with nothing selectable answers 403
  with its own message, logged as no_entitlement
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:52.967168+00:00'
updated_at: '2026-11-01T10:26:52.967168+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted caller with no selectable business makes an unprefixed request to any route that needs a business (sites, tickets, project knowledge, chat), the response is:
- HTTP 403 (not 503 or 402), `content-type: text/plain`, `cache-control: no-store`
- body "No business on this account can be opened at the moment. The business switcher lists each one and says why.", which is distinct from the uniform denied message
- a `no_business` event in the log with reason `no_entitlement` and the caller's email.

An account that holds at least one live business among lapsed ones is unaffected and resolves to the live one.

## Verification
Seed a wholly lapsed caller, request a business-scoped route, and assert the status, exact body, and log event. Add one live grant and assert that the same request now succeeds against that business.
