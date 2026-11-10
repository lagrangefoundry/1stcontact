---
uid: acceptance_criterion-f45342ae
id: AC-2592
type: acceptance_criterion
title: Promoting an already-placed picture again overwrites at its recorded name and
  mints no suffixed duplicate
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-10T00:04:51.254812+00:00'
updated_at: '2026-11-10T00:04:51.254812+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
Promoting a picture onto a site where it is **already recorded** (`placed_as` names that site) writes over the asset at its recorded name. It does not choose a free name and does not create a suffixed duplicate such as `logo-2.png`.

- The promotion reports the recorded name.
- The site's asset list has the same names before and after.
- The bytes at that name are the picture's current render.
- The material's `placed_on` still lists the site once, and `placed_as` still holds one entry for it.

A material that is placed on the site but has **no** recorded name there (placed before names were recorded) is treated as a first placement: it takes a free name and records it.

## Verification
Through the platform's routes, against real D1 and real R2:
1. Promote a picture onto a site and note the reported name. Give it a quarter-turn `rotate` recipe by writing the record only, then promote it onto the same site again. The second promotion reports the same name, the site's asset list has no new entry, and the asset at that name now has its width and height swapped.
2. Read the material. `placed_on` contains the slug once and `placed_as` has exactly one entry for that slug.
