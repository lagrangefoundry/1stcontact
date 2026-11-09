---
uid: acceptance_criterion-0e42a88c
id: AC-2507
type: acceptance_criterion
title: A missing or unconfirmed Turnstile token is refused, and an unconfigured secret
  fails closed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:23.264702+00:00'
updated_at: '2026-11-09T00:30:23.264702+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Turnstile is verified server-side on every submission that passes the honeypot. The outcomes are:
- No token, or a blank one: refused with `400`.
- The verifier answers anything other than success, a non-OK status, or a network failure: refused with `403`.
- The deployment has no Turnstile secret configured (unset or blank): refused with `503`, even when a token is present.

In all three cases nothing is written and nothing is sent. Each refusal is visibly different from the acknowledgement. Verification sends the secret, the token and the caller's source IP to Cloudflare's siteverify endpoint as a form-encoded POST.

## Verification
Against the endpoint, submit with no token, then with a token the verifier double rejects, then with the double throwing, then with the secret unset. Assert the status for each, no contact or event written, and (for the verified case) that the double received siteverify's URL with `secret`, `response` and `remoteip`.
