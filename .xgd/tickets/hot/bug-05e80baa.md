---
uid: bug-05e80baa
id: BUG-277
type: bug
title: 'Turns: writing to a client stream that has closed (''Unable to enqueue'')
  kills the consultant''s turn silently — the connection must not be the turn, and
  an errored round must never be silent'
created_by: EPIC-19
created_at: '2026-10-25T17:51:14.844040+00:00'
updated_at: '2026-10-28T03:54:27.970107+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f942afba
  commits:
  - working_sha: 6a216a047a9d50507b9d1b6938faa95e9243ec53
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 4d3552219de47235f18798b6e92517b59e0cdb08
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.640
---

## Symptom

First-Draft-Test Dina's Diner 2 (tenant `biz_8fd239cc503b7ecfb518206d86d5178f`,
site `site_24e7845dd4cf28ed711f024ba24b895f`), 2026-10-25 UTC, on the snapshot
built 10:26 local (all of BUG-274, BUG-275, BUG-276, REQ-455, REQ-456, REQ-458).
The operator: "The first attempt at a first draft seemed to silently fail."

- **17:35:33:** the consultant's first-draft turn `32281d03` starts (a host
  "client finished" cue). It reads the site and writes the design (`set_design`
  accepted at 17:36:58, all seven parts).
- **17:36:14:** the client asks "What's happening now?". The talker answers
  (`9930201e`, on its own request).
- **17:37:48:** `Delegate` is refused `logo_sized` (BUG-276, as intended).
- **17:38:18:** the turn ends `{"status":"aborted","forked":true,"spend_unknown":true}`.
  `turn_log` says `outcome: error, detail: "Unable to enqueue"`. **The client gets
  no reply, and no follow-up runs.**
- **17:43:41:** the client asks "What happened? I don't see a first draft yet?".
  The consultant apologises, is refused `logo_sized` again, fixes its brief, and the
  build starts at 17:45:28.

## Cause (to confirm)

"Unable to enqueue" is the Workers runtime's `TypeError` from
`ReadableStreamDefaultController.enqueue` on a stream that is already closed or
cancelled. The response stream carrying the consultant's turn had most likely
been closed by the client side: the panel opened a new request when the client
wrote at 17:36, or the browser dropped the connection. The consultant's next
output after the refusal was then written to that dead stream, and the exception
killed the turn. `router.ts` documents guarding `enqueue` on a cancelled stream
(~7630, ~7911, ~8075), so at least one path still throws, or the throw escapes a
guard. The ticket session finds it by reproducing.

BUG-275 deliberately added no follow-up for a turn that ends in an error ("no UAT
could reach that branch"). This is that branch, reached in the field.

## Fix

1. **The client's connection is not the turn.** Writing to a closed or cancelled
   response stream never ends the turn. The client is detached from that stream,
   the turn runs to its end, and everything it produces stays in the session
   record, where `/api/ai/reattach` and the next panel load show it. Every
   `enqueue` and `close` on a client stream, on every route that streams a turn
   (prompt, cue, talker, reattach), goes through one guard that swallows "stream
   closed" and nothing else.
2. **An errored round is never silent.** If a consultant round ends `error` (any
   cause), the client gets one plain line on their next connection, or
   immediately if connected ("Something went wrong on my side. I'm picking it
   back up."). The round gets BUG-249's one-shot continuation, as a stall does,
   with the error kind in the cue. It is recorded in `turn_log` with its cause, as
   now.

## Observation (no change asked here)

`logo_sized` refused the consultant's brief twice before it wrote the logo size
through `brand`. The refusal works, but the consultant's instructions should make
the first brief right. Check that `Delegate`'s description and the consultant's
priming say up front that the logo size lives in `brand`, as BUG-276 intends.

## Test plan

`tests/test_UAT_FC_BUG-277_a_closed_stream_does_not_end_the_turn.workers.test.ts`,
using the workers pool with a scripted model:

- A consultant turn whose client stream is cancelled mid-turn (the test closes the
  reader) carries on to `turn_end complete`, and its reply is in the session record
  and returned by `/api/ai/reattach`.
- The same with a talker round opened in between on another request, as in the
  incident.
- A consultant round that throws an error: the client's next connection shows the
  "picking it back up" line, a continuation round runs, and `turn_log` records the
  error.
- Re-run the BUG-249, BUG-256, BUG-275, REQ-416 talker and reattach UATs.


## What landed (BUG-277 session)

**Cause, confirmed.** `streamTurn` (`router.ts`) wrote each turn event with a bare
`controller.enqueue` inside the `for await`, deliberately: a throw there was how a
closed stream ended the turn. The throw on a closed stream is "Unable to enqueue",
which the route's `catch` recorded as `outcome: error, detail: "Unable to enqueue"`,
while the generator's `return()` aborted the turn upstream. A cue turn uses the same
route (`/api/ai/prompt` with `cue`). The new UATs reproduce exactly that row on the
unfixed code.

1. **The connection is not the turn.** One guard, `clientStream(controller)` in
   `router.ts`, carries every `enqueue` and `close` on a turn's client stream, in
   `streamTurn` (prompt, cue, and talker replies, which ride the prompt route) and
   `streamTail` (reattach). It swallows only a closed or cancelled stream's
   `TypeError`, and the stream's `cancel()` also detaches the client. Any other
   error still throws. `streamTurn` carries on to the turn's end with its client
   detached, and the turn is recorded `complete`. `streamTail` stops following,
   since a follower writes nothing. A Stop is `/api/ai/stop`, never a closed socket.
2. **An errored round is never silent** (`continuedTurn`, `host-core.ts`). A
   consultant round that ends `error`, whether by a `done` with status `error` or by
   a throw (not `UnknownSessionError`), gets one carry-on per message, like a stall:
   - the client is told `ERROR_RECOVERING_LINE` ("Something went wrong on my side.
     I'm picking it back up."), live as text and durably as a posted assistant turn
     (`manager.postTurn`, best-effort, 5 s), so a client who is not connected sees
     it on the next panel load;
   - the round is carried on with a new hidden host cue, `error-continuation-cue`
     (`priming.json`; `errorContinuationCue`/`isErrorContinuationCue` in
     `roles.ts`), naming the error's first line (≤200 chars). `isHostCue` hides it
     from the transcript;
   - the recovery round's spend row is keyed `<turn>-errored`;
   - the terminal `done` carries `meta.errored`. `turn_log` records
     `complete` / `recovered after error: <message>` (scrubbed), the same shape as
     BUG-249's "recovered after stalled".
   A second error in the same message ends it: a thrown error is rethrown, so the
   route frames it as before (REQ-146's key-scrub UAT still holds). Otherwise the
   client reads `STUCK_AGAIN_LINE`. No recovery runs if a stall was already
   recovered, or if a Stop is pending.

Transient provider errors (429/529/5xx) are still retried inside the adapter
(lagrange-framework BUG-92) and never reach this path.

## Superseded evidence (explicit supersession by BUG-277)

These pinned "a client walking away ends the turn", which this ticket removes:
- `BUG-46_an_abandoned_turn_is_recorded_aborted_not_complete` is removed. The new
  contract is pinned by `BUG-277_a_turn_whose_client_stream_is_cancelled_carries_on_to_its_end`.
- `BUG-121_an_abandoned_turn_is_reported_as_interrupted_not_as_short` is removed.
  A dead isolate still produces an interrupted turn, the same way.
- `REQ-292_a_turn_cut_off_before_its_terminal_event_claims_nothing` is removed,
  because walking away no longer cuts a turn off.
- `BUG-254_a_turn_aborted_mid_build_keeps_its_own_spend_and_its_builder` is adapted.
  The client walks away, the turn is now `complete`, and the row carries both
  requests (1 500 input) and its builder.
- `BUG-232_a_turn_that_throws_after_billed_requests_records_them` is adapted. The
  errored round is carried on once (4 requests). The errored round's own row is
  unchanged, and the carry-on bills nothing, so it has no row.

## Observation, checked

The consultant priming (`priming.json` ~1059 and ~1832) and `Delegate`'s goal note
(`GOAL_LOGO_NOTE`) both already say the logo's size is `brand.logo` and never a
brief's. The two `logo_sized` refusals were the model not following that guidance.
Nothing was changed.

## Test results

`tests/test_UAT_FC_BUG-277_a_closed_stream_does_not_end_the_turn.workers.test.ts`
(workers pool, real router, session manager, junction DO and D1, scripted model):
- `a_turn_whose_client_stream_is_cancelled_carries_on_to_its_end`: the ledger
  reads `complete`, reattach replays the reply ending `complete`, and the panel
  load paints it.
- `a_talker_round_on_another_request_does_not_end_the_detached_turn`: as in the
  incident.
- `an_errored_round_is_told_and_carried_on_once`: the live line comes before the
  reply, the cue names the error, and the ledger reads `recovered after error`.
- `a_client_not_connected_finds_the_line_on_their_next_connection`: the next panel
  load shows the line, then the reply, and never the cue.

All four fail on the unfixed code: the ledger reads `error`. Regression: the full
workers project and the node files importing host-core/roles. Every remaining
failure also fails on clean working, so they are pre-existing.