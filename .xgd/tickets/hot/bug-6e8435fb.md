---
uid: bug-6e8435fb
id: BUG-224
type: bug
title: Client messages sent while a delegated builder is running never reach the consultant
  session
created_by: xgd
created_at: '2026-10-18T18:25:08.681855+00:00'
updated_at: '2026-10-18T19:45:15.727879+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-8f59f165
  commits:
  - working_sha: 8c67a88d6fee9b8cf30296dce3cc3555ff28a7cf
    reconcile_sha: null
    main_sha: null
  - working_sha: 4cb8d51d791e97b7d527ff243707f74f11607a2a
    reconcile_sha: null
    main_sha: null
  version: 0.2.536
---

## What happened
In a consultant session, the client typed several messages while the consultant was inside one long turn that made a chain of `Delegate` calls (builder role, four delegations in sequence, about 20 minutes in total). None of those messages ever reached the consultant: not between delegations, not at the end of the turn, and not in the next turn. `AgentHistory` shows no user turn between the client message that started the work and the consultant's final reply. The client only found out because the consultant never answered them, and had to paste the text again by hand.

## Expected
Either:
- messages typed during a running turn are delivered to the consultant between tool calls (best, so the consultant can react mid-run), or
- they are queued and delivered as the next user turn once the running turn ends.

They should never be dropped silently. If input is refused while a turn is running, the client should be told in the UI.

## Reproduce
1. Start a consultant turn that makes two or more sequential `Delegate` calls (each several minutes long).
2. While it runs, type and send one or more messages from the client UI.
3. When the turn ends, read `AgentHistory` for the session: the messages are missing, and the next turn's input does not contain them.

## Impact
High. The client feels ignored ("abandoned"), and design input given mid-build is lost. In this case it was reactions to a comparison site that changed the visual direction.



## Confirmed in the code (EPIC-19, 2026-10-18)

This is a known gap, not a regression. `apps/control-app/src/builder/chat.js:1098` says so: `webui-chat` routes a submit made while the consultant is working to its queue, and **this pane passes no queue transport**, so the text is shown as pending and then dropped. BUG-122 only made it recoverable as a draft on the next load. REQ-345, which would have delivered it, was abandoned in favour of the group room, and the client is not in the room on the one-to-one path. So on today's path a mid-turn message is lost every time.

**Fix, in two steps, both ours:**
1. **Queue transport (the floor).** Pass `webui-chat` a queue transport so queued messages run as the next turn once the current one ends. `webui-chat` already coalesces everything queued during a turn into one submission and keeps later arrivals for the round after. Nothing is ever dropped, and the pending bubble stays visible until delivered.
2. **Between tool calls (the goal).** lagrange-framework REQ-180's per-request signals channel has landed. Use it to tell the consultant, on her next tool call, that the client has written (a count and a cursor), and give her a way to read it, so she can acknowledge it mid-run. During a single long `Delegate` the message waits until that builder returns; that is acceptable.

The UI must say which happened: *"Sent — I'll see this when I finish the current step"* while it waits.

## What was built (free-coded, BUG-224)

Both steps landed, on the framework's own Interpose feature (lagrange-framework REQ-200/201) rather than a new channel. It turned out there was no need for a "count and cursor" signal plus a read tool: the framework can put the message itself into the consultant's next request.

### Where it was actually being lost
- `webui-chat` already holds queued text and runs it as the next turn (framework BUG-64), but only in page memory. A long turn whose stream drops gets repainted (BUG-123 chase) or reloaded, and the queue goes with it.
- The framework's between-call delivery was never switched on for us. The consultant's and settings backends are registered under our own names with no capabilities, so the session manager never offered a round the interposed messages.
- On the Worker a session junction is mirrored per isolate, so a message posted by a second request cannot just be appended to the junction. The isolate running the turn would never see it.

### Behaviour now
- **While a turn runs, ▶ / Enter interposes** (`turnModes: {interpose: true}`). Queue stays on the hold menu. The message goes to `POST /api/ai/interpose {sessionId, text}`, which keeps it in the session's **inbox** (field `client_inbox` on the session's `chat` ticket, written by compare-and-set) and answers `{messageId}`. It refuses an unknown session (404), empty text (400) and over-long text (400, same sentence as `/api/ai/prompt`).
- **The running turn takes the inbox after every tool event**, in the isolate running the turn, and hands each message to `manager.interpose`. The tool loop reads interpositions when it builds the next request, so the message is in **the consultant's very next model call**. The turn's stream carries an `interposition` frame and the transcript records it inside the round. During a single long `Delegate` the message waits until that builder returns.
- To make that possible, the site (consultant) and business (settings) backends are now registered with **`injectBetweenCalls` only**. All other capabilities stay off.
- **A message that misses every call** (it arrived during the final answer, or the turn has no tool calls) **is not dropped**. It stays in the inbox, and `/api/ai/session` reports it as `waiting: [{id, text, at}]`. The panel runs it as the next prompt with `fromMessages: [id]`. The prompt route retires the named ids, and any waiting message with the same text, before the turn, so it reaches the model **exactly once**.
- **The panel**:
  - shows a message sent mid-turn as a pending bubble captioned *"Sent — I'll see this when I finish the current step"*, which turns solid when the `interposition` frame arrives;
  - if the origin refuses the interpose, holds the message and runs it as the next turn, so nothing is lost;
  - on load or repaint, adopts `waiting` messages: re-shown as pending if a turn is live (not re-posted), or run at once as **one** turn naming their ids if no turn is running. Waiting messages are not offered back as "unsent" (BUG-122 reconcile counts them as accounted for).
- Stale comments that said this pane had no queue transport were corrected, and the dead `onInterject` option was removed (upstream deleted Interject).

### Known limits (not addressed)
- A message taken from the inbox into the junction whose round then stops without another model call (Stop, budget) stays pending in the junction. If the page is still open, the panel runs it as the next turn; if the page is gone, it is not re-offered.
- The Node `1c builder` host has no interpose route, so there the panel's interpose is refused and the message runs as the next turn.
- The group-room path is unchanged.
- Two tabs open on an idle conversation with waiting messages could both run them.

## Test plan
- `tests/test_UAT_FC_BUG-224_a_message_sent_mid_turn_reaches_the_consultant.workers.test.ts` (real routes, manager, junction, D1; scripted model only):
  - a message posted during the first model call is absent from that request and present in the next, with one `interposition` frame, recorded in the transcript, and nothing left waiting;
  - a message that misses every call is reported as `waiting` by id and, sent back with `fromMessages`, reaches the next request exactly once with no `interposition`;
  - interpose refuses an unknown session (404) and empty text (400).
- `tests/test_UAT_FC_BUG-224_the_panel_hands_mid_turn_messages_to_the_origin.test.ts` (jsdom, installed `webui-chat`, transport stubbed):
  - a mid-turn send goes to `interpose`, not a new turn, shows pending, and goes solid on the `interposition` frame;
  - a refused interpose runs as the next turn;
  - waiting messages with no turn running run at once as one turn naming both ids, with no "unsent" note.
- Regression: every suite that drives `/api/ai/prompt` or the builder pane (101 files). The only failures also fail on clean `xgd-working` (REQ-208 vendor, REQ-295, REQ-342, the reconciliation conversation and pane suites), or come from the worktree having no `dist-assets` (builder-workspace-origin).