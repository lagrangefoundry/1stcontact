---
uid: bug-9c8a3c80
id: BUG-176
type: bug
title: 'Group chat: a retired room''s surviving junction blocks the room from ever
  being created again'
created_by: EPIC-19
created_at: '2026-10-02T04:42:49.806091+00:00'
updated_at: '2026-10-02T05:49:33.981486+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dcd2b39c
  story_points: 3
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


## What landed
- **`db/migrations/0025_restore_retired_rooms.sql`** (0024 is applied and immutable, so this is a follow-up rather than an edit). It un-archives every room that 0024 archived because its roster named an `assistant-<site>` session, together with the transcript comments 0024 archived with it, and drops the retired member from the roster. Guards: it only restores a room that has **no live successor** under the same `room-<site>` session id, so a session never ends up with two homes. It only restores comments archived at or up to 60s before their room's archive moment, which leaves a chat copy's surplus comments archived. Idempotent. The `assistant-<site>` sessions, their transcripts and their junctions stay retired. Their junctions are kept deliberately: nothing ever opens that id again.
- **`openRoom` (`host-core.ts`) keeps a reopened room's roster at exactly [consultant, coordinator]** through the framework's own `group.remove`/`group.add` (`keepRoster`). That is how a replaced member gives way without the room being retired, and it is where the coordinator joins a room restored by 0025. The coordinator's chat ticket may not exist until it first drains, which SQL cannot do.
- **`openRoom` discards an orphan room junction** (`discardOrphanRoomJunction`) when no live ticket homes `room-<site>` and a junction exists, then creates the room afresh. It is called only with `roomSessionIdFor(slug)`, never with `site-<site>` or `coordinator-<site>`. It deletes the log directly (`SessionLog.delete`) and only then calls `manager.closeSession` to drop cached state. Calling `closeSession` first would drain to the archive, which would mint a memberless chat ticket for the room.
- **Junction decision recorded at the only other chat-archive path**: `chat-copy.ts`'s stray row. Its junction is kept deliberately, because it is keyed by the *source* business's session id, which is still live there. No upstream framework change was needed.

## Supersedes
REQ-358's "a room opened before the rename is recreated with the coordinator" (test `test_UAT_FC_REQ-358_a_room_opened_before_the_rename_is_recreated_with_the_coordinator`, removed). A room whose member is replaced is now **kept**, with the same ticket uid and its contributions, and only its roster changes.

## UATs (in `tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts`; real route, D1, ticket store, junction DO)
- `test_UAT_FC_BUG-176_a_room_whose_member_is_replaced_keeps_its_ticket_and_contributions`: a real room with contributions has its roster pointed at a legacy `assistant-<site>` ticket. Migrations 0024 then 0025 are run. On reopen it is the same room uid, the roster is [site, coordinator], the contributions are in the turns, and the consultant transcript is byte-identical.
- `test_UAT_FC_BUG-176_an_archived_room_whose_junction_survives_is_created_afresh`: the room ticket is archived while its junction survives. Reopening yields one new room with both members, and the consultant transcript is byte-identical.
- `test_UAT_FC_BUG-176_a_business_with_no_room_opens_one_around_its_existing_conversation`: a legacy business with no room gets a room whose consultant member is its existing conversation, with the transcript intact.
The first two fail without the `host-core.ts` change, with exactly the symptom's "already has a junction" error.
