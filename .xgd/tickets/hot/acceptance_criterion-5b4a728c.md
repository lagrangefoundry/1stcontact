---
uid: acceptance_criterion-5b4a728c
id: AC-2546
type: acceptance_criterion
title: Pictures are named in the shared picture vocabulary; unknown, ambiguous, site-asset
  and non-raster pictures are refused with distinct codes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:54.884226+00:00'
updated_at: '2026-11-09T18:39:15.503772+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
`edit_image` and `list_image_edits` accept a picture by any name it already answers to in the assistant's picture vocabulary: its made-with name, its uploaded filename, or its Library name. They refuse a picture that cannot carry a recipe, each with a distinct code and a reason:
- **NOT_FOUND:** no stored picture has that name. The message lists the names that exist.
- **AMBIGUOUS:** the name matches more than one picture. The message names the candidates.
- **NOT_EDITABLE:** the name resolves to a file on the site rather than a Library item, so there is nowhere to keep a recipe for it.
- **UNREADABLE:** the picture is not a raster the renderer can edit, such as an SVG drawing or a GIF.

No recipe is written in any refused case.

## Verification
For each case, call `edit_image` with a valid recipe and assert the code and reason. Use:
- an unknown name;
- a name shared by a site asset and a Library item;
- a site asset (e.g. a drawing made by `write_image`);
- an uploaded SVG and an uploaded GIF.

Then assert that the Library item names that are valid still accept edits under each of their spellings.