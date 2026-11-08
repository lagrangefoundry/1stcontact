---
uid: acceptance_criterion-b49749ff
id: AC-2420
type: acceptance_criterion
title: A point inside an SVG image reports drawing user-space coordinates consistent
  with its viewBox, object-fit and preserveAspectRatio, without inlining the SVG
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:27.657650+00:00'
updated_at: '2026-11-08T13:05:18.012611+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- For a point placed inside an image whose asset is an SVG, the reported user-space coordinate is the point in the drawing's own viewBox coordinates. Placing the point at the image's top-left corner of painted content reports the viewBox origin; the bottom-right reports origin plus viewBox size.
- The conversion first applies the image box's `object-fit` and `object-position` (the box the drawing is painted into), then the drawing's own `preserveAspectRatio`. With `object-fit: fill` on a box of a different aspect ratio than the viewBox, the reported coordinates still land on the drawing feature under the pointer.
- The page still renders the drawing as an `<img>`. No SVG is inlined into the preview to resolve a point.
- If the asset cannot be fetched or has no viewBox, the point's expansion leaves out the svg user-space row and reports every other frame normally.

## Verification
Mount the edit render with an SVG image node of known viewBox. Click known positions with combinations of object-fit (contain, cover, fill) and preserveAspectRatio values, and assert the user-space numbers match the expected inversion within rounding. Assert the preview DOM still contains the `<img>` and no inline `<svg>` for that asset. Point a node at an asset that returns an error, and assert the block has no svg user space row but does have node-relative and viewport rows.