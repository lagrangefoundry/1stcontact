---
uid: comment-fb6f8c8a
id: COMMENT-5801
type: comment
title: Comment on bug BUG-309
created_by: xgd
created_at: '2026-10-28T02:35:12.665981+00:00'
updated_at: '2026-10-28T02:51:42.997616+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ffc8d54d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7af0973a-4580-470d-a1d8-f205c1083de7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T02:35:05Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T02:35:05Z" -->
#### You
Build warnings: ACCESS_DEV_OPEN not on env.production.vars; Duplicate key note in plan-surface.json lines 35 and 41.

<!-- xgd-chat role="assistant" ts="2026-10-28T02:35:05Z" -->
#### Claude
ACCESS_DEV_OPEN is deliberate (REQ-145, pinned by a UAT). The duplicate note key is real: JSON keeps the last, so the plan-note meaning is lost from the consultant tool description. Ticket: one description covering both shapes or rename, plus a no-duplicate-keys check on every surface JSON.

<!-- xgd-turn id="7142660e-3c65-4789-80f7-bed775f68c95-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T02:39:03.902074+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7142660e-3c65-4789-80f7-bed775f68c95-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T02:51:40.636673+00:00" -->
#### Claude
I'm fixing the duplicate key and adding the guard test. Before editing, I'm taking the session lock.

I'm confirming where the story-board note result comes from, so the test pins both shapes the code actually emits.

Both shapes are confirmed (`plan-core.ts:3546` and `story-core.ts:713`). Now I'm writing the UAT.

Both tests pass. Now I'm running the nearby priming and tool-manual suites, since the description got longer.

The run found no test files, which matches the known long-filter quirk. I'm rerunning with short name stems.

Four failures in two suites. I'm checking whether they also fail without my change: I'll swap the old JSON in temporarily, without using git stash.

The same four fail on the old file too, so they're pre-existing. I'm bumping the version and committing.

I'm on the unbranched path, so I'll bump and commit only my two files plus the version file, then run the gate.

The ticket is at free_coded. Last steps: record the decision in the ticket, set story points, and release the session lock.

I've fixed BUG-309 and it's at `free_coded` (commit `23d2f71fa4`, version 0.2.692).

**The fix:** `plan-surface.json` now has a single `written.note` description covering both results: "the note: for a note added to the plan, its section and length; for a story-board note, the note as it now stands". I kept one key rather than renaming one. The two places that produce this result (`plan-core.ts:3546` and `story-core.ts:713`) are unchanged, so nothing that already reads `note` has to change.

**The guard:** a test rather than a check in the loader. The surface files are imported as JSON modules, so by the time any loader sees them they've already been parsed and the duplicate has already collapsed. `tests/test_UAT_FC_BUG-309_surface_json_keys.test.ts` reads the raw text of every `*-surface.json` in `tools/generate/src/cli/ai/` and fails on a duplicate key at any depth. It uses a small scanner written into the test, so there's no new dependency, and the test also checks the scanner catches a known duplicate. Both new tests pass.

**Other tests:** I ran 15 related suites. Four tests fail, in `REQ-416_worker_and_talker` and `REQ-424_focus_tasks`. They fail the same way with the old JSON, so my change didn't cause them.

The ticket body now records the choice and these results. `ACCESS_DEV_OPEN` is still out of scope, as the ticket says.

<!-- xgd-chat-end -->