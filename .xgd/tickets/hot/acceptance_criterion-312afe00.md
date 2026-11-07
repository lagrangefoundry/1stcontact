---
uid: acceptance_criterion-312afe00
id: AC-2355
type: acceptance_criterion
title: The sign-in request endpoint allows cross-origin calls only from origins inside
  the session cookie domain
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:18.650560+00:00'
updated_at: '2026-11-07T21:04:38.924684+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
An OPTIONS preflight to `/sign-in` from an origin whose host is the session cookie domain, or a subdomain of it, returns 204. The response has `Access-Control-Allow-Origin` echoing that origin, permits POST with a JSON content type, and includes `Vary: Origin`. A sign-in POST from such an origin carries the same allow-origin header. A preflight or POST from an origin outside the cookie domain gets no `Access-Control-Allow-Origin` header.

## Verification
Send preflights with an apex origin inside the domain and with `https://elsewhere.example`. Assert the 204 and the echoed allow-origin header for the first, and that the header is absent for the second. Repeat for the POST.