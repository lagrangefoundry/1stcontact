---
uid: acceptance_criterion-d9837542
id: AC-2266
type: acceptance_criterion
title: Accepting the terms records member.signed_up carrying the accepted terms version
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:21:33.583953+00:00'
updated_at: '2026-11-04T17:29:02.968162+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4630e921
  kind: behavior
  regression_only: false
---

## Criterion
When a contact accepts the terms, a `member.signed_up` event is recorded against them. Its detail carries the accepted terms version, e.g. `{version: "2026-09-01"}`, and it becomes the newest entry in their history.

## Verification
Invite a contact, then accept terms for them at a given version. Read the history and assert that the newest event's kind is member.signed_up and that its detail equals {version: <accepted version>}.