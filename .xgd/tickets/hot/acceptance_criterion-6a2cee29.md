---
uid: acceptance_criterion-6a2cee29
id: AC-2590
type: acceptance_criterion
title: Promotion places the picture as currently edited (rendered recipe, stored bytes
  when unedited or no renderer) and records the asset name actually written per site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-10T00:04:46.397801+00:00'
updated_at: '2026-11-10T00:04:46.397801+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
Promoting a Library picture onto a site places the picture **as it currently stands**: the material's original with its recipe applied, not the stored original.

- On a deployment that can render, a picture whose recipe is non-empty lands on the site as the rendered result. A picture with an empty recipe lands as its stored bytes, and no transform is requested.
- On a deployment with no renderer, the stored bytes are placed. Promotion still succeeds.
- When the promotion lands, the material's record says, for that site, the asset name actually written (`placed_as`: `{ slug, name }`). This is the name the promotion reports. If the requested name was taken and a free name was chosen, the recorded name is the free name, not the requested one.
- The site is also in the material's placement list (`placed_on`), as before. A promotion to a second site records a second `{ slug, name }` entry and leaves the first in place.

## Verification
Through the platform's routes, against real D1, real R2 and the real local Images binding:
1. Give a Library picture a recipe of a single quarter-turn `rotate`, then promote it onto a site. Read the site asset back. Its width and height are swapped relative to the stored original.
2. Promote a picture whose requested name is already taken on the site. The material's `placed_as` holds that site's slug with the derived name that was reported, not the requested name.
3. Promote an unedited picture. The site asset is byte-identical to the stored original.
