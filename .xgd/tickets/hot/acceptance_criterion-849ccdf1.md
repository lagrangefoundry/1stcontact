---
uid: acceptance_criterion-849ccdf1
id: AC-431
type: acceptance_criterion
title: Catalog membership is not validated (structure-only boundary)
created_by: xgd
created_at: '2026-07-08T19:13:38.938705+00:00'
updated_at: '2026-07-08T19:13:38.938705+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
Structural validation does not check catalog membership. A site definition that is structurally well-formed but references a module `type` (or `variant`) that is not a real catalog entry still validates successfully. This documents the deliberate boundary: whether a referenced module/variant actually exists is verified downstream at render time, not by structural validation.

## Verification
Submit a structurally valid site whose module instance uses an arbitrary/unknown `type` value. Assert the result reports success.
