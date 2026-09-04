---
uid: acceptance_criterion-f14db6cc
id: AC-1486
type: acceptance_criterion
title: Bytes attached to a piece of material come back as a record naming their content
  digest and size, listed under the material they belong to
created_by: xgd
created_at: '2026-09-02T00:16:55.839493+00:00'
updated_at: '2026-09-04T05:17:13.503742+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Attaching bytes to an existing ticket, through the account-scoped store the deployment itself uses,
succeeds and yields an attachment record that names the bytes:

- a **content digest**: a 64-character lowercase hexadecimal digest derived from the bytes
  themselves, identical for identical bytes and different for any other bytes. It is an **integrity
  field on the record — it is not where the bytes are stored.** Two records carrying the same digest
  are two independent stored objects, not one object named twice;
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
returned record's digest matches the 64-hex-character form and its size equals the length of the
sequence attached. Attach the same sequence again and assert both records carry the same digest;
attach different bytes and assert a different digest. Then list the ticket's attachments and confirm
every record is among them.

The digest must not be asserted as the storage address — that is AC-1488's subject, and asserting it
here is what left this criterion passing while reading the bytes back was impossible.
