---
uid: acceptance_criterion-76e9a678
id: AC-2119
type: acceptance_criterion
title: A named business whose entitlement has lapsed is refused, logged as no_entitlement
  rather than not_a_member
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:43.703018+00:00'
updated_at: '2026-11-01T10:37:00.583591+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When the caller is a member of business X but no active grant covers now, a request under `/b/<X>/…` is refused with the same 403 and uniform body as a non-member target. It does not fall back to another business the caller can reach. The logged reason is `no_entitlement`, distinct from `not_a_member`. This applies even when the caller has another, live business.

## Verification
Seed a caller with one live business and one lapsed one. Request under the lapsed business's prefix and assert the 403 with no data. Assert the logged reason is `no_entitlement`. Request under the live business's prefix and assert it still resolves.