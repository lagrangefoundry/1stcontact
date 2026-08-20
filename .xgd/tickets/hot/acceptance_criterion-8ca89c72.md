---
uid: acceptance_criterion-8ca89c72
id: AC-1242
type: acceptance_criterion
title: Every palette entry is shown as a swatch with its name, its colour and its
  usage count, including an entry used nowhere
created_by: xgd
created_at: '2026-08-20T01:58:44.448622+00:00'
updated_at: '2026-08-20T01:58:44.448622+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

The palette surface lists **every** entry the site's palette holds, one swatch each, and each swatch
carries three things: the entry's name, the entry's colour shown as colour, and how many places
reference that entry across the site — counted at any position within the entry's light↔dark family.

An entry that nothing references is listed with a count of zero rather than omitted: zero is the
fact the removal rule is entirely about, so it is the count that must be reportable.

## Verification

Open the surface on a site whose palette has several entries, including one referenced from several
places at several different positions in its family and one referenced nowhere at all. Observe one
swatch per entry, in the palette's own order, each showing its name, its colour and its usage count;
observe the multiply-positioned entry's count equal to the total number of references to it (not
only the unpositioned ones), and the unreferenced entry present with a count of zero.
