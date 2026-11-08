---
uid: comment-e607de3a
id: COMMENT-654
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T19:19:00.371022+00:00'
updated_at: '2026-08-05T19:19:00.371022+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1706ff8a
  kind: note
---

## Assessment complete — PASS

**REPORT-1298** (`report-1706ff8a`), schema verified: `result: pass`, `report_kind: uat_coverage_check`, `subject_uid: capability-8108afab`, `violations: 0`, `warnings: 1`, `needs_review_count: 0`. Capability field written (`uat_coverage: pass`).

**The finding: this capability has zero elements in scope.** CAP-73 was absorbed into CAP-71 (`capability-2049c9ec`) by the sanctioned 2026-08-05 structural rebalance. No ACs, no stories — so no coverage gap can exist here.

I verified that three ways rather than trusting the capability body:
1. Body declares `merged_into: capability-2049c9ec` + absorption banner.
2. `xgd ticket get story-24098299` reports `capability_uid: capability-2049c9ec` — the ticket file, which is authoritative, no longer points here.
3. REPORT-1266's `merges:` block records `absorbed: [capability-8108afab] into: capability-2049c9ec`.

**The trap I checked for:** the index *does* still return STORY-86 under this capability — that's the documented `stale_index_on_branch` defect (branch worktrees resolve to the canonical main store holding pre-merge values). The real risk was STORY-86 falling through the cracks, assessed by neither capability. It doesn't: querying the surviving capability returns STORY-86 *as well*. It's double-attributed, not un-attributed, and gets assessed under CAP-71 where it belongs. Assessing it here would have written a story verdict into a scope its own ticket file rejects.

**Why the one residual is a warning, not a violation.** The capability is stuck at `status: active` when it should be `deprecated` — `reject_deprecation_if_capability_has_stories` reads the same stale index and sees phantom stories. That's a bug in the xgd system repo, which by the project's taxonomy is an *error*, not a recoverable *failure*. Raising it as a violation would spawn a fix loop with no lever that could close it: none of story-body-edit / ac-deprecate / uat-add / uat-edit changes a capability's status, and `xgd ticket rebuild-index` refuses to run on branch worktrees by design. It would fail every round without converging. Warnings don't affect pass/fail, so the state stays on record without that.

Two things worth your attention beyond this ticket:
- The remaining **seven absorbed capabilities** are in the identical state and will each emit this same warning — they should be cleared in one batch after the index fix, not one loop apiece.
- `.xgd/uat_index.json` is gitignored (`.gitignore:27`) and the regression bootstrap doesn't rebuild it, so a *missing* file reads as "0 UATs for every capability" rather than erroring. It's present here (rebuilt during the rebalance), but the silent-zero behaviour is unfixed and will recur on the next clean regression run — that's what made the original input report invalid.
