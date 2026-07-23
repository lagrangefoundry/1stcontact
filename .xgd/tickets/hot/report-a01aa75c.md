---
uid: report-a01aa75c
id: REPORT-847
type: report
title: 'Capability-Intent Alignment: 1c Gradient Fidelity (level=uat)'
created_by: xgd
created_at: '2026-07-23T11:20:25.241346+00:00'
updated_at: '2026-07-23T11:20:25.241346+00:00'
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

# Capability-Intent Alignment: 1c Gradient Fidelity
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Level: uat. ACs are the working reference; the AC bodies are treated as
correctly aligned to intent (story- and ac-level cycles ran ahead of this one),
and intent history was consulted only where an AC/label looked suspicious
(AC-637). This is fix attempt 2 (previous_attempt_count=1); the attempt-1 fix
report (report-e3ad52ca) was re-read rather than assumed.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (via STORY-76,
intent_uid = bundle-ab9e0cb6 / BUNDLE-6):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 | free_and_reconciled | 2026-07-13 | Capture text-fill gradient stop positions; positionless stops compared on colour only | YES |
| REQ-62 | free_and_reconciled | 2026-07-16 | Capture + render + diff panel/card **surface** gradient; standalone `gradient` content value + shared `resolveSurfaceGradient`. **Out of scope**: homing the resolved fill as a padded/rounded/inset render on a specific module (text-block vehicle deleted by REQ-84) | YES (with an explicit retirement of the module-render clause) |
| BUNDLE-6 | free_and_reconciled | merged @7a42e182 | Reconciled vehicle bundling REQ-58/59/61/62 | YES |

Cumulative current intent for this capability: capture (stop positions +
surface gradient), diff (stop-position axis + surface-gradient axis), and author
(the `gradient` content value resolving via `resolveSurfaceGradient` to a
`background-image: linear-gradient(...)` fill). A padded/rounded/inset
gradient-panel **module render** is explicitly NOT in current intent.

## Alignment Ledger

Per active AC: its UAT, the intent it evidences, and the alignment outcome.

| Element | UAT (file) | Intents aligned to | Outcome |
|---|---|---|---|
| AC-634 (stop-position drift flags) | test_UAT_AC634_text_fill_gradient_stop_position_drift_flags (reconcile-gradient-first-class.test.ts) | REQ-59 | aligned — drives real `diffManifests`; asserts drift (20pp) flags and within-tolerance (1pp) does not |
| AC-635 (positionless → colour-only) | test_UAT_AC635_positionless_stops_compared_on_colour_only (reconcile-…) | REQ-59 | aligned — both-null and one-null cases, real `diffManifests` |
| AC-636 (surface-gradient present/missing) | test_UAT_AC636_surface_gradient_present_vs_missing_flags (reconcile-…); also test_UAT_FC_REQ-62_surface_gradient_missing/matching/both_null (req62-gradient-panel.test.ts) | REQ-62 | aligned — missing/matching/neither triad, real `diffManifests` |
| AC-637 (gradient value → surface fill) | test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay (req62-…) | REQ-62 | aligned to the re-scoped **body/criterion** (resolver); AC **title** is stale — see Finding #1 |
| AC-638 (gradient field accept/reject) | test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed (reconcile-…); also test_UAT_FC_REQ-62_validation_accepts/rejects (req62-…) | REQ-62 | aligned — real `validateModuleContent` on a synthetic gradient meta |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-637 (acceptance_criterion-377af866) | ac-edit | The AC **title** still reads "A text-block authored with a gradient panel renders a padded, rounded panel with that gradient surface" — the retired text-block module-render behaviour that REQ-62 (free_and_reconciled) puts explicitly out of scope and that attempt-1 (report-e3ad52ca) scrubbed from the AC **body**, the STORY-76 body, and the test name. The criterion/verification and the UAT (test_UAT_AC637_*) correctly cover only the surviving `resolveSurfaceGradient` seam. The title is a stale label, not a coverage or evidence defect, so it does not invalidate the UAT. | Rewrite the AC-637 title to match the re-scoped body, e.g. "A gradient content value resolves to a panel surface `background-image: linear-gradient(...)` fill (absolute-or-overlay stops); under-specified → no fill". |
| 2 | info | exclusivity | AC-636 / AC-638 | — | Each is covered by both an AC-named reconciliation UAT and a parallel `test_UAT_FC_REQ-62_*` free-coding UAT of similar shape. This is the codebase's intentional dual-track (FC-ceremony evidence for the framework change + AC-matrix evidence), not redundant duplication — the FC tests also add real-Chromium capture coverage the AC tests do not. No action. | none |

## Notes for the Editor

- **Attempt-1 residue.** report-e3ad52ca (fix attempt 1) reported violations_remaining=0 after re-scoping AC-637's Criterion+Verification and STORY-76 body away from the deleted text-block render. It updated the body but not the **title** field of AC-637 — this is exactly the "previous fix did not fully resolve" residue the attempt-2 preamble warns about. The remaining drift is cosmetic (a title/body mismatch), which is why this level is PASS-with-warning rather than FAIL: the UAT evidence and coverage are complete and correctly scoped.
- **No code issue.** `resolveSurfaceGradient` (packages/framework/src/modules/text-style.ts:257) emits only `background-image: linear-gradient(...)` with no panel geometry — consistent with the re-scoped AC-637 asserting no padded/rounded/inset render. `validateModuleContent` (validate.ts:254) and `diffManifests` (values-diff.ts:1697) exist and are exercised by real calls. No `code-issue` findings.
- **UAT substance.** All five UATs hit real entry points (exported diff engine, resolver, content validator) — none is a structural/AST-only check; the req62 suite additionally drives a real Chromium capture. No internal mocking observed.

