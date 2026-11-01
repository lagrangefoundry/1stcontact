---
uid: acceptance_criterion-b54ba690
id: AC-2175
type: acceptance_criterion
title: The invite control is shown only to an owner, and its dialog states that no
  message is sent
created_by: xgd
created_at: '2026-11-01T18:27:53.575096+00:00'
updated_at: '2026-11-01T18:27:53.575096+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The Users tab's invite control sits with the list controls and is shown only when
the people list reports the caller may invite; it is hidden otherwise. The invite
dialog takes an address and an optional name, and states in words that no message
is sent — there is no mail delivery, and a control labelled "Invite" that said
nothing would be read as having sent something. After an invite, the dialog
reports the outcome and distinguishes a newly added person from one who was
already known; a refused invite is reported in the dialog rather than closing it
silently.

## Verification

Render the Users tab for a caller who may invite and assert the invite control is
visible; for one who may not, assert it is hidden. Open the dialog and assert it
contains the sentence that no message is sent. Invite a new address and assert the
dialog reports it as newly added; invite an already-known address and assert the
dialog reports it as already known. Submit an empty address and assert the error
is shown in the dialog.
