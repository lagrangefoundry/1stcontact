---
uid: report-9e9f839a
id: REPORT-1071
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-08-02T17:37:32.215028+00:00'
updated_at: '2026-08-02T17:37:32.215028+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-98fc5946
---

Reverted and verified: matrix restored to 11 capabilities / 12 stories / 86 UATs / 0 orphans.

## Rebalance could not be executed — reporting as blocked

### 1. The driving report is invalid

`report-58c1c6a8` flagged all 11 capabilities as `under_min` with `actual_count: 0`. That uniform zero is a measurement artifact, not a matrix property:

`uat_count` is sourced entirely from `.xgd/uat_index.json` (`uat_count_index.py:37`). That file is **gitignored** (`.gitignore:27`) — a per-worktree generated artifact. This regression worktree was cut fresh from main, so the file never existed here; `UATCountIndex` silently returned `loaded=False` and every AC counted 0. I regenerated it (`xgd quality rebuild-uat-index`): **87 UAT tests → 86 ACs**.

Note main's copy is also empty (`{"acs": {}}`), so this recurs on every fresh worktree.

### 2. Corrected counts — the gate does still genuinely fail

| UATs | Stories | Capability |
|---|---|---|
| 17 | 2 | size_aware_diffing |
| 13 | 1 | capture-to-l1-fold |
| 11 | 1 | reproduction-gate-3probe |
| 11 | 1 | values_diff_fidelity |
| 10 | 1 | l1-layout-substrate |
| 9 | 1 | capability-modules |
| 7 | 1 | 1c CLI Argument Parsing |
| 5 | 1 | gradient_fidelity |
| 2 | 1 | reproduction-module-treatments |
| 1 | 1 | framework_value_system |
| 0 | 1 | framework_responsive_dials |

**86 UATs total, 0 orphan stories, 0 orphan ACs.** All 11 are still under `min_uats=20`, so a merge is warranted — but on real signal, which the zero-report provided none of. Thresholds are deliberate (`matrix_refactor` at `config.yaml:126`), not a stray default.

### 3. Why execution is blocked — the environment can't express this change

I built and applied the full merge, then had to revert it. This worktree runs in **REQ-630 overlay mode**: the canonical ticket store is the `main` worktree, and writes go copy-on-write into the local overlay. But `ticketing.list` merges local + canonical **without deduping**. After reassigning all 12 stories:

- The capability tree returned **25 capabilities instead of 14** — every old capability appeared twice.
- UATs **double-counted to 258** instead of 86.
- All 11 deprecations failed the `deprecated = no attached stories` invariant, because `attached_story_ids()` reads canonical's inverted index, which still maps the old capability→story pairs.

Local index and files were correct throughout; the merged view is what breaks. I reverted (`git reset --hard b2d248b02`) rather than leave the matrix in that state, and verified restoration. I did not write to main's canonical store — that's outside this regression's scope and your call.

### 4. Plan, ready to run against canonical

All three groups land in `[20, 200]`, total 86, all 12 stories placed:

- **1c Capture, Diff & CLI Fidelity** — 40 UATs, 5 stories: `16f2793c`, `2c7069fe`, `d5de22a5`, `82eb6908`, `e15a19ef`
- **Reproduction Pipeline: Fold, Treatments & Acceptance Gate** — 26 UATs, 3 stories: `8acc338d`, `46e3b3c7`, `24098299`
- **Framework Substrate: L1 Layout, Values & Behavior Modules** — 20 UATs, 4 stories: `d0a8cfad`, `c490f1cf`, `3569e1a4`, `179b8c06`

Two caveats worth your decision: the framework group lands at exactly 20 (fragile to any UAT removal), and it merges L1 layout with behavior modules — a distinction CLAUDE.md treats as architecturally load-bearing, but neither reaches 20 alone (11 and 11). Separately, `story-d5de22a5` and `story-3569e1a4` carry stale prose references to their old capability in-body; the "do not modify story content" constraint blocks fixing those here.

```yaml
## Rebalance Summary
status: blocked
previous_attempts: 0
blocker: >
  Input report invalid (missing .xgd/uat_index.json → all counts 0; regenerated).
  Rebalance cannot execute in this REQ-630 overlay worktree: list() merges local
  and canonical stores without dedup (25 caps / 258 UATs post-change), and the
  deprecation invariant reads canonical. Changes reverted; matrix restored.
splits: []
merges: []   # planned above, not applied
```

Want me to re-run this against the `main` canonical store, or file the two underlying bugs (uat_index absent on fresh worktrees; overlay list dedup + deprecation guard) first?
