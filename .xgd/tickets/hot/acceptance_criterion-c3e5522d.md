---
uid: acceptance_criterion-c3e5522d
id: AC-1717
type: acceptance_criterion
title: Selecting a row shows the file itself and the rights record read-only, with
  no control by which a client can assert rights
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:49.652644+00:00'
updated_at: '2026-09-14T07:06:34.792965+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Selecting a row opens a detail view that shows the material itself and the record of what the
platform holds:

- **The file, shown rather than named — for every kind that can be shown.** A picture is
  rendered from its own stored bytes. A document the platform can read is shown in the reader
  window above the record rather than only offered as a download: which reader is chosen, and
  how each is drawn, is stated separately. Material nothing can render is offered as a download
  under its original filename, exactly as it was before the reader existed. If the stored bytes
  cannot be read, a plain statement that the file is no longer in storage replaces the preview,
  rather than a broken image or an empty window.
- **The download link is present in every case**, including the cases that now render: being
  able to read a file on screen is not the same as having it.
- **The record, read-only.** The filename, the kind, what the client said the material is for,
  where it came from, its rights, whether it may appear on the site, which site it is used on and
  the address it was fetched from are all displayed, and none of them offers any means of
  editing. There is no control anywhere on the pane by which a client can assert rights over a
  file.

## Verification

Select an image-kind row and observe the picture rendered from the platform's own bytes for that
material, plus a download offer carrying the original filename. Select a document row of a kind
the platform can read and observe its contents shown above the record, with the download offer
still present. Select a row of a kind nothing can render — a font, an unrecognised binary — and
observe the download offer alone, with no reader window. Point the preview at bytes that cannot
be read and observe the "no longer in storage" statement in place of the file. Inspect every
field row of the record and observe that none is marked or behaves as editable — in particular
the rights and "may appear on the site" values cannot be changed from this pane.
