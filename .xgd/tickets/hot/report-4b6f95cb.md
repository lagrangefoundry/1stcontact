---
uid: report-4b6f95cb
id: REPORT-903
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=story)'
created_by: xgd
created_at: '2026-07-24T07:34:29.445858+00:00'
updated_at: '2026-07-24T07:34:29.445858+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-b1a287b0 (regression start f5e08d21). Capability: CAP-65
(capability-18a822ac). Level: story. Previous attempts: 0.

## Cumulative Intent Considered

Both stories in CAP-65 draw from a single reconciled intent bundle. Neither story
carries an `updated_by` chain — the capability tree has exactly one originating
intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | merged @ 7a42e182 | Bundles REQ-58+REQ-59+REQ-62+REQ-61 | YES |
| — REQ-61 (in bundle) | reconciled via bundle | — | `--size` selector on `values-diff` + pixel `diff`; standalone `responsive-diff` N-way cross-size analysis + `--classify` | YES — CAP-65's primary driver |
| — REQ-58 (in bundle) | reconciled via bundle | — | Multi-viewport capture / persisted viewport ladder + per-viewport reference screenshots the `--size` diff work reuses | YES — CAP-65's capture dependency |
| — REQ-59 (in bundle) | reconciled via bundle | — | Text-fill gradient stop positions in capture/values-diff | NO — gradient-diffing capability, not CAP-65 |
| — REQ-62 (in bundle) | reconciled via bundle | — | Panel background gradient capture/render/diff | NO — gradient-diffing capability, not CAP-65 |

CAP-65's slice of the bundle is REQ-61 (size-aware `--size` diffs + `responsive-diff`)
resting on REQ-58's multi-viewport capture. REQ-59 and REQ-62 share the bundle but
land in a different capability (gradient diffing) and are out of scope for this tree.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-77 (story-16f2793c) — Size-aware diffing: `--size` on both diff commands + per-viewport reference screenshots + fail-loud on missing reference data | REQ-61 (size param), REQ-58 (persisted ladder + per-viewport screenshots) | aligned |
| STORY-78 (story-2c7069fe) — Responsive-diff: standalone N-way cross-size node analysis + `--classify` | REQ-61 (responsive-diff command) | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-77 + STORY-78 | — | Together they fully express CAP-65's intent surface: (a) `--size mobile\|tablet\|desktop` on `values-diff` and pixel `diff`, (b) per-viewport reference screenshots at capture time, (c) fail-loud on missing/short reference ladder, (d) standalone `responsive-diff` N-way table with `--classify`/`--sizes`/`--json`/`--out`. No REQ-61/REQ-58 asked-behavior is unexpressed; no retired behavior lingers. | none |
| 2 | info | consistency | STORY-77, STORY-78 | — | REQ-61 prose proposed `--size desktop\|tablet\|phone`; both stories and the shipped CLI use `mobile\|tablet\|desktop`. Not drift: `tools/generate/src/cli/perceptual.ts:388` attributes the `mobile\|tablet\|desktop` vocabulary to REQ-61, so the reconciled shipped reality settled the token as `mobile`. Stories are grounded in the implemented interface (STORY-78 carries an explicit `--ref`-vs-slug divergence note in the same spirit). | none |
| 3 | info | exclusivity | STORY-77 vs STORY-78 | — | No overlap. STORY-77 adds a size selector to the two existing reproduction-vs-reference diff commands; STORY-78 is a standalone one-site-across-sizes analysis. Both read the same persisted ladder, but that is a dependency, not duplicated intent. | none |

## Notes for the Editor

Clean tree. Single reconciled intent bundle, two disjoint `feature` stories, complete
coverage of the CAP-65 slice (REQ-61 + REQ-58 capture dependency), no stale
references, no retired behavior lingering. The only observation worth carrying forward
is the `phone`→`mobile` vocabulary settlement (finding #2): REQ-61 prose and the
shipped token differ, but the shipped code explicitly attributes `mobile` to REQ-61,
so the matrix correctly tracks the reconciled reality rather than the pre-implementation
prose. No action.
