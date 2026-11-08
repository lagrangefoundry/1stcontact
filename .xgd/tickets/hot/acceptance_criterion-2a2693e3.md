---
uid: acceptance_criterion-2a2693e3
id: AC-2397
type: acceptance_criterion
title: measure_drawing reports the requested and the resolved font, measured in the
  site's own draft page
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:48.584665+00:00'
updated_at: '2026-11-08T10:12:32.186707+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
Each font entry in the measurement reports both the font family the drawing requested and the face that actually resolved when rendered with the site's declared fonts. A drawing that names `system-ui` (or another platform-dependent stack) shows `requested` ≠ `resolved`. A drawing that names a family the site does not provide reports the fallback that resolved, not the requested name. A family the site declares via its `@font-face` rules resolves to that face, and the page's own stylesheets do not restyle the drawing being measured.

The font context is the site's own: the production measurer (`browserMeasurer`) opens `<origin>/preview/<slug>/draft/` (slug URI-encoded) on this deployment's origin, runs the shipped `measureScript` over the drawing exactly as the site stores it, and closes the browser driver afterwards, including when the measurement fails.

## Verification
In a real browser (skipped, with the reason, where no Chromium can launch), run the shipped `measureScript` in a page carrying the site's `@font-face` and a hostile page stylesheet. Measure a drawing with `font-family="system-ui, ..."`, one with an absent family plus a fallback, and one with the site-declared font. Assert requested/resolved differ for the first two, match for the third, and that the page's stylesheet did not change the font-size.

Without a browser, drive the production `browserMeasurer` with a scripted driver. Assert it opens exactly `<origin>/preview/<encoded slug>/draft/`, runs `measureScript(<stored drawing bytes>)`, returns what the page answered, and closes the driver once, also when the page fails. Through `measure_drawing`, assert the requested and resolved faces the page reported reach the response.
