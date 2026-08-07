---
uid: acceptance_criterion-9561711e
id: AC-992
type: acceptance_criterion
title: 'Editing through the builder''s origin is the same surface: a rejected edit
  returns the validator''s own fault, and a saved edit leaves both renderings current'
created_by: xgd
created_at: '2026-08-07T02:02:58.806555+00:00'
updated_at: '2026-08-07T02:12:03.691962+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

The builder origin's copy-edit endpoint exposes the same read and write
operations as the command line, not a parallel implementation. A rejected edit is
answered as a **client fault** carrying the same code, path and hint the command
line reports — never as a generic server failure that discards the message naming
the field. A successful save re-renders **both** the editable rendering and the
plain draft rendering before reporting success, so the change is visible in
either way of viewing the page.

## Verification

Against the running origin: read a region's fields and assert they match what the
command line returns for the same region. Post an invalid edit and assert the
response is a client-fault status carrying the same code, path and hint as the
command line's refusal, with the draft unchanged. Post a valid edit and assert
both the editable and plain rendered outputs on disk contain the new words.