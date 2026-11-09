---
uid: acceptance_criterion-ef95eeef
id: AC-2486
type: acceptance_criterion
title: An SVG drawing carries a default-face caption pointing to measure_drawing;
  after on an image picture is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:35.000286+00:00'
updated_at: '2026-11-09T01:25:30.093015+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A stored SVG drawing returned as a picture carries a caption, on the same text block that names the picture. The caption says:
- it is a drawing photographed outside the site's own page, so its text is in the browser's default face rather than the one the site serves;
- **therefore letter widths and line breaks in it are not evidence** (EPIC-1's answer on REQ-218, 2026-09-11: until drawings are photographed in the site's draft preview, "the caption is load-bearing and should say what is actually wrong");
- `measure_drawing` is what reads where anything in it actually is.

A raster stored picture carries no such caption. An `image` picture carrying `after` is refused before any stored picture is read or browser leased, saying a stored picture is a picture and not a page — there is nothing on it to click or fill, and changing what it shows is `edit_image`.

## Verification
Screenshot a stored `.svg` site asset and assert the leading text block contains the default-face caption, says letter widths and line breaks are not evidence, and names `measure_drawing`; screenshot a stored JPEG and assert no such caption. Call `screenshot` with `{kind: 'image', image: 'hero.png', after: ['click "Go"']}` and assert the refusal says a stored picture is not a page and names `edit_image`, with the image store and browser doubles unused.

> **Divergence and code issue** (BUNDLE-42 reconciliation review, 2026-11-08). The shipped caption (`DRAWING_RASTER_NOTE`, `tools/generate/src/cli/picture.ts:329-332`, mirrored in `fidelity-surface.json`) names the default face and `measure_drawing` but does **not** say letter widths and line breaks are not evidence. This AC states the EPIC-1 intent. Code is frozen in this reconcile, so the one-line caption change needs a scoped code_frozen exception on `picture.ts` (and the surface JSON if it carries the text). Until that lands, the existing UAT (`tests/reconciliation-assistant-sees-a-stored-picture.test.ts`, the AC-2486 case) pins only the default-face and `measure_drawing` halves, and must gain the letter-widths/line-breaks assertion together with the code change. See STORY-157 "Code issue flagged — the drawing caption does not say letter widths are not evidence".
