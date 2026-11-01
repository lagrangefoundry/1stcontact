---
uid: report-ecc53467
id: REPORT-900
type: report
title: 'UAT Coverage: 1c Gradient Fidelity'
created_by: xgd
created_at: '2026-07-24T07:27:49.116641+00:00'
updated_at: '2026-07-24T07:27:49.116641+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-36dd68c5
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Gradient Fidelity

**Result**: PASS
**AC verdicts**: 5 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

All stories under CAP-64 trace to a single reconciled bundle, BUNDLE-6.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58/59/62/61) | free_and_reconciled | 2026-07-19 (merged 7a42e18) | REQ-59: capture text-fill gradient stop *positions*; values-diff compares positions at ±2pp; absent offsets → colour-only. REQ-62: capture + diff + author a panel *surface* gradient (surfaceGradient axis, `resolveSurfaceGradient`, `gradient` content-field type). | YES |
| REQ-84 (referenced) | reconciled (per story body) | — | Retired the semantic *layout* modules (text-block/hero/…); no module currently homes a rounded/inset gradient-panel render. | YES (retired the module-homing behaviour) |

The current cumulative intent: gradients are a first-class captured/diffed/authored **value** — stop positions on text-fill gradients, and a panel **surface** gradient (capture, `surfaceGradient` diff axis, shared `resolveSurfaceGradient` resolver, `gradient` content-field). Homing that resolver as a specific module's padded/rounded panel render is explicitly **out of scope** (the module was retired by REQ-84); the resolver is exported for any surface.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-76 | BUNDLE-6 (REQ-59, REQ-62) | aligned | Body describes only value-level behaviour (capture/diff/author); correctly declares module-homing + radial/conic + solid surfaceFill out of scope. No stale claims. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-637 | ac-edit (title) | AC *title* reads "A text-block authored with a gradient panel renders a padded, rounded panel…" — the module-render behaviour REQ-84 retired and the story body lists as out of scope. The AC *criterion* and its test correctly cover the in-scope shared `resolveSurfaceGradient` resolver (absolute-or-overlay stops, <2 stops → no fill). | Retitle AC-637 to describe the resolver behaviour (e.g. "A gradient content value resolves to a panel surface `background-image` fill, absolute-or-overlay"); do NOT change the criterion or test. |

No violations, no needs_review.

## Evidence Verified (per AC)

Tests drive real production entry points — the exported diff engine (`diffManifests`, the same path the `1c` CLI runs), the real content validator (`validateModuleContent`), the shared resolver (`resolveSurfaceGradient`), and a real Chromium capture (`cmdCapturePage`/`flattenCapture`). No internal component is mocked; only the local fixture HTTP server is a boundary. Ran `vitest run` on both files: **12 passed / 12** (incl. browser capture tests).

| AC | Test | Verdict | Substance |
|---|---|---|---|
| AC-634 | `test_UAT_AC634_text_fill_gradient_stop_position_drift_flags` (reconcile-gradient-first-class.test.ts) | pass | 60% vs 40% middle stop (20pp) → gradient delta; 60 vs 61 (1pp, within ±2) → none. Distinguishes correct/incorrect tolerance handling. |
| AC-635 | `test_UAT_AC635_positionless_stops_compared_on_colour_only` | pass | Both-null and one-null offset cases both diff clean on identical colours+direction — covers "one or both sides" of the criterion. |
| AC-636 | `test_UAT_AC636_surface_gradient_present_vs_missing_flags` | pass | present-vs-flat → surfaceGradient delta; matching → none; neither → none. All three criterion cases. |
| AC-637 | `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (req62-gradient-panel.test.ts) | pass | `resolveSurfaceGradient` returns `linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)` (literal + role overlay); single stop → `''`. Matches criterion body. Title stale (finding #1). |
| AC-638 | `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` | pass | Well-formed gradient → no errors; non-object string → error naming `panelGradient`. |

## Notes for the Editor

Single low-risk item: AC-637's title predates REQ-84 (it still names the text-block panel render) while every load-bearing part — criterion, verification, and test — already targets the surviving `resolveSurfaceGradient` seam. This is title-only drift; the coverage is genuine and green. A one-line retitle closes it. No UAT work, no deprecation, no code change is warranted for this capability.

Note for the outer workflow: `.xgd/uat_index.json` reported all five tests as `status: missing` in this fresh regression worktree; direct source inspection + a live `vitest run` confirm all five exist and pass. Coverage verdicts here are grounded in the actual test bodies and run, not the stale index.
