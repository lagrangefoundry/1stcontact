---
uid: report-ba2f9c42
id: REPORT-940
type: report
title: 'UAT Coverage: End-to-End Reproduction Gate (3-Probe)'
created_by: xgd
created_at: '2026-07-24T10:24:33.291984+00:00'
updated_at: '2026-07-24T10:24:33.291984+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-8108afab
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: End-to-End Reproduction Gate (3-Probe)

**Result**: PASS
**AC verdicts**: 6 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9: REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more) | free_and_reconciled | merged @ edeb1c2c | Framework pivot to L1 substrate (REQ-79/82/84); the 3-probe acceptance gate is the post-pivot reproduction boundary the capability documents | YES |

The capability body itself anchors the gate to the framework pivot (REQ-79 / REQ-86). No later intent in the ledger retires the three probes, the combined gate, demand-driven recovery, or diagnostic reporting. Capability is `active`; all six ACs are `active`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-86 | BUNDLE-7 (REQ-79 / REQ-82 / REQ-84, framework pivot) | aligned | Body describes exactly the reconciled behavior: analytic evaluator envelope findings, three probes + report shapes, combined gate over the absolute-base/overlay split, demand-driven promotion of failing pinned groups. Scope note correctly excludes CAP-70 (renderer/validator), CAP-71 (fold), and the browser-backed round-trip spine. |

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

All six ACs are active per cumulative intent and each is substantively covered by a
passing UAT in `tests/reconciliation-3probe-gate.test.ts`, exercised at the real
module boundary (`tools/generate/src`: foldToL1, sampleFidelityProbe, offSampleProbe,
contentRobustnessProbe, threeProbeGate, promoteToFlow, evaluateLayout; validateL1 from
the schema package). No internal mocking. Each test carries a real discriminator:

| AC | Behavioral claim | Discriminator in the UAT |
|---|---|---|
| AC-705 | fidelity matches oracle within tol; residuals + unmatched | perturbs one box at the LAST width (proves all-width iteration) → residual with exact dx/dy/dw; drops a run → unmatched entry; clean case → empty + maxDelta ≤ tol |
| AC-706 | envelope holds at unsampled 500/900 | fluid doc passes both; narrow doc (captured only ≥768) clips at 500, clean at 900 |
| AC-707 | envelope holds under 2.5× grown content | pinned base overruns sibling → overlap finding, pass=false; flow-structured equivalent → pass=true, empty findings per width |
| AC-708 | combined gate non-vacuous over base/overlay split | base w/o recovery → pass=false driven by content-robustness (fidelity still passes on base); base + recovered overlay → pass=true, all sub-reports present |
| AC-709 | recovery promotes only failing groups, returns valid L1 | root region promoted ('0'), recovered doc passes robustness at every width AND validateL1().ok; roomy region already survives → not promoted |
| AC-710 | findings are diagnostic, not boolean | fidelity residual names run+width+per-axis deltas; overlap finding carries kind+detail+≥2 index paths; clip finding carries kind + `\d+px` magnitude + leaf path |

## Notes for the Editor

- **Verification note (not a finding):** `.xgd/uat_index.json` reports all six tests as
  `status: "missing"`. This is a phantom of the fresh regression worktree — the index is
  gitignored/never-run here, so it carries all-zero/never-run status. The test file exists
  on disk, compiles, and all 6 tests pass green (`npx vitest run
  tests/reconciliation-3probe-gate.test.ts` → 6 passed, 2.11s). Coverage assessment was
  made against the on-disk source and a live run, not the stale index. No editor action
  required; if the index is consumed downstream, rebuild it rather than trusting the
  phantom counts.
