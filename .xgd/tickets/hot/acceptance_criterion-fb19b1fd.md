---
uid: acceptance_criterion-fb19b1fd
id: AC-2348
type: acceptance_criterion
title: Pressing Continue on a live link signs the person in with a session cookie
  the builder and the apex both read
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:13.641033+00:00'
updated_at: '2026-11-07T21:04:42.165191+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A same-origin POST (or one with no Origin header) to `/sign-in/<token>` with a live token returns a 303 redirect to `/`, marked no-store. It sets a session cookie that is HttpOnly, Secure and SameSite=Lax, has the configured session cookie name, and is scoped to the configured session cookie domain, so the builder host and the public apex both receive it. The token is used up: posting it again does not create a second session. A later builder request carrying only that cookie, with no Access token, is admitted as that person's verified email.

## Verification
Redeem a token and assert the 303, the Location, and the cookie's attributes and Domain. Then call a builder route with only that cookie and Access unstubbed, and assert it is admitted as the person's email. Post the token again and assert it is refused.