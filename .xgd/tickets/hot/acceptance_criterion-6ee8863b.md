---
uid: acceptance_criterion-6ee8863b
id: AC-1049
type: acceptance_criterion
title: A painted panel carrying no background image exposes its fill and no image
  picker — a background can be changed, never added
created_by: xgd
created_at: '2026-08-10T08:23:28.764117+00:00'
updated_at: '2026-08-20T02:54:01.583367+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A region that is a painted panel but carries **no** background image is still a
region with something to edit: it exposes **its fill** and no image field at
all. A panel carrying an empty handle is treated the same way as one carrying
none, because an empty handle paints nothing.

The picker offers no empty choice and no way to introduce a background where
none exists. This is deliberate rather than an omission: a panel is an editable
region only because it paints something, so a panel whose only paint was its
background would stop being addressable the moment it was cleared and could
never be reached again to restore it. Making the field one that must hold a
value puts that outcome out of reach by construction. Removing a background
remains reachable only through the surface that addresses the parameter
directly.

The same asymmetry holds of the fill: it can be **set** on a panel that declares
none and **changed** on one that declares it, because doing so cannot take the
panel out of the set of addressable regions — it is already painting something
or it would not be a region. Clearing a fill back to nothing is not offered
here, for the same reason removing a background is not.

## Verification

Seed a page with a painted panel carrying paint but no background image, and a
second carrying an empty handle. Request each region's fields and assert the
request succeeds, that exactly one field is returned, and that it is the fill
rather than an image picker. Assert a value written into the fill of a panel
that declared none lands in the draft and the re-rendered page paints it. Assert
the field list returned for a panel that *does* carry a background contains no
empty option, and that no control on either form can clear a fill or a
background.
