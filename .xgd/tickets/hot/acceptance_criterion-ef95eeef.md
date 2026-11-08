---
uid: acceptance_criterion-ef95eeef
id: AC-2486
type: acceptance_criterion
title: An SVG drawing carries a default-face caption pointing to measure_drawing;
  after on an image picture is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:35.000286+00:00'
updated_at: '2026-11-08T23:45:25.123594+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A stored SVG drawing returned as a picture carries a caption, on the same text block that names the picture, saying it is a drawing photographed outside the site's own page, so its text is in the browser's default face rather than the one the site serves, and that `measure_drawing` is what reads where anything in it actually is. A raster stored picture carries no such caption. An `image` picture carrying `after` is refused before any stored picture is read or browser leased, saying a stored picture is a picture and not a page — there is nothing on it to click or fill, and changing what it shows is `edit_image`.

## Verification
Screenshot a stored `.svg` site asset and assert the leading text block contains the default-face caption and names `measure_drawing`; screenshot a stored JPEG and assert no such caption. Call `screenshot` with `{kind: 'image', image: 'hero.png', after: ['click "Go"']}` and assert the refusal says a stored picture is not a page and names `edit_image`, with the image store and browser doubles unused.