---
uid: acceptance_criterion-3f701591
id: AC-482
type: acceptance_criterion
title: Layer children render at their structured positions
created_by: xgd
created_at: '2026-07-09T20:43:05.857718+00:00'
updated_at: '2026-07-09T20:43:05.857718+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
When a module instance (or the standalone `layer` section) carries a layer whose children each declare a numeric position, the rendered page places every child at its declared position. The author supplies only unitless numbers — `x`/`y` as offsets within the layer box, `z` as stacking order, and optional `width`/`height`/`rotate`; the framework, not the author, produces all positioning styles. A site whose modules carry only structured positions validates successfully.

## Verification
Render a page containing a layer with two or more children at distinct positions (e.g. one at x=10/y=20/z=1, another at x=55/z=3, with a width). The produced markup positions each child according to its declared x/y/z/width/rotate values, and `validateSite` reports the site as valid. No author-supplied CSS string appears anywhere in the child styling.
