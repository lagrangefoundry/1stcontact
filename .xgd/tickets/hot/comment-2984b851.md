---
uid: comment-2984b851
id: COMMENT-5572
type: comment
title: Comment on bug BUG-257
created_by: xgd
created_at: '2026-10-23T16:30:16.978584+00:00'
updated_at: '2026-10-23T16:39:13.121560+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8907537a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a1c209d5-47c5-42e3-9cda-a2113bdc3780",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="06432726-d500-4b16-ba23-cab8ad7f9fbb-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T16:29:22.338729+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="06432726-d500-4b16-ba23-cab8ad7f9fbb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T16:39:11.792559+00:00" -->
#### Claude
Reading the framework's progress-record producer to see where `started_at`/`eta_s` come from.

Still mapping the code: the host's "working note" path is where model progress frames come from.

Confirming the junction stamps a timestamp on each record, which the fix will rely on.

Still locating where junction records get their `ts`; checking how 1stcontact's own junction stamps records.

Now the code change.

Now the UAT, modelled on the REQ-360/REQ-390 harness.

Two fixes to the double: the caller now replies before each call (which also avoids the talker cue), and each call gets its own tool id, since `calls()` would give both Delegates `call-Delegate`.

All three pass. Checking that they fail without the fix:

Now the regression scope: the heartbeat, working-line, talker and stall suites that read progress frames.

The one failure is the REQ-416 priming UAT, which is already red on clean working (hand-over line wrapped) and unrelated. Running the typecheck and lint:

Typecheck is clean, and the repo has no ESLint installed. Committing, then the merge-back sequence.

Updating the ticket's test plan with what actually ran, before merging back:

BUG-257 is fixed and merged into `xgd-working` as version 0.2.596. The ticket is at `free_coded`, so promoting it to reconcile is your call.

**What changed:** every progress frame the host relays now carries `step_started_at`, the start of the step its estimate refers to. That's the field name proposed in lagrange-framework BUG-93. `started_at` still means the round's start, so the current widget reads frames exactly as before. The whole change is in `progressEvent` in `tools/generate/src/cli/ai/progress-core.ts`, about 15 lines, with no new state and no change to the framework.

**How the step start is found:** every junction record already has its own timestamp (`ts`), so no new plumbing was needed:
- **Consultant notes** (a `Delegate` note or a slow-tool note such as "capturing…"): the host writes these as the step's tool call is issued, so the step started at the note's own `ts`.
- **"Still working" heartbeats:** only a running `Delegate` writes these, and their `elapsed_s` counts from when the worker was briefed. So the step started `elapsed_s` before the heartbeat's `ts`, and the heartbeat's elapsed time counts from the same start as the widget's estimate.

Because each frame's step start comes from that one record, a client that reloads mid-build and sees only the latest record gets the same value as the live stream.

**Tests:** three UATs in `tests/test_UAT_FC_BUG-257_progress_frames_carry_the_step_start.workers.test.ts`, one for each case in the ticket's test plan. All three pass with the fix and fail without it. The progress-related suites (REQ-360, REQ-390, REQ-416, BUG-240, BUG-249) pass, except one REQ-416 priming test that was already failing on clean working. The ticket's "REQ-222 progress UATs" was a mislabel, since REQ-222 is publishing; I ran these suites instead and noted that in the ticket.

**Still to come:** the widget won't look any different until lagrange-framework BUG-93 reads `step_started_at`. Dev also serves a frozen snapshot, so it only shows this after `bin/deploy --env dev`.

<!-- xgd-chat-end -->