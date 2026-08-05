---
uid: report-c6ed5d6e
id: REPORT-1312
type: report
title: 'Capability-Intent Alignment: gradient_fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-05T20:15:26.318337+00:00'
updated_at: '2026-08-05T20:15:26.318337+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-36dd68c5
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: gradient_fidelity
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Summary

`capability-36dd68c5` (CAP-64) holds **zero stories**, therefore zero ACs, therefore
**zero UATs**. The uat-level element set for this capability is empty, so consistency,
coverage, and exclusivity are vacuously satisfied at this level.

Its sole story STORY-76 (`story-82eb6908`) was reassigned to `capability-aa030c83`
(CAP-63, `1c_capture_diff_fidelity`) by the 2026-08-05 structural rebalance, taking its
five ACs (AC-634…AC-638) and their UATs with it.

**No gradient intent is left unproven.** All five ACs have substantive UATs that drive real
entry points, and they were **executed in this run and pass** — see Test Evidence below.
Verified independently by locating and reading each test body and running the suite, not by
inheriting the ac-level report.

The outstanding drift for this capability is the **un-retired husk** (`status: active`, body
still asserting ownership, dangling rebalance-report citation) plus a **ticket-index defect**.
Both are capability/story-level concerns already recorded as four violations in REPORT-1310
(`report-292d4308`, level=story, FAIL, same cycle) and are **not** re-counted here.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-59 | `request-bc936f38` | free_and_reconciled | 2026-07-13 | `1c capture`: record gradient stop positions (text-fill gradients) | YES |
| REQ-62 | `request-90edd177` | free_and_reconciled | 2026-07-16 | Gradient panel fill: capture + render + diff a background gradient (not just text fills) | YES |
| BUNDLE-6 | `bundle-ab9e0cb6` | free_and_reconciled | merged `7a42e182` | Carrier bundle (REQ-58+59+62+61); recorded `intent_uid` on CAP-64 and STORY-76 | YES |
| Structural rebalance | — | 2026-08-05 | Reassigned STORY-76 to CAP-63; set `merged_into`; appended ABSORBED note | Operational (no intent ticket) |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`. All gradient behavior asked
for by REQ-59 and REQ-62 is active intent and must remain expressed — and it is, under CAP-63.

## Alignment Ledger

Elements in uat-level scope for `capability-36dd68c5`: **none** (no stories → no ACs → no UATs).
Recorded below is where the capability's UAT evidence now lives.

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-64 `capability-36dd68c5` | REQ-59, REQ-62 via BUNDLE-6 | **empty at uat level** — zero stories, zero ACs, zero UATs; nothing to validate |
| STORY-76 `story-82eb6908` | REQ-59, REQ-62 | **out of scope** — `capability_uid: capability-aa030c83` (authoritative per-UID read) |
| `test_UAT_AC634_text_fill_gradient_stop_position_drift_flags` | REQ-59 | aligned (under CAP-63) — exercises AC-634; 20pp drift flags, 1pp within ±2pp tolerance does not |
| `test_UAT_AC635_positionless_stops_compared_on_colour_only` | REQ-59 | aligned (under CAP-63) — exercises AC-635; both-null and one-null cases, neither fabricates a delta |
| `test_UAT_AC636_surface_gradient_present_vs_missing_flags` | REQ-62 | aligned (under CAP-63) — exercises AC-636; missing→delta, matched→none, both-absent→none |
| `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` | REQ-62 | aligned (under CAP-63) — exercises AC-637; absolute hex + palette-role overlay, <2 stops → empty fill |
| `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` | REQ-62 | aligned (under CAP-63) — exercises AC-638; well-formed accepted, non-object rejected with field-identifying error |

**Consistency**: vacuous — no UATs in scope. (Out-of-scope check: each of the five AC UATs was
read and does exercise the behaviour its AC claims — no shape mismatch found.)
**Coverage**: no gap — every active AC (AC-634…AC-638) has at least one substantive UAT.
**Exclusivity**: vacuous in scope; one same-shape overlap observed under CAP-63 (finding #4).

## Test Evidence

Located via the `test_UAT_AC<number>_*` convention; run in this session:

```
npx vitest run tests/reconcile-gradient-first-class.test.ts tests/req62-gradient-panel.test.ts
Test Files  2 passed (2)
Tests  10 passed | 2 skipped (12)
```

- All five AC-numbered UATs (AC-634…AC-638) **ran and passed**.
- The 2 skipped tests are `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid` and
  `test_UAT_FC_REQ-62_text_fill_gradient_not_a_surface_gradient`, gated behind
  `it.runIf(chromiumAvailable())`. They are FC free-coding tests, **not** AC-numbered UATs, so
  no acceptance criterion is left unexercised by their skip. Chromium is unavailable in this
  environment.
- **Substantive, not structural**: the UATs drive real entry points — `diffManifests` (the
  exported diff engine the `1c` CLI itself runs), `validateModuleContent`, and
  `resolveSurfaceGradient`. No AST/structural assertions, no internal mocking.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | CAP-64 `capability-36dd68c5` (`fields.uat_coverage: pass`) | story-body-edit | This is the **uat-level field of the husk**: the capability asserts `uat_coverage: pass` while owning zero UATs. The claim is vacuously true, not false, so it is not a violation — but read at face value it implies a passing UAT surface under CAP-64 that does not exist. It is a uat-level echo of REPORT-1310's husk violations, not an independent defect. | Resolve via the story-level husk retirement (retire CAP-64, pointer body). Do **not** apply `uat-add`. |
| 2 | info | coverage | AC-634…AC-638 | — | All five ACs `status: active`, each with exactly one AC-numbered UAT, all executed and passing this run. REQ-59 and REQ-62 lose no evidence from the absorption. | none |
| 3 | info | consistency | Ticket index (XGD tooling) | code-issue (already filed) | Index defect confirmed and **wider than previously recorded**. Three symptoms: (a) stale row — `list --type story --filter fields.capability_uid=capability-36dd68c5` returns a phantom STORY-76 (`updated 2026-07-24`) though the authoritative read gives `capability-aa030c83` (`updated 2026-08-05`); (b) **duplicate rows** — `list --type story` returns 21 entries for 12 real stories; (c) human-ID lookup broken for capability/story/AC types — `CAP-63`, `CAP-64`, `STORY-75`, `STORY-78`, `AC-634` all resolve "not found" while their UIDs resolve, though `REPORT-1262` resolves fine. Already recorded as REPORT-1310 finding #4. | none here — see REPORT-1310 |
| 4 | info | exclusivity | `test_UAT_AC636_*` vs `test_UAT_FC_REQ-62_{surface_gradient_missing,matching_surface_gradient_no_flag,both_null_surface_gradient_no_flag}` | — | **Out of scope for CAP-64** (these prove STORY-76 under CAP-63) but flagged for that cycle: `test_UAT_AC636_surface_gradient_present_vs_missing_flags` (`tests/reconcile-gradient-first-class.test.ts:108`) asserts missing→delta / matched→none / both-null→none, and the three `test_UAT_FC_REQ-62_*` tests (`tests/req62-gradient-panel.test.ts:114,122,128`) assert the same three scenarios in the **same shape** (`diffManifests` over the same 135deg `#f1f5f9`→`#e2e8f0` fixture). Same shape, same scenarios — a genuine redundancy, not a unit/integration/browser split. | Consider consolidating during CAP-63's uat cycle; no action for CAP-64 |

## Notes for the Editor

**This PASS is not a statement that CAP-64 is healthy.** It is scoped to the uat level, whose
element set is empty. The husk remains unrepaired: `status: active`, `merged_into:
capability-aa030c83`, no `superseded_by_uid`, zero stories. Those four violations live in
REPORT-1310 (`report-292d4308`) and are the story-level cycle's to close. Passing them through
a third time at uat level would triple-count a single underlying defect.

**The one thing a uat-level editor must not do** is treat the empty UAT set as a coverage gap
and author replacement UATs under CAP-64. The gradient behaviour is already fully proven by
AC-634…AC-638's passing tests under CAP-63; new tests here would duplicate them and create the
exact exclusivity violation this level exists to prevent. The correct action is retiring the husk.

**Methodology — the index defect changes how this level must be queried.** A naive uat-level run
that trusts `xgd ticket list --type story --filter fields.capability_uid=capability-36dd68c5`
sees a phantom STORY-76 and validates five UATs no longer in scope. Emptiness was therefore
established positively, not by trusting the filter: every one of the 12 real stories was read
per-UID and its `capability_uid` recorded — `aa030c83` ×5, `ae9d65d6` ×5, `2049c9ec` ×2, and
**zero** pointing at `capability-36dd68c5`. Any re-run before the index is rebuilt should do the
same. Note also that human-ID lookup is broken for story/AC/capability tickets, so a re-run must
address tickets by UID throughout.

**Attempt history.** `previous_attempt_count: 3`. The current empty-scope state is a consequence
of the 2026-08-05 rebalance, not of an unresolved earlier uat-level finding. Prior uat-level
reports: REPORT-899 (`report-8f241bc0`, 2026-07-24) PASS; REPORT-847 (`report-a01aa75c`,
2026-07-23) PASS; REPORT-845 (`report-feb7be57`, 2026-07-23) FAIL, closed by fix REPORT-846.
No repeat fix attempt at this level is warranted — further cycles on CAP-64 will keep
re-detecting the same husk until the lifecycle transition completes.
