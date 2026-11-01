---
uid: acceptance_criterion-53df43e2
id: AC-2120
type: acceptance_criterion
title: A request with no target operates the caller's first selectable business, skipping
  lapsed ones, never the platform default
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:49.881180+00:00'
updated_at: '2026-11-01T10:25:49.881180+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
For an admitted caller whose request carries no `/b/<id>/` prefix, the request operates the first of the caller's businesses (in grant order) that is selectable, meaning it has a live membership, an active grant, and an active business. Businesses earlier in the order that are lapsed or deactivated are skipped. The request never resolves to the deployment's configured platform business unless that business is itself the caller's first selectable one.

## Verification
Seed a caller whose oldest business is lapsed and whose second is live, with neither being the platform business. Make an unprefixed business-scoped request and assert it returns the second business's data.
