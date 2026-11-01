---
uid: report-987f798d
id: REPORT-784
type: report
title: 'Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe) (level=uat)'
created_by: xgd
created_at: '2026-07-23T06:31:59.452200+00:00'
updated_at: '2026-07-23T06:31:59.452200+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe)
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

At uat level the AC bodies are the working reference; intent history is consulted
only where an AC is itself suspicious (none were). The capability's single story
(STORY-86, story_kind=feature, status=completed) originates from one merged intent.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-31e474b9 | merged (merged_at_commit edeb1c2c) | reconcile bundle | Created STORY-86 + AC-705..710: the 3-probe reproduction acceptance gate (sample-fidelity, off-sample, content-robustness), the combined gate over the absolute-base/structure-overlay split, and demand-driven flow promotion | YES |

No retiring/superseding intent touches this capability; the full AC set (705–710)
is active and expected to have substantive UATs.

## Alignment Ledger

Element = each UAT in `tests/reconciliation-3probe-gate.test.ts`; aligned to its AC
(uat-level working reference). All symbols imported by the suite are real exported
functions from `tools/generate/src/l1` (probes.ts, fold.ts), re-exported via the
`l1` barrel (tools/generate/src/index.ts:11) — no phantom exports.

| Test (UAT) | AC aligned to | Outcome |
|---|---|---|
| test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance | AC-705 | aligned — clean pass (empty residuals/unmatched, maxDelta≤tol, doc.widths==all 6 ladder widths); beyond-tolerance residual forced at the LAST width carries text+width+dx/dy/dw; dropped run surfaces as unmatched {text,width}; both non-empty lists drive pass=false |
| test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths | AC-706 | aligned — default 500/900 off-sample widths, empty per-width findings on the fluid base; narrowOracle held-base keyframe clips at 500 (pass=false) while 900 interpolates clean; per-width finding shape asserted |
| test_UAT_AC707_content_robustness_under_grown_content | AC-707 | aligned — 2.5× perturbation on pinned base yields overlap findings per captured width (pass=false); flow-promoted equivalent absorbs growth (pass=true, empty findings); byWidth == base.widths |
| test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split | AC-708 | aligned — non-vacuous both directions: base w/o overlay pass=false driven by contentRobustness (fidelity still passes on absolute base); base+recovered overlay pass=true with all three sub-reports passing; sub-reports carried |
| test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups | AC-709 | aligned — failing root region promoted (path '0'), recovered doc holds envelope at every captured width and satisfies validateL1; already-passing roomy region left absolute (empty promotion list) |
| test_UAT_AC710_probe_findings_are_diagnostic | AC-710 | aligned — fidelity residual names run/width/per-axis deltas; overlap finding carries kind + non-empty detail + ≥2 index paths; clip finding carries kind + detail matching /\d+px/ + ≥1 path; matches AC-710's Verification spec exactly |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-709 / test_UAT_AC709 | — | AC-709 Criterion includes a secondary clause "a recovery that would produce an invalid document is rejected rather than returned." The UAT asserts the returned doc validates (validateL1(recovered).ok) but does not force the rejection branch. This matches AC-709's own Verification section, which does not call for the rejection path; the positive validity invariant is covered. Recorded as ledger note, not a gap. | none |
| 2 | info | coverage | AC-710 / test_UAT_AC710 | — | AC-710 Criterion mentions the fidelity coverage entry (text,width) for an oracle sample with no reproduced run. The AC-710 UAT does not re-test that clause, but AC-705's UAT does (Ghost row → unmatched {text:'Ghost row', width:768}); AC-710's Verification focuses on residual deltas + overlap/clip, which the test covers. Fully covered across the suite. | none |

## Notes for the Editor

- Every active AC (705–710) has exactly one substantive UAT that exercises real
  module entry points (foldToL1, the three probes, threeProbeGate, promoteToFlow,
  evaluateLayout, validateL1) — no internal mocking, no AST-only structural checks.
- No exclusivity problem: AC-705 and AC-710 both construct a fidelity residual, but
  AC-705 verifies pass/residual/unmatched semantics and AC-710 verifies the
  diagnostic detail shape (plus overlap and clip findings). Distinct properties,
  not redundant.
- The two info findings are complementary-coverage observations, not gaps: each
  UAT matches its AC's Verification spec, and the cross-referenced clauses are
  exercised elsewhere in the same suite. Neither affects the verdict.
