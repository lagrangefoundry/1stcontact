---
uid: acceptance_criterion-1eccf6a6
id: AC-484
type: acceptance_criterion
title: Image children apply enumerated shape and edge treatments
created_by: xgd
created_at: '2026-07-09T20:43:13.715373+00:00'
updated_at: '2026-07-09T20:43:13.715373+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
An image child may carry an enumerated treatment: a `shape` of `circle` or `rounded`, and/or an `edge` of `soft-mask` (a feathered radial mask) or `torn-asset` (a supplied mask asset). Each selected treatment produces the corresponding rendered visual effect — a circle clip, a rounded clip, a feathered edge, or a torn-edge mask. Treatments are chosen from a finite enumeration; there is no raw-CSS path.

## Verification
Render images carrying `shape: circle`, `edge: soft-mask`, and `edge: torn-asset`. The rendered output marks each image with its treatment, and the per-site stylesheet defines the matching effects (circle border-radius, a radial mask for soft edges, a mask-image for torn edges).
