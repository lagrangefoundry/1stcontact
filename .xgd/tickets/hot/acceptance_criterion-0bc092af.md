---
uid: acceptance_criterion-0bc092af
id: AC-1027
type: acceptance_criterion
title: 'Choosing an image bakes nothing: no asset file is touched and every other
  parameter the region carries survives untouched'
created_by: xgd
created_at: '2026-08-07T04:41:27.360466+00:00'
updated_at: '2026-08-07T04:41:27.360466+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Choosing an image changes exactly one structured field on the region and nothing
else:

- **No file is written, copied, resized, converted or processed.** Every file in
  the site's asset store is byte-for-byte identical after the edit, and no new
  file appears.
- **Every other parameter the region carries survives.** Whatever the region
  holds besides its handle and alt text — including the presentation parameters
  a captured design folds onto an image — is unchanged by the edit.

This is what keeps the eventual home of framing parameters (crop, scale, scrim,
rotation) protected while they are out of scope: they will be written as the same
structured fields, and nothing about choosing an image may displace them.

## Verification

Fingerprint every file in the site's asset store — contents, size and
modification time — before an image edit. Save a new choice of image, then assert
every fingerprint is unchanged and the set of files is identical. Assert the
edited region is identical to its previous state apart from the one handle field,
including any presentation parameters it carried.
