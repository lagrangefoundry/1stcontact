---
uid: acceptance_criterion-04e0650b
id: AC-1724
type: acceptance_criterion
title: An identifier that is not this account's material is answered not-found by
  every Library operation, and a write so answered changes nothing
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:18.861938+00:00'
updated_at: '2026-09-11T05:28:52.594546+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

An identifier that names something other than this account's material — a record of another kind,
or nothing at all — is answered **not found** by every one of the Library's operations: reading
one piece of material, serving its file, and writing a corrected description. It is never
answered with a refusal that distinguishes "exists but is not yours to read here" from "does not
exist", because that distinction would make these operations an oracle for which records the
account holds.

A write so answered changes nothing: the record named keeps the content it had.

## Verification

Create a record of another kind (for example a brief) in the same account. Ask for it as one
piece of material, ask for its file, and submit a corrected description against it. Observe each
answered not-found rather than as a refusal, and observe the record's content unchanged
afterwards. Repeat with an identifier that names nothing at all and observe the same not-found
answer.