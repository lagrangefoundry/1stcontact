---
uid: acceptance_criterion-2f93352e
id: AC-2036
type: acceptance_criterion
title: compare reports exactly the perceptual verdict 1c diff computes for the same
  two pictures, with ranked regions as coordinates
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:54.475246+00:00'
updated_at: '2026-10-27T21:13:44.022529+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
For the same two images, the assistant's `compare` reports exactly the verdict `1c diff` computes for the equivalent invocation. The result carries:
- `size`: the width and height actually compared.
- `meanDifference`.
- `percentDifferent`: the percent of pixels over threshold.
- `bands`: the banded difference profile.
- `regions`: the ranked difference regions, each with its rank, its area as x/y/w/h coordinates, and its mean difference.

Every value equals the CLI's for that pair. When the pictures genuinely differ (for example, a changed patch), at least one region is reported and the mean difference is above zero. The result returns no file paths, heatmap images or crop images.

## Verification
Seed a captured reference with one image and serve a draft with the same image plus a changed patch. Call `compare` with the reference as `a` and the draft as `b` through the fidelity surface. Independently compute `1c diff`'s verdict on the same two images: crop to the common rectangle, then run the perceptual diff. Assert that `size`, `meanDifference`, `percentDifferent` and `bands` are equal, and that the region ranks and areas are equal in order. Assert at least one region and `meanDifference > 0`.