---
uid: report-e3ad52ca
id: REPORT-846
type: report
title: Fix 1c Gradient Fidelity (uat) — attempt 1
created_by: xgd
created_at: '2026-07-23T11:16:13.160273+00:00'
updated_at: '2026-07-23T11:16:13.160273+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-36dd68c5
  level: uat
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — 1c Gradient Fidelity (uat)

**Attempt**: 1
**Fixes applied this call**: 4
**Violations remaining**: 0
**Needs more work**: false

## Root cause (single violation, Finding #1)

AC-637 asserted a **render** — text-block content into a padded/rounded/inset
gradient panel — whose only vehicle, the `text-block` module, was deleted by
REQ-84 (framework pivot). REQ-62's out-of-scope forbade re-homing that render on
any other module, so the behaviour has neither implementation nor test, and the
claimed `test_UAT_AC637_*` never existed. Per the report's Suggested edit, the
render clause is retired intent; the fix re-scopes AC-637 to the **surviving**
authoring seam (`resolveSurfaceGradient`) and lands a properly-named UAT there,
with the companion STORY-76 body scrubbed so a future story-level pass sees no
drift.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-637 (acceptance_criterion-377af866) | Re-scoped Criterion + Verification from the retired text-block padded/rounded/inset render to the surviving `resolveSurfaceGradient` seam: a `gradient` content value (direction + ≥2 stops) resolves to `background-image: linear-gradient(...)` (absolute-or-overlay stops), and resolves to no fill when under-specified. No render/geometry re-asserted. |
| 2 | story-body-edit | STORY-76 (story-82eb6908) | Dropped the "text-block `panelGradient` … padded, rounded, inset panel" render language from §2 *Authored* bullet and the *In scope* line; reframed *Out of scope* to state no module currently owns a padded/rounded/inset gradient-panel render (resolver exported but unhomed). Everything else preserved verbatim. |
| 3 | uat-edit | AC-637 test | Renamed the sole resolver test `test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay` → `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (mandatory AC-traceable name) and extended it to also assert the under-specified single-stop → empty-declaration case my re-scoped Verification added. Calls the real `resolveSurfaceGradient` (no mocking). Passes. |
| 4 | matrix | AC-637 | Set `uat_coverage: pass` now that the traceable UAT exists. |

## Verification

- `npx vitest run tests/req62-gradient-panel.test.ts` → **8 passed** (incl. the
  real-Chromium capture UAT; the new AC637 test among them).
- No stale references to the old test name remain (`grep` clean — clean rename,
  not a duplicate).
- Resolver confirmed at `packages/framework/src/modules/text-style.ts:257`; it
  emits only `background-image: linear-gradient(...)` with no panel geometry, so
  the re-scoped AC does not re-assert padded/rounded/inset (honouring the report's
  "Resolver has no panel geometry" note).

## Code Edits (if any)

None to production code. Test-only edit to `tests/req62-gradient-panel.test.ts`
(rename + one added assertion). `resolveSurfaceGradient` behaviour was already
correct and untouched.

## needs_review Items Forwarded

None.

## Non-blocking (Finding #2, warning — not actioned)

Exclusivity warning: AC-636 / AC-638 diff+validation scenarios are covered in
both `tests/reconcile-gradient-first-class.test.ts` and
`tests/req62-gradient-panel.test.ts`. The report classifies this **opportunistic,
non-blocking** — the req62 file carries unique real-Chromium capture UATs nothing
else covers, and the two naming schemes give AC-vs-REQ traceability. Left as-is
per the report; a future consolidation should keep one canonical assertion per
scenario and preserve the capture UATs.
