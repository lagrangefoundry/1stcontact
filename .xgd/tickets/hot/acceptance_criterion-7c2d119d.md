---
uid: acceptance_criterion-7c2d119d
id: AC-2200
type: acceptance_criterion
title: Opening or withdrawing a grant, and changing a person's login status, are refused
  403 to a caller who does not own the scoped business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:16.672958+00:00'
updated_at: '2026-11-01T20:02:32.046535+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
The three owner write actions that are not record changes are refused with **403** if the caller does not own the business they are scoped to: opening a grant, withdrawing a grant, and changing a person's login status. No grant row is written or modified, and no person's status changes. An owner of the scoped business performs all three successfully.

## Verification
Against real D1, as an admitted caller who is a member but not an owner of the scoped business: attempt to open a grant, withdraw an existing grant, and set a person's status. Assert 403 for each, that the grant count and the existing grant's status are unchanged, and that the person's status is unchanged. Repeat as an owner and assert each succeeds.