---
uid: acceptance_criterion-057a1e43
id: AC-2121
type: acceptance_criterion
title: A platform_operator can operate any existing business without membership, but
  not a lapsed, deactivated, or unknown one, and gains no extra scope
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:56.412678+00:00'
updated_at: '2026-11-01T17:58:28.457562+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
A caller whose user record carries `platform_operator` (the hosting capability) and who names `/b/<X>/` for an existing, active business with an active grant, while holding no membership on X, operates X exactly as its owner would and sees X's sites. What comes back is an ordinary business handle with no extra scope: no platform scope and no access to any other business. The bypass covers membership only:
- if X's entitlement has lapsed, the request is refused (403, uniform body, logged `no_entitlement`)
- if X does not exist, the request is refused (403, uniform body, logged `unknown_business`)
- if X is deactivated, the request is refused (403) rather than served.

A caller without `platform_operator` naming the same X is refused `not_a_member`.

## Verification
Seed a `platform_operator` with no memberships and a separate business with a live grant. Request under its prefix and assert its sites are returned. Expire that grant and assert a 403 with the logged `no_entitlement`. Deactivate a second live business and assert a 403. Name a nonexistent id and assert a 403 with the logged `unknown_business`.
