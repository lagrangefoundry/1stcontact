---
uid: request-1f0b2ce5
id: REQ-358
type: request
title: 'Group chat: the second agent is the coordinator, and both agents are pointed
  at DOC-64'
created_by: EPIC-19
created_at: '2026-10-02T01:04:30.865457+00:00'
updated_at: '2026-10-02T01:25:36.011178+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8fb60143
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