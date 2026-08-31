---
uid: acceptance_criterion-da75ddf7
id: AC-1392
type: acceptance_criterion
title: Asset bytes round-trip byte-for-byte including non-text sequences, typed by
  name, listable and removable
created_by: xgd
created_at: '2026-08-31T09:47:47.268616+00:00'
updated_at: '2026-08-31T10:04:13.545164+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Asset bytes written to the cloud store come back byte-for-byte, including a sequence that is not
valid text — a byte run that would be corrupted by any decode on the way in or out survives
unchanged.

- Assets are listed by name, sorted, for the site they were written to.
- The stored object carries the content type the asset's name implies (an `.svg` is labelled as
  SVG, a `.png` as PNG), so a response built from it is labelled without re-guessing the
  extension.
- Reading an asset the store does not hold reports absence rather than empty bytes.
- Removing an asset by name takes it out of the listing and makes a subsequent read report
  absence; the site's other assets are untouched.

## Verification

Write two assets in one change — one text-shaped, one containing bytes that are not valid UTF-8 —
then list them (both present, sorted), read each back (identical to what was written, compared as
bytes), and inspect the stored object's declared content type for each. Read a name never written
and observe the absence report. Remove one asset and observe it gone from the listing and from a
read, with the other still present and readable.