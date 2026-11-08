---
uid: acceptance_criterion-3deb6d20
id: AC-2444
type: acceptance_criterion
title: A run-array text node validates and each varying run renders carrying its own
  axes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:24.894988+00:00'
updated_at: '2026-11-08T13:28:24.894988+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
An L1 text node whose `text` is an ordered list of two or more `{ text, axes? }` runs passes validation. In the rendered page the runs appear in order, their words concatenated byte-for-byte (each run's own separating spaces kept), and each run with axes is wrapped in its own span styled with exactly its axes: its colour, its weight, its italic slope, its size as an `em` multiple of the node's size, and its baseline shift as a `vertical-align` in `em` (not a transform).

## Verification
Render a node with runs such as ["Hello ", {"world", colour + bold}, {"st", sizeScale 0.6 + baselineShiftEm 0.4}]; assert the text reads "Hello worldst", the coloured run's computed colour and weight match, and the lifted run's style carries `font-size: 0.6em` and `vertical-align: 0.4em`.
