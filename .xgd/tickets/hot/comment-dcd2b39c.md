---
uid: comment-dcd2b39c
id: COMMENT-4652
type: comment
title: Comment on bug BUG-176
created_by: xgd
created_at: '2026-10-02T05:31:05.749210+00:00'
updated_at: '2026-10-02T05:51:07.585335+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9c8a3c80
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9cf6fc6e-0043-45b6-88d4-50748583482b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f11893e0-6ab4-4bfc-a562-5a6f98637f7f-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T05:28:19.247598+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f11893e0-6ab4-4bfc-a562-5a6f98637f7f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T05:51:06.831698+00:00" -->
#### Claude
I'm reading `openRoom` in `host-core.ts` and the junction Durable Object to map out the fix. After that I'll cut the branch.

I'm checking what the framework provides for removing a junction (the `SessionLog` and manager APIs) so the fix reuses it and doesn't add new code.

I'm checking how the upstream archive's `homeRef`/`apply` treats an archived ticket. That tells me whether an orphan junction can be discarded safely through the framework's own `closeSession`.

I'm checking whether any other code path archives chat tickets, then I'll write the follow-up migration.

The scope is clear and the ticket body already covers it. I'm setting the ticket to `free_coding` and cutting the branch.

Now the follow-up migration `0025`.

The migration is written. Next, `openRoom`: discard an orphaned room junction, and bring the roster of a reopened room up to date.

Now point 3 of the fix: the only other code path that archives a chat ticket is `chat-copy.ts`'s stray row. I'm recording the junction decision there.

Next, the tests. They go into the existing REQ-357 workers file so they can reuse its route, junction and model-double helpers. Checking the ticket-store API for archiving and reading comments:

Now the tests. They replace the REQ-358 "recreated" case, because this ticket supersedes that behaviour.

Running the workers suite from the worktree:

All 11 pass. To confirm the new tests actually catch the bug, I'm reverting the `host-core.ts` fix and rerunning them:

Both projects typecheck clean. Running the neighbouring REQ-357/358 suites and the chat-copy suites:

Everything is green. Before committing I'm reading my notes on the version-gate flow for this repo:

Ticket updated. Committing on the branch:

Committed. Taking the merge lock and merging into `xgd-working`:

The merge was clean. I'm checking that no other session landed its own `0025` migration in the meantime:

BUG-176 is fixed and merged into `xgd-working`, and the ticket is at `free_coded`. The new tests and the neighbouring group-chat suites pass, and both projects typecheck clean.

**What changed**
- **Retired rooms come back (`db/migrations/0025_restore_retired_rooms.sql`).** 0024 has already been applied, so it can't be edited. The new migration restores every room 0024 archived, along with its transcript, and removes the retired `assistant-<site>` member from its roster. It skips any room that already has a live replacement under the same `room-<site>` id, and running it twice changes nothing. The old `assistant-<site>` sessions stay retired.
- **Members change, the room stays (`openRoom` in `host-core.ts`).** When a room is reopened, its members are set to exactly the consultant and the coordinator, using the framework's own `group.add` and `group.remove`. The ticket, junction and history are kept. This is also how the coordinator joins a restored room, since its chat ticket may not exist yet when the migration runs.
- **Leftover room junctions are cleared.** If no live room ticket exists but a `room-<site>` junction does, `openRoom` deletes that junction and creates the room fresh. This only ever touches the room's session id, never `site-<site>` or `coordinator-<site>`. It deletes the junction directly rather than calling the framework's `closeSession` first, because that would save to the archive and create a room ticket with no members.
- **The other archive path keeps its junction on purpose.** The only other place that archives a chat ticket is the stray row in `chat-copy.ts`. Its junction belongs to the source business's live conversation, so I left it alone and added a comment saying why. No framework change was needed.

**Tests:** three `test_UAT_FC_BUG-176_*` cases, added to `tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts` to reuse its helpers:
- a room whose member is replaced keeps its ticket and contributions;
- an archived room whose junction survives is created again;
- a business with no room gets one built around its existing conversation.

Where it applies, each test checks that the consultant's transcript is byte-for-byte unchanged. With the `host-core.ts` change reverted, the first two fail with the exact "already has a junction" error from the ticket.

**Decision for you:** this replaces REQ-358's "a room opened before the rename is recreated" behaviour. I removed that test, and the ticket body says so explicitly so reconcile doesn't restore it.

**For the dev store:** run your usual deploy so migration 0025 is applied. That restores the two archived rooms, so you don't need the manual Durable Object deletion described in the ticket. If you already deleted that file, the restored room will open without its junction, which should rebuild it from the archive. I haven't tested that case.

Commits: `677c8d7` for the fix and `8ac8c93` for the automatic version bump. The branch and worktree have been cleaned up.

<!-- xgd-chat-end -->