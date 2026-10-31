---
uid: comment-931c759b
id: COMMENT-5822
type: comment
title: Comment on bug BUG-312
created_by: xgd
created_at: '2026-10-28T21:43:52.160668+00:00'
updated_at: '2026-10-29T01:31:47.374069+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7a7b6b4b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5d8872a4-702b-4478-9c48-46766c6a143a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T21:43:46Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T21:43:46Z" -->
#### You
Got The work stopped before it finished ... Press Carry on in production making the changes - what is going on? In this situation should we not retry automatically?

<!-- xgd-chat role="assistant" ts="2026-10-28T21:43:46Z" -->
#### Claude
Turn started 21:20:28Z, last heartbeat 21:33:28Z, marked lost 21:34:51Z, no deploy, no logged error: the isolate was ended, likely cpu_ms 300000 or memory. Yes, auto carry-on once after a lost turn, then the button; record the cause.

<!-- xgd-turn id="e8f1fdc3-4796-44fe-8c73-f136412ed96c-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T22:20:07.749802+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e8f1fdc3-4796-44fe-8c73-f136412ed96c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T22:36:47.139909+00:00" -->
#### Claude
Still mapping the code: checking whether the auto carry-on can ride the existing hidden host-cue path (so the client sees only a consultant line, no fake user bubble).

Branch `free-BUG-312` is cut and set up; now editing the cue template, host-core and the route.

Now the template (spliced textually per the priming.json note) and roles.ts helpers.

Now the host-core edits.

Looking up how the framework records tool calls on the junction, so the turn log can name the last step.

Still tracing the tool record's shape (the zsh glob keeps tripping my greps); nearly done with it.

Host-core is done (cue, quiet line, "once" check, death detail). Now wiring the route: the `lost` cue, the reopen payload, and the tail stream.

Route wired. Now the turn-log `detail` and the panel side.

Panel done. Typechecking, then writing the UATs.

Writing the panel UAT (jsdom) now, modelled on BUG-294's.

Panel UATs pass (5/5, not skipped). Now the workers UAT for the origin side.

All 7 pass. Checking regressions: tests that pin the old "unknown cue" text, the priming templates and the turn log.

Hit the known long-filter quirk; rerunning with short name filters.

Checking whether that BUG-249 failure is mine or a baseline/flaky one.

Pre-existing: it fails the same way on clean xgd-working. Everything else (120 tests across 23 neighbour suites) passes. Now the version bump and commit.

Committing the work on the branch first.

Now updating the ticket body (keeping the existing content) before the merge-back.

A stray `-` got appended (wrong flag). Rewriting the body as the original plus the new section.

Ticket body is right. Now the merge-back: lock, merge working in, bump, xgd-merge, move to free_coded.

Landed and `free_coded`. host-core auto-merged with newer working changes, so I'm rerunning the BUG-312/294 suites on the merged tree before cleaning up.

A lost turn now carries on by itself once, and the turn log says how it died. BUG-312 is at `free_coded` (commits `37c1e65f` and `e2a60788`, version 0.2.698), merged into xgd-working. It is **not deployed** to production yet.

**What the client sees now**
- **Lost once:** when a turn is found `lost`, the panel starts the continuation itself instead of showing BUG-294's notice. It goes as a hidden host cue in a new request, so a turn killed by the CPU limit gets a fresh 5-minute budget. Nothing is posted in the client's name. The new turn opens with one quiet line, "Picking up where I left off.", which is also written to the transcript.
- **Lost again:** if the automatic continuation is also lost, the client gets BUG-294's notice and Carry on button as before. The server enforces this: it only accepts the cue while the conversation's last turn ended `lost` and wasn't itself that cue, and answers 409 otherwise. So a client stop, an errored round or a spending cap never triggers it.
- **If the server refuses the cue** (say, another tab got there first), the panel shows the notice and button, so the client always has one or the other.
- **Settings conversation:** it keeps the button, because the continuation instructions are written for the site consultant.

**What the turn log records**
- A lost turn's `detail` now gives the last heartbeat, how long the turn had been silent when found, and the step it was in: inside an unfinished tool such as Delegate, after the last finished tool, or in the model. It ends with "platform outcome unknown — see Workers Logs around <time>".
- The Worker doesn't fetch the `exceededCpu`/`exceededMemory` verdict itself. The instance that died can't report it, and querying the observability API from the Worker would need a new production secret. That's your call if you want it.
- Separately, the session response had been sending the client the lost turn's raw record, including its turn id. It no longer does.

**Decisions you may want to revisit**
- A turn started by pressing Carry on by hand gets one automatic continuation if it's lost. Each press costs at most two turns.
- The fix for the cause itself isn't done: the long consultant turn still runs in one request and can hit the CPU limit again. Splitting it across requests needs the measurement in the ticket's Finding first (which steps use the CPU). The automatic continuation is only a mitigation.

**Tests:** 7 new tests (4 server-side, 3 in the chat panel) pass, and they and BUG-294's still pass after merging into xgd-working. In the neighbouring suites (BUG-129/245/249/262/277/284/285/288/298, REQ-171/182/306), 120 of 121 tests pass. The one failure, BUG-249's `…stalls_twice…` test, fails the same way on clean xgd-working.

The ticket body keeps your text, with "What landed" and "Tests" sections added.

<!-- xgd-turn id="bc5d757f-df83-497b-971d-225d1bd1d345-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T01:29:39.554563+00:00" -->
#### You
Is this ticket finished?

<!-- xgd-turn id="bc5d757f-df83-497b-971d-225d1bd1d345-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T01:31:45.368447+00:00" -->
#### Claude
BUG-312 is finished, with two caveats: it isn't in production yet, and the underlying CPU problem isn't fixed.

**What's done:**
- The ticket is at `free_coded`.
- Both commits (`37c1e65f`, `e2a60788`) are merged into xgd-working.
- The work branch and its worktree have been removed.
- The ticket body describes what landed and which tests cover it.
- A lost turn now carries on by itself once; if that continuation is also lost, the client gets the Carry on button.
- The turn log now records how a lost turn died: the last heartbeat, how long it had been silent, and the last step it was in.

**What's still open:**
1. **Not deployed.** Production still has the old behaviour, where every lost turn shows the Carry on button. It reaches production at the next deploy from xgd-working.
2. **The ticket hasn't been reconciled.** Moving it to `ready_to_reconcile` is your call whenever you're ready. The ticket body is up to date for that.
3. **The cause isn't fixed.** The turn that was lost hit the 5-minute CPU limit, and 5 minutes is the most Workers allows. The automatic carry-on only gives a dying turn a fresh 5 minutes in a new request. The real fix is to split long consultant turns across requests, for example running each builder pass in its own request. That needs a measurement first of which steps use the CPU. The ticket records this as not done, and it's design-sized work rather than part of this fix.
4. **Optional:** the Worker doesn't fetch Cloudflare's own verdict on why a turn died (`exceededCpu` or `exceededMemory`). Doing that would mean adding the observability token as a production secret. For now the log names the time to look up in Workers Logs instead.

If you want point 3 tracked, I'd suggest a separate ticket for it. I haven't created one; say the word and I will.

<!-- xgd-chat-end -->