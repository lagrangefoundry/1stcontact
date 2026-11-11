---
uid: acceptance_criterion-70b8cb2c
id: AC-2581
type: acceptance_criterion
title: A catalogue item name is accepted unchanged by screenshot and edit_image as
  the same picture
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:45.438953+00:00'
updated_at: '2026-11-11T03:25:45.506138+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

The `item` value that `list_library` returns for an image names the same picture everywhere else the assistant uses it. Passing that value unchanged as `screenshot`'s `of.image` and as `edit_image`'s `image` resolves to the same stored picture, and neither tool refuses it as unknown or ambiguous.

The same holds for the filename and title spellings. A spelling that resolves to one catalogue item resolves to that same picture in `screenshot`.

## Verification

In a deployment that offers both the looking surface and the image-edit surface (a browser launcher and the Images binding), seed one uploaded image in the Library with a known describer title. In one hosted conversation:
- take its `item` value from `list_library`;
- call `screenshot` with `{of: {kind: 'image', image: <item>}}`, then with the filename, then with the title, and assert that each returns a picture labelled with that same `item`;
- call `edit_image` with `image: <item>` and assert that it answers for that same `item` (with its title) and is not refused;
- call `list_image_edits` with the same value and assert the same `item`.

## UATs

- `tests/test_reconciliation_library_catalogue.workers.test.ts` — `test_UAT_AC2581_catalogue_item_is_accepted_by_screenshot_and_edit_image_and_uid_filename_and_title_name_the_same_picture`: driven through `route()` with the real local Images binding and the shared `fakeBrowser`. Covers `screenshot` by item, filename and title (each labelled `library image <item>`, returning `image/png`), and `edit_image` / `list_image_edits` by item (each answering `image: <item>`, the describer title, the recipe, and the 8×8 original).
