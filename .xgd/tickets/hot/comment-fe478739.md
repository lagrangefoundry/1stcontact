---
uid: comment-fe478739
id: COMMENT-4653
type: comment
title: Comment on bug BUG-177
created_by: xgd
created_at: '2026-10-02T05:32:05.816140+00:00'
updated_at: '2026-10-02T05:38:23.097958+00:00'
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

<!-- xgd-chat-end -->