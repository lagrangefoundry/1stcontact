---
uid: bug-56eb7b64
id: BUG-168
type: bug
title: A delegating turn dies at ten minutes on a framework default we never set,
  and takes its own account of itself down with it
created_by: EPIC-20
created_at: '2026-09-29T05:01:39.275254+00:00'
updated_at: '2026-09-30T20:56:23.737685+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-345c5fb6
  story_points: 3
  commits:
  - working_sha: 9a05b6f5026c61b4823b51de8e01237cd29043c6
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 8f7676046e0bf5452b7999e732d99986c13c5366
    reconcile_sha: null
    main_sha: null
  version: 0.2.421
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


## Scope of this fix (free-coded)

**What changes for the user**

- A builder or settings turn is given **30 minutes** of wall clock instead of the
  framework's shipped 600 s. The value lives in `tools/generate/src/cli/ai/turn-clock.json`
  beside `backends.json`, with its reason written there; `host-core.ts` passes it as
  `timeout` on both `promptStream` calls (consultant and settings). A delegated
  worker keeps the framework default for its own run — it is bounded inside the
  caller's turn.
- **Platform:** the turn is driven inside the route's streaming response (the
  junction DO only takes short append calls), and Workers put no wall-clock limit
  on an invocation while its client is connected. The limit that does bind is
  **CPU time**, which defaults to 30 s on the paid plan. Awaiting the provider
  costs no CPU, but each write re-validates the definition (~80 ms, BUG-6612c4b7's
  measurement), so a write-heavy 30-minute turn can reach 30 s of CPU. `wrangler.toml`
  therefore sets `[limits] cpu_ms = 300000`, the paid-plan maximum, which is billed
  only when used. What can still kill a turn: the client disconnecting (by design,
  it aborts the turn) and a runtime restart/deploy eviction (already surfaced by
  REQ-306's ledger and BUG-121's pending record).
- **A turn that reaches a budget says what it did.** The installed library no
  longer throws at the clock (framework REQ-181): the round ends with
  `exhausted: true, exhausted_by: 'time' | 'calls'` and a `complete` status. The
  client used to see that reply just stop, and the next turn could not see the
  tool results (the transcript it reads back is prose only). Now the consultant's
  and settings assistant's backends are wrapped by `narrateExhaustion`
  (`turn-clock-core.ts`), which inserts one closing paragraph *inside the backend
  stream*, before the terminal event, so the manager records it as the assistant's
  own prose: live in the client's pane, on reload, and in the next turn's transcript.
  The paragraph says which budget ran out (the clock, in minutes, or the tool-call
  limit) and that the work is saved. It then lists what the turn did: every
  hand-off, with the worker's own reported summary (capped), and a count of the
  other tools that ran. It ends with an invitation to carry on. Workers are not
  wrapped: their prose never reaches the client, and their exhaustion already comes
  back to the caller as the delegation's `exhausted` outcome.
- **The worker's summary stays fenced as untrusted.** The Toolbox marks a
  delegation result as third-party data (`<<<untrusted>>> … <<</untrusted>>>`),
  because the worker is a model that read site and third-party text. Quoting it
  without the markers in text recorded as the assistant's own would pass that
  data off as the consultant's own words to the next turn, getting around the
  provenance marking. So a fenced result is quoted with its markers kept.
  (The client sees the markers too; that is a cosmetic cost accepted for now.)

**Test plan** — `tests/test_UAT_FC_BUG-168_turn_clock.test.ts`:
1. `turn-clock.json` states 1800 and its reason. Through the real host, a turn
   of three model calls 700 s apart completes and gets no notice; at the
   framework's 600 s it would be cut off.
2. Through the real host, with a real delegated worker and a faked clock, a
   turn ending `exhausted_by: 'time'` after a Delegate call and a read call
   ends on a closing paragraph. The paragraph names the 30-minute limit,
   quotes the worker's summary inside the untrusted markers, and counts the
   other tool. After a reload the paragraph is the last assistant message in
   the transcript, and a freshly built manager sends it to the model on the
   next turn.
3. A turn that runs out of tool calls names that limit instead of the clock.
4. `wrangler.toml` declares `[limits] cpu_ms` at the paid-plan maximum.