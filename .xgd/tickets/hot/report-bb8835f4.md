---
uid: report-bb8835f4
id: REPORT-939
type: report
title: 'Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe) (level=uat)'
created_by: xgd
created_at: '2026-07-24T10:20:35.019792+00:00'
updated_at: '2026-07-24T10:20:35.019792+00:00'
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

The capability's single story (STORY-86 / story-24098299, `story_kind=feature`)
carries `intent_uid=bundle-31e474b9` (BUNDLE-7, status `free_and_reconciled`,
merged_at_commit edeb1c2c). The bundle reconciles the framework-pivot line
REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 (+2 more) — the capture/diff coverage
audit and the L1 substrate/renderer pivot on which this gate sits.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (REQ-79/82/83/84/63…) | free_and_reconciled | merged edeb1c2c | L1 substrate, safe renderer, capture→L1 fold, 3-probe acceptance gate | YES |

At `uat` level the AC bodies are the working reference; the intent ledger was
consulted only to confirm the story is not describing retired behavior. It is
not — the 3-probe gate is the current, reconciled acceptance boundary.

## Alignment Ledger

Every active AC of the feature story is exercised by exactly one substantive UAT
in `tests/reconciliation-3probe-gate.test.ts`, importing the real production
exports from `tools/generate/src` (`foldToL1`, `sampleFidelityProbe`,
`offSampleProbe`, `contentRobustnessProbe`, `threeProbeGate`, `promoteToFlow`,
`evaluateLayout`, `validateL1`) — all confirmed present in
`tools/generate/src/l1/probes.ts`. No AST/structural stand-ins.

| AC | UAT | Outcome |
|---|---|---|
| AC-705 sample-fidelity | test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance | aligned — asserts pass+empty residuals/unmatched+maxDelta≤tol, all 6 widths checked, perturbed box surfaces residual with text/width/dx/dy/dw + pass=false, dropped run → unmatched(text,width) |
| AC-706 off-sample | test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths | aligned — pass at default 500/900 empty per-width; narrow fixture clips at 500 (kind='clip', pass=false), 900 clean |
| AC-707 content-robustness | test_UAT_AC707_content_robustness_under_grown_content | aligned — pinned overrun → overlap finding per width + pass=false; flowed equivalent → pass=true empty at 2.5× |
| AC-708 combined gate | test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split | aligned — base w/o overlay → pass=false driven by content-robustness (fidelity still pass); base+recovered → pass=true all three; sub-reports carried |
| AC-709 demand-driven recovery | test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups | aligned — failing root promoted (path '0'), recovered passes at every width, validateL1 ok; roomy region already passes → not promoted (empty) |
| AC-710 diagnostic findings | test_UAT_AC710_probe_findings_are_diagnostic | aligned — fidelity residual names run/width/deltas; overlap finding kind+detail+≥2 paths; clip finding kind+detail(px magnitude)+path |

## Findings

None. No consistency, coverage, or exclusivity violations at the uat level.

- **Consistency**: each UAT exercises the specific behavior its AC claims,
  against real entry points, with assertions on the exact report fields the AC
  enumerates (residual dx/dy/dw, unmatched text/width, finding kind/detail/paths,
  per-width findings, promotion index paths).
- **Coverage**: every active AC (705–710) has one substantive UAT. The six ACs
  collectively cover the feature story's entire in-scope surface (analytic
  evaluator envelope findings, the three probes + report shapes, the combined
  gate over the absolute-base/overlay split, demand-driven promotion, diagnostic
  reports). No story behavior is left untested.
- **Exclusivity**: no two UATs verify the same scenario — each targets a distinct
  probe / gate / recovery behavior.

## Notes for the Editor

- **AC-709 sub-clause, informational only (not a finding):** the AC body states
  "a recovery that would produce an invalid document is rejected rather than
  returned." test_UAT_AC709 asserts the *positive* guarantee (the returned
  recovered document passes `validateL1`) and the non-promotion of already-safe
  regions, but does not force the rejection path. This is consistent with the
  AC's own **Verification** block, which only requires asserting "the returned
  document validates" — so the UAT faithfully covers the AC's stated verification.
  The rejection clause is a defensive invariant; if a future hardening pass wants
  belt-and-suspenders coverage it could add a `uat-add`, but it is not required
  for alignment and is not scored as a warning.
- The test file is named `reconciliation-3probe-gate.test.ts` and its header calls
  these "Reconciliation UATs," while the story's `story_kind` is `feature`. This
  is cosmetic naming, not a matrix/intent drift — the tests use the mandated
  `test_UAT_AC<n>_*` convention and prove feature ACs. No action.
