---
uid: acceptance_criterion-2f93352e
id: AC-2036
type: acceptance_criterion
title: compare reports exactly the perceptual verdict 1c diff computes for the same
  two pictures, with ranked regions as coordinates
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:46:54.475246+00:00'
updated_at: '2026-10-30T20:11:56.862718+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
For the same two images, the assistant's `compare` reports exactly the verdict that `1c diff` computes for the equivalent invocation. The result carries:
- `size`: the width and height actually compared.
- `meanDifference`.
- `percentDifferent`: the percent of pixels over threshold.
- `bands`: the banded difference profile.
- `regions`: the ranked difference regions, each with its rank, its area as x/y/w/h coordinates, and its mean difference.

Every value equals the CLI's for that pair. Where the CLI reports a value rounded to two decimal places, it is equal at that precision. When the pictures genuinely differ (for example, a changed patch), at least one region is reported and the mean difference is above zero. The result returns no file paths, heatmap images or crop images.

## Verification
**Setup.** Seed a captured reference with one image, in an on-disk reference store. Serve a draft that has the same image plus a changed patch.

**The assistant's call.** Call `compare` through the composed Toolbox, with the reference as `a` and the draft as `b`. The result must be a non-error rendering inside the untrusted-content frame.

**The CLI's call.** Run `1c diff --json` (`cli.run`) against that same bundle directory as `--ref`, with the draft's bytes as `--actual`. This is the real CLI path, and it applies the CLI's own tuning.

**Assert:**
- `size` equals the CLI's `dims`.
- `meanDifference`, `percentDifferent` and `bands` equal the CLI's at its two-decimal precision.
- The region ranks, areas and mean differences equal the CLI's regions exactly, in order.
- There is at least one region, and `meanDifference > 0`.
- The result carries only the documented keys, and no path, heatmap or crop.
