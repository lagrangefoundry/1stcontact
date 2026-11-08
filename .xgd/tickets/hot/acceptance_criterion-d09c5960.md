---
uid: acceptance_criterion-d09c5960
id: AC-2351
type: acceptance_criterion
title: Signing out ends our session and clears our cookie whatever admitted the caller,
  and lands on /sign-in without an Access credential
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:15.747754+00:00'
updated_at: '2026-11-08T02:44:22.335111+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
  title: Signing out ends our session and clears our cookie whatever admitted the
    caller, and lands on /sign-in without an Access credential
---

## Criterion
On a deployment that issues sessions, a POST to `/sign-out` always answers with a Set-Cookie header that clears our session cookie. This holds whatever credential admitted the caller. If the request carried a live session of ours, that session has ended: presenting the same cookie value afterwards no longer admits anyone. A POST to `/sign-out` with no cookie, or with a dead one, succeeds the same way. When the request carries no Access credential (no forwarded assertion header and no `CF_Authorization` cookie), the response is a 303 redirect to `/sign-in`.

## Verification
Sign in with a session only (no Access credential). POST /sign-out and assert a 303 to `/sign-in` and the clearing cookie. Replay the old cookie against a builder route with no Access token and assert it is not admitted. POST /sign-out with no cookie and assert the same 303 to `/sign-in` with the clearing cookie.