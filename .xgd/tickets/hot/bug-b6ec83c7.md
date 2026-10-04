---
uid: bug-b6ec83c7
id: BUG-201
type: bug
title: 'gate: a failing sample-fidelity probe never reaches gate.json, so a section
  missing at phone widths is reported as 92 escapes'
created_by: repro-console:repro-joyfulculinarycreations-com#9
created_at: '2026-10-04T17:19:22.022816+00:00'
updated_at: '2026-10-04T18:47:54.038480+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  defect_class:
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1f10286b
---

Filed by `repro-console:repro-joyfulculinarycreations-com#9`. Bundle: `storage/references/joyfulculinarycreations.com/index`. Companion to REQ-385.

**defect_class:** `instrument-blind`. The gate reported a structural failure and named it as 92 escapes, while the one probe that measured a content loss (`sampleFidelity`) is absent from `gate.json` entirely. For this content loss the report is not wrong; it is empty.

## 1. gate.json drops the sample-fidelity probe, so content missing at a captured width is never named

- `1c l1-gate --ref storage/references/joyfulculinarycreations.com/index --json` on the same retained l1.json reports `sampleFidelity: {pass: false, tolerancePx: 2, maxDelta: 14.61, residuals: 8, unmatched: 23}`. The unmatched entries include **all six visible runs of the testimonial section at both 320 and 375** ("What people are saying", the visible testimonial, "Dan H.", "Parent / CFO", both arrows). They are `display: none` in the served CSS (REQ-385 issue 1).
- `storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-9/diff/gate.json` contains the string `sampleFidelity` **0 times**. Its `layout.findings` holds 92 entries, all `kind: "escape"`, `probe: "contentRobustness"`. The diagnosis says the failure is "92 backing surface(s) have left the content they back". The next step says "Make each escaping surface size itself…".
- Cause: `tools/generate/src/cli/gate-core.ts:1118-1121` builds `collisions` from `onSample` plus `escapesOnly(offSample)` plus `escapesOnly(contentRobustness)`. `sampleFidelity`'s `unmatched` and `residuals` never reach `layout.findings` or the diagnosis (`gate-core.ts:1162-1250`). The only trace of the probe is `l1Pass: false`.
- Consequence: the round's worst defect by the brief's own ordering (content completeness first) is a full section missing on phones. That defect reached this round only because I ran `l1-gate` by hand. values-diff (1280 only) and the perceptual diff (1280 only) cannot see it by construction.

**Proposed change.** Carry `sampleFidelity.unmatched` (and residuals over tolerance) into `gate.json` as their own finding kind, for example `kind: "missing-at-width"` with the text and width. Name them **first** in the structural diagnosis, ahead of overlaps and escapes, with the sentence "N run(s) the reference paints at width W are not drawn". Count unmatched entries into the round's `unmeasured` population too: a run that paired with nothing is BUG-106's population, and today it is reported as `unmeasured 0`.

**This will raise the count of reported findings** for this bundle by 23 (12 of them at 320/375), because it makes currently unreported failures visible.

## 2. l1-gate reports the flow recovery only as counts, so nobody can tell why it is not served

`recovery: {served: false, servedFindings: 892, recoveredFindings: 1642, fidelityMaxDeltaPx: 14.61, fidelityResiduals: 35}` (retained) and `{…recoveredFindings: 1205, fidelityMaxDeltaPx: 80.02, fidelityResiduals: 215}` (HEAD fold, refolded copy). The recovered document's own findings and residuals are not in the JSON. This is why REQ-385 issue 3 (the 92 escapes) had to be filed `cannot-tell`.

**Proposed change.** Emit `recovery.findings` / `recovery.residuals` (or at least per-surface counts) under `--json`.

## How to see it

```
cd /Users/martin/lagrangefoundry/1stcontact
grep -c sampleFidelity storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-9/diff/gate.json
./bin/1c l1-gate --ref storage/references/joyfulculinarycreations.com/index --json | python3 -c "import json,sys; g=json.load(sys.stdin); s=g['sampleFidelity']; print(s['pass'], len(s['unmatched']), sorted(g['recovery']))"
```
- **Wrong (now):** `0`; then `False 23 ['fidelityMaxDeltaPx', 'fidelityResiduals', 'promoted', 'recoveredFindings', 'served', 'servedFindings']`.
- **Right:** a re-gate (`CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox --out /tmp/g`) whose `gate.json` names the 23 unmatched runs and leads its diagnosis with the 12 at 320/375, and an l1-gate JSON whose `recovery` carries its findings.


---

## What changed (free-coded)

**1. gate.json names the sample-fidelity probe.** `reconcileGates` (`tools/generate/src/cli/gate-core.ts`) now reads `l1Gate.sampleFidelity` and:
- adds two `LayoutCollision` kinds with `probe: "sampleFidelity"` and no paths: `missing-at-width` (one per `unmatched` entry: `at 320px: "What people are saying" is painted by the reference and not drawn`) and `displaced-at-width` (one per residual over tolerance, carrying dx/dy/dw and the tolerance). Both are sorted narrowest width first and placed **first** in `layout.findings`, ahead of overlaps/buried/escapes/uncovered. Run text in a `detail` is whitespace-collapsed and truncated to 80 chars.
- leads the structural-failure diagnosis with one clause per width — `N run(s) the reference paints at width Wpx are not drawn` — then displaced runs, then the existing collision classes; the next step leads with "Draw each missing run at the width named…".
- writes the probe itself into the report as a top-level `sampleFidelity` block (pass, tolerancePx, maxDelta, residuals, unmatched, mounted). `ReconcileInput.l1Gate.sampleFidelity` is optional: a hand-built input without it produces no block and no fidelity findings; absent `unmatched`/`residuals` lists read as empty.

**2. The unmeasured set counts runs not drawn.** `unmeasuredOf` (`tools/repro-console/src/unmeasured.ts`) adds `sampleFidelity.unmatched` into the `populations` part, with detail "N are runs the reference paints at a captured width that the page does not draw". Counted only when the report carries a `sampleFidelity` block; an older report keeps the total it always had (same precedent as `unmeasuredProperties`).

**3. `l1-gate --json` recovery carries its lists.** `RecoveryCost` gains `findings` (the recovered document's content-robustness findings as `LayoutCollision`s — the list `recoveredFindings` counts), `residuals` (its sample-fidelity residuals — the list `fidelityResiduals` counts) and `unmatched`. Existing counts unchanged.

**Measured on the real bundle** (`storage/references/joyfulculinarycreations.com/index`, retained l1): `l1-gate --json` → `recovery.findings` 1642 = `recoveredFindings`, `recovery.residuals` 35 = `fidelityResiduals`, `recovery.unmatched` 23. Reconciling that l1 result gives `layout.findings` = 23 missing-at-width + 8 displaced-at-width + 92 escape; the diagnosis opens "6 run(s) the reference paints at width 320px are not drawn; 6 run(s) … at width 375px …"; headline `unmeasured 23` (values half held at zero). The full `1c gate` re-gate was not run (needs Chromium).

## Test plan

`tests/test_UAT_FC_BUG-201_missing_at_width_reaches_gate_json.test.ts` — the served document is folded from a page without a three-run testimonial section and graded (real fold, real `acceptanceGate`, real `reconcileGates`, through a written `gate.json`) against an oracle that paints it at 320/375 only:
- `unmatched_runs_are_missing_at_width_findings_first` — 6 `missing-at-width` findings, probe `sampleFidelity`, widths 320×3 then 375×3, first in `layout.findings`; `gate.json` carries `sampleFidelity.unmatched` (6).
- `diagnosis_leads_with_runs_not_drawn_per_width` — diagnosis opens with the per-width sentences; next step opens "Draw each missing run…".
- `unmatched_runs_count_into_the_unmeasured_population` — populations = 6 with the detail; a report without the block keeps populations 0.
- `l1_gate_json_recovery_carries_its_findings_and_residuals` — `cmdL1Gate` over an on-disk bundle, JSON round-tripped: `recovery.findings`/`residuals` lengths equal their counts, `recovery.unmatched` = 6.

Regression: all suites referencing `reconcileGates`/`cmdL1Gate`/`unmeasuredOf`/`gate-core` (25 files, 228 tests), all repro-console suites (30 files), REQ-156 workerd fidelity suite; `tsc --noEmit` clean for tools/generate and tools/repro-console.