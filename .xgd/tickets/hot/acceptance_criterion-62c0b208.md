---
uid: acceptance_criterion-62c0b208
id: AC-942
type: acceptance_criterion
title: One colour used at several opacities becomes one palette entry, with the opacity
  carried on each reference
created_by: xgd
created_at: '2026-08-06T21:07:43.103029+00:00'
updated_at: '2026-08-07T16:50:12.024794+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Where a site uses the same RGB value at several opacities — the alpha families
the census reports — the retrofit produces exactly one palette entry for that
colour, and each of the site's uses becomes a reference to that one entry
carrying its own opacity. No palette entry carries an opacity of its own; a
conceptual colour occupies one entry regardless of how many opacities it is
used at.

Every opacity survives the trip exactly: a reference resolves back to the same
translucent value that was authored, for every opacity in the site.

## Verification

Take a stored site whose census reports an alpha family of three opacities
(one RGB at full, mid and low opacity), run the retrofit, and assert: the
palette carries exactly one entry for that RGB; that entry's stored value has
no opacity component; the three uses resolve back to the three original
translucent literals byte-for-byte.