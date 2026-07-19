---
uid: acceptance_criterion-08fea0a7
id: AC-665
type: acceptance_criterion
title: A radius dial accepts an absolute px radius verbatim or a named shape resolved
  to its token
created_by: xgd
created_at: '2026-07-19T03:10:28.552791+00:00'
updated_at: '2026-07-19T03:10:28.552791+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When a site definition sets the CTA shape or the panel corner dial to an absolute px
radius (e.g. `12px`), the published site applies that exact corner radius to the CTA
button / panel; when set to a named shape (e.g. `round`, `rounded`), it resolves to
the theme's radius token for that shape. Both forms are accepted on the same dial.

## Verification

Author a site setting the CTA shape and panel corner once to an absolute px radius
and once to a named shape, build each, and confirm the rendered corner radius is the
literal value in the first case and the themed token value in the second.
