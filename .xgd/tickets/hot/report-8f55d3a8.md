---
uid: report-8f55d3a8
id: REPORT-1708
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-08-09T00:55:29.829560+00:00'
updated_at: '2026-08-09T00:55:29.829560+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-69e94af9
---

I did not execute any rebalance. Here's why — the health check report is invalid.

## What I found

**The report `report-75f53b61` is a measurement artifact, not a structural imbalance.** It flagged all 21 capabilities as `under_min` with `actual_count: 0` against a threshold of 20.

That is unsatisfiable on its face: merging is the remedy for `under_min`, but merging all 21 capabilities into one still yields 0 UATs. No assignment of stories to capabilities can produce ≥20 UATs when every capability reads zero. Acting on the report literally would have collapsed the entire matrix into a single capability and still failed the gate.

**Two distinct bugs produce it:**

1. **Missing UAT index.** `assemble_capability_tree()` reads UAT counts from `.xgd/uat_index.json` via `UATCountIndex` (`xgd_source/quality/structural_validation.py:177`). That file is **gitignored** (`.gitignore:27`), so it is never committed and is always absent in a fresh regression worktree. `UATCountIndex._load` returns silently on a missing file, leaving every count at 0. I rebuilt it with `xgd quality rebuild-uat-index`: **331 UAT tests discovered, mapped to 311 ACs.**

2. **No status filter.** `run_health_check` iterates `tree["capabilities"]` with no status check (`structural_validation.py:258`). `status` is captured into the tree but never consulted, so `deprecated`/`superseded` capabilities — which correctly hold 0 stories *because they were already merged* — are flagged `under_min` forever. Rebalancing cannot fix these: their `merged_into` / `superseded_by_uid` fields already point at their survivors and they have no stories left to move.

## The matrix's actual state, after rebuilding the index

| UATs | Stories | Capability |
|---|---|---|
| 95 | 7 | Framework Substrate: L1 Layout, Values & Behavior Modules |
| 55 | 5 | 1c Capture & Diff Fidelity |
| 36 | 3 | Site Delivery: Deploy & Public Serving |
| 34 | 4 | Site Materials & Starting Point |
| 32 | 2 | L1 Reproduction Pipeline: Fold & Acceptance Gate |
| 28 | 1 | Builder Workspace: Chrome, Origin & Display Panel |
| 28 | 2 | In-Page Copy Editing |
| 22 | 1 | Structured Copy Editing |

All 8 active capabilities fall within the configured `[20, 200]` band (`.xgd/config.yaml:107-109`). 25 stories, 330 UATs, **0 orphan stories, 0 orphan ACs**. The other 13 are already `deprecated` or `superseded` with correct merge pointers — prior rebalancing did its job.

**There is no imbalance to correct.** No splits, no merges, no reassignments are warranted.

## What I changed

No tickets created, updated, or archived. `git status` is clean. The one side effect is `.xgd/uat_index.json`, rebuilt in this worktree — a gitignored derived cache that was missing. I left it in place because it makes a re-run of the health check in this worktree measure real counts rather than zeros.

```yaml
## Rebalance Summary
status: not_performed
reason: health_check_report_invalid
previous_attempts: 0
classification: error   # system bug, not a recoverable workflow failure
report_uid: report-75f53b61
root_causes:
  - id: missing_uat_index
    detail: ".xgd/uat_index.json is gitignored (.gitignore:27), absent in fresh
             regression worktrees; UATCountIndex silently yields 0 for every AC"
    evidence: "rebuild discovered 331 UATs across 311 ACs"
  - id: no_status_filter
    detail: "run_health_check (structural_validation.py:258) does not exclude
             deprecated/superseded capabilities; already-merged shells are
             flagged under_min permanently and are unfixable by rebalancing"
true_state:
  active_capabilities: 8
  uat_range: [22, 95]
  thresholds: [20, 200]
  all_within_thresholds: true
  retired_capabilities: 13   # deprecated/superseded, merge pointers set
  total_stories: 25
  total_uats: 330
  orphan_stories: 0
  orphan_acs: 0
splits: []
merges: []
```

Per the failure/error taxonomy in `CLAUDE.md`, this is an **error**, not a failure — there is no fix loop that resolves it, because the defect is in the measurement, not in the matrix. The fix belongs in the xgd package (rebuild the index before the health check, and filter retired capabilities out of the balance scan), not in this project's tickets. I stopped rather than attempting recovery.
