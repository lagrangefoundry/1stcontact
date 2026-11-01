---
uid: acceptance_criterion-80b556e5
id: AC-2117
type: acceptance_criterion
title: A /b/<id>/ prefix selects a held business, and two businesses held by one person
  never see each other's sites
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:30.683735+00:00'
updated_at: '2026-11-01T10:37:01.017575+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted caller holds live, entitled memberships on businesses A and B:
- A request under `/b/<A>/…` returns only A's sites and data, never B's. The same holds in reverse for `/b/<B>/…`.
- The prefix is removed before routing, so `/b/<A>/<route>` behaves like `<route>` scoped to A. `/b/<A>` with no trailing path is treated as `/`.
- An empty prefix id (`/b//…`) is not a target. The path is routed as given.

## Verification
Seed one identity holding two businesses, each with a distinct site. Request the sites listing under each prefix and assert that each response contains only its own business's site. Request a prefixed route and its unprefixed equivalent and assert they behave the same apart from scope.