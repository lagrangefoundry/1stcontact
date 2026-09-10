---
uid: acceptance_criterion-9561711e
id: AC-992
type: acceptance_criterion
title: 'Editing through the builder''s origin is the same surface: a rejected edit
  returns the validator''s own fault, and a saved edit leaves both renderings current'
created_by: xgd
created_at: '2026-08-07T02:02:58.806555+00:00'
updated_at: '2026-09-10T17:29:54.305849+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The builder origin's editing endpoint exposes the same read and write operations
as the command line, not a parallel implementation, and it is the same single
endpoint for a change of words and a change of image — there is no separate
image route.

- **Reading is the same read.** A region's fields, as read over the origin,
  match what the command line returns for the same region — including, for an
  image region, the closed list of choices carried inside the image field itself.
  The chooser therefore costs no additional round trip and cannot present an
  option the write path would reject.
- **A refusal is a client fault.** A rejected edit — including a choice that is
  not one of the options the region offered — is answered as a **client fault**
  naming the offending field and carrying the same code, path and hint the
  command line reports, never as a generic server failure that discards it.
- **A save leaves both views current.** A successful save writes the draft and
  replies; there is no rendering step in between, because the origin produces
  **both** the editable rendering and the plain draft rendering from the
  definition when each is next requested. Every subsequent read of either
  channel from the origin therefore carries the change, so it is visible in
  either way of viewing the page.

## Verification

Against the running origin: read a copy region's and an image region's fields
and assert they match what the command line returns for the same regions,
including the image region's option list. Post an invalid edit of each kind and
assert the response is a client-fault status carrying the same code, path and
hint as the command line's refusal, with the field named and the draft
unchanged. Post a valid edit of each kind, then fetch both the editable and the
plain draft rendering from the origin and assert each carries the new value and
no longer carries the previous one.
