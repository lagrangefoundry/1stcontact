---
uid: acceptance_criterion-ef95eeef
id: AC-2486
type: acceptance_criterion
title: An SVG drawing carries a default-face caption pointing to measure_drawing;
  after on an image picture is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:35.000286+00:00'
updated_at: '2026-11-09T02:16:09.774569+00:00'
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

> **Resolved** (BUNDLE-42 test_fix, fix plan REPORT-11648, code_frozen override granted at rung 1). Commit `40ae57dd34` extended `DRAWING_RASTER_NOTE` (`tools/generate/src/cli/picture.ts`) and the matching caption in `fidelity-surface.json` with the letter-widths/line-breaks warning, and the AC-2486 UAT now asserts it (batch check REPORT-11652: 65/65 pass). Photographing drawings in the site's draft preview remains EPIC-1's wanted refinement and a recorded divergence in STORY-157.
