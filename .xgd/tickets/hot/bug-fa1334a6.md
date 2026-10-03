---
uid: bug-fa1334a6
id: BUG-193
type: bug
title: set_standing_note reports success but the next turn is primed with an older
  note
created_by: xgd
created_at: '2026-10-03T21:24:06.495716+00:00'
updated_at: '2026-10-03T23:30:04.310905+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c0c95f3e
  commits:
  - working_sha: dc9a0cc4352ff6b4839e0da52ecf63fe716db1d5
    reconcile_sha: null
    main_sha: null
  - working_sha: b2d5f6d7c4ff5dedc40850cf3d8d692e73e5bdc9
    reconcile_sha: null
    main_sha: null
  version: 0.2.464
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

## Seen a third time, with no outage
After filing this bug, I called `set_standing_note` twice more in the same turn. Both calls succeeded (note_bytes 1927, then 1918), and the final text listed REQ-375 and BUG-193 as filed.

The next turn was primed with a note that still says "REQ per-side borders NOT filed" and "possible persistence bug, not yet filed". That is the version from the turn **before**, so the last 2–3 successful writes of a turn are consistently missing from the next turn's priming.

This points to the priming snapshot being taken from something other than the latest committed note. Either the turn's writes are buffered and not flushed, or priming reads from a stale replica or cache.

## Correction and confirmation
**Correction:** my earlier note on this ticket said it was seen "a third time", but I wrote that within the same turn, before any next turn had been primed. That claim was premature, so please disregard it.

**Confirmation, now real:** the turn after that one was primed with a standing note that still says "REQ per-side borders NOT filed… possible persistence bug, not yet filed". The final write of the previous turn was successful (note_bytes 1959) and listed REQ-375 and BUG-193 as filed. The priming note matches a write from **two** turns back, so every later successful write was dropped from priming.

Separately, the decision ledger delivered in the same priming was current (2 entries, correct), so the problem looks specific to the standing note's storage or read path.

## Retraction: probably not a bug (reporter error)
On reflection, the evidence doesn't support this report. The record delivered to the agent is explicitly a snapshot "as this turn began". All of the "missing" writes were made **within the current turn**, so a start-of-turn snapshot is not expected to contain them. The note that was delivered matches the last write of the **previous** turn exactly, which is correct behaviour. My earlier "confirmation" mistook a record re-delivered mid-turn (still the start-of-turn snapshot) for a new turn's priming.

Suggest closing this as not-a-bug. A possible small improvement: when the record is re-delivered within a turn, label it as the start-of-turn snapshot (e.g. "as of change N, start of this turn"), so the agent doesn't read it as a failed write.


## Resolution (free-coded)
Not a persistence bug. The session-memory provider reads the standing note when the turn's priming is assembled, so the delivered note is the last write of the **previous** turn. Writes made during the current turn are stored correctly and reach the agent at the start of the next turn. The defect is in how the note is presented: unlike the decisions block ("when this turn began") and the page digest ("a snapshot and does not move as you work"), the standing-note heading never said it was a start-of-turn snapshot, so the agent read the unchanged note as a failed write.

**Behaviour now:** the "Your standing note" block delivered in priming says three things. It is the note as it stood when the turn began. It does not move as the agent works. A rewrite made during the turn is kept and is the note given at the start of the next turn, so its absence from this snapshot is not a failed write. Text change only, in the `session-memory-note` template in `tools/generate/src/cli/ai/priming.json`. Storage and the read path are unchanged.

**Test plan:** `tests/test_UAT_FC_BUG-193_the_note_is_labelled_as_a_start_of_turn_snapshot.workers.test.ts` runs through the Worker's real `/api/ai/prompt` route against D1, with a scripted model. Turn 1 writes note A. Turn 2 rewrites it to B mid-turn, and its priming carries A (not B) under a heading that says "when this turn began" and "is not a failed write". Turn 3's priming carries B and not A. The test fails without the template change. Regression scope (all green): REQ-283 and REQ-339 workers suites, REQ-182 and REQ-171 priming suites.