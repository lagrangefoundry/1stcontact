---
uid: report-a114e904
id: REPORT-11540
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T18:14:34.283821+00:00'
updated_at: '2026-11-08T18:14:34.283821+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-49607926
  parent_report_uid: report-b0262d00
  batch_index: '0'
---

I fixed the AC-1400 failure: its UAT now passes. Five other tests in the batch scope still fail, for reasons outside this batch.

**Diagnosis:** the test was correct and so was the production code. The failure came from the test setup. Six suites run `1c assets`, which renames the served `dist-assets` folder away and moves a shared staging folder into place. When one of those builds ran while AC-1400 was reading the folder, AC-1400 saw no tree or half of one.

**Fix (test files only; no production code and no AC-1400 assertions changed):**
- **New `tests/support/fs-lock.ts`:** the mkdir lock from `local-d1.ts` moved into a shared helper, in both a blocking and an async form. The holder writes its process id into the lock folder, so a waiter breaks a lock only when that process is gone or the lock is older than 10 minutes. The longest holder needs about 4 minutes, so a live lock is never broken.
- **`tests/support/local-d1.ts`:** now uses the shared helper and keeps its 120 s limit.
- **The six suites that run the build** (1c-launcher-bootstrap, platform-asset-tree-swap, marked-points-served-modules, BUG-71 import graph, product-ticket-store-schema, builder-workspace-import-graph): each `1c assets` run holds the lock for its whole duration.
- **AC-1400's UAT:** the whole test runs under the lock. Its time limit went from 120 s to 600 s so that waiting for a build already in progress doesn't count against it.

**Verification:** I ran the related suites directly with vitest (`xgd quality run` reported only one of its six failures, AC960). AC-1400 passes, AC-2464 and the BUG-71 tests pass, and AC960 passes on its own. TypeScript reports no errors in the touched files. I couldn't run ESLint: it isn't installed locally and the sandbox blocked downloading it.

**Still failing, all outside this batch:**
- **AC1476 and AC1477:** `db/migrations/0003_ticket_store.sql` doesn't exist in this checkout; `db/migrations` only has `0001_baseline.sql`.
- **AC1417, AC1485 and AC1791:** the build now reads `tools/generate/src/cli/capture/measure-svg.ts` and `packages/site-schema/src/anchors.ts`, added by commit `a091d16b5b` (Marked Points). The mirror and fixture checkouts these suites build in don't contain those files, so the build exits 1 on file-not-found. The lock wraps those builds but doesn't change what they read.

I couldn't run the unmodified versions of those three suites to prove they failed before my change, because the sandbox denied that command. The cause is clear from the errors, though. These belong in a separate batch. The changes aren't committed.

```yaml
## Assessment
batch: 0
failures:
  - test: "tests/reconciliation-workspace-build-artifacts.test.ts::test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate"
    status: fixed
    diagnosis: "Test-infrastructure race: sibling suites run `1c assets`, which swaps apps/control-app/dist-assets out (rename to .retired, staging renamed into place) while AC-1400 reads it. Not a production bug; the AC and assertions are correct."
    fix: "Added shared cross-process mkdir lock tests/support/fs-lock.ts (sync and async forms; pid-based crash detection; 600 s stale limit, longer than the longest holder, about 240 s). local-d1.ts reuses it. All six suite-initiated builds hold the lock for their full run; AC-1400 holds it across its reads (time limit raised to 600 s to cover waiting). No production or assertion changes."
    evidence: "vitest run: AC-1400 passes; AC2464 and BUG-71 pass; AC960 passes standalone."
out_of_batch_failures_observed:
  - tests: [test_UAT_AC1476_, test_UAT_AC1477_]
    cause: "db/migrations/0003_ticket_store.sql does not exist (only 0001_baseline.sql); not caused by the lock."
  - tests: [test_UAT_AC1417_, test_UAT_AC1485_, test_UAT_AC1791_]
    cause: "The build now reads tools/generate/src/cli/capture/measure-svg.ts and packages/site-schema/src/anchors.ts (commit a091d16b5b); the mirror and fixture checkouts in these suites don't contain them, so the build fails with ENOENT. Not caused by the lock; out of batch scope."
```