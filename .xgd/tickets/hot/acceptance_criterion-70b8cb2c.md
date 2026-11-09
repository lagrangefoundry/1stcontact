---
uid: acceptance_criterion-70b8cb2c
id: AC-2581
type: acceptance_criterion
title: A catalogue item name is accepted unchanged by screenshot and edit_image as
  the same picture
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:45.438953+00:00'
updated_at: '2026-11-09T23:18:45.438953+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

The `item` value that `list_library` returns for an image names the same picture everywhere else the assistant uses it. Passing that value unchanged as `screenshot`'s `of.image` (and as `edit_image`'s `image`) resolves to the same stored picture and is not refused as unknown or ambiguous.

The same is true of the filename and title spellings: a spelling that resolves to one catalogue item resolves to that same picture in `screenshot`.

## Verification

Seed one uploaded image in the Library. Take its `item` value from `list_library` and call `screenshot` with `{of: {kind: 'image', image: <item>}}` in the same hosted conversation. Assert that a picture is returned. Repeat with the item's filename. Assert that neither call fails with a not-found or ambiguity error.
