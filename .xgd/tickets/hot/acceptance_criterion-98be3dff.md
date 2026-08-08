---
uid: acceptance_criterion-98be3dff
id: AC-837
type: acceptance_criterion
title: A page declaring no responsive layout and no wrap renders exactly as it did
  before
created_by: xgd
created_at: '2026-08-06T02:37:47.238077+00:00'
updated_at: '2026-08-08T00:43:24.107630+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The axis is strictly additive: a document that declares neither a layout track nor a wrap
publishes **the same stylesheet it published before the axis existed**.

- A row container that declares no track emits its two flow declarations, in the same
  order, and **no wrapping declaration at all** — a container that never asked to wrap
  must not start carrying a wrapping rule, in either direction.
- A container that declares no track contributes **no breakpoint block of its own**; the
  static layout stands at every width.
- A grid container's column emission is untouched.

## Verification
Publish a row container with a gap and one child, declaring no track and no wrap. Observe
its rule opens with exactly the flow declarations it did before, that it carries no
wrapping declaration, and that the stylesheet contains no breakpoint block attributable
to it. Publish a grid container with a fixed column count and observe its declarations are
unchanged.