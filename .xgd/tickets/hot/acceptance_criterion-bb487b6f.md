---
uid: acceptance_criterion-bb487b6f
id: AC-2543
type: acceptance_criterion
title: Operations apply in author order, one renderer step each, with each operation
  measured against what the earlier ones left
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:50.452711+00:00'
updated_at: '2026-11-09T18:25:50.452711+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A recipe is applied in the order it was written, with each operation measured against what the operations before it left:
- **Crop:** its fractions are fractions of the picture's current dimensions, rounded to whole pixels.
- **Rotate:** a 90° or 270° turn swaps width and height; 180° leaves them as they are.
- **Resize:** fits the picture within the given width and/or height while keeping its aspect ratio. It never stretches and never crops to fill.
- **Adjust:** leaves the dimensions unchanged.

The renderer receives one transform step per operation, in recipe order, and never a single merged step that the platform could reorder.

## Verification
Example: a 1000×500 picture with `[rotate 90, crop top 0.25 bottom 0.25]`.
- `size` is 500×500, not the 1000×250 that cropping before rotating would give.
- A recording Images binding double receives two transform steps: the rotate first, then a trim of 500 wide by 500 high, offset 250px from the top.

Further cases:
- A `resize` of width 250 on a 1000×500 picture reports 250×125.
- Reordering the same operations changes `size` as the order dictates.
