---
uid: report-00cb70b9
id: REPORT-1302
type: report
title: 'UAT Coverage: 1c CLI Argument Parsing & Output Hygiene'
created_by: xgd
created_at: '2026-08-05T19:36:30.113837+00:00'
updated_at: '2026-08-05T19:36:30.113837+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ac7ca849
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c CLI Argument Parsing & Output Hygiene

**Result**: PASS
**AC verdicts**: 0 pass, 0 fail, 0 deprecated, 0 needs_review (capability owns no ACs)
**Story verdicts**: 0 pass, 0 fail, 0 stale, 0 needs_review (capability owns no stories)
**Capability verdict**: pass (vacuous)

## Summary

`capability-ac7ca849` (CAP-66) owns **zero stories**, therefore **zero acceptance
criteria**, therefore **zero UATs**. UAT coverage is **vacuously satisfied**: there is
no active AC left without a substantive test, and no story body whose behavioral
promise could go unproven, because there are no ACs and no stories to assess.

The capability was absorbed into **`capability-aa030c83`** (CAP-63, "1c Capture & Diff
Fidelity") by the 2026-08-05 structural rebalance (`report-bdaf6840` / REPORT-1266).
Its `merged_into` field records the target; its body carries the absorption banner.

## Verification method (records, not index)

The ticket index on this branch worktree is known-unreliable (see Warning 1), so the
zero-story claim was **not** taken from a `--filter` query. Every story ticket was
fetched individually by UID and its `capability_uid` read from the record:

| capability_uid | Stories |
|---|---|
| `capability-aa030c83` | STORY-75, STORY-76, STORY-77, STORY-78, STORY-79 |
| `capability-ae9d65d6` | STORY-80, STORY-81, STORY-82, STORY-83, STORY-85 |
| `capability-2049c9ec` | STORY-84, STORY-86 |
| **`capability-ac7ca849`** | **(none)** |

12 unique story UIDs, 12 accounted for, **none** pointing at this capability.

ACs reach a capability only transitively via `story_uid` — AC tickets carry no
`capability_uid` of their own (verified on all 7 ACs formerly in this capability's
tree: fields are `story_uid`, `kind`, `regression_only`, `uat_coverage`). With no
story owning this capability, no AC and no UAT can resolve to it. The proof is
transitive and complete.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-19 | Originating intent (REQ-58 pass-3, plan item 5): boolean `--multi-viewport` parsing; `--json` stdout hygiene; render diagnostics to stderr; stdout restored on failure | YES |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Store-selecting flags propagate into driven render/serve | YES |
| BUNDLE-9 (`bundle-cceaba25`) | free_and_reconciled | 2026-07-29 | Quiet bootstrap: "Missing pages directory" suppressed at origin on both streams; Astro container built only for pages carrying behavior modules | YES |
| Structural rebalance (`report-bdaf6840`) | applied | 2026-08-05 | Reassigned STORY-79 to `capability-aa030c83`; emptied this capability | YES (retires this capability as a matrix node) |

The behavior itself is **not** retired — it lives on, fully intact, under the survivor
capability. What the rebalance retired is this capability's role as an owner of intent.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| (none) | — | — | Capability owns no stories after the 2026-08-05 rebalance |

The sole former member, STORY-79 (`story-e15a19ef`, intent `bundle-ab9e0cb6`, last
updated by `bundle-cceaba25`), now sits under `capability-aa030c83` and is assessed
in that capability's scope, not here. Its 7 ACs (AC-656, AC-657, AC-658, AC-659,
AC-720, AC-738, AC-739) travel with it.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | CAP-66 | capability-deprecate | Capability is empty but still `status: active`. Deprecation was attempted by the rebalance and blocked: `reject_deprecation_if_capability_has_stories` → `attached_story_ids()` reads the ticket index, which on a branch worktree resolves to the canonical main store holding pre-merge `capability_uid` values, so it reports phantom attached stories | No action available in this scope. Flip to `status: deprecated` once the index defect is fixed and the reassignment has landed in the canonical store |

**Zero violations. Zero needs_review.** Nothing here requires a uat-add, uat-edit,
ac-add, ac-deprecate, or story-body-edit.

## Notes for the Editor

**Do not treat the index as evidence on this worktree.** Two concrete symptoms
observed this run, both consistent with the defect the rebalance report flagged:

- `xgd ticket list --type story --filter fields.capability_uid=capability-ac7ca849`
  returns **1 ticket** (STORY-79) — a phantom. The record itself says
  `capability_uid: capability-aa030c83`. The filter is matching a stale index entry.
- `xgd ticket list --type story` returns **two entries for STORY-79** (one stamped
  `2026-08-05`, one `2026-07-29`) resolving to the same UID `story-e15a19ef`, and
  `xgd ticket get STORY-79` fails outright with "Ticket ID not found" — human-ID
  lookup is broken by the duplication. Fetching by **UID** works and is authoritative.

The same duplication affects capabilities (22 entries for 11). Any editor pass that
reads membership from a `--filter` query on this branch will act on stale data. Fetch
by UID and read `capability_uid` off the record.

**One item to carry into the survivor's scope, not fixable here:** AC-738 and AC-739
(both from BUNDLE-9, 2026-07-29) carry **no `uat_coverage` field at all**, while the
other five ACs on STORY-79 are marked `pass`. They are now under
`capability-aa030c83`, so they are out of this scope — but that capability's coverage
check should not mistake an absent field for a verdict.
