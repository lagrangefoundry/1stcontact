---
uid: acceptance_criterion-507fa6b8
id: AC-486
type: acceptance_criterion
title: A layer composites over another module, and a standalone layer section is available
created_by: xgd
created_at: '2026-07-09T20:43:21.792663+00:00'
updated_at: '2026-07-09T20:43:21.792663+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
Attaching a layer field to any module instance composites the layer's positioned children directly over that module's own rendered markup (z-compositing over another module), with the host content beneath the child stack. A registered standalone `layer` module provides a bare art-directed section whose only content is its positioned children. A module instance without a layer field renders exactly as it did before — unwrapped and unchanged.

## Verification
Render a hero (or any module) with a layer attached: the host module's markup is nested as the layer content, beneath the positioned stack. Render a page using the standalone `layer` module and confirm it produces a single positioned stack section and that the positioning rules are present in the per-site stylesheet. Render a module with no layer and confirm its markup is unchanged.
