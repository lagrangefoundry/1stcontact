---
uid: acceptance_criterion-7b488315
id: AC-1055
type: acceptance_criterion
title: A conversation identifier the origin never issued is refused before anything
  is streamed, and starts no conversation
created_by: xgd
created_at: '2026-08-10T08:35:48.124047+00:00'
updated_at: '2026-08-10T08:35:48.124047+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The origin answers only for conversation identifiers it issued. An identifier that
was invented, guessed — including one matching the form the origin itself would
produce for a site — or held over from before a restart is refused as not found,
with a plain refusal rather than an event stream, and rather than an apology
placed in a conversation as though the assistant had tried. No conversation is
created, no transcript storage appears, and no site is written.

## Verification
Without opening a conversation, submit a turn carrying (a) an identifier of the
form the origin derives for an existing site and (b) a fabricated identifier
containing path-traversal characters. Each is refused as not found, the refusal is
a plain structured answer and not an event stream, no transcript storage exists
afterwards, and every site's draft is unchanged.
