---
uid: report-f2d8131e
id: REPORT-1313
type: report
title: 'UAT Coverage: gradient_fidelity'
created_by: xgd
created_at: '2026-08-05T20:20:56.696569+00:00'
updated_at: '2026-08-05T20:20:56.696569+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-36dd68c5
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: gradient_fidelity

**Result**: PASS
**AC verdicts**: 0 pass, 0 fail, 0 deprecated, 0 needs_review (element set empty)
**Story verdicts**: 0 pass, 0 fail, 0 stale, 0 needs_review (element set empty)
**Capability verdict**: pass

## Summary

`capability-36dd68c5` (CAP-64) holds **zero stories**, therefore zero ACs, therefore zero
UATs. The coverage question is **vacuous at every level** — there is no element in this
capability's scope whose behavioral claim could be uncovered.

Its sole story STORY-76 (`story-82eb6908`) was reassigned to `capability-aa030c83`
(CAP-63, `1c_capture_diff_fidelity`) by the 2026-08-05 structural rebalance, taking all
five ACs (AC-634…AC-638) and their UATs with it. **No gradient intent was lost and none is
left unproven** — verified independently below, not inherited from the ac/uat-level reports.

The residual drift for this capability (un-retired husk + ticket-index defect) is real but
is **not a coverage defect**, and no lever in this workflow's taxonomy (`uat-add`,
`uat-edit`, `ac-deprecate`, `story-body-edit`) resolves it. It is already counted as four
violations in REPORT-1310 (`report-292d4308`, level=story, same cycle) and is recorded here
as warnings rather than re-counted. See "Notes for the Editor".

## Verification Performed

Not inherited — established directly this run:

1. **Story reassignment is real, the index entry is the stale artifact.**
   `xgd ticket list --filter fields.capability_uid=capability-36dd68c5` returns STORY-76
   (`UPDATE:2026-07-24`), but the authoritative record `xgd ticket get story-82eb6908`
   reports `capability_uid: capability-aa030c83` (`updated_at 2026-08-05T17:24:09`). The
   index carries **two entries for the same UID** — a stale shadow under CAP-64 and the
   live one under CAP-63.
2. **No orphaned ACs.** All five ACs carry `story_uid: story-82eb6908`, so they travelled
   with the story. `xgd ticket list --all --filter fields.capability_uid=capability-36dd68c5`
   returns no AC attributed to this capability.
3. **The UATs exist and pass.** Located each test body and executed both suites:
   `npx vitest run tests/reconcile-gradient-first-class.test.ts tests/req62-gradient-panel.test.ts`
   → **10 passed, 2 skipped**. All five AC-traceable UATs passed:

   | AC | UAT | File | Result |
   |---|---|---|---|
   | AC-634 | `test_UAT_AC634_text_fill_gradient_stop_position_drift_flags` | `tests/reconcile-gradient-first-class.test.ts:62` | ✓ |
   | AC-635 | `test_UAT_AC635_positionless_stops_compared_on_colour_only` | `tests/reconcile-gradient-first-class.test.ts:77` | ✓ |
   | AC-636 | `test_UAT_AC636_surface_gradient_present_vs_missing_flags` | `tests/reconcile-gradient-first-class.test.ts:108` | ✓ |
   | AC-637 | `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` | `tests/req62-gradient-panel.test.ts:69` | ✓ |
   | AC-638 | `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` | `tests/reconcile-gradient-first-class.test.ts:138` | ✓ |

   The 2 skipped are `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid` and
   `test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient` — Chromium-gated
   free-coding tests, not AC-traceable UATs (warning 3).

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-59 | `request-bc936f38` | free_and_reconciled | 2026-07-13 | `1c capture` records gradient stop positions (text-fill gradients) | YES |
| REQ-62 | `request-90edd177` | free_and_reconciled | 2026-07-16 | Gradient panel fill: capture + render + diff a background gradient | YES |
| BUNDLE-6 | `bundle-ab9e0cb6` | free_and_reconciled | merged `7a42e182` | Carrier bundle (REQ-58+59+62+61); recorded `intent_uid` on CAP-64 and STORY-76 | YES |
| Structural rebalance | — | 2026-08-05 | Reassigned STORY-76 to CAP-63; set `merged_into`; appended ABSORBED note | Operational (no intent ticket) |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`. All gradient behavior
REQ-59 and REQ-62 asked for remains active intent — and remains expressed, under CAP-63.
Nothing was retired, so no AC here warrants `deprecated`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| _(none in scope)_ | — | — | CAP-64 holds zero stories after the 2026-08-05 rebalance |
| STORY-76 (now CAP-63) | REQ-59, REQ-62 via BUNDLE-6 | aligned — **out of scope here** | Assessed under CAP-63's own `uat_coverage_check`; all 5 ACs verified passing this run |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | CAP-64 (`capability-36dd68c5`) | capability-retire | Absorption left half-finished: `status: active` with zero stories; body still asserts ownership and cites a rebalance report that does not exist | Set `status: deprecated`; trim body to a bare pointer to `capability-aa030c83`. **Already counted as violations in REPORT-1310 — do not double-count** |
| 2 | warning | — | ticket index | tooling-defect (not a matrix edit) | Duplicate index entry for `story-82eb6908` makes CAP-64 appear to still hold STORY-76; separately, human-ID resolution is broken store-wide (`CAP-63`, `CAP-64`, `STORY-75`, `STORY-76`, `AC-634`, `REPORT-900` all fail to resolve — only UIDs work) | Reindex the ticket store. This is the "blocking index defect" CAP-64's own body cites, and is why the husk could not be deprecated |
| 3 | warning | uat | REQ-62 capture UATs | uat-environment (CAP-63 scope) | Two `test_UAT_FC_REQ-62_*` capture tests skip without Chromium, so the capture side of REQ-62 is unexercised in this run | Ensure Chromium is provisioned in the regression environment; assess under CAP-63 |

**Violations: 0. Needs review: 0.** → PASS.

## Notes for the Editor

**There is no UAT authoring work here.** Do not open this capability looking for a coverage
gap to close — the element set is empty and every gradient AC already has a substantive,
passing UAT under CAP-63.

**This capability failed three prior attempts, and the cause is a category error worth
naming.** The defect that keeps surfacing is a *structural* one (an un-retired husk plus a
stale index), not a *coverage* one. The `uat_coverage_check` workflow has no lever that can
fix it — authoring a UAT, editing a UAT, deprecating an AC, or editing a story body all
address elements this capability no longer contains. Continuing to fail this gate re-runs a
workflow that structurally cannot converge. The fix belongs to the rebalance/editor pass
that owns REPORT-1310's four violations, and it is blocked on the index defect (finding 2)
because the husk cannot be retired while the store cannot resolve its ID.

**Recommended order:** reindex the ticket store first (finding 2), then retire the husk
(finding 1). Findings 1 and 2 are recorded here for continuity only — REPORT-1310 is their
authoritative home, and this report deliberately does not re-count them so the same defect
does not inflate the violation total across two report kinds.
