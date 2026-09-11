---
uid: acceptance_criterion-9c50e45e
id: AC-1683
type: acceptance_criterion
title: 'Rights are inferred from provenance and never asked: an upload lands owned,
  republishable and not exportable, whatever the request claims'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:07:57.746594+00:00'
updated_at: '2026-09-11T04:17:57.020013+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

The rights record on a piece of material is **inferred from where the file came from, and
never asked of the client**.

For a file the client uploads, the record reads: rights `owned`; republishable; **not**
exportable — the two distribution bits are recorded independently of one another and neither
is derived from the other.

The ingestion request has no ownership input: an ingestion that carries an ownership, rights
or republishable assertion alongside the file is not influenced by it — the recorded rights
are exactly those the provenance implies.

## Verification

Upload a file and assert the three recorded values on the stored record (not only in the
response). Repeat the upload with additional request fields asserting different rights,
`republishable` and `exportable` values, and assert the recorded values are unchanged — the
client's claim about rights is not an input the pipeline accepts. (Material the platform
fetches on the client's behalf carries the inverted bits; that is asserted by the guarded-
fetch story, which owns that entry point.)