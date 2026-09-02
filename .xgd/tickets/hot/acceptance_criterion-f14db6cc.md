---
uid: acceptance_criterion-f14db6cc
id: AC-1486
type: acceptance_criterion
title: Bytes attached to a piece of material come back as a record naming their content
  address and size, listed under the material they belong to
created_by: xgd
created_at: '2026-09-02T00:16:55.839493+00:00'
updated_at: '2026-09-02T00:26:37.838916+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Attaching bytes to an existing ticket, through the account-scoped store the deployment itself uses,
succeeds and yields an attachment record that names the bytes:

- a **content address**: a 64-character lowercase hexadecimal digest derived from the bytes
  themselves, identical for identical bytes and different for any other bytes;
- a **size** equal, exactly, to the number of bytes attached;
- the filename and content type supplied with the attachment, where supplied.

Listing the attachments of that ticket afterwards returns that record. An attachment belongs to the
ticket it was attached to and is reached from it — it is not a free-standing object with a lifecycle
of its own, and no separate step is needed to associate it.

Attaching requires nothing beyond an existing ticket and the bytes: no account argument, no location,
and no prior registration of a place to put them.

## Verification

Against a real database and a real object store, inside the deployment's own runtime and through the
same wiring the deployment uses: create a ticket, attach a known byte sequence to it, and assert the
returned record's content address matches the 64-hex-character form and its size equals the length of
the sequence attached. Then list the ticket's attachments and confirm the record is among them.