---
uid: acceptance_criterion-a3fee1fb
id: AC-2201
type: acceptance_criterion
title: Suspending a person's login stops them signing in, and restoring it lets them
  back in; there is no suspend control in the panel
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:18.146724+00:00'
updated_at: '2026-11-01T19:33:18.146724+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
The server can set a person's login status in the scoped business. Once a person is suspended (a status other than active), their next sign-in is refused as user inactive, whatever memberships or grants they hold. Setting them back to active lets them sign in again. A request with no status is refused 400 "A status is required.", and an id that names nobody in this business is 404. In the panel, May sign in is shown only as a locked value, and the detail offers no control that changes it.

## Verification
Against real D1: set an invited, entitled person's status to inactive and assert that admission refuses them as user inactive. Set it back to active and assert they are admitted. Send an empty status and assert 400. Send an unknown id and assert 404. In the panel, assert the May sign in cell is locked and that no transport call changes status.
