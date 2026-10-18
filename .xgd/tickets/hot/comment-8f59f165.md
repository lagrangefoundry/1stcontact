---
uid: comment-8f59f165
id: COMMENT-5490
type: comment
title: Comment on bug BUG-224
created_by: xgd
created_at: '2026-10-18T19:22:02.440566+00:00'
updated_at: '2026-10-18T19:45:38.096538+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-6e8435fb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8c0139b2-4f0b-4973-9180-c83fd8014895",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ec4fd43b-a13c-4302-a70a-4c6a485626ba-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T19:21:03.846588+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ec4fd43b-a13c-4302-a70a-4c6a485626ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T19:45:37.024260+00:00" -->
#### Claude
I'm reading BUG-224 and the `webui-chat` queue API before scoping the fix.

Upstream `webui-chat` already holds and replays queued text itself, so I'm now checking where 1stcontact loses it on a long, dropped stream.

I've found the client-side loss paths. Now I'm checking the server's prompt route and whether the framework's between-calls delivery (Interpose) is wired on the server.

Still tracing the server path. The prompt route calls a `streamPrompt` wrapper, and I'm finding out what it does when a turn is already running.

I'm checking the framework's per-call signals hook, since a second request can't reliably reach the running turn's in-memory junction on Workers.

I'm settling the design. The precedents are the chat ticket (`pending_turn`) as the shared store and the room's Stop, which a second request writes and the running isolate polls.

The design holds together. The remaining question is page reload: whether the panel API can re-show or re-send messages the server is still holding.

I have the design. Moving the ticket to `free_coding` and cutting the branch.

I'm reading the test harness so I can write a workers UAT that sends a message mid-turn and asserts it reaches the next model request.

Writing the server side now: the inbox port in `host-core.ts`, the route, and the Workers store.

Now the edits to `host-core.ts`: the port, memory implementation, `HostDeps` field, and `ChatSession.waiting`.

Server port is wired. Next is the Workers store on the chat ticket, with a version check like the room guard's.

Now the routes: `/api/ai/interpose` and `fromMessages` on `/api/ai/prompt`.

Server side is done; the Node `1c builder` host skips the interpose route and degrades to queueing. Now the client: `api.js` transport, then `chat.js`.

Client wiring is mostly in. I'm adding the reload-during-turn case: messages still waiting are shown as pending bubbles again.

Code is written. Now the UATs, starting with how the BUG-122 test drives `chat.js`.

Now the workers UAT.

I left an unused helper in that file; removing it.

Found it: the site backend is registered without capabilities, so the framework never offers it between-call delivery. Checking how the framework registers its own Claude API backend.

The workers UAT passes: a mid-turn message reaches the next model call, and a late one waits and then runs once. Checking whether the new capability changes any other existing path.

No other path passes signals, so nothing else changes. Now the panel UAT in jsdom.

The waiting-on-load test passes. The other two hang because `submitInput()` resolves only when the turn ends, so the test shouldn't await it.

The refusal case now passes. The last failure is in my test: `getMessages()` doesn't expose elements, so I'll query the DOM instead.

Both new suites pass. Next, the regression scope: every suite that drives the chat routes or the pane.

One failure in batch 1, `REQ-208 … never_learns_which_vendor_drew_the_image`. Checking whether it also fails on clean `xgd-working`.

Pre-existing on `xgd-working`, so not caused by this change. Running batch 2.

Memory notes REQ-295 as failing before this change. Checking REQ-295 and REQ-342 on clean `xgd-working`.

All five also fail on clean `xgd-working`, so none are caused by this change. Now the node-project (pane) suites.

47 node-project failures, and several look like builder socket suites, which memory says the sandbox blocks. Running the same list on clean `xgd-working` to compare.

Those are location artifacts (no `dist-assets` in the worktree). No regressions from this change. Now a typecheck.

Typecheck is clean. Reading my notes on the commit, version and promotion gates before committing.

Next I'll update the ticket body so every UAT traces to its wording, then commit, merge back and move the ticket to `free_coded`.

Ticket body updated. Committing explicit paths on the branch.

Committed `8c67a88`. Taking the merge lock and merging into `xgd-working`.

Merged; the commit is on `xgd-working`. Moving the ticket to `free_coded` and letting the gate bump the version itself.

I've built both steps of BUG-224. A message the client sends while the consultant is working now reaches her at her next tool call. If it arrives too late for that, it runs as the next turn. It is never silently dropped.

**Why messages were being lost:**
- The chat panel held mid-turn messages only in page memory. A 20-minute turn whose stream drops gets repainted or reloaded, and those messages went with it.
- The framework can already put a message into a running turn between tool calls (Interpose), but it was never switched on for us. Our consultant and settings backends declared no capabilities.
- On Workers, each isolate keeps its own copy of the session log. A message arriving in a second request couldn't reach the isolate running the turn.

**What changed:**
- **Sending mid-turn:** pressing ▶ or Enter while a turn runs now interposes. The message goes to a new route, `/api/ai/interpose`, which stores it on the session's chat ticket, a store every isolate shares. Queue is still on the hold menu.
- **Delivery:** after every tool event, the running turn picks up those messages and passes them to the framework's Interpose, so they are in the consultant's next model call. During a single long `Delegate`, the message waits until that builder returns. To allow this, both backends now declare between-call delivery and nothing else, so prompt caching and dialogue bounds are unchanged.
- **Late messages:** a message that misses every call stays stored. The session reports it as waiting, and it runs as the next prompt. The server makes sure it reaches the model exactly once.
- **Panel:** a pending message shows *"Sent — I'll see this when I finish the current step"* and turns solid when it is delivered. If the server refuses it, the panel runs it as the next turn. After a reload or repaint, waiting messages are shown again, or run straight away if no turn is running.

**Tests:**
- A new Workers UAT and a new panel UAT pass. They cover delivery into the next call, the exactly-once fallback, the route's refusals, and the panel's behaviour.
- I ran the 101 suites that drive the chat routes or the pane. Every failure either also fails on clean `xgd-working` (REQ-208, REQ-295, REQ-342, the reconciliation conversation and pane suites) or comes from the worktree having no `dist-assets`.
- Typecheck is clean.
- I haven't tried it in a deployed environment. Dev keeps serving its old snapshot until `bin/deploy --env dev` is run.

**Known limits, also written into the ticket:**
- If the client hits Stop (or the turn hits its budget) after a message was picked up but before the next call, and the page is gone, that message isn't offered again.
- The Node `1c builder` host has no interpose route, so there messages simply run as the next turn.
- The group room path is unchanged.
- Two tabs open on an idle conversation could both send its waiting messages.

BUG-224 is at `free_coded`. The commits are `8c67a88` plus the gate's version bump to 0.2.536, merged into `xgd-working`, and the branch is cleaned up. The ticket body describes what was built and the test plan, ready for you to promote to reconcile.

<!-- xgd-chat-end -->