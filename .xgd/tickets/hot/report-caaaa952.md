---
uid: report-caaaa952
id: REPORT-11490
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T15:12:48.328059+00:00'
updated_at: '2026-11-08T15:12:48.328059+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-99
  parent_report_uid: report-f32587ff
  batch_index: '0'
---

All 10 failures in this batch now pass: 13 tests passed in the scoped run. The 9 iteration-1 tests in `reconciliation-builder-session-and-control-sizing.test.ts` stayed green, and I didn't touch them. Iteration 2's composer font-size fix is still in place.

**What I changed**

1. **`apps/control-app/src/builder/builder.css`** (allowed by the `code_frozen` exception): added a `.builder-library__badge--role` rule next to the other badge rules. It restates the role pill's own resting look, muted text (`var(--shell-fg-muted)`) on the shell border, so nothing the user sees changes. There's a short comment saying what the modifier is for, no font-size literal, and no `.is-placed` state. With that rule in place, the mounted sweep passes. The static sweep it had been hiding (lines 442–471) reported no further unmatched or unsized classes, so no other CSS edits were needed.
2. **`tests/reconciliation-builder-workspace-typography.test.ts`** (a test-only fix): once the sweep passed, the test failed at its teardown, `app.destroy()`, with `TypeError: handle.close is not a function` at `library.js:853`. The test's fake subscription returned a bare function, but the real `subscribeMaterial` (`api.js:513`) returns `{ close }`. I changed the stub to `subscribe: () => ({ close: () => {} })` to match. No assertion changed.

**Still failing, not in this batch:**
- `test_UAT_AC965_*` times out because the sandbox blocks `api.cloudflare.com`. The planner said to ignore it.
- `tests/test_reconciliation_business_scope_operator.workers.test.ts` doesn't load: `ENOENT ../db/migrations/0005_operator_membership.sql`. None of this batch's tests are in that file.

**Not changed:** `library.js`, the AC-2232 ticket, and the story. Nothing needed to propagate upstream.

**Not run:** the repo has no lint script, and `npx eslint` couldn't be fetched (the sandbox blocks the npm registry), so lint wasn't run.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/src/builder/builder.css   # under the authorised code_frozen exception
  - tests/reconciliation-builder-workspace-typography.test.ts   # library transport stub shape matches real subscribeMaterial
verified: "npx vitest run -t '<batch ACs>' → 13 passed; only AC965 (sandbox network, excluded) and an out-of-batch workers file with a missing migration path fail"
```