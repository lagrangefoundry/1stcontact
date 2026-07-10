---
uid: acceptance_criterion-c3068995
id: AC-557
type: acceptance_criterion
title: Injectable HTML in a markdown content field fails the render
created_by: xgd
created_at: '2026-07-10T00:33:50.370079+00:00'
updated_at: '2026-07-10T00:33:50.370079+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
When a markdown content field (e.g. a body, subhead, or caption) produces HTML that
contains a `<script>`, `<iframe>`, `<object>`, or `<embed>` tag, an inline `on*`
event handler (e.g. `onerror=`), or a link/resource attribute carrying an unsafe URL
scheme, rendering the site **fails** with a distinct content-safety error. The raw
dangerous HTML never reaches the published page and never executes on load. A
markdown link with an unsafe scheme (e.g. `[x](javascript:...)`) is rejected on the
same basis.

## Verification
Render a real module (e.g. text-block) whose markdown body contains a raw `<script>`
and, separately, an unsafe-scheme markdown link; assert the render raises the
content-safety error and no output emits the script/handler/unsafe-scheme link.
