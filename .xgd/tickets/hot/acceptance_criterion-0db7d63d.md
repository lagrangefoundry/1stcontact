---
uid: acceptance_criterion-0db7d63d
id: AC-792
type: acceptance_criterion
title: Every media handle in the imported page resolves to the site's own mirrored
  asset
created_by: xgd
created_at: '2026-08-03T03:46:30.956475+00:00'
updated_at: '2026-08-03T04:01:08.732484+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
Importing a capture bundle whose folded layout carries absolute media handles
writes a page definition in which every asset-bearing handle — an image leaf's
source, a box's background image, and each font face — names the site's own
mirrored copy of that asset as a root-relative path, and no handle naming the
captured origin (or any other remote host) survives anywhere in the written page
definition. The import reports how many handles it bound to the mirror.

## Verification
Import a bundle whose folded document carries a remote background image, a
remote image-leaf source and a remote font face, with all three mirrored in the
bundle's asset map. Read the written page definition and confirm: each of the
three handles is the mirrored root-relative path, the captured origin and the
font host appear nowhere in it, and the reported count of localized handles is
three.