---
uid: report-6a8ed521
id: REPORT-10930
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T20:45:04.690392+00:00'
updated_at: '2026-11-04T20:45:04.690392+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-3f77b790
  parent_report_uid: report-a931f6c9
  batch_index: '0'
---

I made no edits. I can't reproduce the AC1421 failure, and the report doesn't record what went wrong.

**What the report shows.** REPORT-10928 marks `test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only` as `failed`, but the entry is synthesised: *"structured failure details unavailable — JUnit XML missing or unparseable"*. There's no assertion message, no traceback, and the captured stdout is truncated. The "AC-1421 orphaned" entry is a knock-on effect: it's flagged only because its one covering UAT was marked failed.

**What I ran.** Nothing outside `.xgd/` has changed since the commit the report ran against (`961e91a2`), so the tree is the same. The test passed every time:
- On its own: passed.
- The whole `tests/reconciliation-publish-revision.test.ts` file, under the root config and the node config: 5/5 passed.
- The full root suite (node and workerd projects), filtered to the report's own scope (AC1291–1306, 1385–1398, 1418–1424, 1447–1448, 1632–1633): 47 passed, 0 failed. AC1421 took 86 ms.

**Ruled out:**
- **Timeout:** the node config sets 60 s and the test takes about 86 ms.
- **Builder file-watcher race:** `startBuilder` has no watcher or interval timer.
- **Cross-file `process.chdir` interference:** Vitest's default fork pool runs each file in its own process, and the shared run with both projects passed.

**Is the test sound?** Yes, it matches AC-1421's verification steps one for one. It checks the history comes back newest first with messages, lineage and per-path changes, then that a dirty-draft checkout is refused by name until `--force` is passed. After the forced checkout the draft is re-parented to r1, the next publish becomes r3 with r1 as its ancestor, and r2 can still be read. The AC and story need no change.

The failure was most likely a transient problem in the quality run itself, given the missing JUnit XML. Changing the test or the AC to answer a failure I can't see would be guesswork.

```yaml
## Assessment
status: no_change_needed
blocked_by: null
evidence: "REPORT-10928 failure entry is synthesised with no message or traceback (JUnit XML missing). The test passes alone, as a whole file (5/5) and in the full root suite filtered to the report's scope (47 passed, 0 failed); nothing outside .xgd changed since the reported commit 961e91a2."
proposed_change: "none — rerun the quality check; if it fails again, capture the JUnit/stdout for test_UAT_AC1421 so the actual assertion is visible"
```