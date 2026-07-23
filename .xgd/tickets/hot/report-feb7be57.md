---
uid: report-feb7be57
id: REPORT-845
type: report
title: 'Capability-Intent Alignment: 1c Gradient Fidelity (level=uat)'
created_by: xgd
created_at: '2026-07-23T11:11:02.906953+00:00'
updated_at: '2026-07-23T11:11:02.906953+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-36dd68c5
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Gradient Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-9260fc31. Capability: capability-36dd68c5 (CAP-64). Level: uat.
Upper layers ran and passed first (story report-6992c381: 0 viol / 2 warn; ac report-7a858346: 0 viol / 1 warn), so AC bodies are the working reference — consulted intent only where an AC is contradicted by shipped code.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (request-bc936f38) | free_and_reconciled | ~2026-07 (BUNDLE-6) | Text-fill gradient stop-position capture + values-diff axis (±2pp tol) | YES |
| REQ-62 (request-90edd177) | free_and_reconciled | ~2026-07 (BUNDLE-6) | Panel/card surface gradient: captured, diffed, authored — authoring vehicle = a text-block `panelGradient` render (padded/rounded/inset). Out-of-scope: re-homing the panel field onto modules other than text-block. | YES |
| REQ-84 (request-f243b6b9) | bundled | ~2026-07-20 (framework pivot, REQ-79) | DELETES the semantic layout modules incl. `text-block/` — the vehicle REQ-62 rendered its gradient panel through. Already reflected in code (module dir gone; catalog = carousel + contact-form). | YES (imminent; code already landed) |
| REQ-72 (request-0698bbdf) | ready_to_reconcile | 2026-07-18 | Gradient stop-**colour** capture (hexify oklch/oklab). Flagged at story level; not a uat-level concern for the existing ACs. | imminent |
| BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | merged 7a42e182 | STORY-76's intent_uid (REQ-58/59/62/61). | YES |

Net cumulative picture: text-fill stop-position diff (REQ-59) and surface-gradient capture/diff + gradient-value authoring/validation (REQ-62) are live. The **text-block panel render** REQ-62 used as its authoring vehicle is **retired by REQ-84** and gone from the code; REQ-62's own out-of-scope forbade re-homing that render onto any other module — so no module currently renders a padded/rounded/inset gradient panel.

## Alignment Ledger

| AC (test) | Test file:loc | Exercises AC? | Outcome |
|---|---|---|---|
| AC-634 acceptance_criterion-f338ed5b (`test_UAT_AC634_text_fill_gradient_stop_position_drift_flags`) | tests/reconcile-gradient-first-class.test.ts:62 | Yes — real `diffManifests`; 60→40 drift (>±2pp) flags `gradient`, 60 vs 61 does not | aligned |
| AC-635 acceptance_criterion-a555336c (`test_UAT_AC635_positionless_stops_compared_on_colour_only`) | tests/reconcile-gradient-first-class.test.ts:77 | Yes — both-null AND one-side-null cases diff clean, matching "offset compared only when both sides carry it" | aligned |
| AC-636 acceptance_criterion-72a041dd (`test_UAT_AC636_surface_gradient_present_vs_missing_flags`) | tests/reconcile-gradient-first-class.test.ts:108 | Yes — gradient-vs-flat flags `surfaceGradient`; matching + both-absent do not (all three AC cases) | aligned |
| AC-637 acceptance_criterion-377af866 (claimed `test_UAT_AC637_...`) | — (no such test) | **No** — AC requires rendering a text-block into a padded/rounded/inset gradient panel; only `test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay` (tests/req62-gradient-panel.test.ts:69) exists, asserting the resolver's CSS string only | **gap** — render behavior retired by REQ-84 + untested |
| AC-638 acceptance_criterion-a657c39c (`test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed`) | tests/reconcile-gradient-first-class.test.ts:138 | Yes — real `validateModuleContent`; well-formed clean, string rejected naming the field | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency + coverage | acceptance_criterion-377af866 (AC-637) | uat-edit (cascades to ac-edit + story-body-edit) | AC-637 requires a **render**: "its content renders inside a padded, rounded, inset panel whose background is the specified linear gradient … (not a flat, full-bleed band)." No test exercises this. There is no `test_UAT_AC637_*` in the repo (grep `test_UAT_AC63[4-8]` returns only 634/635/636/638). The sole coverage, `test_UAT_FC_REQ-62_panel_gradient_stops_absolute_or_overlay` (tests/req62-gradient-panel.test.ts:69), asserts `resolveSurfaceGradient(...)` returns exactly `background-image: linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)` — a CSS string, with no render and no padded/rounded/inset assertion. The render vehicle (the `text-block` module) was **deleted by REQ-84** (bundled; `packages/framework/src/modules/text-block/` confirmed gone, catalog now carousel + contact-form), and REQ-62's out-of-scope forbade re-homing the panel field onto another module — so the "padded, rounded, inset panel" behavior has neither implementation nor test. `report-0a245f78` (reconciliation UAT generation) **claims** a `test_UAT_AC637_...` that "renders the panel-gradient padded/rounded/inset box"; that test does not exist. | AC-637's unique claim (the panel render) is retired intent. Re-scope AC-637 to the **surviving** authoring seam — the `gradient` content value resolves absolute-or-overlay stops into a `linear-gradient(...)` surface via `resolveSurfaceGradient` — and point its UAT at that resolver (the existing test_UAT_FC_REQ-62 resolver test, renamed `test_UAT_AC637_*`), OR deprecate the render clause outright. Drop the "text-block … padded, rounded, inset panel" render language from STORY-76 §2 to match (companion story-body-edit). |
| 2 | warning | exclusivity | acceptance_criterion-72a041dd (AC-636) + acceptance_criterion-a657c39c (AC-638) | (opportunistic) | The surface-gradient diff scenario (AC-636) and gradient validation scenario (AC-638) are each covered twice in the same shape: tests/reconcile-gradient-first-class.test.ts (`test_UAT_AC636_*`, `test_UAT_AC638_*`) and tests/req62-gradient-panel.test.ts (`test_UAT_FC_REQ-62_surface_gradient_missing_flags` / `_matching_` / `_both_null_`, and `_validation_accepts_` / `_rejects_`) both call the same `diffManifests` / `validateModuleContent` with equivalent inputs. Not a violation — the req62 file also carries unique real-Chromium capture UATs (`test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid`) that nothing else covers, and the two naming schemes give AC-vs-REQ traceability. | Opportunistic only: if the two files are consolidated, keep one canonical diff/validation assertion per scenario and preserve the unique capture UATs. Non-blocking. |

## Notes for the Editor

- **Cascade origin.** This is fundamentally an ac/story-level drift that surfaced only at uat level. The story-level (report-6992c381) and ac-level (report-7a858346) cycles passed because they compared AC-637 against the STORY-76 body, which still describes the text-block `panelGradient` padded/rounded/inset render — and that story text is internally consistent with the AC. Neither cycle cross-checked against REQ-84's deletion of the text-block module. The uat-level check catches it because the *test* cannot exercise a render whose module no longer exists. The durable fix therefore edits AC-637 and the STORY-76 body (not merely the test), so a future story-level pass sees the drift resolved.
- **Naming-convention miss.** Even setting the retirement aside, AC-637 has no `test_UAT_AC637_*`-named test; its coverage hides under the `test_UAT_FC_REQ-62_*` naming. Per TEST-STRATEGY the `test_UAT_AC{n}` name is mandatory for AC traceability; whatever test lands for the re-scoped AC-637 should adopt it.
- **Resolver has no panel geometry.** `resolveSurfaceGradient` emits only `background-image: linear-gradient(...)`; the padding / border-radius / inset that AC-637 asserts were properties of the deleted text-block render, not of the resolver. A re-scoped AC-637 must not re-assert padded/rounded/inset unless a surviving module is given that render (which REQ-62 out-of-scope currently forbids).
- The other four ACs are cleanly covered by substantive UATs driving the real diff engine and content validator (no internal mocking) — no action.
