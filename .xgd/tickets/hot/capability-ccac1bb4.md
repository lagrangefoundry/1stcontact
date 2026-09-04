---
uid: capability-ccac1bb4
id: CAP-108
type: capability
title: 'Material Ingestion: From A Client''s Bytes To A Findable Record'
created_by: xgd
created_at: '2026-09-04T03:50:41.223169+00:00'
updated_at: '2026-09-04T03:50:41.223169+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: material-ingestion
---

[[CAP-106]] holds the client's material once it is here. This capability is how it gets here.

Until this existed there was no way to put a byte into the system at all. A client can hand the
platform a file, or ask it to pull something in on their behalf, and what comes back is not a file
in a folder: it is a record with a title, a written description of what the file *says*, a stated
provenance, a stated set of rights, and a place in the account's searchable knowledge — reached the
moment the request is answered rather than after some later pass.

This capability owns the path from bytes to a findable record:

- The two entry points — a file the client gives us, and an address we retrieve for them — and the
  single pipeline they converge on, so that everything true of one is true of the other.
- What the system decides about a file **without asking**: what kind of thing it is, and what may
  be done with it. Rights are inferred from where the file came from rather than put to the client
  as a legal question they usually cannot answer.
- Making the file findable by its contents rather than by its filename, and behaving honestly when
  it cannot be read.
- The refusals: a file too large to hold, an address that must not be reached, and material that
  may never be republished on a site.

What this capability is NOT: where material lives once created ([[CAP-106]]), the knowledge base
built over it ([[CAP-107]]), or the Library and drop-to-upload surfaces the client operates it
through.
