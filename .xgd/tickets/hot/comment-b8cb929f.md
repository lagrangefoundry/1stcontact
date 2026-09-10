---
uid: comment-b8cb929f
id: COMMENT-2548
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T15:09:12.075228+00:00'
updated_at: '2026-09-10T15:09:12.075228+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4dffa7f4
  kind: note
---

**Attempt 7 complete — 5 findings closed, all verified green.** Report: REPORT-3749 (`report-4dffa7f4`).

## What landed

| Finding | AC | Mutation |
|---|---|---|
| **v1** (priority) | AC-1630 | New `test_UAT_AC1630_pinned_box_content_overflow_is_reported` — the capability's only criterion with zero evidence anywhere now has a UAT covering all of its Verification |
| **v10** | AC-710 | `test_UAT_AC710` gained the third forced violation; its clip assertion tightened from `/\d+px/` to the viewport-edge shape |
| **v8** | AC-691 | Both halves: text-leaf `height === undefined` invariant + media/panel height pinning; widest-sample assertion moved onto a new constant-typography run with the no-track negative |
| **v9** | AC-689 | `signalsFor()` gained a media element and a painted panel; multi-kind asserted on the bundle's `l1.json` |
| **v6** | AC-1629 | New `test_UAT_AC1629_band_scrim_folds_onto_the_section_background_box`, incl. the per-axis widest-sample clause BUG-24's tests never closed |

Violations 8 and 9 were on their fifth report against `tests/reconciliation-l1-fold.test.ts`, untouched since 2026-07-22 — that file is now repaired.

**Verification:** all seven AC-traced files run — **36 tests, all passing** (was 34; the two new UATs are the delta, nothing regressed).

## Two judgment calls worth flagging

- **AC-1630's test closes on `toHaveLength(1)`, not `.some(…)`**, and the fixture card is 300px wide so the horizontal viewport clip physically cannot fire and stand in for the violation. `probes.ts:410` can no longer be deleted silently.
- **I did not set `uat_coverage` on AC-1629/AC-1630**, despite the prompt's step 6 suggesting it. That field is owned by `check`/`fix_uat_coverage`, and setting it here would have this loop asserting a verdict the assessor is about to compute from the tests. The tests are landed and green — flagged in the report in case the workflow expects otherwise.

## Remaining: 5 violations

All are the workstream-A consolidation jobs — AC-1625, AC-1626, AC-1627, AC-1628, AC-1631 — each an AC-traced UAT lifting assertion shapes from an existing `test_UAT_FC_*` file plus one or two clauses those don't close. Per the report's info 18, AC-1625's UAT is where the positive responsive-track case belongs; I deliberately kept it out of `test_UAT_AC691` to avoid manufacturing the duplicate this level exists to prevent. Four warnings (11–14) also remain. `needs_more_work: true`, `progress_made: true`.
