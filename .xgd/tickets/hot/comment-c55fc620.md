---
uid: comment-c55fc620
id: COMMENT-8023
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T18:41:28.607389+00:00'
updated_at: '2026-11-08T18:41:28.607389+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a114e904
  kind: note
---

I've fixed all six failures, and the batch gate passes, but only when the sandbox's `GIT_CONFIG_*` variables are cleared. Run as given, `xgd quality run` hit `git` exit 128 (`missing config key GIT_CONFIG_KEY_0`) in tests inside and outside this batch. That looks like a sandbox environment problem, not a code one. Run directly, all 22 tests in scope passed (1 is skipped by an existing environment check).

The cross-process lock the planner asked for was already in place in `tests/support/fs-lock.ts` from the previous attempt. These failures had different causes. No production code was changed.

**Cause 1: the asset build reads new files that the test mirrors didn't link in (AC-1417, AC-1485, AC-1791).** The REQ-210 commit added framework entries in `tools/generate/src/cli/assets.ts`: `measure-svg.ts`, `site-schema/src/anchors.ts` and `site-schema/src/svg.ts`. Three tests run `1c assets` against a copy of the repo that links only a fixed list of directories, so the build hit ENOENT. These were stale tests, not a bug.
- `tests/reconciliation-1c-launcher-bootstrap.test.ts` and `tests/reconciliation-product-ticket-store-schema.test.ts` now also link `measure-svg.ts`.
- `tests/reconciliation-platform-asset-tree-swap.test.ts` now links all three files. Each has no imports of its own.
- AC-1417's exact `frameworkFiles` list was the old three entries. It is now the eight the build emits: the shipped entries in order, plus `packages/site-schema/src/l1/text.js`, which the build picks up by following imports (BUG-71). It is still an exact match.

**Cause 2: the migrations were merged into one baseline (AC-1476, AC-1477).** The REQ-190 commit (`5c012c3758`) replaced `0001`–`0009` with a single `0001_baseline.sql` and deliberately dropped the `ALTER TABLE tenants ADD COLUMN config` step. The tests still opened the old `0003_ticket_store.sql`. The code is right and the ACs were out of date, so I amended both ACs and updated their tests rather than deprecating anything.
- **AC-1476:** the test now checks for exactly one baseline file, with `tenants`, then `sites`, then `tickets`/`counters` created in that order. It still applies the migrations to an empty database with the real runner and checks the `config` column, that re-applying changes nothing, and that the test harness applies the same files.
- **AC-1477:** the test now compares against the baseline's ticket-store section. Where it used to expect one locally written `ALTER`, it now expects none. The "remove a statement and the check names it" step now removes the `counters` statement by name. Picking it by position no longer worked because the ticketing component now publishes change-log statements after it.
- I rewrote both AC bodies to the one-baseline wording and added notes (COMMENT-8021, COMMENT-8022). COMMENT-8021 on AC-1476 was written before its body was updated and still says the body "should be amended", which is now done.

```yaml
## Assessment
status: fixed
diagnosis:
  - tests: [AC1417, AC1485, AC1791]
    outcome: stale_test
    evidence: "ENOENT on tools/generate/src/cli/capture/measure-svg.ts and packages/site-schema/src/anchors.ts inside the mirror roots; the build entry map (tools/generate/src/cli/assets.ts) names those files since REQ-210 / REQ-130"
    change: "link the new self-contained build entries into the mirrors; update AC1417's exact frameworkFiles list to the emitted eight"
  - tests: [AC1476, AC1477]
    outcome: stale_matrix_and_test
    evidence: "db/migrations holds only 0001_baseline.sql (REQ-190, 5c012c3758); 0003_ticket_store.sql and the ALTER TABLE tenants step no longer exist by design (also documented in tests/test_UAT_FC_REQ-162_ticket_store_bindings.test.ts)"
    change: "amend AC-1476 / AC-1477 bodies (+ notes COMMENT-8021, COMMENT-8022); retarget the UATs at the baseline's ticket-store section, assertions kept exact"
production_changes: none
verification: "direct vitest run: 22 passed, 1 skipped; xgd quality run with the batch filter: Overall Status SUCCESS, only with the sandbox's GIT_CONFIG_* env cleared — unmodified env failed with git exit 128 (missing config key GIT_CONFIG_KEY_0) in in-scope and out-of-scope tests"
```