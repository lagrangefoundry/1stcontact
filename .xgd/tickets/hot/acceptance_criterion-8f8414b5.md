---
uid: acceptance_criterion-8f8414b5
id: AC-1580
type: acceptance_criterion
title: 'Placing a file never replaces an asset already on the site: a taken name yields
  a free variant, and that name is reported'
created_by: xgd
created_at: '2026-09-04T04:52:01.812188+00:00'
updated_at: '2026-09-04T04:52:01.812188+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

Placing a file on a site never replaces an asset already there. When the file's name is already in
use on that site, the asset is stored under a free variant of the name that keeps the original
extension, the asset already live on the site is left byte-for-byte unchanged, and the answer
reports the name actually used rather than the one requested. Repeating this yields a further free
variant rather than reusing the first.

## Verification

Place a file, then place a different file of the same name on the same site. Confirm the first asset
is unchanged, the second exists under a distinct name that keeps the extension, and the reported
name is the one it was actually stored under. Place a third and confirm it takes a further distinct
name.
