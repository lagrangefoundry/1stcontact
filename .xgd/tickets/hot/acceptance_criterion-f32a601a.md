---
uid: acceptance_criterion-f32a601a
id: AC-490
type: acceptance_criterion
title: A load-triggered motion renders as framework-computed animation, with no raw
  instance CSS on the page
created_by: xgd
created_at: '2026-07-09T20:52:03.371448+00:00'
updated_at: '2026-07-09T20:52:03.371448+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
Rendering a page whose module carries a `load` motion produces output in which the module's markup is wrapped so the section animates on load, and the per-site stylesheet contains the entrance animation rules (keyframes for fade/slide/scale bound to the load trigger). The motion's params (duration/delay/easing) appear only as framework-computed custom properties on the wrapper; no raw CSS declaration from the instance appears in the page.

## Verification
Render a site with a load fade/slide/scale motion. Assert the rendered HTML wraps the module in a motion container indicating trigger+type, that the per-site stylesheet includes the corresponding keyframes and animation binding, and that supplied duration/easing surface as custom-property values (not as raw CSS authored by the instance).
