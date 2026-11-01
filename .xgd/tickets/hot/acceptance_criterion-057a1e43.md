---
uid: acceptance_criterion-057a1e43
id: AC-2121
type: acceptance_criterion
title: A platform admin can operate any existing business without membership, but
  not a lapsed, deactivated, or unknown one
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:56.412678+00:00'
updated_at: '2026-11-01T10:25:56.412678+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
A caller flagged `platform_admin` who names `/b/<X>/` for an existing, active business with an active grant, and who holds no membership on X, operates X exactly as its owner would, seeing X's sites. The bypass covers membership only:
- if X's entitlement has lapsed, the request is refused (403, uniform body, logged `no_entitlement`)
- if X does not exist, the request is refused (403, uniform body, logged `unknown_business`)
- if X is deactivated, the request is refused rather than served.

## Verification
Seed an admin with no memberships and a separate business with a live grant. Request under its prefix and assert its sites are returned. Expire that grant and assert a 403 with the logged `no_entitlement`. Name a nonexistent id and assert a 403 with the logged `unknown_business`.
