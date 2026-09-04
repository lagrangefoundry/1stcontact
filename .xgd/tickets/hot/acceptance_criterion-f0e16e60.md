---
uid: acceptance_criterion-f0e16e60
id: AC-1567
type: acceptance_criterion
title: Material nothing has read yet is still listed, and says in plain words that
  it cannot be found by its contents
created_by: xgd
created_at: '2026-09-04T04:27:38.101632+00:00'
updated_at: '2026-09-04T04:27:38.101632+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Material for which no description could be produced appears in the list and opens in the detail area
like any other. In place of a description, the detail area states plainly that nothing has read the
file yet, that it therefore cannot be found by what is in it, and invites the client to say what it
is — it does not present an empty box, an error, or a fabricated description.

The invitation is not a dead end: correcting the description from this state behaves exactly as
correcting a system-written one does.

## Verification

Ingest a material that cannot be described (no describer available, or a file with no extractable
text). Assert it appears in the list. Select it and assert the detail area carries the
plain-language statement rather than a blank description, an error, or invented text. Type a
description from that state, commit, and assert the correction is stored and attributed to the
client.
