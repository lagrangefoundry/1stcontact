---
uid: acceptance_criterion-c3e5522d
id: AC-1717
type: acceptance_criterion
title: Selecting a row shows the file itself and the rights record read-only, with
  no control by which a client can assert rights
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:49.652644+00:00'
updated_at: '2026-09-11T05:28:53.605107+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Selecting a row opens a detail view that shows the material itself and the record of what the
platform holds:

- **The file, shown rather than named.** An image is rendered from its own stored bytes; material
  of any other kind is offered as a download under its original filename. If the stored bytes
  cannot be read, a plain statement that the file is no longer in storage replaces the preview,
  rather than a broken image.
- **The record, read-only.** The filename, the kind, what the client said the material is for,
  where it came from, its rights, whether it may appear on the site, which site it is used on and
  the address it was fetched from are all displayed, and none of them offers any means of
  editing. There is no control anywhere on the pane by which a client can assert rights over a
  file.

## Verification

Select an image-kind row and observe the picture rendered from the platform's own bytes for that
material, plus a download offer carrying the original filename; select a non-image row and
observe the download offer without a rendered picture. Point the preview at bytes that cannot be
read and observe the "no longer in storage" statement in place of the image. Inspect every field
row of the record and observe that none is marked or behaves as editable — in particular the
rights and "may appear on the site" values cannot be changed from this pane.