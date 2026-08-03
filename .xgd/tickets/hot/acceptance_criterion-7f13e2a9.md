---
uid: acceptance_criterion-7f13e2a9
id: AC-793
type: acceptance_criterion
title: Rendered reproduction contains no remote handle and every handle it emits resolves
  to a file it ships
created_by: xgd
created_at: '2026-08-03T03:46:34.792119+00:00'
updated_at: '2026-08-03T03:46:34.792119+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
Rendering an imported reproduction produces output in which no HTML or CSS
artifact contains an absolute URL naming the captured origin, and every asset
handle the output emits resolves to a file present in that same output. The
rendered page therefore cannot reach the target host, because it never names it
— it renders identically with the target host unreachable.

## Verification
Import a bundle with remote image, background-image and font handles, then
render the site. Scan every emitted HTML and CSS artifact: assert the captured
origin and the font host appear in none of them, assert at least one local asset
handle is emitted, and assert each emitted handle corresponds to a file that
exists in the render output.
