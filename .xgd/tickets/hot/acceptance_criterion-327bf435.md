---
uid: acceptance_criterion-327bf435
id: AC-2217
type: acceptance_criterion
title: Naming another account's business on the portal path is indistinguishable from
  naming a business that does not exist
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:10.697365+00:00'
updated_at: '2026-11-01T20:16:10.697365+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
Requesting the portal under a business prefix (/b/<id>/account) for a business the caller holds no membership on returns a response with the same status, headers relevant to content, and body bytes as the same request for a business id that does not exist. Neither response contains that business's name or portal content.

## Verification
As an admitted caller, request /b/<other-held-business>/account and /b/<nonexistent-id>/account. Check status and body are byte-identical and that the other business's name does not appear.
