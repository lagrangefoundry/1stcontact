---
uid: acceptance_criterion-4697d04b
id: AC-564
type: acceptance_criterion
title: text-block and services-grid accept a contentWidth dial capping the content
  column at the left gutter
created_by: xgd
created_at: '2026-07-10T01:12:12.089035+00:00'
updated_at: '2026-07-10T01:12:12.089035+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
text-block and services-grid accept a `contentWidth` dial (`default`/`narrow`/`wide`). The section frame stays full-width; the dial caps the section's content (heading, intro, and body or cards) to a narrower measure — `narrow` to the narrow container width, `wide` to the wide container width — pinned to the frame's left gutter (the header/hero content edge) by the section's left alignment, so it reads as a narrow left-aligned column. `default` applies no cap: the content fills the frame and a section omitting the dial is unchanged.

## Verification
Render text-block and services-grid with `contentWidth: narrow` and observe, via the published markup/stylesheet, a `content-width-narrow` treatment capping the section content to the narrow container width at the left gutter; render with the dial omitted and observe the content fills the section frame unchanged.
