---
uid: acceptance_criterion-5a6e478d
id: AC-1806
type: acceptance_criterion
title: A conversation is never announced to itself, while still remaining a searchable
  member of the client's knowledge
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:52.153782+00:00'
updated_at: '2026-09-14T06:28:52.153782+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A conversation is never announced to itself. Conversations are members of the
client's knowledge — they remain searchable, remain indexed, and remain described
by the map — but they are never reported as arrived material, and neither is the
conversation's own record.

Without this a conversation would announce itself on every turn for the rest of
its life, because the record of what it has been told is written onto the
conversation the moment a turn begins.

## Verification

Open a conversation and take a turn, so that the conversation's own record exists
and has just been written. Take a second turn with nothing uploaded in between,
and confirm the context for that turn contains no arrival notice and does not
name the conversation as arrived material. Confirm separately that the
conversation is still reachable as a member of the client's knowledge — it is
excluded from arrival notices alone, not from the corpus.
