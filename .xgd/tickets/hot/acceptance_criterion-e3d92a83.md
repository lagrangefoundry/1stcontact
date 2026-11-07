---
uid: acceptance_criterion-e3d92a83
id: AC-2354
type: acceptance_criterion
title: Withdrawing a person's login ends every session they hold and stops further
  sign-in links to them
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:17.943920+00:00'
updated_at: '2026-11-07T08:23:17.943920+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
When a person's status is set to anything other than active, every session that person holds ends, on every browser. A cookie from any of those sessions no longer admits them. After that, a sign-in request for any of their addresses sends no message and creates no token, and the requester still sees the normal acknowledgement.

## Verification
Sign one person in twice (two cookies), then set their status to suspended through the people route. Assert that neither cookie admits them on a builder route with no Access token, and that a sign-in request for their address sends no mail and returns the standard acknowledgement.
