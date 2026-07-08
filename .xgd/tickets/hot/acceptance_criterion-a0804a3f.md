---
uid: acceptance_criterion-a0804a3f
id: AC-458
type: acceptance_criterion
title: The three content modules are resolvable from the catalog and each exposes
  a conforming contract
created_by: xgd
created_at: '2026-07-08T19:30:00.974171+00:00'
updated_at: '2026-07-08T19:30:00.974171+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The module catalog resolves each of the three content modules (`text-block`, `services-grid`, `contact-form`) by id and version, returning its contract and renderable component, so that all six Phase 0 modules are resolvable. Each content module exposes a conforming contract declaring its id, version, finite variants, per-dial value enumerations, and per-field content schema.

## Verification
Resolve each of the three content modules from the catalog and assert a contract plus component are returned; assert each contract declares the expected variants, dials, and content-schema fields, and that all six Phase 0 modules resolve.
