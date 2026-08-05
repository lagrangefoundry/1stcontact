---
uid: report-82fa8c87
id: REPORT-1295
type: report
title: 'Capability-Intent Alignment: reproduction-gate-3probe (level=ac)'
created_by: xgd
created_at: '2026-08-05T19:11:12.391933+00:00'
updated_at: '2026-08-05T19:11:12.391933+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: reproduction-gate-3probe
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Summary

CAP-73 (`capability-8108afab`) was **absorbed into CAP-71**
(`capability-2049c9ec`, "L1 Reproduction Pipeline: Fold & Acceptance Gate") in the
2026-08-05 structural rebalance. It carries `fields.merged_into:
capability-2049c9ec` and its body documents the absorption explicitly.

**Its story tree is empty, therefore its AC layer is empty.** There are zero ACs
in scope for this check, so consistency, coverage, and exclusivity are all
vacuously satisfied at the `ac` level. The AC surface that formerly hung under
this capability is now owned by CAP-71 and is validated under that capability's
own cycle.

## Verification performed

The stale-index defect named in the capability body made the naive query
misleading, so ownership was confirmed against authoritative ticket reads rather
than index listings:

| Check | Command | Result |
|---|---|---|
| Sole story's true owner | `xgd ticket get story-24098299` | `capability_uid: capability-2049c9ec` — **not** this capability |
| ACs pointing at this capability | `list --type acceptance_criterion --filter fields.capability_uid=capability-8108afab` | `[]` — zero |
| AC ownership | `list --type acceptance_criterion --filter fields.story_uid=story-24098299` | 11 ACs, all reachable only via CAP-71 |
| Archived stories | `list --type story --filter ... --archived` | same single stale row, no distinct ticket |

The 11 ACs now under CAP-71 are: AC-705, AC-706, AC-707, AC-708, AC-709, AC-710,
AC-724, AC-734, AC-735, AC-736, AC-737.

## Cumulative Intent Considered

| Intent ID | Status | Asked / changed | Counts? |
|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled (`merged_at_commit edeb1c2c`) | Originating intent for STORY-86 and the 3-probe gate AC tree | YES — but now expressed under CAP-71 |
| BUNDLE-8 (`bundle-cceaba25`) — BUG-7 + REQ-91 + REQ-89 + REQ-90 + REQ-92 + 5 more | free_and_reconciled (`merged_at_commit b1bd5b6b`) | `updated_by` on STORY-86; refined evaluator flow-direction and half-open breakpoint behaviour (AC-734..737) | YES — now expressed under CAP-71 |

Both reconciled intents remain fully expressed in the matrix; the rebalance moved
*where* they are expressed without retiring or orphaning any behavior. No intent
in the ledger asks for behavior that is now unexpressed.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| capability-8108afab (CAP-73) | BUNDLE-7, BUNDLE-8 (historically) | absorbed — zero stories, zero ACs; retained as historical pointer per `merged_into` |
| — no ACs in scope — | — | vacuous pass at `ac` level |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | — | capability-8108afab | — | Capability correctly absorbed into CAP-71; body documents the move and `merged_into` is set. Empty AC layer is intended state, not drift | none |
| 2 | info | — | capability-8108afab | — | `status` is still `active` rather than `deprecated`. The body records this as blocked by a ticket-index defect during the rebalance run, not as an alignment decision. Capability-level concern, out of scope at `ac` level | none at this level — see Notes |
| 3 | info | — | story-24098299 (STORY-86) | — | A stale index row still returns STORY-86 for `fields.capability_uid=capability-8108afab` (indexed `updated_at` 2026-07-29 vs authoritative 2026-08-05). Tooling/index defect, not matrix-intent drift | none at this level — see Notes |

## Notes for the Editor

**No AC-level edits are required for this capability. Do not author, deprecate, or
edit ACs under CAP-73** — it owns none, and any AC created here would duplicate
CAP-71's tree and reintroduce an exclusivity violation the rebalance just resolved.

Two carried-forward defects are recorded here as drift-prevention context. Neither
is repairable by an AC-level matrix edit, and neither maps to any resolution
category in the taxonomy (they are XGD tooling/state issues, not story/AC/UAT
content issues):

1. **Stale ticket-index row for STORY-86.** `xgd ticket list --type story --filter
   "fields.capability_uid=capability-8108afab"` still returns STORY-86, while the
   authoritative `xgd ticket get story-24098299` reports `capability_uid:
   capability-2049c9ec`. The index holds two rows for the same UID with different
   `updated_at` stamps (2026-07-29 and 2026-08-05); the `--archived` variant
   returns the same stale row. **Any future check that trusts the filter query
   over a direct ticket read will conclude CAP-73 still owns STORY-86 and may
   double-process its 11 ACs under two capabilities.** This is the same defect the
   rebalance report cites as blocking the `deprecated` status transition.

2. **CAP-73 remains `status: active` with `merged_into` set.** Until the index
   defect is resolved and the status can be moved to `deprecated`, this capability
   will keep being scheduled for validation cycles that have nothing to validate.
   Resolving (1) should unblock (2).

Both belong to the XGD tooling layer (index rebuild / status transition), so they
are surfaced here for the operator rather than filed as matrix work.
