---
uid: acceptance_criterion-c4cdb569
id: AC-673
type: acceptance_criterion
title: Site definition rejects a malformed per-breakpoint dial object
created_by: xgd
created_at: '2026-07-19T03:21:20.471600+00:00'
updated_at: '2026-07-19T03:31:26.590660+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
A per-breakpoint dial object is validated at site-definition load: it must carry a `base` value, and it may carry only the keys `base`, `sm`, `md`, `lg`, `xl`. A per-breakpoint object missing `base`, or carrying any unrecognised key, is rejected with a validation error rather than being silently accepted or having the stray key dropped.

## Verification
Load a site definition whose dial value is `{ sm: 12 }` (no base) and confirm validation fails; load one with `{ base: 12, xxl: 40 }` (stray key) and confirm validation fails; load `{ base: 12, md: 24 }` and confirm it is accepted.