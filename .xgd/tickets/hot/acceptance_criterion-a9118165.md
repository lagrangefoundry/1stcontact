---
uid: acceptance_criterion-a9118165
id: AC-2563
type: acceptance_criterion
title: A preview submission skips Turnstile and the rate limiter; a public submission
  cannot obtain that bypass by anything in the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T19:56:42.190689+00:00'
updated_at: '2026-11-09T20:04:36.741885+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A submission through the draft preview is not subject to Turnstile verification or the rate limiter. It needs no Turnstile token, makes no call to the verifier, is never acknowledged-and-dropped for exceeding a rate limit, and is accepted on a deployment with no Turnstile secret and no rate limiter configured. It is still subject to the shape, size and field limits and the honeypot. The bypass exists because Cloudflare Access has already identified the submitter. It is granted only by the server for the preview route, and nothing in a request can obtain it. A submission to the published endpoint that carries a body field, query parameter or header named `identified` (with any value) is still rate-limited and still requires a verified Turnstile token, and the body field is stored only as an ordinary answer.

## Verification
On the control app with no `TURNSTILE_SECRET` and no `LEAD_RATE_LIMIT`, POST a submission with no Turnstile token to `/preview/<slug>/draft/api/lead`. Assert that it is acknowledged, a contact is written and the verifier fetch is never called. Repeat beyond the published limit (more than 20 in 60 seconds) and assert every submission is written. POST with the honeypot filled and assert nothing is written. Against the published endpoint, POST `identified=true` with no Turnstile token and assert `400`. With a failing token, assert `403`. Assert that a recorded submission keeps `identified` among its answers.