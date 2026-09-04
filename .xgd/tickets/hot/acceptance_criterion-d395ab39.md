---
uid: acceptance_criterion-d395ab39
id: AC-1590
type: acceptance_criterion
title: Attached bytes are read back through the record that owns them, and a record
  naming absent bytes says so
created_by: xgd
created_at: '2026-09-04T05:17:47.050944+00:00'
updated_at: '2026-09-04T05:17:47.050944+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a7a12d81
  kind: behavior
  regression_only: false
---

## Criterion

Bytes attached to a piece of material are **retrievable through the record that owns them**, so the
surface that shows a client their own file can actually fetch it.

Given a material ticket with an attachment, reading that attachment's bytes through the deployment's
own account-scoped store returns exactly the bytes that were attached — byte-for-byte, and with the
filename and content type the record carries — without the caller supplying an account, a location,
or a content digest. Presenting the record is sufficient and is the only thing that works: the
content digest is an integrity field and does not resolve to bytes.

The two ways this can fail are distinguished, and neither is silent:

- **A store built with no byte layer at all** is reported as attached files being unreadable in this
  deployment, rather than as the file being missing.
- **A record whose bytes are absent from the store** is reported as *that material's file no longer
  being in storage*, naming the material — not as the material not existing, and not as an empty
  response. A record naming bytes that are gone is a real fault (a sweep collected an object something
  still named), and it is surfaced as one.

The read is bound to the account the same way the write is: bytes are fetched through the store
handle's own scoped byte access, so a correctly-formed address belonging to another account cannot
be read back through it.

## Verification

Inside the deployment's runtime against a real object store: create a material ticket, attach a known
byte sequence, and read the bytes back given only the material and its attachment record — assert
they equal the sequence attached and that the content type and filename are the ones supplied. Delete
the stored object out from under the record and assert the read fails naming that material's file as
no longer in storage, rather than returning empty bytes or reporting the material as absent. Build a
store without a byte layer and assert the read reports attached files as unreadable.
