---
uid: acceptance_criterion-bd6b20e9
id: AC-2350
type: acceptance_criterion
title: A cross-site POST to a sign-in link is refused and the link stays usable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:15.043141+00:00'
updated_at: '2026-11-07T21:04:41.158572+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A POST to `/sign-in/<token>` whose Origin header names a different origin from the one serving the route returns 403 with no session cookie, and the token is not used. A later same-origin POST of that token still signs the person in.

## Verification
Issue a link, then POST it with `Origin: https://attacker.example` and assert 403, no Set-Cookie header, and that the token is unused. Then POST same-origin and assert the redemption succeeds.