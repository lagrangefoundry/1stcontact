---
uid: comment-cf58efd9
id: COMMENT-5371
type: comment
title: Comment on bug BUG-210
created_by: xgd
created_at: '2026-10-17T19:18:02.517482+00:00'
updated_at: '2026-10-17T20:31:46.774599+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-700565eb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8200dba2-51f9-467c-a9f8-77c502b62acc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9ce50de2-b010-44a9-8901-d675560ea002-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T19:01:01.951055+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bbe1b092-14bc-4c36-948b-3bfcf6f2eb4c-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T19:16:15.217844+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above): Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance. Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="87fc30a5-7c4a-43ab-b791-a47a580ed2d6-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T20:02:47.520376+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="87fc30a5-7c4a-43ab-b791-a47a580ed2d6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T20:31:42.148400+00:00" -->
#### Claude
Ticket is set to `free_coding` and branch `free-BUG-210` is cut. Next I'm reading the new framework memory-core API (BUG-83) so I can adapt `host-core.ts`.

Now the manager side — how the core is wired and where the summary store comes from.

Now the host side: how `host-core.ts` currently wires memory.

Still mapping the API: the framework's core now grants its own memory tools to Claude-API sessions, which may collide with this host's own agent surface. Checking that next.

Implementing now. Starting with the configuration data in `priming.json`.

Now `roles.ts`: rename the host providers off the core-owned names, add the product/memory loader, and make the budget gauge self-contained.

Now the edits to `roles.ts` — constants first.

Now `host-core.ts` — replace both `registerDefaults` sites and the deleted `defaultProduct`.

Host wired. Now the existing tests that call the deleted API or assert the old provider names.

Code changes are in; now running the affected existing suites against the real installed library to see where we stand.

Node suites green. Now the conversation (workerd) suites that were masked.

All five masked conversation suites pass against the real installed library (39/39). Now writing the BUG-210 UATs — reading the existing REQ-283/296/403 harnesses to reuse them.

Writing the BUG-210 workers UAT file now (reusing the shared scripted-model and D1 support helpers).

Switching the static UAT to the project's own `aiCore()` loader for consistency, then running the new workers UAT.

Both BUG-210 UAT files pass (6/6) against the real library. Now a type check and the wider regression sweep.

Type check clean for both projects. Running the full workers project as the regression sweep (in batches).

1555/1571 pass. Triaging the 16 failures — REQ-180/204 are known pre-existing; checking whether the delegation-related ones (REQ-295/340/342/354/379, BUG-167) relate to my change.

Baseline (old code + pre-BUG-83 lib) passes BUG-167, REQ-340, REQ-342, REQ-354, REQ-379; REQ-148 and REQ-295 fail there too (pre-existing). Restoring my changes and diagnosing those five directly.

Still diagnosing the REQ-342 failure: the delegation method is rendered, but possibly a different variant than the test expects. Checking the actual text.

Shadowing the Node-resolved library with the pre-BUG-83 copy too, so I can compare these node failures on baseline code vs. my code under identical conditions.

Identical 31 failures with my code on the old library. Now baseline code on the old library for the same batch, to confirm they predate this change.

Batch 1: no failure unique to my change, and 20 tests fail on baseline that pass with it. Restoring my changes and the real library link, then running batch 2.

The checkout also reverted my three test-file edits (I hadn't saved those aside); re-applying them.

Batch 2: only known pre-existing failures (`logDir`, REQ-341 grant list, REQ-349 style audit — unrelated). Re-running my edited suites, then cleaning up the temporary library copy.

All green. Updating the ticket body with what landed (preserving the existing content), then committing and merging back.

Ticket body updated. Committing on the branch, then lock → merge into xgd-working → promote.

Merged into xgd-working. Promoting to `free_coded` (letting the gate do the version bump, per the known race).

BUG-210 is at `free_coded`. Updating the memory note that described the old workaround, since it's now stale.

BUG-210 is fixed and merged into xgd-working. Builder conversations open again — the consultant, the settings assistant and new businesses alike, with REQ-403's start button offered. I verified this against the real installed framework, not the temporary pre-BUG-83 copy. The ticket is at `free_coded` (version 0.2.515, commits `956b981270` plus the gate's version bump), the branch is cleaned up, and promotion to reconcile is your call.

**How the memory core is configured**

The framework stores this configuration once per session manager, not once per role. The consultant, coordinator and delegated builder share one manager and the settings assistant has its own, so both get the same `memory` block. It lives in `priming.json`:

- **charter — on.** Every session is told "This conversation is ticket <uid>". I reworded one line of it: the default says older exchanges are "in your summary and your transcript", which isn't true for the builder or the settings assistant.
- **summary — off.** The framework's summary reads a different storage location (a `chat_summary` comment) that this host never writes. REQ-283's standing note and decisions ledger are still delivered every turn by the host's own provider. No stored data was moved.
- **transcript — off.** On the Claude API backend it would also give every session a second set of memory tools that write to that same unused location. That would split memory in two next to the tools the consultant already has.
- **reminder — off.** Its wording names tools this host doesn't grant. The host's own "keep your record current" reminder stays.
- **budget — off.** The framework doesn't keep a session's token count once a request ends, and the Worker rebuilds the manager on every request, so its gauge would always be blank. REQ-296's gauge, which reads the stored figure, stays.

The host's own memory providers moved to `memory.*` names, because the framework now refuses a host binding any of the names it owns.

Two limitations sit in lagrange-framework, so I left them rather than copying framework code here:
- The framework's summary can't be pointed at a host's own storage.
- Its budget gauge can't be given a stored token count, and the function that renders it isn't exported. So `registerBudgetProvider` now renders the gauge itself, using the framework's own wording and number formatting.

If either were fixed upstream, that layer could be switched back on. Your ticket says such gaps become lagrange-framework tickets; I haven't filed them. Say if you want me to.

**Tests**

The two new test files pass, 6 tests in all: `test_UAT_FC_BUG-210_memory_core.workers.test.ts` and `test_UAT_FC_BUG-210_no_registerdefaults.test.ts`. I also updated three existing test files (REQ-239, REQ-284, REQ-339) to the new function signatures.

Across the full workers suite, 1555 of 1571 tests pass. The 16 failures are not caused by this change:
- **Five delegation suites** (BUG-167, REQ-340, REQ-342, REQ-354, REQ-379) were hidden by the old-library workaround. With my change running on the pre-BUG-83 copy they all pass, so the cause is other upstream changes (LF REQ-207's scope claims). For example, REQ-342 expects older wording that REQ-397 has since changed.
- **Already-known failures:** REQ-295, REQ-148, and REQ-180/204.

Node suites that touch the AI host show only known failures:
- Every test that runs the `1c` CLI host fails with `SessionManager: unknown option logDir`. That's a separate break: the framework replaced `logDir` with `junctions` and the CLI host was never updated.
- Plus REQ-341, REQ-349 and BUG-39.

My change adds no new failures, and fixes 20 tests that fail on the old code. The ticket body records all of this.

The `logDir` break and the five delegation suites are the next things worth ticketing.

<!-- xgd-chat-end -->