---
uid: acceptance_criterion-514c715c
id: AC-2502
type: acceptance_criterion
title: Every identity-dependent outcome answers one byte-identical acknowledgement
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:12.938739+00:00'
updated_at: '2026-11-09T00:54:16.201104+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every outcome that depends on who submitted, or on what is already recorded, gets a byte-identical response: status, headers and body. These outcomes are:
- a new address
- an address already a contact
- a submission over the rate limit
- a filled honeypot
- an address that has already been sent the form's asset
- an address that is suppressed
- a site key that names no site
- a submission with no email-shaped value

For a JSON submission the response is `200 {"ok":true}`; for a native form submission it is the HTML confirmation page. Nothing in the response reveals which outcome occurred.

## Verification
Produce each outcome against the endpoint (stubbing the rate limiter to refuse where needed) and assert that every response's status, full header set and body bytes equal those of the new-address response.