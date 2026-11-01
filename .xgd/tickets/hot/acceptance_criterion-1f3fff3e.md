---
uid: acceptance_criterion-1f3fff3e
id: AC-2215
type: acceptance_criterion
title: The portal accepts only GET and HEAD; every other method returns 405 and changes
  nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:07.910321+00:00'
updated_at: '2026-11-01T20:16:07.910321+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
/account and every path under it answer GET with the page or asset and HEAD with the same status and headers and no body. Any other method (POST, PUT, PATCH, DELETE) returns 405 "Method Not Allowed", and no stored state (sites, users, memberships, entitlements) differs before and after the request.

## Verification
Send each method to /account and /account/theme.css. Check GET returns 200, HEAD returns 200 with an empty body, and the rest return 405. Snapshot the store before and after the write-verb requests and check they are equal.
