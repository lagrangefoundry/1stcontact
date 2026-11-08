---
uid: acceptance_criterion-b959e6d2
id: AC-2365
type: acceptance_criterion
title: The Account dialog always shows a Sign out form beside Close that posts to
  /sign-out
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:43:59.532013+00:00'
updated_at: '2026-11-08T02:43:59.532013+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
The builder's Account dialog always shows a Sign out control in its footer, beside Close. No state of the caller or the payload hides it. The control is a form with method POST and action `/sign-out`, containing a submit button labelled Sign out. Submitting it is an ordinary form navigation: the browser follows the server's 303, and the client does no fetch and no branching on which credential the caller holds. The `/sign-out` path the builder posts to equals the path the Worker serves sign-out on. `GET /api/businesses` carries no `session` field.

## Verification
Mount the Account dialog in a real DOM with no session information supplied. Assert the footer holds a `form[method=post]` whose action is `/sign-out` with a `button[type=submit]` inside it, next to the Close button. Assert the builder's sign-out path constant equals the Worker's. Assert the `/api/businesses` payload has no `session` key.
