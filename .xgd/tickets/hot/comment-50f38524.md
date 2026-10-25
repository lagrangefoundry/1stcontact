---
uid: comment-50f38524
id: COMMENT-5495
type: comment
title: Comment on request REQ-411
created_by: xgd
created_at: '2026-10-18T22:13:29.064343+00:00'
updated_at: '2026-10-18T22:21:17.751649+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bfef8e28
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c70806a3-6cb9-41ad-9519-77dd2324450b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f6f2cc78-f69d-45c2-bfc9-6c6a6e006aee-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T22:12:32.655980+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f6f2cc78-f69d-45c2-bfc9-6c6a6e006aee-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T22:21:16.741780+00:00" -->
#### Claude
Checking the installed framework's `Tool` option and `Toolbox.concurrent`; the lease context already runs per call via `AsyncLocalStorage.run`.

Reading REQ-410's notes to find the uncommitted parallel UAT (that worktree belongs to BUG-226 — I'm only reading it, and I'll work from my own branch).

The uncommitted REQ-410 UAT isn't anywhere on disk, so I'll write it fresh on the existing REQ-410 harness. Reading that harness now.

Now the code changes in my worktree.

Now the UATs. Checking how the priming's parallel slot is rendered so I can cover the serial case too.

Writing the REQ-411 UAT file. It reuses the REQ-410 harness shape: the real Worker, D1 leases, and a scripted model whose builders meet at a timed barrier.

Running the new suite. First checking that the worktree has the generated `ai-workers` shim, since that directory is gitignored.

All 40 tests pass across REQ-411, REQ-410, both REQ-397 suites and REQ-389. Now a quick check that the overlap UAT really fails without the flag pass-through.

With the flag removed, the overlap and same-file UATs fail, so they test the fix. Running lint and typecheck next.

Typecheck is clean for the changed files. The project has no eslint binary installed, so lint wasn't run. Before committing, I'm checking my notes on this project's version-bump gate.

Committing the code, then updating the ticket body before merging back.

Ticket body updated with the original scope preserved. Now merging back: lock, then merge the branch into xgd-working.

Merged, and the rematerialize found nothing to change. Moving to `free_coded` without `--version`, so the gate bumps the version itself.

REQ-411 is done and parked at `free_coded`: commits `2e65cd5767` (code + UATs) and `12be8cfcd8` (version bump to 0.2.538). It's merged into xgd-working and the branch is cleaned up. Builders commissioned in the same consultant reply now run at the same time.

**What changed:**
1. **Each tool carries its operation's concurrency.** `toolSet` in `host-core.ts` now registers every tool with `{ concurrent: box.concurrent(name) }`. `Delegate` is declared concurrent, so up to `max_concurrent` builders overlap. Every other tool still waits for whatever is running and runs alone. Nothing in the code names `Delegate`.
2. **The lease context was already per call, so no change was needed.** `around` runs each call in its own `asWriter` context (`AsyncLocalStorage.run`). Two builders running at once each write as themselves, and a write by one to the other's section is refused.
3. **The consultant is only told about parallel builders when they can actually run.** `concurrentSupported` in `lease-core.ts` now also checks that the installed `Tool` accepts the `concurrent` option. If it doesn't, the consultant is told builders run one at a time.
4. **REQ-410's uncommitted parallel-builder test wasn't in any checkout**, so I rewrote it in `tests/test_UAT_FC_REQ-411_concurrent_builder_closures.workers.test.ts`.

**Tests:** the new suite has 5 tests, run through the real Worker with only the model scripted, and covers all five cases in the ticket's test plan. With the regression suites (REQ-410, both REQ-397 suites, REQ-389) that's 40 of 40 passing. With the flag removed, the overlap and same-file tests fail, so they test the fix.

**Gaps:**
- I didn't run lint: there's no eslint binary in the project and `npx` failed on a root-owned npm cache (EPERM). Typecheck of the changed files is clean.
- The "serial paragraph when `Tool` can't be concurrent" case is tested at `concurrentSupported`, the value the host turns into `parallel: 1`, not through the full host. The Worker host has no way to swap in an older framework.

The ticket body keeps the original scope and adds "What landed" and "UATs (as landed)" sections. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->