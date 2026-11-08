---
uid: acceptance_criterion-d9ab036e
id: AC-2483
type: acceptance_criterion
title: An image picture is matched by site filename, /assets/ handle, bare stem, Library
  record id, title or upload filename through one rule; fonts excluded
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:30.120219+00:00'
updated_at: '2026-11-08T23:45:25.900129+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
An `image` picture (REQ-218) is matched across both stores by one rule, whichever spelling the caller holds:
- a site asset by its filename (`hero.png`), its `/assets/…` handle (`/assets/hero.png`) or its bare stem (`hero`, the name a drawing was written under);
- a Library item by its record id, its Library title, or its upload filename when that differs from the title.

An exact spelling wins outright; only when nothing matches exactly is the name compared ignoring case and surrounding whitespace, so two pictures that differ only by case (`Logo.png`, `logo.png`) are each reachable by their exact name. Only pictures are in the set: a font file in the site's assets cannot be named as a picture, and a capture is reached as a `reference`, not as an `image`.

## Verification
With a site holding `hero.png`, `Logo.png`, `logo.png` and a font `brand.woff2`, and a Library holding an image record titled "Spring banner" uploaded as `banner-final.jpg`: assert `screenshot` of `image` resolves the same site picture for `hero.png`, `/assets/hero.png` and `hero`; the same Library picture for its record id, `Spring banner`, `  spring BANNER ` and `banner-final.jpg`; `Logo.png` and `logo.png` each to their own picture; and `brand.woff2` is refused as not found.