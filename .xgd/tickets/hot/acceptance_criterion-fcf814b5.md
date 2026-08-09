---
uid: acceptance_criterion-fcf814b5
id: AC-739
type: acceptance_criterion
title: An Astro container is constructed only for pages that carry behavior modules
created_by: xgd
created_at: '2026-07-29T04:33:06.638626+00:00'
updated_at: '2026-08-09T02:55:47.093346+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

Rendering a site constructs the Astro container only when the site actually has
a page carrying behavior modules.

- A site whose pages are all L1 reproductions — and the empty starter — renders
  its expected HTML with **no** Astro container constructed anywhere in the
  render path, and the emitted markup carries no module hooks.
- A site with at least one behavior-module page constructs the container on
  demand and renders identically to before: the module markup, its theme CSS,
  and its client script are all present.

## Verification
Render an L1-only site and a behavior-module site through the render entry
point with the Astro container's creation observed. Confirm the L1 render
produces the expected page HTML without the container being created, and the
module render produces the module markup and theme CSS with the container
created.