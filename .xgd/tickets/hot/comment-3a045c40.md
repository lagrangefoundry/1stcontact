---
uid: comment-3a045c40
id: COMMENT-7798
type: comment
title: Comment on bug BUG-348
created_by: xgd
created_at: '2026-11-04T23:42:55.412139+00:00'
updated_at: '2026-11-05T00:03:58.934988+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f5e73b09
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a3d42cb3-c8a7-47f7-a812-f4c54c9c6279",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f0a9076d-4663-4945-b3cb-da04057f6a89-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T23:41:39.473785+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="f0a9076d-4663-4945-b3cb-da04057f6a89-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:03:58.095579+00:00" -->
#### Claude
I'm tracing how the builder panel follows a running turn, so I can find where a host-started turn gets missed.

Still mapping the code: the panel only rejoins a running turn at load or after a dropped stream, so I'm checking whether the tab's one update stream (`/api/changes`) can tell it a turn has started.

I'm finding where the server works out whether a turn is running (`live`), so the panel can be told when one starts.

I'm checking how the server reads the conversation's junction, to pick the cheapest way to tell an open panel a turn has started.

I'm reading the dev junction log for the incident, to see whether the panel's stream ended because the job ended or because the connection dropped.

Looking at the junction Durable Object's API, to see whether it can cheaply say "something new has been written since offset N".

Writing this up. Before code, I'm reading how the existing UATs drive the plan panel's status slot and the scripted host, so the new tests fit.

Still mapping the framework's session-log API, the last piece before I write code.

I have enough to start. Updating the ticket with the confirmed cause and the design, setting `free_coding`, then cutting the branch.

Worktree ready. Writing the host-core function first.

Now adding `awaitSessionTurn` to host-core, right after `tailSession`.

Now the route. Checking where the router imports `tailSession` from and how deps are typed.

Adding the client call to `api.js`.

Server half is done. Now the panel. Checking what `isBusy` covers in webui-chat before writing the wait loop.

`isBusy()` covers streaming, the status widget and talkers, which is what the loop needs. Now looking at the start of `paint` to place the hook.

Now writing the panel changes in `chat.js`: the transport default, the wait loop, and the hook in `paint`.

Code is in. Now the UATs, starting with how the REQ-431 test reaches the idle line.

Writing the jsdom panel UAT first.

All three pass. Checking they actually exercise the fix by disabling the panel hook and re-running.

Red without the fix, green with it. Now the origin UAT against the real worker. Reading the REQ-624 workers test for a minimal scripted prompt.

Writing the origin UAT against the real router: in-process runner, junction DO, D1 and R2, with only the model scripted.

Both UAT files pass. Now regressions: the adjacent panel suites, then type-check and lint.

Checking whether BUG-64 is red on a clean tree before blaming my change.

That transport has no `awaitTurn`, so my loop never starts in this test. Confirming it is red on clean xgd-working too.

Already red on clean xgd-working, so it's not this change. Now type-check and lint the changed files in the worktree.

No ESLint in this repo; type-checking with the local `tsc`.

Type-check: control-app is clean, and generate has the same two errors as baseline. Checking for route-inventory tests that list every `/api/ai/*` path.

Running the pane-rejoin reconciliation suite. It may use the default fetch-backed transport, where the new loop would make extra requests.

Committing the work on the branch, then running the merge-back loop.

Updating the ticket body's test plan with the final UAT names before merging back.

Now the merge-back loop: lock, merge xgd-working into the branch, bump the version, merge back, then move to `free_coded`.

Merged cleanly. Re-running the panel UAT on the merged tree before landing it.

It's at `free_coded` with both commits and version 0.2.768. Setting story points, then cleaning up the branch.

I've fixed BUG-348: an open builder panel now picks up a turn it didn't start (no reload needed) and shows its status, progress line, reply and Stop. The ticket is at `free_coded` with version 0.2.768, and the branch is merged into xgd-working and cleaned up.

**What actually happened in the incident.** The panel finds a running turn only when it loads, or when its own stream drops without a proper ending. In the dev junction log, the job was marked ended ("lost") at 22:04:25, but its runner kept going: it ran the 22:11 round after the builder pass, then the 6.5-minute AnimateImage, and was marked lost again at 22:18:51. The panel's stream ended at the first "lost" marker, and nothing ever told it about the work that carried on.

That false ending is BUG-343's area: only the runner should declare a job ended. BUG-343's fix landed at 12:27 PST, before this 14:04 PST incident, so it may still be leaking. I left it out of scope here; it's recorded on this ticket.

**The fix:**
- **New server route, `POST /api/ai/await-turn`.** It waits up to 45 seconds for the next turn to start in the conversation, whoever starts it. It reads only what's new in the conversation log every 1.5 seconds, never the whole log. The answer is either "started, rejoin from here" or "nothing yet, ask again from here".
- **Panel (`chat.js`).** While nothing is running, the panel keeps one wait open. That uses the conversation's own connection, which is free while idle, so a tab doesn't hold any extra connections. When a turn starts, the panel rejoins it the same way a reload does, so the "Nothing being built right now" line hides while the turn runs. This includes a long consultant tool like AnimateImage.

**Tests:**
- Panel tests (3, real chat panel and plan-panel status slot): the host starts a round and the panel shows its status, progress and reply with no reload; the idle line stays hidden through a slow tool until the round ends; Stop reaches the server. All three fail with the fix disabled.
- Server tests (3, real router with a scripted model): a turn started from another client is reported and replays its reply when rejoined; a job that's already running is answered at once; bad input gets 400 and an unknown conversation gets 404.
- Adjacent panel suites pass. These were already failing on clean xgd-working and aren't caused by this change: BUG-64's live-turn test, and pane-rejoin AC2092–2094. Type-check is clean apart from two existing errors.

**Two things to know:**
- A message sent from another tab is followed live, but its question bubble doesn't appear until the next reload. This is noted on the ticket.
- Dev still serves the old snapshot. You'll need `bin/deploy --env dev` to see the change there.

<!-- xgd-chat-end -->