---
uid: acceptance_criterion-d553d8fb
id: AC-2046
type: acceptance_criterion
title: describe_reference reports a capture's widths, sections, image counts, coverage
  findings and contents, and refuses an unknown name with NOT_FOUND
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:12.934693+00:00'
updated_at: '2026-10-27T21:19:12.934693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
`describe_reference(name)` for a captured reference returns: `bundle`, `url`, `capturedAt`; `viewports`, the widths the capture recorded as ascending integers; `sections`; `images` with `mirrored`, `referenced` and `unreferenced` counts; `findings`, the operator-readable coverage sentences (empty when the capture looks complete); and `members`, the bundle's contents with all mirrored images collapsed into one entry stating their count. For a name that has no capture, it fails with the surface's `NOT_FOUND` error, and the message names the missing reference and points the model at `list_references`.

## Verification
Seed a bundle with screenshots at three widths (written out of order), mirrored images, and a page referencing an image that was not mirrored. Assert the viewports are ascending, the three image counts are correct, a finding is present, and the members list has a single collapsed assets entry. Then call it with an unknown name and assert `NOT_FOUND` with the name and `list_references` in the message.
