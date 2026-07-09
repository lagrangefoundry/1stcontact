---
uid: acceptance_criterion-e6ebfba8
id: AC-516
type: acceptance_criterion
title: 'Surface-only bands (no background) are unaffected: their surface fill paints
  normally'
created_by: xgd
created_at: '2026-07-09T22:27:55.006962+00:00'
updated_at: '2026-07-09T22:27:55.006962+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A section that declares a `surface` dial but **no** `background` is unaffected by the composition precedence rule: its surface-derived background fill paints normally, exactly as before. The precedence rule that suppresses a band's own fill applies only when a background wrapper is present.

## Verification
Render a module with a `surface` dial and no `background`. Assert the surface-derived background fill is painted on the section as normal (it is not suppressed), and its text-color contract is applied — i.e. surface-only behavior is a strict no-change from prior behavior.
