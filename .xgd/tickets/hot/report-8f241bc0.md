---
uid: report-8f241bc0
id: REPORT-899
type: report
title: 'Capability-Intent Alignment: 1c Gradient Fidelity (level=uat)'
created_by: xgd
created_at: '2026-07-24T07:21:44.860527+00:00'
updated_at: '2026-07-24T07:21:44.860527+00:00'
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

Attempt 3 (previous_attempt_count=2). Re-run triggered because today's `ac`-level
cycle FAILED (report-ef3cb592, 2026-07-24) on the AC-637 title residue, which
invalidates downstream reasoning and re-drives the `uat` level. This report
assesses UAT evidence validity/coverage only; the AC-637 title fix is owned by
the `ac` level, not here.

## Cumulative Intent Considered

Single story (STORY-76 / story-82eb6908, `story_kind=feature`, status=completed),
`intent_uid=bundle-ab9e0cb6`. The bundle carries the two intents that make up
this capability's scope (REQ-58/REQ-61 in the same bundle concern the
gigabytealchemy re-import and responsive-diff, not gradient fidelity).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 (via bundle-ab9e0cb6) | reconciled (intent of a completed story; landed) | ~2026-07-16 | Capture text-fill gradient **stop positions**; `values-diff` compares offsets within ±2pp; absent offsets compared on colour only | YES |
| REQ-62 (via bundle-ab9e0cb6) | reconciled ("landed, free-coded" 2026-07-16) | ~2026-07-16 | Capture + resolver-render + diff a panel/card **surface** gradient (`resolveSurfaceGradient` → `background-image: linear-gradient(...)`); a `surfaceGradient` diff axis; a `gradient` content-field value | YES |

**Cumulative intent:** capture + diff of text-fill stop positions (REQ-59);
capture + shared-resolver render + diff of a panel/card surface gradient, plus a
gradient content-field value (REQ-62). REQ-62 scopes only the *shared* resolver
rendered as a card/panel background — NOT homing that fill as a padded/rounded
render on a specific module. STORY-76's "Out of scope" clause states this
explicitly. (Level priority respected: at `uat` the AC criterion/verification are
the working reference; intent consulted only to confirm the AC-637 title residue.)

## Alignment Ledger (test → AC)

Each active AC has ≥1 substantive UAT exercising real exported code paths
(`diffManifests`, `resolveSurfaceGradient`, `validateModuleContent`) — no internal
mocking; the only mock-free "external" seam is a local HTTP fixture server for the
real-Chromium capture. All 12 UATs across the two files pass (`vitest run`,
2026-07-24, Chromium available so the `runIf` capture tests executed, not skipped).

| AC | UAT (file) | Exercises criterion? | Outcome |
|---|---|---|---|
| AC-634 (text-fill stop-position drift → gradient delta, ±2pp) | `test_UAT_AC634_text_fill_gradient_stop_position_drift_flags` (reconcile-gradient-first-class) | Diffs wordmark mid-stop 60% vs 40% → gradient delta; 60 vs 61 (sub-±2pp) → no delta | aligned |
| AC-635 (offset-less stops compared on colour only) | `test_UAT_AC635_positionless_stops_compared_on_colour_only` (reconcile-…) | both-null and one-null offset pairs, identical colours+direction → no delta | aligned |
| AC-636 (missing/differing surface gradient → delta; matching/absent → none) | `test_UAT_AC636_surface_gradient_present_vs_missing_flags` (reconcile-…) + `test_UAT_FC_REQ-62_{surface_gradient_missing,matching,both_null}_*` and real-Chromium `..._capture_records_panel_gradient_and_solid` (req62-gradient-panel) | all three sub-cases (missing/matching/neither); capture records BOTH gradient and composited solid | aligned |
| AC-637 (criterion: `resolveSurfaceGradient` → `background-image: linear-gradient(...)`, absolute-or-overlay stops, <2 stops → no fill) | `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (req62-gradient-panel) | asserts `linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)` and `''` for a single stop — exactly the criterion; nothing about a text-block/padding/rounding | **criterion aligned; test correctly scoped.** Title residue is an `ac`-layer issue (see warning) |
| AC-638 (gradient value: accept well-formed, reject non-gradient with field name) | `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` (reconcile-…) + `test_UAT_FC_REQ-62_validation_{accepts,rejects}_*` (req62-…) | accepts `{angleDeg:'to-br', stops:['#f1f5f9','accent']}` → []; rejects string / malformed object naming `panelGradient` | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-637 | ac-edit (owned at `ac` level) | AC-637's **title** ("A text-block authored with a gradient panel renders a padded, rounded panel with that gradient surface") claims a module-specific padded/rounded render STORY-76 marks out of scope. This is a title/body mismatch, NOT a UAT defect: the AC criterion+verification are in-scope and `test_UAT_AC637_...` exercises exactly the resolver criterion. It surfaced as a `uat`-level **warning** in report-a01aa75c (2026-07-23) and is now a `uat`-level **violation** at the `ac` level in report-ef3cb592 (2026-07-24). Recorded here as a warning for ledger continuity; it is not counted as a `uat` violation because no test is missing and none exercises the wrong behaviour. | None at `uat` level. The fix (reword AC-637 title to match its criterion) is the sole `ac`-level violation in report-ef3cb592 — do NOT add a text-block gradient-panel render (out of scope; would be new capability). |

## Notes for the Editor

- **UAT layer is complete and green.** 5/5 active ACs covered by substantive UATs
  exercising real code; 12/12 tests pass (incl. real-Chromium capture). No `uat`
  add/edit needed.
- **Do not fix the title here.** The AC-637 title reword is an `ac`-level edit,
  already the single violation of the current `ac` cycle (report-ef3cb592). Fixing
  it there clears the cascade and this `uat` warning resolves with it. No code or
  test change is warranted — resist "making the title true" by authoring the
  out-of-scope module render.
- **No exclusivity issue.** The `test_UAT_FC_REQ-62_*` UATs (real-Chromium capture,
  synthetic-manifest diff, content-validation) are different-shape supplementary
  evidence for AC-636/AC-638, not same-shape duplicates of the `test_UAT_AC6xx_*`
  tests. AC-634 (offset drift) and AC-635 (absent-offset colour-only) are distinct
  scenarios. AC-636's surface-*gradient* axis is distinct from CAP-63's solid
  `surfaceFill` axis (both asserted in the capture UAT).
