---
uid: report-e2f6e2a7
id: REPORT-1285
type: report
title: 'UAT Coverage: capability-modules'
created_by: xgd
created_at: '2026-08-05T18:25:25.356637+00:00'
updated_at: '2026-08-05T18:25:25.356637+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ce902be4
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: capability-modules

**Result**: PASS
**AC verdicts**: 0 pass, 0 fail, 0 deprecated, 0 needs_review (no ACs exist)
**Story verdicts**: 0 pass, 0 fail, 0 stale, 0 needs_review (no stories exist)
**Capability verdict**: pass

## Headline

`capability-ce902be4` (CAP-72) holds **zero stories**, therefore **zero ACs**,
therefore **zero UATs**. The coverage check is **vacuously satisfied**: there is
no active AC that could lack a test, and no story body that could outrun its
evidence.

This is the intended end-state of the structural rebalance run earlier in this
same regression (`report-bdaf6840`, 2026-08-05), which absorbed CAP-72 into
**`capability-ae9d65d6`** (CAP-70, "Framework Substrate: L1 Layout, Values &
Behavior Modules"). The capability body documents the absorption and carries
`merged_into: capability-ae9d65d6`.

The behavioral intent formerly assessed here (REQ-85's behavior-module contract,
REQ-87's rename) has **not** been dropped — it moved intact with STORY-85 and is
assessed under CAP-70. Nothing became unevidenced by this transfer.

## Verification Method

I did not inherit the zero-story claim from the three prior level reports
(`report-248c0b33` story, `report-666132a3` ac, `report-02071078` uat — all PASS,
0 violations). The ticket index on this worktree is known-unreliable (warning 1),
so `--filter fields.capability_uid=...` is not trustworthy. I re-derived the
state from five independent angles, all agreeing:

1. **The stale filter reproduces.** `xgd ticket list --filter
   fields.capability_uid=capability-ce902be4` returns STORY-85 at a
   `2026-07-24` snapshot; the same story lists under `capability-ae9d65d6` at
   `2026-08-05`. Two conflicting index entries for one ticket.
2. **Per-ticket read wins.** `xgd ticket get story-179b8c06` (STORY-85) reads
   `capability_uid: capability-ae9d65d6`. The ticket, not the index, is truth.
3. **Full story sweep.** I enumerated all 12 story UIDs and read
   `capability_uid` from each ticket via the API. Distribution: 5 →
   `capability-aa030c83`, 5 → `capability-ae9d65d6`, 2 → `capability-2049c9ec`.
   **Zero → `capability-ce902be4`.**
4. **Store-wide grep.** No ticket file on this branch carries
   `capability_uid: capability-ce902be4`.
5. **Tree + index probes.** `xgd ticket children` → none; `xgd ticket backlinks`
   → none; AC-type query → empty. ACs carry no `capability_uid` of their own
   (verified against the 87-AC canonical store), so the AC tree is fixed by
   story membership — which is empty. `.xgd/uat_index.json` is keyed by AC id
   only (86 ACs / 87 tests, no capability association), so it cannot attribute a
   UAT here either.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-79 | request-87b26bca | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + capability modules; founds module-as-behavior | YES |
| REQ-84 | request-f243b6b9 | free_and_reconciled | 2026-07-20 | Pivot C: strip layout modules to L1; retires "module = bundle of aesthetic dials" | YES (retired prior model) |
| REQ-85 | request-015e42ac | free_and_reconciled | 2026-07-20 | Pivot D: module contract (config/slots/conformance) + reframe carousel & contact-form — founding intent for this capability | YES |
| REQ-87 | request-84af044b | free_and_reconciled | 2026-07-21 | Mechanical rename `capability module` → **behavior module** | YES |
| BUNDLE-7 | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | Reconciliation vehicle; STORY-85's `intent_uid` | YES |
| REQ-96 | request-3a064234 | ready_to_reconcile | 2026-07-26 | Behavior modules layout-agnostic by construction (L1 `control` node) | YES (imminent) |

Every intent above is reconciled or imminent — none was retired. Correspondingly
there is **no AC to deprecate** here, because there is no AC here at all. The
intent surface is live; it is simply assessed under CAP-70 now.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| (none) | — | n/a | Capability holds zero stories after the 2026-08-05 rebalance |
| STORY-85 *(departed)* | REQ-79, REQ-84, REQ-85, REQ-87, BUNDLE-7, REQ-96 | moved | Now under `capability-ae9d65d6`; assessed there, not here. Transfer verified lossless by `report-248c0b33` |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | CAP-72 | none (xgd system bug) | Canonical main store still holds the pre-merge `capability_uid: capability-ce902be4` on `story-179b8c06`, while the branch copy correctly reads `capability-ae9d65d6`. Any tool reading the canonical index misattributes STORY-85 — and transitively AC-697…AC-722 and the nine tests in `tests/reconciliation-behavior-modules.test.ts` — to this capability | No project-side edit. Resolves when the branch merges to main. Do **not** "fix" by re-pointing the branch ticket |
| 2 | warning | capability | CAP-72 | capability-deprecate (blocked) | Capability is still `status: active` with zero stories; it should be `deprecated`. `reject_deprecation_if_capability_has_stories` reads the stale canonical index and sees phantom attached stories, so the flip is refused | Retry the deprecation once the index is correct post-merge; `merged_into` + body banner already record the state unambiguously |

**Violations: 0. Needs review: 0.** Both findings are pre-existing, already
documented in `report-bdaf6840`, and are defects in the **xgd system repo**
(`/Users/martin/lagrangefoundry/xgd`) — not in this project's matrix or tests.
Neither is a coverage gap, so neither gates this check.

## Notes for the Editor

**There is nothing to edit in this capability.** No UAT to author, no AC to
deprecate, no story body to trim. Any fix loop targeting CAP-72 should no-op.

The one trap worth stating plainly, because the index actively invites it:
**do not audit STORY-85, AC-697…AC-722, or `tests/reconciliation-behavior-modules.test.ts`
against this capability.** The index says they belong here; the tickets say
otherwise, and the tickets are right. That material is CAP-70's scope, and
double-assessing it here would either duplicate CAP-70's findings or — worse —
produce contradictory verdicts on the same ACs from two capabilities in one
regression.

CAP-72 is now a historical pointer. The correct long-term action is deprecation
(warning 2), which is blocked on an upstream index defect rather than on
anything a matrix editor controls.
