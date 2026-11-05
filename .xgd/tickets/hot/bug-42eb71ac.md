---
uid: bug-42eb71ac
id: BUG-292
type: bug
title: 'Host holds: speak-first refuses calls after the consultant has just spoken,
  looping until the spend ceiling'
created_by: EPIC-19
created_at: '2026-10-26T01:04:12.504529+00:00'
updated_at: '2026-10-28T03:54:11.576438+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ce6707a8
  commits:
  - working_sha: 9a8e4aa018b6993234c6ecc9e52c2582f786fb45
    reconcile_sha: null
    main_sha: null
  - working_sha: 9919712a64a293ab2c2a44ead5f277a52b8c791b
    reconcile_sha: null
    main_sha: null
  version: 0.2.660
  story_points: 5
---

## Symptom

First-Draft-Test Dina's Diner 4 (site_99aa2f2e…, tenant biz_782fff7f…), 2026-10-26 UTC.

At 00:36:26 the consultant ended its 41-minute build turn with a message to the client ("The home page
gets a driver off 80 fast… What's your first reaction?"). The host then held the reply with the
home-length cue (BUG-287: home 6.1 phone screens, budget 6). In that held round:

- **28 calls refused, 3 minutes, $1.73, nothing done.** Every call (`describe_page home`, `set_decision
  pages_navigation`) came back "Not run yet: your client has heard nothing from you this turn…
  acknowledge what they just did…". The consultant retried the same calls for 30 Opus rounds
  (00:36:33–00:39:24, each re-reading ~90k cached tokens) before it put a line of text first.
- **Then the build couldn't finish.** At 00:39:52 its `Delegate` (move the coffee bell story to Our
  story) failed `spend_ceiling`: the client message (the heart on the direction card) had reached its
  $10 ceiling — ~$8.20 before the loop, over $10 after it. The consultant told the client what was
  left ("Stopped before the build was finished"), and the home page stayed over budget.
- **The chat panel showed it out of order.** The long-running round's bubble was created at 23:55,
  under "Next I'm building the first draft". The cued "ready to look at" replies (00:12–00:35) were
  appended below it. Then the round's own 00:36 text and the held rounds' text (00:39–00:40) were
  written into that old bubble. So 17:40 text sat above 17:12–17:35 messages, and the 00:36 "first
  reaction" message disappeared from the live view (probably overwritten). The stored transcript
  and the junction log are in the right order.

## Cause

1. **The speak-first gate judges per round, not by what the client last read.** `holdsSpeakFirst`
   (`tools/generate/src/cli/ai/host-core.ts`) includes `isHomeStructureCue`, and `spokenTurns` is
   per turn. A host hold that carries on straight after the consultant's own message counts as
   "the client has heard nothing", which is false: they just read it. The refusal text then tells
   the model to "acknowledge what they just did" when the client did nothing.
2. **The home-structure cue orders the work against the gate.** Its words: "Record the new structure
   with set_decision… Tell your client the new structure in one line, then build that." The model
   followed that order (record first), and the gate refused the record every time.
3. **Nothing bounds a refusal loop.** An identical refused call is retried at full price,
   indefinitely, until the spend ceiling ends the work.
4. **Live chat places a long round's text at the round's start.** `apps/control-app/src/builder/chat.js`
   draws cued replies as new messages at the bottom (`onCued`). The originating round's text keeps
   streaming into the bubble made when that round started, however much has been drawn below it.

## Fix (as built)

[[BUG-290]] (landed first, from the same incident) already made the gate judge by the
message, not the round: `spokenTurns` is set when any round yields words to the client
and the gate's `cued` hook is `holdsSpeakFirst(prompt) && !spokenTurns.has(key)`. It also
releases the gate once a refused call's result has come back, so a round wastes at most
one request. This ticket builds on that:

1. **No speak-first right after the consultant spoke.** Covered by BUG-290's
   message-level check. This ticket adds the evidence for the incident's exact case: a
   reply the client read, then the host's home-structure hold, whose first call
   (`set_decision pages_navigation`, made with no words first) runs without a refusal.
2. **Held cues say "tell, then record, then build".** `home-structure-note`
   (`priming.json`, used by both home-length cues) now reads: move what serves the
   curious to its own page… "In this order: tell your client the new structure in one
   line, then record it with set_decision as 'pages_navigation', then build that".
   The other speak-first-list cues that ordered work before words now put the line
   first. `critique-continuation-cue`: "If your client has heard nothing from you since
   they last wrote, first tell them in one line that you are looking the site over.
   Then call critique…". `promise-continuation-cue`: "Start each one now — say so to
   your client first, then set_task status doing —". `SPEAK_FIRST_REFUSAL` no longer
   says "acknowledge what they just did" (a host hold follows nothing the client did).
   It now says the client "has heard nothing from you since they last acted" and asks
   for what the consultant is about to do and how long.
3. **A refused round can't loop, the client isn't left in silence, and the cost is
   visible.**
   - Bounded to one refused request a round (BUG-290).
   - When the gate then lets a call run with nothing said to the client, the host
     writes one neutral line on the stream before the call (`OVERRIDE_LINE` in
     `cadence-core.ts`: "I'm working on this now — it takes a few minutes, and I'll
     tell you here when it's done."). The line counts as words the client has heard
     (`spokenTurns`).
   - The refused round's request is marked in the meter. `keepClientOriented` calls a
     new `speakFirst.refused` hook once a round. The host's consultant sink tags the
     next request row it writes with `speakFirstRefused`: either the request that
     issued the refused calls or the one that carried their refusals back, whichever
     completes first, and exactly one per refused round. New column
     `request_spend.speak_first_refused` (migration `0034_request_spend_refused.sql`,
     manifest updated, test D1 factory at head).
   - `GET /api/refusals` (tenant-scoped) returns `{count, costMicros, recent[]}`, from
     `tenantRefusedSpend` in `spend.ts`. The builder's Debug tab has a **Refused
     rounds** section: "N refused rounds, $X." and the latest refused requests, newest
     first (time, cost, turn).
4. **Late text goes at the bottom of the chat** (`apps/control-app/src/builder/chat.js`,
   `talkDesk`). The fix is in chat.js because `webui-chat` is upstream. When a cued
   reply is drawn below an open work stream, that stream is marked displaced, after
   anything it had said but not drawn is drawn first. From then on its text is
   collected and drawn as its own assistant message at the bottom, at the next tool
   call, the next progress frame or the end of the stream, instead of going back into
   the bubble made when the round started. No text is replaced, and a stream with no
   cued reply below it streams into its own bubble as before.

## Design decisions

- The "refuse twice, then let go" in the original Fix was superseded by BUG-290's
  "once a round". What this ticket adds is the client-facing line and the visibility.
- Refused cost is recorded on the request row, following REQ-438's `review_id`. It
  is not a plan field or a log line, so the figure is the billed cost of the actual
  request. The Debug read is business-level, so it needs no site→session mapping
  (the Debug tab is already per business).
- Late chat text is drawn in segments (at tool calls, progress frames and the end)
  rather than streamed character by character. This keeps the change inside chat.js
  without touching the upstream widget.

## Test plan

UATs (all passing):
- `tests/test_UAT_FC_BUG-292_held_rounds_after_words.workers.test.ts` (real Worker
  route, junction, D1/R2, delegation and the host's look; doubles for the Anthropic
  client and the browser):
  - `…a_home_structure_hold_after_a_reply_the_client_read_runs_its_first_call_unrefused`
  - `…a_round_that_keeps_calling_without_speaking_is_refused_once_the_host_tells_the_client_and_the_refusal_is_priced_on_the_debug_read`:
    one refusal, then calls run; `OVERRIDE_LINE` on the stream; exactly one
    `request_spend` row with `speak_first_refused = 1` and a cost; `/api/refusals`
    returns count 1 and that cost.
  - `…a_round_that_speaks_first_is_never_refused_and_spends_nothing_on_refusals`: no
    refusal, no host line, count 0.
  - `…held_cues_put_the_line_to_the_client_first_and_the_refusal_claims_no_client_action`:
    in the home-structure note, "tell your client" comes before `set_decision`, which
    comes before "then build"; the refusal has no "acknowledge what they just did".
- `tests/test_UAT_FC_BUG-292_late_text_at_the_bottom.test.ts` (the real chat panel
  against the installed `webui-chat`):
  - `…a_rounds_text_after_cued_replies_is_drawn_below_them_in_transcript_order`: round
    start, two cued replies, the round's own text, then a held round's text. Every
    message is kept, in transcript order, both in the panel's messages and on screen.
    Fails against the old chat.js.
  - `…a_round_with_no_cued_reply_below_it_keeps_streaming_into_its_own_bubble`.
- `tests/test_UAT_FC_BUG-292_debug_tab_counts_refusals.test.ts` (the real builder in
  jsdom): the Debug tab's Refused rounds section shows "2 refused rounds, $0.11." and
  the recent list, newest first.

Regression scope: BUG-240/241/245/247/254/262/264/272/273/275/277/278/279/284/285/287/290,
REQ-291/292/357/379/386/390/409/413/415/416/427/428/431/436/438/449/451/459, and every
other suite importing `builder/chat.js`. All green, apart from failures that fail the
same way on clean xgd-working: BUG-245 priming ×2, BUG-275 ×1, REQ-416 ×3, REQ-428 ×2,
REQ-431 ×2, REQ-436 ×1, BUG-64, BUG-244, REQ-127, and builder-assistant-pane AC1065/AC1070.

Related: [[BUG-278]], [[BUG-284]], [[BUG-287]], [[BUG-240]], [[REQ-436]], [[EPIC-19]].