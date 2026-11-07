---
uid: acceptance_criterion-2d6a1734
id: AC-2349
type: acceptance_criterion
title: An expired, already-used, or unknown link gets one identical page offering
  a fresh sign-in link
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:14.338210+00:00'
updated_at: '2026-11-07T08:23:14.338210+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
A POST to `/sign-in/<token>` where the token is expired, already used, or was never issued returns the same response in all three cases: status 200 and an identical page body. The page tells the reader to request a fresh link and carries the sign-in form so they can do that on the spot. No session cookie is set.

## Verification
Produce one token of each kind (expire one via the clock, redeem one twice, invent one), POST each, and assert equal status and equal body, that the sign-in form is present, and that there is no Set-Cookie header.
