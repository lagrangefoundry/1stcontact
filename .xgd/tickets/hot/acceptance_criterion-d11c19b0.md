---
uid: acceptance_criterion-d11c19b0
id: AC-2591
type: acceptance_criterion
title: A recipe change from the Library editor or edit_image replaces the placed asset's
  bytes at its recorded name in one operation, reported per placement in republished
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-10T00:04:48.877483+00:00'
updated_at: '2026-11-10T00:04:48.877483+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
Changing the recipe of a picture that is already placed replaces the site asset's bytes **at its recorded name, in one operation**. This holds whether the change comes from the client's Library editor (`POST /api/material/recipe`) or from the assistant's `edit_image`.

- After the change, each site in the material's `placed_as` holds the new render at the same name. No second asset is created, and the asset is never absent in between.
- The site's draft change journal records the replacement (`asset.replace`) naming the asset.
- The page that references the asset is unchanged. The draft shows the edited picture straight away. The published site serves it after the client's next publish, and an earlier published revision keeps its previous bytes.
- The client's recipe route answers with `republished`: one entry per recorded placement with its `slug`, `name` and `replaced: true`.
- A material with no recorded placement acquires no site asset from a recipe change, and `republished` is empty.
- On a deployment with no renderer, the recipe is still stored, `rendered` is `false`, `republished` is empty, and nothing on the site changes.
- A propagation that does not land never undoes the recipe change.

## Verification
Through the platform's routes, against real D1, real R2 and the real local Images binding:
1. Promote an unedited picture onto a site and note the reported name. Post a recipe of one quarter-turn `rotate` to the client's recipe route. The response's `republished` names that site and name with `replaced: true`. The site lists one asset under that name, and its width and height are now swapped. The draft journal has an `asset.replace` entry for it.
2. Repeat step 1 with the recipe written through the assistant's `edit_image`. The site asset at the recorded name is replaced in the same way.
3. Post a recipe for a picture that was never promoted. `republished` is empty and the site's asset list is unchanged.
