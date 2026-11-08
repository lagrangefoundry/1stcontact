---
uid: comment-484dbd86
id: COMMENT-7968
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T04:56:13.043589+00:00'
updated_at: '2026-11-08T04:56:13.043589+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ed5966c2
  kind: note
---

I filed the iteration 4 fix plan as **REPORT-11277** (`report-ed5966c2`). It saved locally, but the sandbox blocked the sync to github.com (`github.com:22`, user denied), so the report isn't pushed yet.

**Why the previous plan failed validation:** The diagnosis in REPORT-11276 was never rejected. The validator refused only its `dependency_tests`, which used names with the describe-block prefix and spaces (log event `fix_plan_filter_rejected`, seq 1221). The builder never got to run that batch. The test file still has the old calls, and the only fix assessments on record are from October and concern a different problem.

**The diagnosis is unchanged:** In `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts`, lines 161 and 228 call `route(request, env, deps)` with three arguments. The real signature is `route(request, env, scope, deps, ctx)` (`apps/control-app/src/router.ts:1075`, and lines 3506–3512 at the reference). So the deps object is read as the scope, no business is set, and `/api/ai/session` returns 500. The sibling business test file passes the arguments in the right order, which is why its tests pass.

**This plan is one batch, decided at rung 2 (the reference state):**
- **The fix:** the test passes `{ businessId: TENANT }` as the scope, then the deps (`{ launch: browser.launch }` for AC2025, `{}` for AC2024).
- **Why `TENANT`:** it is the business the dev-open scope resolves to (`scope.ts:391-394` at the reference), and the one the test seeds and reads back.
- **Unchanged:** every assertion, all acceptance criteria and all production code. No mode override.
- **Orphan AC-2025:** it should clear once its test passes.
- **Selector fix:** `dependency_tests` now use the bare test names for AC2024 (no-bucket), AC2372 and AC2373. `test_scope` is the AC tokens `test_UAT_AC2025_ or test_UAT_AC2024_ or test_UAT_AC2372_ or test_UAT_AC2373_`.

I also flagged one passing test as weak evidence: the browser binding in the AC2025 test is never actually used. So the test doesn't prove that having the binding is what turns on the looking tools.

**Not verified:** I didn't run the Worker suite. The diagnosis comes from reading the code and the failure output.