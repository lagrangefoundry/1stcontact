---
uid: bug-fc895c95
id: BUG-177
type: bug
title: 'Debug tab: each agent''s own session never refreshes while the room runs'
created_by: EPIC-19
created_at: '2026-10-02T04:42:57.214526+00:00'
updated_at: '2026-10-02T15:20:35.991527+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: medium
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fe478739
---

## Symptom
With group chat switched on, the Debug tab's **"Each agent's own session"** section doesn't show the consultant's or the coordinator's chat as the room runs. It shows whatever it read when the tab was drawn, often "Nothing yet.", and never changes.

## Root cause
`drawPrivate()` (`apps/control-app/src/builder/debug.js`) is a one-shot read of `POST /api/ai/private`. It runs only on `setBusiness`, on `setSite`, and when the group-chat switch is flipped. Nothing calls it when an exchange runs, when a member posts, or when a member's turn ends. So the section shows a snapshot taken before any agent had said anything, and it stays that way until the operator changes business or site.

The exchange stream does carry the signal — the host pushes `member_done` (tagged `meta.member`) at the end of each member's round, and a final `done` — but the chat pane's `roomFrames()` drops every member-tagged event and `createChatPanel` has no hook that tells its host the room moved. The Debug pane cannot see the chat at all.

Also checked: `privateSessions` reads both members by their current session ids after REQ-358's rename (`site-<site>` and `coordinator-<site>`); no `assistant-<site>` read remains. The existing REQ-357 UAT only proved the consultant's turns, never the coordinator's after an exchange.

## Fix
The private-session view follows the room. It is redrawn:
- when a member's turn ends during an exchange (the `member_done` event the exchange stream already carries, REQ-357), and when the exchange's final `done` arrives. The chat pane reports these to its host through a new `onRoomActivity` option (read off the stream in the same place `onSiteChanged` already is); the builder hands it to the Debug pane's new `refreshPrivate()`;
- when the Debug tab is shown (the shell's existing `onTabChange`), so returning to the tab after an exchange shows the current sessions.

A redraw keeps the reader's place: each member section keeps the open/closed state the operator left it in (a collapsed one stays collapsed, an expanded one stays expanded; a member seen for the first time starts open), and the section's scroll position is kept. It is read-only, as now. A redraw answer that arrives after the business has changed is dropped, as now.

No polling. The exchange stream already says when something changed.

Out of scope: a member's text while it is still being written (the view updates when each turn ends and is stored), and following an exchange that was already running when the page loaded (the room has no reattach yet; showing the tab still redraws).

## Test plan
`test_UAT_FC_BUG-177_*`:
- (panel) With the switch on and a site open, a `member_done` or final `done` on the exchange stream makes the Debug pane read the private sessions again and draw the new turns.
- (panel) Showing the Debug tab redraws the private sessions.
- (panel) A member section the operator collapsed stays collapsed across a redraw.
- (workers) After one exchange in which both members post, `/api/ai/private` answers both members, by their current session ids, each with at least one turn.