---
uid: acceptance_criterion-cf420e00
id: AC-2416
type: acceptance_criterion
title: The mark's cross is two bars centred on the disc, with a 22px hit area and
  no font glyph
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:46:03.491565+00:00'
updated_at: '2026-11-08T13:05:18.884905+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion
- The cross contains no text: no glyph such as `✕` is used to draw it.
- The cross is two bars rotated ±45°. Each bar is centred on the disc's centre by construction, offset by exactly half its own size, so the cross sits on the disc's centre whatever the platform's fonts.
- The disc, which is also what you hover or drag, is 22×22px and centred on the point's exact position.

## Verification
Inspect the mark that the real edit render produces once a point is placed. Assert the cross element's text content is empty and it contains exactly two bar elements. Assert each bar's computed offsets centre it on the disc and the bars are rotated +45° and −45°. Assert the disc is 22px square with its centre at the point's coordinates.