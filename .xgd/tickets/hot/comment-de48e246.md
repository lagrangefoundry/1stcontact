---
uid: comment-de48e246
id: COMMENT-7967
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T04:48:57.906761+00:00'
updated_at: '2026-11-08T04:48:57.906761+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-bc09699f
  kind: note
---

I filed the iteration 4 fix plan as **REPORT-11276** (`report-bc09699f`). The ticket is saved locally, but the sandbox blocked its sync to github.com.

**The cause is in the test file, not the product code.** In `tests/reconciliation-assistant-looking-surface-worker.workers.test.ts`, the two failing tests call `route(request, env, deps)` with three arguments. The signature is `route(request, env, scope, deps, ctx)` (`apps/control-app/src/router.ts:1075`), so:
- the deps object is read as the scope, and the real deps fall back to `{}`;
- the chat host is then built for an undefined business;
- `/api/ai/session` returns 500, which matches both failures (lines 164 and 232).

The sibling file `reconciliation-assistant-looking-surface-business.workers.test.ts` passes the arguments in the right order, which is why its tests pass.

**The plan is one batch, decided at rung 2 (the reference state):**
- The builder passes `{ businessId: TENANT }` as the third argument and moves the deps to the fourth: `{ launch: browser.launch }` for AC2025 and `{}` for AC2024.
- `TENANT` is `'looking'`, the business the Worker's dev-open mode resolves to (`scope.ts:392-394` at the reference). It is also the business the test seeds and reads back, so all three steps hit the same one.
- No assertion changes, no change to acceptance criteria, and no mode override. The production wiring (`sessionFidelity`, `chatHost`) already matches the reference.
- The orphan AC-2025 should clear once its test passes.
- The sibling tests for AC2024 (the no-bucket variant), AC2372 and AC2373 run alongside the batch, to catch any side effects.

This is a different idea from the earlier iterations, which tried porting production code. This one corrects how the test calls the code.

**Not verified:** I couldn't run the Worker suite because the sandbox blocks binding a local port (`listen EPERM 127.0.0.1`), so this diagnosis comes from reading the code. You can allow binding with `sandbox.network.allowLocalBinding: true` in settings.

The bug got past the checks because the quality build skips type-checking ("No tsconfig.json — type-check skipped"). `tsc` would have flagged the wrong argument type.