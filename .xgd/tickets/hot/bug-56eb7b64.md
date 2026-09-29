---
uid: bug-56eb7b64
id: BUG-168
type: bug
title: A delegating turn dies at ten minutes on a framework default we never set,
  and takes its own account of itself down with it
created_by: EPIC-20
created_at: '2026-09-29T05:01:39.275254+00:00'
updated_at: '2026-09-29T05:01:39.275254+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
---

## What is wrong

A turn that delegates dies at ten minutes, and it is our default we never set.

`runToolLoop`'s `timeout` is a per-call option on `promptStream` with a framework
default of 600 seconds. This project passes none — `host-core.ts` calls
`manager.promptStream(sessionId, text)` with no options, and `guardTurn` proxies the
options through unchanged — so every turn runs at the shipped default. That was
harmless while a turn was the caller reading and writing. It is not harmless now: a
worker's entire run happens inside one of the caller's tool calls, so the worker
spends the caller's wall clock.

## Observed

Gigabyte Alchemy consultant session, 2026-09-29. Of five turns that finished,
**three died this way**:

| turn | window | elapsed | detail |
|---|---|---|---|
| 1 | 03:37:20 → 03:48:45 | 11m 25s | `tool loop timeout after 600s` |
| 4 | 04:10:26 → 04:20:43 | 10m 17s | `tool loop timeout after 600s` |
| 5 | 04:26:12 → 04:36:45 | 10m 34s | `tool loop timeout after 600s` |

Every one of them delegated. The two turns that completed did not.

## What the client sees, which is the other half of the defect

The work is durable, so it lands. The turn is then reported as failed. The session's
own words for it, from the transcript: *"my last turn was cut off mid-explanation"*,
*"the thing I was in the middle of telling you"*, *"that last run died mid-flight and
I need to know what survived"*. Twice the consultant opened its next turn by
re-reading the change record to discover what its own previous turn had done.

So a timeout costs more than the turn. It costs the turn's account of itself, and the
next turn pays to reconstruct it — which is the expensive direction, since the next
turn is the consultant and the record it re-reads is large.

## What must hold

1. **A delegating turn is given the wall clock a delegation actually needs.** The
   value is this project's to choose and to state, with its reason, where the other
   backend decisions are stated (`backends.json` is the precedent: *"these were
   framework constants… this file is 1c exercising that"*). Observed worker runs are
   minutes long and a turn may delegate more than once.
2. **The value is chosen against the platform, not against optimism.** The turn runs
   under the junction Durable Object with the route holding the isolate open; the
   ceiling has to be a figure that arrangement can actually survive, and saying so is
   part of the change.
3. **A turn cut off mid-flight still says what it did.** Whatever the ceiling, it can
   be reached. The client should not be left with a failed turn whose work is live and
   unnarrated, and the next turn should not have to re-derive it from the record.

## The structural answer, which this is not

Raising the ceiling treats the symptom. The reason a delegating turn is minutes long
is that the caller's tool loop blocks on the worker — the caller is idle for the whole
run and paying for the wait in its own budget. The shape that removes the problem is a
delegation the caller does not wait inside: hand off, keep working or end the turn,
collect the result later.

That is a larger change and it belongs upstream, not here. This ticket is the cheap
correct thing: stop running a delegating consultant at a default meant for a turn that
does its own typing.

## Related

- **lagrange-framework BUG-73** — what the abort then loses: the turn's own spend, and
  a worker still running when the turn dies. Three of these five turns recorded zero
  tokens of their own for that reason.
- **BUG-166** — the console surface those zero rows land on.
- **REQ-348** — the caller-side discipline, which reduces how long a run needs but
  does not bound it.
