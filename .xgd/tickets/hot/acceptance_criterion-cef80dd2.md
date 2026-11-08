---
uid: acceptance_criterion-cef80dd2
id: AC-2484
type: acceptance_criterion
title: An image name matching several pictures is refused listing each exact name;
  matching none is refused pointing to the creation handle, Library name and list_assets
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:31.765201+00:00'
updated_at: '2026-11-08T23:45:25.646774+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
An `image` name that matches more than one stored picture is refused, never guessed: the refusal says how many pictures the name means and lists each candidate's exact name (the one that means exactly one picture), asking for one of those. A name that matches nothing is refused as not found, telling the model to name the picture by the handle it was given when the picture was made, by the name it appears under in the Library, or by anything `list_assets` shows; when the deployment holds no stored pictures at all, the refusal says it holds none yet. Neither refusal returns image bytes, and there is no operation that lists Library pictures.

## Verification
With site assets `hero.png` and `hero.svg`, call `screenshot` with `image: 'hero'` and assert the refusal names 2 pictures and lists `'hero.png'` and `'hero.svg'`, with no image block. Call with `image: 'nope'` and assert the not-found refusal points at the handle given when it was made, the Library name and `list_assets`. With an empty store, assert the refusal says none are held yet. Assert the fidelity surface declares no `list_images` operation.