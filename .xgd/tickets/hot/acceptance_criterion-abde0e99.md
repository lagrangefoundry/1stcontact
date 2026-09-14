---
uid: acceptance_criterion-abde0e99
id: AC-1803
type: acceptance_criterion
title: A record of what a conversation has been told that cannot be read costs one
  wider sweep and never the turn
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:40.410424+00:00'
updated_at: '2026-09-14T06:52:07.175894+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A conversation's record of what it has already been told is bookkeeping, and an
unreadable one never costs a turn. If that record is missing, empty, or cannot be
read back, the turn runs and streams normally and the sweep simply starts wider —
the worst consequence is that a document already announced is announced a second
time. A record that is readable but partial (a boundary with no list of what sat
on it) is accepted at face value rather than discarded.

The conversation is never refused, and no error is surfaced to the client, on
account of this record alone.

## Verification

Take a turn on a conversation whose record of what it has been told holds text
that cannot be read back as a record at all, and confirm the turn completes and
streams its answer normally. Repeat with the record absent and with it empty.
Confirm a record holding only a boundary is accepted, yielding that boundary with
an empty list of documents sitting on it.