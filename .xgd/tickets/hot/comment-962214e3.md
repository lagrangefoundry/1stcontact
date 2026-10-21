---
uid: comment-962214e3
id: COMMENT-5546
type: comment
title: Comment on bug BUG-249
created_by: xgd
created_at: '2026-10-21T18:46:35.872409+00:00'
updated_at: '2026-10-21T19:20:56.364295+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-db247fe1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "37ba4bd6-8c16-409d-a55c-ab3b1b957258",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="151b1414-9052-42a9-9b0d-236a99f56f84-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T18:45:45.615732+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="151b1414-9052-42a9-9b0d-236a99f56f84-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T19:20:55.469111+00:00" -->
#### Claude
I'm reading the ticket and mapping the turn pipeline (lease, locks, talker desk, turn ledger) before scoping. It's a big ticket, so I'm handing the code survey to an Explore agent.I have enough of the design. Before coding I'm filing the scope in the ticket and checking a few seams: the cue definitions, `turnOutcome`, and how the router maps outcomes.

Now I'm recording the design on the ticket and filing the framework half in lagrange-framework.

Framework half filed as lagrange-framework BUG-92. Next I'm appending the design to BUG-249 and setting it to `free_coding`.

Writing the code now, starting with the progress deadline in `progress-core.ts`.

Still implementing. I'm adding the stall cue and config, then the host release and continuation wiring in `host-core.ts`.

Host side is in. Now the Worker side: bounded Durable Object calls, the turn-log outcomes and watchdog, the router, the cron, and client wording.

Wiring is done. Now the client's failure wording: gentle in production, detailed under `TURN_DIAGNOSTICS`.

Both typecheck clean. Now the UATs, modelled on the REQ-306 killed-turn suite.

Writing the BUG-249 UAT file now (wedged tool, stuck twice, watchdog, bounded junction writes).

Two of four pass. The failures show the hang landing before the round's `turn_start`, so the wedge is catching a pre-model read. Instrumenting to see which call trips it.

All 4 BUG-249 UATs pass. Next: a UAT for the failed-talker path, built on the REQ-416 worker+talker harness.

Talker UAT passes. Now a jsdom UAT for the gentle panel wording, then a wide regression run.

One REQ-416 priming assertion fails. Checking whether it fails on clean xgd-working too.

Pre-existing: it fails the same way on clean xgd-working. Now the node-project regressions.

Many failures are known worktree-location artifacts (webui resolution). Two look relevant to my change: the env-parity checks REQ-144 and AC1341, and REQ-180/185. Checking those.

I'll declare `TURN_DIAGNOSTICS = ""` in production vars instead of leaving it absent. That keeps the env-parity invariant and the break-glass pattern (ships empty, off).

All three failures are pre-existing: identical on clean xgd-working. Re-running typecheck and checking for a lint script.

Everything relevant is green. Now syncing the ticket body with what was actually built, then committing.

Ticket body is current. Committing on the branch.

`module-assets.ts` was rewritten by a test run, a known side effect. Reverting it before staging.

Committed `5ad2bf9`. Next: lock, merge into xgd-working, and promote to `free_coded`.

Merged with nothing to rematerialize. Promoting with `move-to-free-coded`, omitting `--version` so the gate bumps the version itself.

BUG-249 is implemented and merged into xgd-working. The ticket is at `free_coded` (commits `5ad2bf9` + version bump `cc808aa`, 0.2.572), with the body updated to match what was built. It's ready for you to promote when you choose.

**What was wedging the session.** A turn stuck on an await that never returns, such as a tool call or a Durable Object write, kept its session claim alive. The framework's heartbeat is just a 5-second timer, so the turn looked alive forever. Every retry then lost the claim and was quietly queued with no reply. Stop couldn't help either, because it only interrupts the model stream, not a pending tool. A restart "fixed" it only because the heartbeats stopped.

**What now happens:**
- **Progress deadline.** If a turn makes no real progress for 5 minutes (`stall_seconds` in `turn-clock.json`), the host stops waiting for it. Heartbeats don't count as progress, but a delegated builder working in its own session does. The host then releases the claim, the talker and the fork, so the session is free.
- **Carrying on.** A stalled turn is continued once automatically, with a hidden cue saying what got stuck. Meanwhile the client sees "One moment — picking that back up…". If it stalls a second time, the client gets one gentle apology.
- **Every turn closes in `turn_log` with a cause**, e.g. `stalled 300s awaiting tool Delegate (last: tool_issue)`. A turn that recovered closes `complete` with the stall in its detail. A watchdog on the existing 10-minute cron closes any row left open as `lost`. The operator console now shows a Stalled count.
- **Stalls are logged when they happen** as `turn_stalled` lines in the Workers log, which serves as the operator alert.
- **Every Durable Object call has a 15-second ceiling**, so a hung write can no longer block the next turn.
- **Clients never see turn ids or "it was our failure".** A new `TURN_DIAGNOSTICS` setting is on in dev and empty in production; in production the client gets a gentle line instead.
- **`POST /api/ai/unstick`** is the last-resort release for a session.
- **A failed talker no longer goes silent.** The client's message goes to the builder at its next step, no more talkers are tried that round, and the client sees "I'll pick that up as soon as this part of the build is done."

**Tests.** I added 7 new UATs across three files. The main one uses a database read that never returns inside `list_pages`: the turn ends, recovers, records its cause, and the next message runs normally with no restart. The related suites pass. Four other failures fail identically on clean xgd-working: REQ-416's priming check, REQ-185's break-glass check, two REQ-180 vocabulary checks and AC1333's hook ordering. I changed one existing test: the REQ-306 killed-turn suite now runs with diagnostics on, because it checks the dev-only turn id.

**What's still open:**
- **lagrange-framework BUG-92 (filed, no code from here)** covers what only the framework can fix:
  - tie the heartbeat to progress;
  - let Stop interrupt a pending tool;
  - add a public `abandonTurn`;
  - retry on 5xx/529 and on a stream that goes silent.

  Until it lands, three limits remain:
  - a stuck turn's heartbeat keeps writing junk records until the isolate exits;
  - a message sent before the deadline fires is still silently queued;
  - an abandoned tool is never actually cancelled.
- **Unstick only frees what the serving isolate can see.** A turn stuck in a different isolate is freed by that isolate's own deadline.
- **Dev needs a refresh to show this.** The local server picks up `TURN_DIAGNOSTICS` on restart, and the browser-side wording change reaches the dev environment only after `bin/deploy --env dev`.

<!-- xgd-chat-end -->