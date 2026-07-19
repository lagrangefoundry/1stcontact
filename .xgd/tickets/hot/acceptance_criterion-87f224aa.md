---
uid: acceptance_criterion-87f224aa
id: AC-663
type: acceptance_criterion
title: A length dial set to a named step resolves to its overlay token, unchanged
  from prior behaviour
created_by: xgd
created_at: '2026-07-19T03:10:20.712782+00:00'
updated_at: '2026-07-19T03:10:20.712782+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When the same length dial is set to a named step (e.g. `lg`, `4xl`), the published
site resolves it to the module's overlay token for that step. A site definition
using named steps renders byte-identically to the pre-existing per-step behaviour —
the named-overlay path is unchanged; only the absolute escape hatch is added.

## Verification

Author a site using named-step length values, build it, and confirm each dial
resolves to the same token/value it produced before this capability (no visual or
CSS-value change for step-based definitions).
