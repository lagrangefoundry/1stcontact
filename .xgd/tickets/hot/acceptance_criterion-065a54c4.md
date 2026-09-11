---
uid: acceptance_criterion-065a54c4
id: AC-1679
type: acceptance_criterion
title: Ingested bytes reside in the account's private material store and never in
  the store that serves the public internet
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:40.158667+00:00'
updated_at: '2026-09-11T04:07:40.158667+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

The bytes of an ingested file are stored only in the account's **private material store**,
under a location derived from the account the request was scoped to, and never in the store
from which the public internet is served.

After an ingestion, exactly one stored object exists at the location the attached file record
addresses, its content is the bytes that were sent, and nothing corresponding to that file
exists in the public site store.

## Verification

Ingest a file through the entry point, then enumerate the private material store under the
account's own prefix and assert that the attached file's location resolves there and holds
the bytes that were sent. Enumerate the store that serves published sites and assert nothing
was written there by the ingestion. The assertion is about residency, not about naming: it
must fail if a future change writes the bytes into the public store even under a different
key.
