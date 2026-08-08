---
uid: acceptance_criterion-edb008ef
id: AC-805
type: acceptance_criterion
title: A background image on any node kind binds to the site's own mirrored asset
created_by: xgd
created_at: '2026-08-06T01:16:47.624035+00:00'
updated_at: '2026-08-08T00:42:33.077535+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Because the background image is part of the shared surface group, **any** node
kind may carry one — and the asset binding that rewrites captured media handles
to the site's own mirrored assets resolves it on any kind, not only on a box.

When a captured page is imported into a site, a background image declared on a
container, a text run, a slot or a control is rewritten to the site's own
`/assets/…` path exactly as an image leaf's source and a box's background are, so
the imported page serves its own bytes rather than hotlinking the captured
origin. A handle that cannot be resolved to a mirrored asset is **reported as a
gap**, never silently left pointing at the origin.

## Verification
Import a bundle whose captured page paints a background image on a container (not
a box), then inspect the imported page: the container's background handle
resolves to a site-local `/assets/…` path, and the rendered page requests no URL
from the captured origin. Repeat with an unmirrorable handle and observe it
reported as a gap rather than left as the origin URL.