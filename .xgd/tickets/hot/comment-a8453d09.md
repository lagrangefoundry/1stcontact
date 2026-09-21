---
uid: comment-a8453d09
id: COMMENT-3418
type: comment
title: Comment on request REQ-291
created_by: xgd
created_at: '2026-09-21T01:09:23.572849+00:00'
updated_at: '2026-09-21T18:45:44.561492+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3514cc7e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "42fc02d8-36b2-49f8-a0ae-b03f5d0b4a13",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="374f8f8e-5581-49b0-85a8-fb31a227e13d-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T01:08:16.630965+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="374f8f8e-5581-49b0-85a8-fb31a227e13d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T01:11:21.343583+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 8:50pm (America/Los_Angeles)

<!-- xgd-turn id="4753b024-fdef-4698-9bc1-b0138862a831-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T17:43:07.335907+00:00" -->
#### You
Please continue

<!-- xgd-turn id="4753b024-fdef-4698-9bc1-b0138862a831-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T17:44:22.929951+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 11:50am (America/Los_Angeles)

<!-- xgd-turn id="3b994923-a90c-4f81-946e-f61433b5e4d9-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T18:30:34.712132+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3b994923-a90c-4f81-946e-f61433b5e4d9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T18:45:43.467371+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Ticket is clear and the design space is well-constrained by the existing code. Starting the free-coding flow.

Now writing the manifest tool.

Now the hook.

Now the test harness and UATs.

Now let me run the tests.

RED confirmed (6 of 10 fail without the check). The `git checkout` reverted my hook edits — re-applying them.

Now the README, and a regression check across the neighbouring deploy suites.

Now updating the ticket body — appending what was built, so every UAT is motivated by ticket language.

Now DOC-41 §3 and §5, as the ticket asks.

Memory flags direct ticket-file edits as wrong — redoing that through the CLI.

Now commit on the branch.

Now lock, merge back, and promote.

Done. REQ-291 is at `free_coded`.

## What landed

**`db/migrations/manifest.json`** — filename → SHA-256 of bytes, one key per line so a `git diff` shows one line per file. It sits inside `migrations_dir`; wrangler's default pattern is `*.sql`, so it's invisible to wrangler.

**`bin/migration-manifest`** — plain Node, no dependency or transform (same reasoning as `bin/smoke`: it runs inside a deploy, and a gate that needs the site toolchain built first has a new way to fail open).
- bare → rewrite the manifest, reporting **added** keys (ordinary) separately from **CHANGED** values (an edit to a migration that already existed, printed with both hashes)
- `--check` → same report, writes nothing, exit 1
- `verify --env <name> --status <n>` → the hook's entry point, reading `wrangler d1 execute --json` on stdin

**`bin/deploy.d/migrate/10-d1-site-store`** — now reads `SELECT name FROM d1_migrations` from the target environment and verifies **above** the dry-run branch, so the rehearsal and the real deploy run the identical check. Mismatch → exit 1 naming file, environment and both hashes, before anything uploads or applies.

Decision table: unapplied → not checked; applied with no manifest entry → refuse (a tripwire disarmable by deleting a line is not a tripwire); applied but absent from this checkout → reported, not refused; unreadable environment → refuse; `no such table: d1_migrations` → proceed, that environment has applied nothing.

**Evidence** — `tests/test_UAT_FC_REQ-291_applied_migration_content_drift.test.ts`, 11 cases through `tests/support/migrate-hook.ts`. It drives the shipped hook and the shipped script with only `npx` stubbed, and every case also asserts which `wrangler d1 migrations` invocations followed. I verified it RED: removing the verify block fails 6 of 10 (before I added the eleventh case).

DOC-41 §3 (the hook, the dry-run paragraph, the command list) and §5 (a fourth invariant) are updated.

## Two things worth knowing

**One judgement call I made and wrote into the ticket**: the repo's own test asserts the manifest's *presence*, not *equality* — every `.sql` has an entry, no entry names a missing file. Asserting hashes match would regenerate the mechanism away, since the manifest lags on purpose and that lag is what makes an edit visible.

**A limit inherent to the design**: the manifest was generated today, from today's bytes. Production was rebaselined on 2026-09-21 (EPIC-16 §I), so manifest and applied bytes now agree and the check is armed going forward — but it cannot retroactively detect the 2026-09-06 drift, only replay it as a test. That matches the ticket's boundary on the one-off recovery.

**Unrelated failure seen**: `tests/test_UAT_FC_REQ-253_*` dies at import in any worktree — `apps/control-app/src/generated/` is gitignored and absent there. Pre-existing, not from this change; it passes in the main checkout.

<!-- xgd-chat-end -->