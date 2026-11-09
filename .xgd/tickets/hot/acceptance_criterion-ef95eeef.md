---
uid: acceptance_criterion-ef95eeef
id: AC-2486
type: acceptance_criterion
title: An SVG drawing carries a default-face caption pointing to measure_drawing;
  after on an image picture is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:35.000286+00:00'
updated_at: '2026-11-09T02:13:55.984362+00:00'
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

> **Resolved** (BUNDLE-42 reconciliation review, 2026-11-08; code_frozen override report-0fca9951). The caption gap recorded here earlier is closed. `DRAWING_RASTER_NOTE` (`tools/generate/src/cli/picture.ts:331-335`) and the surface prose (`tools/generate/src/cli/ai/fidelity-surface.json:200`) now say letter widths and line breaks are not evidence. The UAT (`tests/reconciliation-assistant-sees-a-stored-picture.test.ts`, the AC-2486 case, :560-562) asserts all three halves: default face, not evidence, and `measure_drawing`. One divergence remains and is recorded on STORY-157: drawings are still rasterised in a bare `data:` document rather than the site's draft preview.
