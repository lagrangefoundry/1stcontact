---
uid: request-1f0b2ce5
id: REQ-358
type: request
title: 'Group chat: the second agent is the coordinator, and both agents are pointed
  at DOC-64'
created_by: EPIC-19
created_at: '2026-10-02T01:04:30.865457+00:00'
updated_at: '2026-10-02T03:05:30.547123+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8fb60143
  commits:
  - working_sha: 66a61f2c90a9e3f4ee84cfba704fdcbe27209990
    reconcile_sha: null
    main_sha: null
  - working_sha: 0bc6d57fc165fe7b9117a3aaa788e7226d15cc6c
    reconcile_sha: null
    main_sha: null
  version: 0.2.435
---

## What changes

The second agent in the group chat is the **coordinator**. Both agents are pointed at **DOC-64**, the document that describes their roles and how a build runs, and they can actually find it.

### 1. One word for the role: `coordinator`
Operator decision (2026-10-01): the second agent's role is `coordinator`, not `assistant`. DOC-64, `plan-surface.json` and `plan-seed.json` already say "coordinator". REQ-357 shipped with `assistant`.
- REQ-357's role key, backend entry (`claude_assistant` → `claude_coordinator`), priming keys (`assistant_priming` / `assistant_reminders`), `instances.json` grant, `group-chat.json` names entry, spend role, the `deps.assistantSurfaces` seam and the member session id (`assistant-<site>` → `coordinator-<site>`) are all renamed.
- **The wire role is not renamed.** The chat transcript's `user`/`assistant` roles, which every chat panel and many UATs depend on, are a different thing and stay as they are. Leaving the agent on `assistant` overloaded that word, which is a second reason for the change.
- Priming and surface text say "the coordinator" and "the consultant". It never says "your assistant".
- Any `assistant-<site>` session or chat ticket already created in a dev store is either re-keyed or recreated. A coordinator that silently starts a fresh session beside an orphaned one would repeat BUG-116.

### 2. The code names stay out of the agents' text
"Alice" and "Bob" are working names only (see REQ-357 §Names). DOC-64 uses them about 50 times, including in its title.
- DOC-64 is rewritten to refer to **the consultant** and **the coordinator**. Its substance is unchanged.
- The display names stay in `group-chat.json`, the one place they live.
- REQ-357's existing test, which fails if a code name appears in code, priming or tool descriptions, is extended to cover the shipped system knowledge-base documents.

### 3. Both roles are told to read DOC-64
- The consultant's priming and the coordinator's priming both name DOC-64 as the document to read before the first turn of a group-chat build.
- This is the Finding 13 lesson. DOC-33 was indexed and never read in 102 turns, because nothing named it and the primed map didn't mention it.

### 4. The system landscape is regenerated
- `kb/system/awareness.md` (the map primed every turn) dates from 2026-09-28 and lists 12 documents. It mentions neither DOC-63 nor DOC-64, and the copy bundled into the Worker's `generated/kb.js` is just as old. The 2026-10-01 knowledge-base rebuild refreshed the index and chunks but not the landscape, even though the file says it is "recycled on every rebuild".
- The landscape is regenerated so that DOC-63 and DOC-64 appear on it. Its territory description must name what DOC-64 is about (the two roles, the plan, how a build runs), so that a search for "how does a build run" or "what does the coordinator do" finds it.
- Find out why the rebuild skipped the landscape. If it is a missing token or skipped step, say so in the build output rather than leaving a stale map in place silently.

## Why free-coded
Small and well bounded. It reconciles vocabulary that has to be settled before REQ-357 is used, and it makes the role document reachable. Context: EPIC-19 (the 2026-10-01 discussion), DOC-62, DOC-64, REQ-356 (the plan), REQ-357 (the room).

## Test plan
- Extend `test_UAT_FC_REQ-357_*` where it pins role names (the tool list, the spend role, the session id), or add `test_UAT_FC_<this>_*`: the coordinator's tool list, backend and session id use `coordinator`; the transcript still uses the `assistant` wire role.
- A UAT that both roles' assembled priming names DOC-64.
- A UAT that no shipped `kb/system` document and no priming or surface text contains the display code names.
- A UAT that the shipped system landscape lists every `kb/system` DOC that is indexed, so a document can no longer be indexed while missing from the map.

## What landed

### 1. `coordinator`
- Role key `COORDINATOR_ROLE = 'coordinator'`; backend `claude_coordinator` (backends.json); priming keys `coordinator_priming` / `coordinator_reminders`, entry `coordinator-role`, manual provider `coordinator.manual`; `instances.json` grant `coordinator`; `group-chat.json` names key `coordinator`; `deps.coordinatorSurfaces`; member session `coordinator-<site>`, backend registered as `claude_coordinator+site:<site>`. The spend role recorded in `turn_spend` is `coordinator`, and the Debug tab's private-session entry carries role `coordinator`.
- The transcript wire role is unchanged: room posts by either agent still arrive as `assistant`, the client's as `user`.
- Text: the consultant's `group-room` template says "the coordinator", never "your assistant"; the builder chat panel's empty-room line reads "the consultant and the coordinator are both here"; the Debug tab's group-chat hint names the coordinator.
- **Existing rooms are recreated, not re-keyed** — migration `0024_retire_assistant_sessions.sql`. It archives every `chat` ticket homed as `assistant-<site>`, every room whose roster lists one, and the transcript comments of both. The next open finds no room and creates one with the consultant's existing conversation (untouched) and a fresh `coordinator-<site>`. Re-keying was rejected: the member's record stream lives in a junction Durable Object keyed by the OLD session id, which SQL cannot move, so a re-keyed session would resume against an empty junction. Without the migration, a pre-rename room does not open at all (verified). Archived, not deleted; idempotent. The local dev D1 held two such rooms.

### 2. Code names
- DOC-64 rewritten (title and body) to "the consultant" / "the coordinator"; substance unchanged. Its title is now "The consultant and the coordinator: roles, the plan, the decisions, and how a build runs".
- REQ-357's names test now also reads every `system_kb` doc ticket through the ticketing API and fails on a display name. DOC-56 (the served-font catalogue) is exempt: "Alice" is a typeface there, the same reason `platform-fonts.json` is exempt from the source scan.

### 3. DOC-64 named in both primings
- The consultant's `group-room` template (rendered only when the business runs a group chat) and the coordinator's role text both say: read DOC-64 in your knowledge base before your first turn in the room.
- **This narrows BUG-65.** BUG-65 forbade any document id in priming text; REQ-358 deliberately names one. BUG-65's UAT now leaves the group-chat-only `group-room` template out of its "names no document" scan, so everything a session is sent without a group chat still names no document. BUG-65's actual concern (an id that leaves the corpus and is still named) is held by a new UAT: every `DOC-n` anywhere in priming.json must be a `system_kb` member.

### 4. The landscape
- **Why the 2026-10-01 rebuild skipped the map:** `buildKb` writes the document index, then the chunk index, then the map. The map is the only step after the index is already on disk, and it needs the describer (the Claude Code CLI when no `ANTHROPIC_API_KEY` is set). When that step failed, the index was current, so every later `1c kb ensure` said "nothing to build" and `1c assets` inlined the old map, because nothing compared the map to anything.
- The map now records what it was drawn over: its frontmatter carries `fields.covers` (uid → the version indexed). `kbSkew` has a fourth class, `unmapped`: corpus documents absent from the map or mapped at another version. `requireCoherentKb` refuses on it, so `1c kb ensure` rebuilds and `1c assets` will not inline a map that leaves an indexed document out. A map with no `covers` (any map built before this) covers nothing and is refused.
- A failure in the map step is now named: "The index and the chunk index were rebuilt, but the awareness map was NOT: …", along with what that means and who writes the map.
- The landscape is regenerated with `bin/kb-release` once this lands.

## Test plan (as implemented)
- `tests/test_UAT_FC_REQ-357_group_chat.workers.test.ts`: the REQ-357 cases now pin `coordinator-<site>` as the member session, `coordinator` as its spend and private-session role, `claude_coordinator`'s model, the coordinator's tool list and "You are the coordinator in a group chat"; the replay case still pins the `assistant` wire role. New: `test_UAT_FC_REQ-358_both_members_are_primed_to_read_doc_64_and_only_in_a_room` (both members' assembled priming names DOC-64; the consultant's does not when group chat is off; no "your assistant"); `test_UAT_FC_REQ-358_a_room_opened_before_the_rename_is_recreated_with_the_coordinator` (legacy rows + migration 0024 → one new room, consultant's ticket kept, second member `coordinator-<site>`, orphan not in the roster).
- `tests/test_UAT_FC_REQ-358_coordinator_and_doc_64.test.ts`: the role configured as `coordinator` in every config document with no `assistant` key left; both group-chat texts name DOC-64; every DOC id priming names is a `system_kb` member; a document indexed but left off the map is refused as UNMAPPED and a rebuild clears it; the shipped map (where `kb/system` is built) covers every indexed document including DOC-63 and DOC-64.
- `tests/test_UAT_FC_REQ-357_names_are_configuration.test.ts`: `test_UAT_FC_REQ-358_no_system_kb_document_spells_a_display_name`.
- Adjusted for the new contract: BUG-48 / REQ-158 fixtures draw the map over what they indexed; BUG-48 / BUG-156 skew literals carry `unmapped`; BUG-65's scan excludes the `group-room` template.


## Landscape regenerated (2026-10-01)
`bin/kb-release` ran with this code: 14 documents, 7 territories, written by claude_code; the map's `covers` lists every indexed document, DOC-63 and DOC-64 included. DOC-64 sits in "Builder AI roles, client consultation, and briefing delegated workers", whose description names the two roles, the plan and how a build runs, with **consultant and the coordinator** as a validated access point. `test_UAT_FC_REQ-358_the_shipped_map_covers_every_indexed_document` passes in the main checkout. The dev server (:8789) only picks this up, and only runs migration 0024, on `bin/deploy --env dev`.