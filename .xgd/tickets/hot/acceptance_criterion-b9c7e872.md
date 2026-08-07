---
uid: acceptance_criterion-b9c7e872
id: AC-1025
type: acceptance_criterion
title: A region's current image is always among the options it offers, even when the
  site's asset store holds no file for it
created_by: xgd
created_at: '2026-08-07T04:41:02.349929+00:00'
updated_at: '2026-08-07T04:41:02.349929+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

The handle a region currently points at is always one of the choices that region
offers, whether or not the site's asset store holds a file matching it. A
reproduction of an existing site can hold a handle the store never mirrored — a
remote address, for instance — and it must still be a legitimate choice rather
than disappearing from its own picker.

This is a correctness rule, not a convenience: a chooser whose options omit its
own value presents the *first* option as selected, so an operator who opened the
form only to correct the alt text and saved would silently swap the image for an
unrelated one.

## Verification

Seed a site with an image region whose handle names nothing in the asset store.
Request that region's fields and assert its current handle appears among the
offered choices, and that the reported current value equals it. Submit a change
map that alters only the alt text and assert the save succeeds and the region
still points at the same handle it did before.
