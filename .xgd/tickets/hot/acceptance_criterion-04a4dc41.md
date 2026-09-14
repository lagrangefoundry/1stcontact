---
uid: acceptance_criterion-04a4dc41
id: AC-1805
type: acceptance_criterion
title: A resumed conversation's first turn back reports what arrived while the client
  was away, with no separate report
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:48.162665+00:00'
updated_at: '2026-09-14T06:28:48.162665+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A conversation resumed after everything held in memory has been dropped — a
reload, an eviction, a redeploy — reports on its first turn back what arrived
while the client was away, by name. There is no separate "while you were away"
report and none is needed: what a conversation has been told about survives with
the conversation itself, so the ordinary per-turn notice covers the gap.

## Verification

Open a conversation and take a turn. Upload a document. Discard every host-held
conversation so nothing about it survives except what was persisted, then reopen
and take a turn on the same conversation. Confirm the context for that turn names
the document uploaded while the conversation was not being served.
