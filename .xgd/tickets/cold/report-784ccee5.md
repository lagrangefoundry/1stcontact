---
uid: report-784ccee5
id: REPORT-1294
type: report
title: 'Capability-Intent Alignment: reproduction-gate-3probe (level=story)'
created_by: xgd
created_at: '2026-08-05T19:08:29.251085+00:00'
updated_at: '2026-08-05T19:08:29.251085+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: reproduction-gate-3probe
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Summary

CAP-73 (`capability-8108afab`) was **absorbed into CAP-71** (`capability-2049c9ec`,
"L1 Reproduction Pipeline: Fold & Acceptance Gate") by the structural rebalance of
2026-08-05 (REPORT-1266 / `report-bdaf6840`). It now holds **zero stories by design**
and is retained as a historical pointer, carrying `merged_into: capability-2049c9ec`.

An emptied, absorbed capability is not drift. The alignment question is therefore
whether the cumulative intent CAP-73 used to carry is **still fully expressed** after
the move. It is: STORY-86 (`story-24098299`) carries the entire 3-probe gate intent
intact under CAP-71. No intent was lost, duplicated, or orphaned. Hence PASS.

The two warnings are residual state from the rebalance being only partially
completable, both rooted in a **known upstream xgd tooling defect already filed in
REPORT-1266**. Neither is project-matrix drift and neither is repairable from this
project's tickets.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability's tree (via STORY-86,
the sole story CAP-73 ever held):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | REQ-79/82/83/84/85/86 framework pivot; **REQ-86** established the end-to-end 3-probe gate. Also REQ-63 (capture/diff audit, other capability). | YES |
| BUNDLE-8 (`bundle-cceaba25`) | free_and_reconciled | 2026-07-29 | **BUG-7** evaluator row/flow width; **BUG-8** breakpoint keyframe / snap hold; **BUG-9** recursive structure recovery. Also REQ-89/90/91/92, BUG-6/10/11 (fold + L1 substrate, other capabilities). | YES |

CAP-73 itself carries no `intent_uid` / `updated_by` field; its intent lineage is
reachable only through STORY-86.

Gate-relevant asks and where each now lives — verified against STORY-86's body, not
assumed from the move:

| Intent | Ask | Expressed in STORY-86? |
|---|---|---|
| REQ-86 | End-to-end 3-probe reproduction gate | YES — the story's whole subject |
| BUG-7 | Row containers must tile children, not give each full parent width | YES — "Flow direction" bullet, incl. the false-flagged-overflow rationale |
| BUG-8 | Reflowed cell lost across a breakpoint; snap holds stale keyframe | YES — "Breakpoint intervals" bullet (half-open `[a.at, b.at)`), with the considered note that this was diagnosed as an *evaluator* defect, not a fold defect, so no fold change was required |
| BUG-9 | `promoteToFlow` must recurse into nested regions | YES — "Demand-driven recovery is region-aware and recursive" |

REQ-89/90/91/92 and BUG-6/10/11 are fold, capture, and L1-substrate asks belonging to
CAP-71's fold story (STORY-84) and the framework-substrate capability. STORY-86
explicitly scopes them out ("Out of scope: the fold itself, including which residuals
it emits (CAP-71); the renderer and envelope validator (CAP-70)"). Correctly absent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-73 story set (empty) | — | aligned — zero stories is the correct post-absorption state; `merged_into` names the survivor |
| STORY-86 (`story-24098299`) — **now under CAP-71** | BUNDLE-7 (REQ-86), BUNDLE-8 (BUG-7/8/9) | aligned — full gate intent preserved verbatim through the reassignment; only `capability_uid` changed |
| CAP-73 body | — | aligned — accurately documents the absorption, names the survivor, and states why `status` is still `active` |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | CAP-73 (`capability-8108afab`) | code-issue | Capability remains `status: active` while holding zero stories and carrying `merged_into: capability-2049c9ec`. Per REPORT-1266, `reject_deprecation_if_capability_has_stories` calls `attached_story_ids()`, which on a branch worktree resolves to the canonical main store holding pre-merge `capability_uid` values — so it reports phantom attached stories and refuses deprecation. `xgd ticket rebuild-index` refuses on branch worktrees by design. | Flip to `status: deprecated` once the index is correct (post-reconcile, on main). Upstream xgd fix — not a project matrix edit. Already filed in REPORT-1266. |
| 2 | warning | consistency | CAP-73 story index | code-issue | `xgd ticket list --type story --filter fields.capability_uid=capability-8108afab` returns STORY-86, but `story-24098299`'s actual `capability_uid` is `capability-2049c9ec`. Reproduced twice this run. Same root cause as #1 (stale canonical-store index on a branch worktree); STORY-86 correctly appears under CAP-71 with a current timestamp while the CAP-73 entry is stale at 2026-07-29. | No project-side edit. Any consumer reading the story tree by filter on this worktree must be treated as unreliable until the index is rebuilt on main. |
| 3 | info | exclusivity | CAP-73 body vs CAP-71 body | — | CAP-73 retains its full original 3-probe description above the absorption banner, which now restates CAP-71's declared scope. Acceptable and arguably desirable for a historical pointer, but it would become a genuine exclusivity violation if CAP-73 were ever reactivated rather than deprecated. | none while CAP-73 stays a pointer |
| 4 | info | coverage | CAP-73 story set | — | Zero stories, vacuously covered; cumulative intent verified present in STORY-86 under CAP-71 at body level (table above), not merely assumed from the reassignment. | none |

## Notes for the Editor

**This capability needs no matrix repair.** Both warnings are the documented, partially
completed tail of the 2026-08-05 rebalance, and both are bugs in the xgd system repo
(`/Users/martin/lagrangefoundry/xgd`), not in this project's tickets. Re-running this
check on this branch worktree will reproduce them identically; they will clear when the
index is rebuilt on main and the absorbed capabilities can be deprecated.

**Carry to CAP-71's own alignment pass (out of scope here, flagged so it is not lost):**
STORY-86's body refers to CAP-71 as an *external* dependency in three places —
"Out of scope: the fold itself, including which residuals it emits (CAP-71)",
"Depends on ... the capture→L1 fold + retained oracle (CAP-71, plan item 2)", and
"Dependencies — Plan item 2 ... (CAP-71)". Post-absorption STORY-86 *lives inside*
CAP-71 alongside STORY-84 (the fold story), so these references are now self-referential
and read as though the fold were in another capability. The intent is still correct —
STORY-86 owns the gate, STORY-84 owns the fold — but the phrasing should be re-pointed
at STORY-84 rather than at the capability that now contains both. This is a
`story-body-edit` for CAP-71's tree.

**Reliability caveat on any health re-run:** REPORT-1266 also records that
`xgd ticket list --type capability` returns 22 entries for 11 capabilities on this
worktree, so `assemble_capability_tree()` double-counts here. Capability-level counts
from this branch should not be trusted.
