---
uid: acceptance_criterion-19aa1684
id: AC-2221
type: acceptance_criterion
title: The portal's copy says closing the account is done by asking, and offers no
  contact channel that does not work
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:16.228821+00:00'
updated_at: '2026-11-01T20:16:16.228821+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
The erasure explanation states that the page does not close the account on its own and that closing is done by asking ("This page does not close your account on its own. Ask us and we will do it."), and that the accurate promise is "everything we are allowed to delete". No text on the page says or implies that the account has been, or is being, deleted, closed or scheduled for deletion, and the page contains no `mailto:` or contact link to an unrouted address.

## Verification
Render /account and press Delete account. Assert the asking sentence is present. Assert no visible string matches completion claims (e.g. "has been deleted", "deletion scheduled", "request received"), and assert no anchor has a `mailto:` href.
