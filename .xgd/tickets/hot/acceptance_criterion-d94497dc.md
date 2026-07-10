---
uid: acceptance_criterion-d94497dc
id: AC-555
type: acceptance_criterion
title: Unsafe URL scheme in a link/resource/action sink fails the render
created_by: xgd
created_at: '2026-07-10T00:33:42.256491+00:00'
updated_at: '2026-07-10T00:33:42.256491+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
When a module content value supplies a URL whose scheme is outside the safe set
— i.e. `javascript:`, `vbscript:`, `data:text/html`, `file:`, or any other
scheme that is not `http`, `https`, `mailto`, or `tel` — into a link, resource,
or form-action sink, rendering the site **fails** with a distinct content-safety
error. No published output containing the unsafe value is produced. This holds for
every URL-bearing sink: hero CTA link and image source, services-grid card link
and icon source, contact-form action, header/footer logo source, and header/footer
navigation link targets.

## Verification
Render a site whose module content injects a `javascript:` (and other unsafe-scheme)
value into each of the named sinks, one at a time; assert the render raises the
content-safety error and produces no output emitting that value. Repeat across the
enumerated sinks.
