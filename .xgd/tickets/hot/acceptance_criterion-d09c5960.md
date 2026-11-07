---
uid: acceptance_criterion-d09c5960
id: AC-2351
type: acceptance_criterion
title: Signing out ends the session and clears the cookie, and succeeds for a caller
  who is not signed in
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:15.747754+00:00'
updated_at: '2026-11-07T08:23:15.747754+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A POST to `/sign-out` returns a 303 redirect to `/sign-in` with a Set-Cookie header that clears the session cookie. If the request carried a live session, that session has ended: presenting the same cookie value afterwards no longer admits anyone. A POST to `/sign-out` with no cookie, or with a dead one, gets the same 303 and the same clearing cookie.

## Verification
Sign in, then POST /sign-out and assert the 303 and the clearing cookie. Replay the old cookie against a builder route with no Access token and assert it is not admitted. POST /sign-out with no cookie and assert the same response shape.
