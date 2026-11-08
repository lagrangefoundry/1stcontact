---
uid: acceptance_criterion-f54fe63a
id: AC-2411
type: acceptance_criterion
title: A measurement reports at most 200 nodes and 120 glyph extents per text node,
  and says in warnings when it stopped
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-08T10:07:03.335743+00:00'
updated_at: '2026-11-08T10:07:03.335743+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Measurement is bounded per drawing (architecture items 31/35). One measurement reports at most 200 nodes (`MEASURE_NODE_LIMIT`), counted in document order with the root `<svg>` as the first. When the drawing has more, the first 200 are reported and `warnings` carries `the drawing has more than 200 nodes; the first 200 are reported.` A text node reports at most 120 glyph extents (`MEASURE_GLYPH_LIMIT`). When it has more characters, the first 120 are reported and `warnings` carries `<ref> has <n> characters; the first 120 are reported.` A drawing at or under each cap gets no such warning. The warnings reach the model in the `measure_drawing` response.

## Verification
Without a browser: evaluate the shipped `measureScript` against a scripted page whose DOM mirrors the written drawing. Drive it through `browserMeasurer` and `measure_drawing`. A drawing of the root plus 200 rects reports exactly 200 nodes, ending at the 199th rect, with the node-cap warning. The root plus 199 rects reports 200 nodes and no warning. A 130-character `<text>` reports 120 glyphs and the glyph-cap warning naming it. A 120-character `<text>` reports 120 glyphs and no warning.
