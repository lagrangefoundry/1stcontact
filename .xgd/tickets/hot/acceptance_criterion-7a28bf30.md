---
uid: acceptance_criterion-7a28bf30
id: AC-2490
type: acceptance_criterion
title: compare accepts an image picture on either side, e.g. a stored picture against
  a captured reference
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:41.088896+00:00'
updated_at: '2026-11-08T23:03:41.088896+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
`compare` accepts an `image` picture (REQ-218) on either side, in combination with any other kind — for example a stored picture against a captured reference, or two stored pictures. The stored side is compared at its own size: both sides are anchored top-left and cropped to their common rectangle exactly as for two pages, and the result carries the same fields (size compared, mean difference, percent different, bands, regions) with each side labelled by which picture it was (`site image …` / `library image …`). A stored picture in a non-PNG format is compared after the same browser rasterisation `screenshot` uses, so a photograph compares as well as a PNG.

## Verification
Seed a reference bundle and a stored JPEG and a stored PNG. Call `compare` with `a` the stored JPEG and `b` the reference, and again with the sides swapped, and assert each returns a comparison with numeric `meanDifference`/`percentDifferent`, `size` equal to the common top-left rectangle of the two, and side labels naming the stored picture and the reference. Compare the PNG against itself and assert a zero mean difference.
