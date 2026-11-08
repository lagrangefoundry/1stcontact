---
uid: acceptance_criterion-34e4647e
id: AC-2363
type: acceptance_criterion
title: The simulator's /cdn-cgi/access/logout clears the /login cookie and returns
  only to the fronted builder's origin
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:03:55.568435+00:00'
updated_at: '2026-11-08T02:03:55.568435+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
`GET /cdn-cgi/access/logout` on the simulator answers 302 with `Set-Cookie: CF_Authorization=; Path=/; Max-Age=0`, clearing the cookie `/login` set (same name and path). Its `Location` is:

- the `returnTo` query value, when `returnTo` is an absolute URL on the same origin as the simulator's `--builder`;
- otherwise the builder origin itself: when `returnTo` is absent, names another origin, or is not a URL.

It is answered by the simulator regardless of credential and is never forwarded to the builder. Together with the Worker's `POST /sign-out` (which sends an Access-credentialed caller to `<team-domain>/cdn-cgi/access/logout?returnTo=<origin>/sign-in`), this lets a person signed in through the simulator sign out of the local builder and land on its sign-in page.

## Verification
Against a real spawned simulator: sign in through `/login`, then request `/cdn-cgi/access/logout?returnTo=<builder>/sign-in`; assert 302 to that URL and a `Set-Cookie` that expires `CF_Authorization` on `Path=/`. Request it with a `returnTo` on another origin and with a non-URL value; assert both redirect to the builder.
