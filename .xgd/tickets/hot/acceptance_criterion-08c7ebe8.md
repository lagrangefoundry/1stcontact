---
uid: acceptance_criterion-08c7ebe8
id: AC-991
type: acceptance_criterion
title: 'No edit through this surface can produce raw HTML or CSS: every control is
  either plain text or a pick from a list the surface itself supplied'
created_by: xgd
created_at: '2026-08-07T02:02:54.192416+00:00'
updated_at: '2026-08-07T19:40:46.126507+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

There are exactly two shapes of field this surface can offer, and neither can
carry code:

- a **plain-text** field, whose content is stored and rendered as the region's
  literal words — markup in it creates no element and applies no style; and
- a **closed-list** field, which can only return one of the options the surface
  itself put in front of the caller, and is therefore strictly narrower than a
  free string.

There is no third shape, no freeform option and no mode through which markup,
styles or script can be submitted as code.

## Verification

Save a string containing script and style markup into a copy region, and into an
image region's alt text. Assert each save succeeds, that the rendered page shows
that string as literal text, and that it introduced no corresponding element or
active style. Separately, read every region of a page and assert that every
field offered is either a plain-text field or a closed-list field, and that
every closed-list field carries the list of values it will accept.