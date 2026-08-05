---
uid: report-1706ff8a
id: REPORT-1298
type: report
title: 'UAT Coverage: reproduction-gate-3probe'
created_by: xgd
created_at: '2026-08-05T19:18:31.379317+00:00'
updated_at: '2026-08-05T19:18:31.379317+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-8108afab
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: reproduction-gate-3probe

**Result**: PASS
**AC verdicts**: 0 pass, 0 fail, 0 deprecated, 0 needs_review (no ACs in scope)
**Story verdicts**: 0 pass, 0 fail, 0 stale, 0 needs_review (no stories in scope)
**Capability verdict**: pass

## Summary — this capability is an absorbed shell with zero elements in scope

CAP-73 (`capability-8108afab`) was **absorbed into CAP-71
(`capability-2049c9ec`) on 2026-08-05** by the sanctioned structural rebalance
(REPORT-1266, `report-bdaf6840`). It now holds **zero stories and zero ACs**.
There is nothing to assess: no AC lacks a test, no story body is stale, because
neither exists within this scope.

This was verified three independent ways rather than taken from the capability
body alone:

1. **The capability body declares it** — `merged_into: capability-2049c9ec`
   plus an `ABSORBED 2026-08-05` banner.
2. **The story's own field disagrees with the index** — `xgd ticket get
   story-24098299` reports `capability_uid: capability-2049c9ec`. The ticket
   file, which is authoritative, no longer points here.
3. **The rebalance report records the merge explicitly** — REPORT-1266's
   `merges:` block lists `absorbed: [capability-8108afab] into:
   capability-2049c9ec`, surviving count 24 UATs / 2 stories.

### Why the index still shows a story here (and why it is not a coverage gap)

`xgd ticket list --type story --filter fields.capability_uid=capability-8108afab`
still returns STORY-86. That is the **documented stale-index defect**, not live
content: on a branch worktree the ticket index resolves to the canonical main
store, which still holds the pre-merge `capability_uid`. REPORT-1266 flags this
as blocker `stale_index_on_branch` and it is the same defect that blocked
flipping the eight absorbed capabilities from `active` to `deprecated`.

**Critically, STORY-86 is not orphaned by this.** The same query run against the
surviving capability returns it as well:

    capability-2049c9ec -> story-24098299 (STORY-86), story-8acc338d (STORY-84)

So STORY-86 is *double*-attributed, not un-attributed. Its coverage is assessed
under CAP-71's own `uat_coverage_check` run, where it belongs. Assessing it a
second time here would duplicate that verdict against a capability that no
longer owns it, and would write a story-level verdict into a scope its own
ticket file rejects. STORY-86 currently carries `uat_coverage: pass`.

## Cumulative Intent Considered

The intent ledger below is the one behind STORY-86, retained for the record. It
does not bear on this capability's verdict, since the story it governs has been
re-homed to CAP-71.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | merged @ `edeb1c2c` | Framework pivot: capture/diff axis coverage, L1 substrate + safety envelope, the reproduction pipeline these probes gate | YES |
| BUNDLE-8 (`bundle-cceaba25`) — BUG-7 + REQ-89 + REQ-90 + REQ-91 + REQ-92 + 5 more | free_and_reconciled | merged @ `b1bd5b6b` | Corrected `evaluateLayout` row/flow width assignment (rows no longer false-flag overflow); half-open breakpoint intervals | YES |
| Structural rebalance (REPORT-1266) | applied, `status: partial` | 2026-08-05 | **Absorbed this capability into CAP-71**; reassigned its only story | YES (retires this scope) |

No intent in the ledger asks this capability to retain stories of its own. The
most recent applicable action retired the scope entirely.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| _(none)_ | — | — | Zero stories in scope; STORY-86 re-homed to CAP-71 by the 2026-08-05 rebalance and assessed there |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | CAP-73 (`capability-8108afab`) | — (blocked upstream) | Capability is `status: active` with zero stories; it should be `deprecated`. `reject_deprecation_if_capability_has_stories` reads the stale canonical index and sees phantom attached stories, so the flip is refused. | No editor action available in this project. Re-run the deprecation once the index defect is fixed in the xgd system repo; the `merged_into` field + body banner are the interim marker. |

Zero violations. Zero needs_review.

## Notes for the Editor

**No editor action is required or possible for this capability.** The single
finding is a warning, and warnings do not affect pass/fail.

The reason it is a warning rather than a violation matters, so it is stated
explicitly: the residual state is caused by a **bug in the xgd system repo**
(`/Users/martin/lagrangefoundry/xgd`), not by drift in this project's matrix.
Per the project's failure/error taxonomy, a system bug is an *error*, not a
recoverable *failure* — it must not be routed into a fix loop. Raising it as a
violation here would spawn a fix workflow with no lever that could close it:
none of `story-body-edit`, `ac-deprecate`, `uat-add`, or `uat-edit` can change a
capability's status, and `xgd ticket rebuild-index` refuses to run on a branch
worktree by design. The loop would fail every round without converging.

Two related defects are already on record in REPORT-1266 and are repeated here
only so this report stands alone:

- `stale_index_on_branch` — branch worktree ticket queries resolve to the
  canonical main store, returning pre-merge `capability_uid` values. This is why
  a story appears under two capabilities at once.
- `uat_index_absent` — `.xgd/uat_index.json` is gitignored (`.gitignore:27`) and
  the regression bootstrap does not rebuild it, so a missing file reads as
  "0 UATs" for every capability rather than as an error. It was rebuilt during
  the rebalance (87 UATs across 86 ACs) and is present in this worktree, but the
  underlying silent-zero behaviour is unchanged and will recur on the next clean
  regression run.

The remaining seven absorbed capabilities from the same rebalance are in the
identical state and will each produce this same single warning. They should be
cleared in one batch once the index defect is fixed — not one fix-loop per
capability.
