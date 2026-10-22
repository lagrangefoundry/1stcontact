---
uid: comment-641e761b
id: COMMENT-5556
type: comment
title: Comment on request REQ-428
created_by: xgd
created_at: '2026-10-22T21:01:01.101050+00:00'
updated_at: '2026-10-22T21:16:19.698889+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5f1e2bc1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "49f3179b-8d73-4de3-b989-49349f103385",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="87da817e-4448-4af5-8458-a0816220723e-user" -->

<!-- xgd-chat role="user" ts="2026-10-22T20:59:59.831213+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="87da817e-4448-4af5-8458-a0816220723e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-22T21:16:16.830883+00:00" -->
#### Claude
I'm reading the plan/focus-task code that REQ-424/426 added, so the four changes reuse it rather than duplicate it.

Still mapping the host: found the continuation loop in `host-core.ts`, which is where the hand-back check (item 4) will hook in.

Working out how the host can tell, per reply, whether it wrote anything — reading the turn-log record shapes now.

Checking the framework's session-log record shape (whether every record carries `turn_id`), which decides how the host counts per reply.

Design is settled enough; checking what REQ-379/408 tests pin on the plan entry's "Due" wording before I write the ticket's design section.

Now recording the design on the ticket, then cutting the branch.

Branch is ready. Implementing part 1 (the cap) and part 2 (one agenda) in `plan-core.ts`.

Now the plan-core edits.

Now the priming text (talker) and the `set_task` / `pin_notes` declarations.

Plan side done. Now the host: the per-site question count and the promise hand-back. Checking how continuation cues are kept off the client's transcript.

Records carry `turn_id` and tool names, so the count can be read per round. Wiring it into the host.

All four parts are implemented and typecheck clean. Now writing the UATs.

Running the new plan-level UATs.

Plan-level UATs pass. Now the real-worker UAT (gear-change count and promise hand-back).

Both real-worker UATs pass. Now the regression scope: every suite that touches the plan entry, the talker, priming, or the plan surface.

The `logDir` failures are the known pre-existing Node-host issue (in memory). Checking REQ-401.

A REQ-356 UAT pins the 2,000 cap, so I'll keep the cap and only dedupe. Measuring whether that's enough.

REQ-401 passes. Rerunning the whole node scope plus the 14 workers suites.

Four workers failures. REQ-416's hand-over UAT is known red on clean working (in memory); checking both files against a clean baseline in the main checkout.

All four fail identically on clean working, so they're pre-existing, as are the `logDir` node failures. Final typecheck, then commit.

Merging back (fast-forward, bump at the tip), per the recipe that works here.

REQ-428 is built, merged into `xgd-working` and set to `free_coded` (commits `24984adc` and the version bump `6675c08a`, version 0.2.581). The new UATs pass: 3 plan-level and 2 that run the real worker.

**What each part does now**

1. **Cap on notes the client hasn't reacted to.** If more than 8 notes are waiting for the client's reaction, `pin_notes` is refused with `NOTES_UNREACTED`, and the refusal tells the consultant to start a story focus task. The 8 is configurable as `focus.max_unreacted_notes` in `plan-seed.json`. The notes counted are the existing "new" notes from REQ-424. Once a story task has covered them, pinning works again.
2. **One agenda for every voice.** The "Open decisions, most valuable first" and "Due:" lines are now built in one place and go into the consultant's per-turn plan entry. The worker, the talker and an ordinary consultant turn all read that entry, so they see the same words. The talker's own notes keep only what is specific to it ("Being built or next", "Already on the panel"), so nothing is said to it twice.
3. **Gear-change count.** The host keeps one count per site, shared by the consultant's and the talker's replies:
   - A reply that asks the client something and writes nothing adds one. A "?" inside a `[?]` gap doesn't count as a question.
   - Any write to the plan or the site resets it to 0. That includes starting a focus task, but not `show_client`.
   - It reads each reply's own records, so the worker's writes beside a talker never count as the talker's.
   - At 3, the plan entry carries the ticket's line.
4. **Promises on the plan.** `set_task` takes two new fields: `client_asked` (the client's words, which makes the task a promise) and `told_client` (what they were told about when it will happen). If the build hands back while a promise from that message is still `todo` and the client hasn't been told, the host carries the turn on. It uses REQ-409's existing continuation and spend limits, and the cue names each owed task. The cue is kept out of the client's transcript. The talker's instructions now say to record a mid-build request this way.

**Decisions I made along the way (all recorded on the ticket)**
- Adding the agenda pushed a fresh plan's entry past its 2,000-character limit, which cut off later lines and broke a REQ-401 UAT. A REQ-356 UAT fixes that limit, so I kept it. Instead, a decision named in the agenda line is no longer repeated in the "Not yet decided / Defaulted / Proposed" lists.
- A due check keeps the exact wording it already had ("Due: ask the client "…" (id) — why."), so the existing REQ-379 and REQ-408 UATs still pass. The talker now reads that same line.
- I fixed a small bug in the old talker agenda along the way: when the next story step was the positioning card, it said "1 new story notes".

**Tests that still fail, all already red on clean `xgd-working`:**
- `REQ-285` (6 tests) and `AC1320` (1 test): the known `logDir` problem in the Node host.
- `REQ-342` (3 tests) and REQ-416's priming hand-over test.

All other suites that touch the plan entry, the talker, the priming or the plan surface pass (58 files).

The ticket is waiting at `free_coded` for you to promote it.

<!-- xgd-chat-end -->