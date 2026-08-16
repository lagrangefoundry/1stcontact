---
uid: acceptance_criterion-6ee8863b
id: AC-1049
type: acceptance_criterion
title: A painted panel carrying no background image still answers with an empty field
  list — a background can be changed, never added
created_by: xgd
created_at: '2026-08-10T08:23:28.764117+00:00'
updated_at: '2026-08-16T06:55:50.427160+00:00'
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

A region that is a painted panel but carries **no** background image still
exposes nothing: the request succeeds and returns an **empty field list**, with
the human-readable statement that there is nothing to edit there. A panel
carrying an empty handle is treated the same way as one carrying none, because
an empty handle paints nothing.

The picker offers no empty choice and no way to introduce a background where
none exists. This is deliberate rather than an omission: a panel is an editable
region only because it paints something, so a panel whose only paint was its
background would stop being addressable the moment it was cleared and could
never be reached again to restore it. Making the field one that must hold a
value puts that outcome out of reach by construction. Removing a background
remains reachable only through the surface that addresses the parameter
directly.

## Verification

Seed a page with a painted panel carrying paint but no background image, and a
second carrying an empty handle. Request each region's fields and assert the
request succeeds with an empty field list. Assert the field list returned for a
panel that *does* carry a background contains no empty option. Contrast with a
copy region and an image region on the same page, which return their fields.