---
uid: acceptance_criterion-0238eb81
id: AC-2366
type: acceptance_criterion
title: Signing out with an Access credential redirects to the team domain's Access
  logout with returnTo on this origin
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:44:00.257306+00:00'
updated_at: '2026-11-08T02:44:00.257306+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A POST to `/sign-out` that carries a Cloudflare Access credential is answered with a 303 to `<team-domain>/cdn-cgi/access/logout?returnTo=<this request's origin>/sign-in`, with `returnTo` URL-encoded. The credential can be the forwarded `cf-access-jwt-assertion` header or a `CF_Authorization` cookie. `returnTo` is built only from the request's own origin, and nothing the caller sends can change it. This holds when the caller also holds a live session of ours. That session is ended, and our cookie is cleared on the same response. When no team domain is configured, the same request is redirected to `/sign-in` and never off our origin.

## Verification
With a team domain configured, POST /sign-out with a `CF_Authorization` cookie and, separately, with the assertion header. Assert the 303 Location is the team domain's logout path with `returnTo` equal to the request origin plus `/sign-in`. Repeat while also holding a live session. Assert the Access logout still wins, the session no longer admits, and the clearing cookie is present. With no team domain configured, assert the Location is `/sign-in`.
