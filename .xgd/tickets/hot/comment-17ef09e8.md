---
uid: comment-17ef09e8
id: COMMENT-5649
type: comment
title: Comment on bug BUG-285
created_by: xgd
created_at: '2026-10-25T22:24:47.187990+00:00'
updated_at: '2026-10-25T22:33:18.442873+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ad6f41f8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f1a3eece-be67-4ba6-af21-83ba4755a88d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7fcd9c8f-b3a3-4c91-aa03-b8a0ce38277d-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T22:22:55.460349+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7fcd9c8f-b3a3-4c91-aa03-b8a0ce38277d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T22:33:12.229423+00:00" -->
#### Claude
Clear scope. Let me look at the code.

Scope is clear from the ticket; I'm cutting the branch and implementing now.

Now the implementation in `roles.ts` and `host-core.ts`.

Now the UAT, through the real host (`streamPrompt` records each message, `openSession` replays it).

Passes. Confirming it fails without the fix:

Red before, green after. Now the regression scope named in the ticket, plus typecheck.

Many workers files fail at file level — let me see why.

Known fresh-worktree gap (missing `apps/control-app/src/generated`). Copying it from the main checkout and rerunning.

The three remaining failures are priming-text suites (I didn't touch `priming.json`). Baselining them without the fix:

Same 3 fail on clean code — pre-existing, not mine. Typecheck:

Clean. Now version bump and commit — checking this project's bump convention.

Committing the fix, then lock → merge working in → bump → fast-forward back.

Fast-forwarded. Running the overlay check, then updating the ticket.

Moved, but with a warning — checking what it said.

Ticket is correct (free_coded, both SHAs, version 0.2.648); the warning was about the first SHA not carrying the bump itself — the second one does. Cleaning up the branch:

BUG-285 is fixed and on `xgd-working`: a reloaded chat no longer shows the host's layout-fault instruction (or any other host cue) as a client message. The ticket is at `free_coded`, version 0.2.648. The new test failed on the old code and passes with the fix.

**What changed**
- **Cues are recognised from the templates, not a list.** A new function, `isCue` in `roles.ts`, treats any template in `priming.json` whose name ends in `-cue` as a host cue. A cue with no fill-ins must match exactly; a cue with fill-ins matches on the text before its first fill-in. `isHostCue` now just calls it, so the reload hides every cue, including any added later.
- **One small change from the ticket's wording:** the ticket said to hide cues the host records as the client's turn. I hide every `-cue` template, including the cues sent to the talker (the second session that answers the client while a build runs), which never end up in the replayed transcript. Hiding those does no harm, and it means there's no exclusion list to keep up to date. The ticket body now says this.
- **The speak-first gate (BUG-278) behaves exactly as before.** Its old list moved unchanged into its own function, `holdsSpeakFirst` in `host-core.ts`. The held-continuation cue and the layout cue still don't trigger it.

**Tests**
- The new test file, `tests/test_UAT_FC_BUG-285_no_host_cue_reaches_a_reloaded_chat.test.ts`, runs through the real host. Each text is sent as a message, the session is reopened, and the test checks what replays:
  - every `-cue` template, read from `priming.json`, is hidden;
  - the layout cue with real fault lines is hidden;
  - a message the client types starting "[The host" is kept.
- I re-ran the related tests (REQ-403/409/415/427/428 and BUG-241/245/249/262/277/278/284): everything passes except three checks on the consultant's instruction text. Two are in BUG-245 and one is in REQ-428, and all three fail the same way on unchanged `xgd-working`, so this change didn't cause them.

**Commits:** `c6ad5787d0` (the fix and the test) and `85d3a2decf` (version bump). Both are fast-forwarded onto `xgd-working`, and the branch has been cleaned up. Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->