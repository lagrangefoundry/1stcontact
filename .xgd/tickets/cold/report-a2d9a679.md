---
uid: report-a2d9a679
id: REPORT-769
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-07-23T06:03:40.918061+00:00'
updated_at: '2026-07-23T06:03:40.918061+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-9260fc31
---

## Structural Rebalance — Diagnosis and Outcome

I investigated the flagged imbalances before touching any tickets, and the rebalance operation **cannot resolve them** because they are not structural imbalances. Executing splits/merges would be actively harmful. Here is the evidence.

### What the health check reports
All 11 capabilities are flagged `under_min` with `actual_count: 0` against `threshold: 20`. Not one is over-sized; every single one reads exactly zero.

### What is actually true
| Fact | Evidence |
|------|----------|
| 11 capabilities exist, each owns 1–2 stories (12 stories total) | `xgd ticket list --type story --filter fields.capability_uid=…` |
| The health check counts **UATs**, via `Σ stories → ACs → UATCountIndex.count_for_ac()` | `xgd_source/quality/structural_validation.py:186-209` |
| `UATCountIndex` reads `.xgd/uat_index.json` | `xgd_source/core/uat_count_index.py:37` |
| **`.xgd/uat_index.json` does not exist** in the regression worktree | `find`/`test -f` → absent |
| No UAT test corpus is indexed (`test_UAT` markers in packages: 0; reconciliation reports say "skipped – no test files") | grep + REPORT-751/747/743 |

### Why rebalancing is the wrong instrument
Split/merge only **redistributes** stories (and their UAT counts) across capabilities. The total UAT count project-wide is **0**. Redistributing zero yields zero. Even the maximal action — merging all 11 capabilities into one — produces a single capability with 12 stories and still `0 < 20`, so it would remain `under_min`. There is no partition of the story set that lifts any capability to the threshold.

Worse, performing merges here would **destroy the current clean one-capability-per-domain structure** (reproduction-gate, l1-substrate, capture-to-l1-fold, capability-modules, responsive-dials, value-system, 1c CLI, size-aware-diffing, gradient-fidelity, values-diff, module-treatments) while leaving the health check still failing — and set `previous_attempt_count` climbing on a loop that can never converge.

Per the failure/error taxonomy and prerequisite semantics in CLAUDE.md, this is a **precondition not met**, not a structural imbalance: the rebalancer's input (a non-empty UAT corpus to redistribute) is absent. The correct fix lives **upstream** of rebalancing:

1. **Most likely:** regenerate `.xgd/uat_index.json` (test files exist under `tests/` but the index that maps ACs→tests is missing/unbuilt), then re-run the structural health check — the counts may pass with no rebalancing at all.
2. If ACs genuinely have no linked UATs yet, run UAT generation/reconciliation to create them.

### Completion report

```yaml
## Rebalance Summary
status: not_actionable   # precondition unmet — not a structural imbalance
previous_attempts: 0
diagnosis: >
  All 11 capabilities flagged under_min with actual_count=0 because the
  project-wide UAT count is 0 (.xgd/uat_index.json is absent; no UAT corpus
  indexed). Split/merge only redistributes UATs and cannot raise a count of 0.
  Even a full merge into one capability stays 0 < 20. Rebalancing is the wrong
  instrument; the fix is upstream (build uat_index.json / generate UATs).
splits: []      # none performed — would not change any count from 0
merges: []      # none performed — would destroy clean structure, not fix the check
recommended_upstream_action:
  - rebuild .xgd/uat_index.json, then re-run structural_health_check
  - if ACs have no UATs, run UAT generation before re-checking
```

I made **no ticket changes** — no stories reassigned, no capabilities created or archived — because every available action is either inert (splits) or destructive-and-still-failing (merges). Surfacing the real cause is the correct outcome here rather than performing a mechanical no-op that corrupts the matrix.
