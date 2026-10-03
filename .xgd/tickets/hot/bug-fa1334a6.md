---
uid: bug-fa1334a6
id: BUG-193
type: bug
title: set_standing_note reports success but the next turn is primed with an older
  note
created_by: xgd
created_at: '2026-10-03T21:24:06.495716+00:00'
updated_at: '2026-10-03T21:24:06.495716+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What happened
Within one turn I rewrote the standing note several times with `set_standing_note`. Every call returned success, with `note_bytes` matching the new text. In the latest turn I rewrote it once more (note_bytes 1927) to record that a capability request had been filed and that the staleness question was closed.

The next turn's primed record ("Your standing note") showed an **earlier** version instead. It was missing the last successful write: it still said the capability request was "NOT filed" and that a "possible persistence bug, not yet filed" was outstanding. This has now happened on two consecutive turns, and the second time there was no visible outage.

## Expected
The note delivered at the start of turn N+1 is exactly the last note written successfully in turn N.

## Why it matters
The standing note is the agent's working memory across turns, and it is the record that "survives when recent exchanges do not". A stale note made the agent restate as unfiled a ticket it had already filed, so it could re-file a duplicate or re-ask a settled question.

## Possible causes to check
- The priming snapshot is taken before the previous turn's writes are committed or flushed.
- Last-write-wins is broken when several writes land in one turn (an earlier write's commit lands after a later one).
- A cache in the priming assembly isn't invalidated on write.

## Reproduce
In one turn, call `set_standing_note` 2–4 times with distinct text, ending on a recognisable final version. Compare the next turn's primed note against the final version.