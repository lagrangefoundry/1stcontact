---
uid: acceptance_criterion-8277958f
id: AC-2506
type: acceptance_criterion
title: A filled honeypot is acknowledged and writes, sends and verifies nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:21.188034+00:00'
updated_at: '2026-11-09T00:30:21.188034+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A submission whose honeypot field is non-empty (anything other than whitespace) receives the frozen acknowledgement, and nothing else happens: no contact is created, no event is recorded, no message is sent, and the Turnstile verifier is never contacted.

## Verification
Submit a valid address with the honeypot field filled, using a verifier double that records calls. Assert the acknowledgement bytes, no new contact or event in the site's business, no message record, and zero verifier calls.
