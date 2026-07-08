---
uid: acceptance_criterion-c21f098b
id: AC-436
type: acceptance_criterion
title: Resolving a known module by id and version returns its contract and component
created_by: xgd
created_at: '2026-07-08T19:20:16.302831+00:00'
updated_at: '2026-07-08T19:20:16.302831+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Requesting a module from the catalog by a known `id` and `version` (e.g. `hero` version 1) returns that module's entry: its contract metadata (matching the requested id and version) paired with a renderable component. Header, hero, and footer at version 1 are each resolvable this way.

## Verification
Resolve each of `header`, `hero`, and `footer` at version 1 from the catalog and assert a definition is returned whose metadata id/version match the request and that a renderable component is present.
