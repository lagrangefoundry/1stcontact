---
uid: acceptance_criterion-811210da
id: AC-2394
type: acceptance_criterion
title: measure_drawing returns per-node primitives in root user space, plus per-document
  viewBox and once-per-font metrics, without internal fields
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:46.405898+00:00'
updated_at: '2026-11-08T07:16:46.405898+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Calling `measure_drawing` on a site drawing returns: the drawing name; the viewBox; a `fonts` list with one entry per distinct font, carrying cap-height, x-height, ascender and descender proportions; and a `nodes` list. Each node has a reference, its kind, its box, and for text its ink box, baseline and advance width. All coordinates are in root user space: a node inside a `<g transform="translate(...)">` reports its translated position, not its local coordinates. The response does not expose a node's current attribute values, its local-to-root scale, its skew flag or its tree path.

## Verification
Measure a drawing that has a translated group containing an id'd `<text>`. Assert the node's box equals its local position plus the translation, the font appears once in `fonts` even when two nodes use it, and none of the internal fields appear on any node.