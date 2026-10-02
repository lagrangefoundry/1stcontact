---
uid: bug-fc895c95
id: BUG-177
type: bug
title: 'Debug tab: each agent''s own session never refreshes while the room runs'
created_by: EPIC-19
created_at: '2026-10-02T04:42:57.214526+00:00'
updated_at: '2026-10-02T04:42:57.214526+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Symptom
With group chat switched on, the Debug tab's **"Each agent's own session"** section doesn't show the consultant's or the coordinator's chat as the room runs. It shows whatever it read when the tab was drawn, often "Nothing yet.", and never changes.

## Root cause
`drawPrivate()` (`apps/control-app/src/builder/debug.js`) is a one-shot read of `POST /api/ai/private`. It runs only on `setBusiness`, on `setSite`, and when the group-chat switch is flipped. Nothing calls it when an exchange runs, when a member posts, or when a member's turn ends. So the section shows a snapshot taken before any agent had said anything, and it stays that way until the operator changes business or site.

Also check, during the fix, that `privateSessions` reads both members by their current session ids after REQ-358's rename (`site-<site>` and `coordinator-<site>`). A member read under the old `assistant-<site>` id would also show "Nothing yet." for ever.

## Fix
The private-session view follows the room. It is redrawn:
- when a member's turn ends during an exchange (the `member_done` event the exchange stream already carries, REQ-357), and when the exchange's final `done` arrives;
- when the Debug tab is shown, so returning to the tab after an exchange shows the current sessions.

A redraw keeps the reader's place: a member section the operator has expanded stays expanded. It is read-only, as now.

No polling. The exchange stream already says when something changed.

## Test plan
`test_UAT_FC_<this>_*`:
- (panel) With the switch on and a site open, a `member_done` or final `done` on the exchange stream makes the Debug pane read the private sessions again and draw the new turns.
- (panel) Showing the Debug tab redraws the private sessions.
- (workers) After one exchange in which both members post, `/api/ai/private` answers both members, by their current session ids, each with at least one turn.
