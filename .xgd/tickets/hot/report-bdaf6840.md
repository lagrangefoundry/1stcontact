---
uid: report-bdaf6840
id: REPORT-1266
type: report
title: Claude structural_rebalance report
created_by: xgd
created_at: '2026-08-05T17:31:31.093384+00:00'
updated_at: '2026-08-05T17:31:31.093384+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: structural_rebalance
  subject_uid: report-31234d67
---

Work is done and verified. Here's the outcome — including two system defects that materially change how this report should be read.

## The input report was invalid

`report-31234d67`/`report-4ca4463f` claimed **0 UATs for all 11 capabilities**. That is an artifact, not data: the count comes from `.xgd/uat_index.json` (`UATCountIndex._load`), which returns 0 for everything and silently sets `loaded=False` when the file is missing. The file is missing here because it's gitignored (`.gitignore:27`) and nothing in the regression bootstrap rebuilds it. Acting on that report literally would have merged all 11 capabilities into one — which would still have read as 0 UATs and failed again.

I rebuilt it (`xgd quality rebuild-uat-index` → 87 UATs across 86 ACs) and re-derived the true counts. A genuine imbalance does exist: **all 11 capabilities sat below the min of 20**, with 86 UATs total, so at most 4 capabilities can satisfy the threshold.

## Rebalance executed (11 → 3)

No capability was over max, so there were no splits. Merges followed existing architectural seams — CAP-68 already declared itself superseded by CAP-70, and CAP-67 records its absolute base as re-homed onto L1, so those merges make the matrix agree with what the tickets already said.

| Survivor | UATs | Stories | Absorbed |
|---|---|---|---|
| **1c Capture & Diff Fidelity** (`capability-aa030c83`) | 40 | 5 | gradient, size-aware diffing, CLI hygiene |
| **L1 Reproduction Pipeline: Fold & Acceptance Gate** (`capability-2049c9ec`) | 24 | 2 | 3-probe gate |
| **Framework Substrate: L1 Layout, Values & Behavior Modules** (`capability-ae9d65d6`) | 22 | 5 | value system, responsive dials, treatments, behavior modules |

Verified against the ticket files (overlaying branch onto canonical store): 86 UATs conserved, 12 stories, 0 orphans, all three survivors within [20, 200]. No story content was modified — only `capability_uid`.

## One step could not be completed

**The 8 absorbed capabilities are still `active`, not `deprecated`.** `reject_deprecation_if_capability_has_stories` calls `attached_story_ids()`, which queries the ticket index — and on a branch worktree that index resolves to the canonical main store, which still holds the pre-merge `capability_uid`. So it reports phantom attached stories:

- branch file `story-82eb6908` → `capability-aa030c83` (correct, committed)
- main store copy → `capability-36dd68c5` (stale)
- `--filter fields.capability_uid=capability-36dd68c5` still returns STORY-76

Blocked identically via `--branch`; `xgd ticket rebuild-index` refuses on branch worktrees by design. I marked each absorbed capability with a `merged_into` field and a body banner instead, so the state is unambiguous and a later run can flip the status once the index is correct.

**Related defect:** `xgd ticket list --type capability` now returns **22 entries for 11 capabilities** on this worktree, so `assemble_capability_tree()` double-counts here. Any health check re-run on this branch will be unreliable regardless of the rebalance.

```yaml
## Rebalance Summary
status: partial              # merges applied; deprecation blocked by index defect
previous_attempts: 0
splits: []                   # no capability exceeded max (200)
merges:
  - absorbed: [capability-36dd68c5, capability-18a822ac, capability-ac7ca849]
    into: capability-aa030c83
    surviving_count_after: 40      # 5 stories
  - absorbed: [capability-8108afab]
    into: capability-2049c9ec
    surviving_count_after: 24      # 2 stories
  - absorbed: [capability-6e088083, capability-bd0b722e,
               capability-938f26ec, capability-ce902be4]
    into: capability-ae9d65d6
    surviving_count_after: 22      # 5 stories
blockers:
  - uat_index_absent: report counts were all-zero; .xgd/uat_index.json gitignored
                      and not rebuilt by regression bootstrap
  - stale_index_on_branch: deprecation invariant reads canonical store;
                           capability list duplicates (22 for 11)
```

Both blockers are bugs in the xgd system repo (`/Users/martin/lagrangefoundry/xgd`), not this project, and fixing them is outside a planner session's remit — flagging rather than patching.
