---
uid: acceptance_criterion-36f34391
id: AC-2131
type: acceptance_criterion
title: The operator can still reach the existing 1stcontact business after the migration,
  and re-running it changes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:59.208562+00:00'
updated_at: '2026-11-01T17:58:34.504118+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
After the operator-membership migration is applied:
- the operator's identity resolves, with no target, to the existing `1stcontact` business, and its existing sites are visible
- the operator holds an `owner` membership and an open-ended (no end date) grant on `1stcontact`
- the migration does not give the operator the hosting bypass (`platform_operator`, formerly `platform_admin`, stays unset)
- applying the migration a second time leaves the users, memberships, and grants tables unchanged (same row count and contents).

## Verification
Apply migrations against a database holding `1stcontact` sites. Admit the operator's email and assert that the resolved business is `1stcontact` and that its sites are listed. Re-apply the migration and assert identical identity-table contents.
