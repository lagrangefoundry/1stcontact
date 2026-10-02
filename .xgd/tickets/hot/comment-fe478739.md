---
uid: comment-fe478739
id: COMMENT-4653
type: comment
title: Comment on bug BUG-177
created_by: xgd
created_at: '2026-10-02T05:32:05.816140+00:00'
updated_at: '2026-10-02T15:27:22.527000+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fc895c95
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2a5525e1-6700-49d4-a002-abda962fe28b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="93494c3c-7fa2-4c9b-bb09-9cc00b81d8ec-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T05:29:15.590343+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="93494c3c-7fa2-4c9b-bb09-9cc00b81d8ec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T05:38:20.861182+00:00" -->
#### Claude
Confirmed the panel side; now tracing the host wiring and the server's `privateSessions`.

Reading how the chat pane translates the room's exchange stream — that's where `member_done` would have to surface.

I've finished the investigation and made no changes. The ticket's diagnosis is right, but the fix needs two pieces of wiring the ticket doesn't mention.

## The cause (confirmed)

`drawPrivate()` in `apps/control-app/src/builder/debug.js:334` reads `/api/ai/private` once and is only called from three places:
- `drawGroup()` (line 330), which runs on `setBusiness` and when the group-chat switch is flipped (line 326);
- `setSite()` (line 406), which `app.js:1422` calls from `showSite`.

Nothing calls it while an exchange is running, so the section keeps whatever it read before anyone spoke.

## Session ids are fine

- The consultant is read as `sessionIdFor(slug)`, which returns `site-<site>` (`host-core.ts:903`).
- The coordinator is read as `coordinatorSessionIdFor(slug)`, which returns `coordinator-<site>` (`group-core.ts:72`).
- No `assistant-<site>` id appears anywhere in `tools/generate/src/cli/ai` or `apps/control-app/src`.

One gap in the evidence: the existing REQ-357 workers test (`tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts:285`) only checks the consultant's turns. It never checks that the coordinator's session has turns after an exchange. The ticket's third test closes that gap.

## What the fix has to wire

**1. The `member_done` event never reaches the app.**
- The server sends it at `host-core.ts:3661`, tagged with `meta.member`.
- On the client, `roomFrames()` (`chat.js:163`) drops every event that carries `meta.member`, including `member_done`.
- `createChatPanel` has no callback for room activity, and the Debug panel can't see the chat at all.

The natural place to catch it is `watchForWrites`, which already sits in front of `roomFrames` on the room stream (`chat.js:817`) and already turns events into callbacks like `onSiteChanged`. My proposal:
- add an `onRoomActivity` option to `createChatPanel`, fired on `member_done` and on the exchange's final `done`;
- in `app.js`, connect it to a new `debug.refreshPrivate()`, which is just `drawPrivate()` made public.

The panel already throws away out-of-date answers, so overlapping refreshes are safe.

**2. The Debug tab isn't refreshed when it's shown.** The shell already reports tab switches through `onTabChange` (`app.js:301`). Adding `if (tabId === DEBUG_TAB.id) debug.refreshPrivate()` there covers it.

## Two corrections to the ticket's wording

- **Collapsed sections, not expanded ones.** `memberSession()` always creates each member's section open (`block.open = true`). The real problem is that a redraw would re-open a section the operator had collapsed. The fix should remember each member's open/closed state, and the ticket should say "keeps each member section's open/closed state".
- **Scroll position.** `privateBody.replaceChildren(...)` throws away the reader's scroll position inside a long session. I'd treat "keeps the reader's place" as including scroll position and restore it after the redraw.

## Limits worth stating in the ticket

- **Finished turns only.** The view updates when each member's turn ends. Text a member is still writing isn't shown, because it only becomes readable once the turn is saved.
- **Reloads during an exchange.** The room has no way to rejoin an exchange already in progress (`roomFrames` is only used for new messages), so a page reloaded mid-exchange won't follow it. Refreshing when the tab is shown softens this, and I'd keep it out of scope.

## Proposed tests

- **Panel:** the Debug pane reads the private sessions again on `member_done` and on the final `done`; it also reads them again when the Debug tab is shown; and a collapsed member section stays collapsed after a redraw.
- **Workers:** after one exchange in which both members post, `/api/ai/private` returns `site-<site>` and `coordinator-<site>`, each with at least one turn.

If you agree, I'll update the ticket's Fix and Test plan sections along these lines, keeping its existing text, and then start the change on its own branch.

<!-- xgd-turn id="3b5b48d7-7f9f-44b8-b809-ca05b7b1c551-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T15:19:56.650566+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3b5b48d7-7f9f-44b8-b809-ca05b7b1c551-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T15:27:21.149817+00:00" -->
#### Claude
Code is in place across chat.js, debug.js and app.js; checking an initialization-order hazard in the tab hook.

Writing the UATs now, driving the real builder with mocked transports.

Passing. Confirming the new tests actually fail without the fix:

Red without the fix, green with it. Now the workers-side UAT; reading the REQ-357 workers harness.

Known fresh-worktree gap: the generated ticketing build artifact. Copying it from the main checkout (it's gitignored).

All 12 pass, the new one included. Running the neighbouring builder suites that import chat.js / debug.js:

One failure, BUG-64 queue gating — my memory notes it as a known upstream regression. Confirming it fails without my change too:

Pre-existing, unrelated. Lint check, then commit.

No lint script in this repo. Following my noted promotion recipe: merge xgd-working into the branch first, bump there, commit, then fast-forward back.

The gate printed a version warning; checking what it said and that the status stuck.

Landed and recorded. Tearing down the branch:

BUG-177 is fixed: the Debug tab's "Each agent's own session" now updates as the room runs. It's committed as `dde461d783` (version 0.2.439) and merged into xgd-working. The ticket is at `free_coded`, 2 story points; promoting it to `ready_to_reconcile` is your call.

**What changed:**
- **Chat pane (`chat.js`):** a new `onRoomActivity` option fires each time a member's turn ends (`member_done`) and when the exchange's final `done` arrives. These events were already on the stream but were being dropped before the app saw them.
- **Debug pane (`debug.js`):** a new `refreshPrivate()` re-reads both members' sessions. A redraw keeps each member section open or collapsed as the reader left it; until now every section was redrawn open, which would have reopened anything you'd closed. Late answers after a business switch are still thrown away.
- **Builder (`app.js`):** connects `onRoomActivity` to `refreshPrivate()`, and also refreshes whenever the Debug tab is shown. There's no polling.

**Tests:** I added five `test_UAT_FC_BUG-177_*` tests, and each one is backed by wording in the ticket body.
- Four drive the real builder: the view updates mid-exchange after the consultant's turn, before the coordinator has spoken; it updates on the final `done`; it redraws when the Debug tab is shown; a collapsed section stays collapsed. All four fail without the fix and pass with it.
- One workers test, added to the REQ-357 workers file: after an exchange in which both members post, `/api/ai/private` returns `site-<site>` and `coordinator-<site>`, each with at least one turn. The session ids were already correct; the old test only checked the consultant.

**Regression check:** I ran the 19 test files that import `chat.js` or `debug.js`. 128 tests pass and one fails, `test_UAT_FC_BUG-64_a_genuinely_live_turn_still_gates_the_composer`. That one fails the same way with my change removed, so it isn't caused by this fix.

**Not covered, as the ticket now says:** a member's text while it's still being written doesn't appear until the turn ends. And a page reloaded mid-exchange won't follow that exchange, though showing the Debug tab still refreshes it.

I updated the ticket body to describe this design, keeping its original text. Gmail, Google Calendar and Google Drive need authorising in your claude.ai connector settings before they can be used here; none of them were needed for this.

<!-- xgd-chat-end -->