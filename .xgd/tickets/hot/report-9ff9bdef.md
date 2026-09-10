---
uid: report-9ff9bdef
id: REPORT-3733
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (uat) — attempt
  7 (cont.): Finding 5 closed'
created_by: xgd
created_at: '2026-09-10T12:45:17.359887+00:00'
updated_at: '2026-09-10T12:45:17.359887+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (uat)

**Attempt**: 7 (second call of this attempt — the call before it landed findings 1, 2, 3, 4, 6 and 7 as REPORT-3732 / `report-b1f350ae`)
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

This call closes **Finding 5**, the last open finding in report-96284e49. All 7
findings (2 violations, 5 warnings) from the anchor report are now addressed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | `test_UAT_AC930_*` (`tests/reconciliation-colour-palette-overlay.test.ts:285`) | **Finding 5 (warning, exclusivity), carried since REPORT-1674.** Retargeted at the axis AC-930 uniquely owns and renamed to `test_UAT_AC930_one_entry_serves_every_opacity_and_shade_of_one_colour`. The `cmdColors` / `cmdColorsAssign` conversion drive — the part that duplicated STORY-97's `test_UAT_AC942_*` in shape — is **gone**. What replaces it authors the shape directly: one entry referenced at three alphas validating through the real `validateSite`; the entry-stays-opaque half proven *by the envelope* (a palette entry carrying `#2e86a3a6` is rejected, with the error path naming the palette); each use resolving back byte-for-byte through the real `loadSite` load boundary with no `"ref"` surviving; three distinct literals reaching the document from a single-entry palette. The **whole-byte-range exactness loop was kept**, as the assessor asked, and the opaque-reference case with it |
| 2 | uat-edit (same test, new coverage) | AC-930 ¶4 | The retarget also picks up the criterion's fourth paragraph — *neither reference axis displaces the other* — which **no arm previously asserted**: the same entry referenced at an alpha, at a shade (against the real `shadeHex`), and at both now resolves to the opaque colour at that opacity, the shaded colour opaque, and the shaded colour at that opacity. So the retarget is net-additive on evidence, not merely subtractive |
| 3 | ac-edit | AC-930 (`acceptance_criterion-bec4d585`) | The matching one-line edit the finding called for. Verification's opening sentence no longer *mandates* the conversion drive ("Convert a site's colour literals…" → "Author a document whose colour axes reference one entry at several alphas…", plus the entry-rejection and load-boundary clauses). A closing paragraph states explicitly that the `1c colors` → `1c colors --assign` conversion is AC-942's to verify and that this criterion verifies the value model the conversion targets. Criterion text preserved verbatim |
| — | file-doc | `tests/reconciliation-colour-palette-overlay.test.ts:15` | Header index entry for AC-930 updated to name both axes and to record the AC-930 / AC-942 division of labour, so a later reader does not re-add the retrofit drive |

## Verification run

```
npm test -- tests/reconciliation-colour-palette-overlay.test.ts
 Test Files  1 passed (1)      Tests  5 passed (5)
```

Regression batch over the capability's touched and neighbouring files
(colour-palette-overlay, colour-shade-axis, l1-substrate, reproduction-treatments,
behavior-modules, nowrap-width-floor, behavior-module-escaping,
l1-shared-axis-groups, l1-authoring-envelope, absolute-value-literals):

```
 Test Files  10 passed (10)    Tests  40 passed | 5 skipped (45)
```

The 5 skips are honest engine-gated declarations: AC-683 and AC-688's pre-existing
`it.runIf`, plus the three arms this attempt separated (AC-1009, AC-1011, AC-1012).
Coverage names re-checked after the renames — every AC touched across both calls of
this attempt still carries at least one `test_UAT_AC<n>_*` definition, and AC-1009 /
AC-1011 / AC-1012 / AC-685 now carry two each (split, not duplicate).

## Code Edits (if any)

None this call, and none across the attempt. All 13 mutations were AC bodies or
tests.

## needs_review Items Forwarded

None.

## State of the anchor report's findings

| # | Sev | Status |
|---|---|---|
| 1 | violation | Closed (attempt 7 call 1) — AC-685 narrowed to DOC-2 §2's Layer-2 families; enums stated as a Layer-1 guarantee. Alternative `code-issue` reading noted for the operator, not taken |
| 2 | violation | Closed (call 1) — AC-1012 split into engine-free + `it.runIf` arms; fidelity clause dropped from the AC and cross-referenced to AC-683 |
| 3 | warning | Closed (call 1) — AC-1009 / AC-1011 split the same way; no bare `if (!HAVE_CHROMIUM) return` remains in the file |
| 4 | warning | Closed (call 1) — `doUnmock` path corrected to `…/src/worker`; AC-702 records the substituted-catalog premise and the seam that would retire it |
| 5 | warning | **Closed this call** — see above |
| 6 | warning | Closed (call 1) — AC-686 / AC-687 clauses removed from Verification, cross-referenced to AC-849 / AC-850; no duplicate tests written |
| 7 | warning | Closed (call 1) — `slots.form.required` asserted; retired REQ-87 vocabulary gone from the file (`grep -n capability` → 0 hits) |

Info items 8, 9 and 10 needed no action at this level; Info 9 (the FC-named REQ-93
tests vs the three `pending` ACs) stays a live watch item for whichever cycle
activates AC-1622 / AC-1623 / AC-1624.

## Note for the assessor on what a re-run will look like

Per the anchor report's own Note 3, the success condition for Finding 2 is a
**lower** pass count in `reconciliation-nowrap-width-floor`: it reported
`4 passed (4) … 14ms` before this attempt and reports `4 passed | 3 skipped` now.
That is the fix, not a regression. The three sandbox-blocked UATs
(`test_UAT_AC703_*`, `test_UAT_AC888_*`, the `*.workers` project) were not touched;
`test_UAT_AC703_*` happened to pass in this session's runs rather than hitting
`listen EPERM`.
