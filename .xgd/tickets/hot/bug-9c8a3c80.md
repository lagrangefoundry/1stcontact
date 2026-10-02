---
uid: bug-9c8a3c80
id: BUG-176
type: bug
title: 'Group chat: a retired room''s surviving junction blocks the room from ever
  being created again'
created_by: EPIC-19
created_at: '2026-10-02T04:42:49.806091+00:00'
updated_at: '2026-10-02T05:38:55.892724+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  severity: high
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dcd2b39c
---

## Symptom
After REQ-358 was deployed, opening the builder for a business whose group chat had been switched on fails with:

> session "room-site_2a2833c06700bc0896dbd380398c7f1e" already has a junction; it is not a new room

That site's group chat can never be created again, and nothing clears the condition.

## Root cause
REQ-358's migration `db/migrations/0024_retire_assistant_sessions.sql` retires the old `assistant-<site>` sessions. It archives the session's chat ticket **and every room that lists it as a member**. Local store, 2026-10-02T03:16:53Z: CHAT-3 (`assistant-…`) and CHAT-4 (`room-site_2a28…`) were both archived. Two rooms in total were archived.

The migration only touches D1. The room's **junction** lives in the `SessionJunction` Durable Object (REQ-307), keyed by session id, and it survives. A room's session id is fixed per site (`room-<site>`, `roomSessionIdFor`). So in `openRoom` (`host-core.ts`):
1. `archive.homeRef(roomSid)` skips the archived ticket and answers `''`.
2. That sends the code to `createGroup`, with the same `sessionId`.
3. `createGroup` (LF `group.js:989`) finds `log.exists()` and refuses, by design.

The general defect: **archiving a chat ticket leaves its junction behind**, and any session whose id is derived from the site, rather than minted fresh, collides with what's left. Rooms are the first sessions with fixed ids that we have ever archived.

## What must not be lost
The consultant's own session, `site-<site>`, is her whole conversation with the client. Nothing in this fix may discard, re-key or archive it. That applies to every business, including legacy businesses that have never had a room. Those have no `room-<site>` junction, so the ordinary `createGroup` path already works for them, and it must keep working unchanged, with the existing conversation becoming the consultant's member session.

## Fix
1. **Change a room's members instead of retiring the room.** When a member session is replaced (for example `assistant` → `coordinator`), the room keeps its ticket, its junction and its history; only `fields.members` changes to the replacement's chat ticket. Revise migration 0024, or add a follow-up migration, so it re-points the member rather than archiving the room. The two rooms already archived in a dev store are restored with the coordinator as their member.
2. **A room-session junction whose room ticket is archived is an orphan.** In `openRoom`, when no live room ticket is found but a `room-<site>` junction exists, discard that junction and create the room afresh rather than failing. This applies **only** to the room session. It never applies to `site-<site>` (the consultant's) or `coordinator-<site>`.
3. **Retiring a session clears or keeps its junction deliberately.** Any path that archives a session's chat ticket also decides, explicitly, what happens to the junction keyed by that session, so a later session under the same id cannot collide with it. If the right hook is in the framework's archive, file it upstream instead (a ticket there, no code).

## Immediate dev workaround (operator, server down)
Delete the leftover junction for the empty archived room. It held only a session header (the archived room's transcript is 218 bytes):
`apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/a0faa9884645cd2d05c8ac54b40f5a356b3e68aeb9c75eb6eb4a10ef5ae4d8b3.sqlite`

## Test plan
`test_UAT_FC_<this>_*` (workers project; real route, D1, ticket store, junction DO):
- A room whose member is replaced keeps its ticket and its contributions, and opens with the new member in its roster.
- A site whose room ticket is archived but whose room junction survives opens a new room, and the consultant's `site-<site>` transcript is byte-identical before and after.
- A business with a consultant conversation and no room opens a room whose consultant member is that conversation, with its transcript intact.