---
uid: acceptance_criterion-68796ba6
id: AC-2197
type: acceptance_criterion
title: A caller who does not own the scoped business is refused 403 when changing
  a contact's record
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:12.383147+00:00'
updated_at: '2026-11-01T20:02:32.733791+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
If the caller does not own the business they are scoped to, a record change is refused with **403** and the message "Only an owner of this business may edit its people.", and nothing changes. This includes a caller who can enter the business without owning it (for example through the platform-operator bypass) and the dev-open loopback path. The refusal is 403, not 404, because every business owner has this surface.

## Verification
Against real D1: as a member who is not an owner, and separately as a platform operator who holds no owner membership on the business, submit a valid change for a person in that business. Assert 403 with the message and that a re-read shows the record unchanged.