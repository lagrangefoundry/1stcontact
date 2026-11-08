---
uid: acceptance_criterion-2a2693e3
id: AC-2397
type: acceptance_criterion
title: measure_drawing reports the requested and the resolved font, exposing platform-dependent
  stacks
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:48.584665+00:00'
updated_at: '2026-11-08T07:26:21.723026+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Each font entry in the measurement reports both the font family the drawing requested and the face that actually resolved when rendered with the site's declared fonts. A drawing that names `system-ui` (or another platform-dependent stack) shows `requested` ≠ `resolved`. A drawing that names a family the site does not provide reports the fallback that resolved, not the requested name. A family the site declares via its `@font-face` rules resolves to that face, and the page's own stylesheets do not restyle the drawing being measured.

## Verification
In a real browser, measure a drawing with `font-family="system-ui"`, one with an absent family plus a fallback, and one with a site-declared font. Assert requested/resolved differ for the first two and match for the third.