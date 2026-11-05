---
uid: comment-9a3b903e
id: COMMENT-7389
type: comment
title: Comment on bug BUG-334
created_by: xgd
created_at: '2026-11-04T00:18:10.012816+00:00'
updated_at: '2026-11-04T00:24:54.849143+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-869caac5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0d483918-6fd6-4185-85ab-aad712e15e0a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d6e16901-6289-48bb-919a-37346d72bc0f-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T00:16:56.534255+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d6e16901-6289-48bb-919a-37346d72bc0f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T00:24:50.985123+00:00" -->
#### Claude
Reading `ps.ts` and the existing dev test suite before designing the fix.

Worktree ready. Now editing `devDown` / `devRestart` in the worktree.

Now the UATs. Checking the dev port band and which ranges sibling suites use.

Missing package links in the worktree (environment, not the change). Linking the rest and re-running.

All 61 pass, including the 4 new UATs. Typechecking and checking the tree before committing.

Typecheck errors are pre-existing in unrelated files; none in `dev.ts`. Checking the version-bump gotcha in memory, then committing.

Lock held. Merging xgd-working into the branch, bumping the version there, then fast-forwarding.

Memory says to use the CLI verb instead of the printed path.

Now syncing the ticket body: keeping the existing text and adding what landed.

A bare `bin/dev restart` now replaces this checkout's running service even when no pidfile names it. BUG-334 is at `free_coded` and merged into xgd-working as `2f0d9bc8` (the fix) and `556e3444` (version bump to 0.2.750). The branch is cleaned up.

**What changed in `tools/generate/src/cli/dev.ts`:**
- **`bin/dev down`** now checks every selected service's port, with or without service names and with or without a pidfile. It can no longer say "down" while one of this checkout's processes is still answering. It still doesn't stop that process itself; that stays the job of `restart` or `reap`.
- **`bin/dev restart`** sends SIGTERM to this checkout's process on each selected port when no pidfile names it, then starts a fresh one and writes its pidfile.
- **When restart won't act:** if a port won't free, it exits non-zero, names the port and process, and starts nothing. If the listener on a port isn't this checkout's, it refuses, names it, and leaves it running.
- **The deploy's restart step** (`devRefresh`) now tells you to run `bin/dev restart <service>` for a service it didn't start, instead of `reap` then `up`.

**One choice to check:** I took "this checkout" to mean a process started from this directory only. `reap`'s rule also counts `.xgd` worktrees of this repo as ours. Restart treats a worktree's server as someone else's, because it belongs to another session, so it refuses rather than killing it. Say if you want it to match `reap` instead.

**Tests:** four new tests in `tests/test_UAT_FC_BUG-334_restart_replaces_an_orphan.test.ts`, matching the ticket's test plan. They use real processes, real `lsof` and real signals. All 61 tests across the six `bin/dev` suites pass. One older BUG-147 test assumed a bare `down` skips the port check; only its comment needed changing, and its assertions still hold. The TypeScript check shows two errors, both in other files (`material-import.ts` and `zip-reader.ts`); `dev.ts` has none.

**Process notes:**
- `xgd branch cut` failed in the sandbox on `core.hooksPath`, so I attached the worktree by hand.
- The ticket rematerialize step was a no-op: 0 candidates.
- I added a "What landed" section to the ticket body and kept your original text.

<!-- xgd-chat-end -->