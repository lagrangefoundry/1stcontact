---
uid: request-58e96ad1
id: REQ-86
type: request
title: 'Framework pivot E: reproduce a site end-to-end in the new system (3-probe
  gate)'
created_by: xgd
created_at: '2026-07-20T19:48:32.790492+00:00'
updated_at: '2026-07-22T18:51:59.300545+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: b7d32cce7f5c4cbed624efe5a22d3eaeab6ad75a
    reconcile_sha: null
    main_sha: null
  version: 0.0.167
  story_points: 4
  bundled_in: bundle-31e474b9
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)**. The end-to-end validation; do last.

## Goal
Validate the whole new pipeline: **capture → L1 → AI structure recovery → render**, gated by the 3-probe acceptance.

## Behaviour
- Capture a real site → L1 (+ oracle + hints).
- AI recovers structure using the hints, verified against the oracle; **promote pinned regions to flow only where off-sample / content probes fail** (demand-driven).
- **Gate (3 probes)**: (a) **sample-fidelity** vs oracle at the 6 captured widths; (b) **off-sample fidelity** at intermediate widths (500 / 900px); (c) **content-perturbation robustness** (longer text / taller image → envelope holds, no overlap/clip).
- Each residual = a framework gap (missing axis / hint / L1 primitive) → filed and fed back.

## Acceptance (UAT — `test_UAT_FC_<this REQ id>_*`)
- `sample_fidelity`: reproduced L1 matches the oracle within tolerance at all captured widths.
- `offsample`: renders sane (no overlap/clip) at 500 and 900px.
- `content_robustness`: perturbed content keeps the envelope (no overlap/clip).

## Docs (same session)
- Rewrite **DOC-19** (repro runbook for the L1 world — keep the value model + gate methodology, drop the module-specific lists); update **DOC-15, DOC-16**.



---

## Free-coding scope (session 2026-07-21)

**What is being built (code):** the end-to-end reproduction gate that ties the existing L1 pipeline pieces (`foldToL1` capture→L1+oracle, `renderL1Document` emitter, capture/round-trip spine) together behind the **3-probe acceptance**, plus the **demand-driven flow promotion** that recovers structure only where the pinned form fails.

New module `tools/generate/src/l1/probes.ts`:
- `evaluateLayout(doc, width, opts)` — a deterministic, browser-free analytic layout evaluator that mirrors the renderer's absolute interpolate/snap geometry math and CSS flow stacking; estimates text natural height so content perturbation is expressible. Emits per-leaf boxes + overlap/clip findings. Being analytic (not browser-gated) makes every probe always-run strong evidence, not a chromium-skip.
- `sampleFidelityProbe(doc, oracle, opts)` — probe (a): evaluated geometry vs the retained oracle boxes at the 6 captured widths, within tolerance.
- `offSampleProbe(doc, opts)` — probe (b): evaluate at 500/900px, assert envelope holds (no overlap/clip).
- `contentRobustnessProbe(doc, opts)` — probe (c): perturb text length / image height, assert envelope holds.
- `threeProbeGate(doc, oracle, opts)` — runs all three, returns a structured pass/fail report; each residual names the framework gap.
- `promoteToFlow(doc)` — demand-driven structure recovery: wrap only the pinned sibling groups that FAIL content-robustness into flow `stack` containers (pin the region origin, flow the interior), leaving passing regions absolute.

Exported from `tools/generate/src/l1/index.ts`.

**Tests:** `tests/req86-e2e-repro.test.ts` — `test_UAT_FC_REQ-86_sample_fidelity`, `_offsample`, `_content_robustness`, plus a discriminator UAT showing content-robustness FAILS on the pinned fold and PASSES after demand-driven `promoteToFlow` (the probe discriminates; promotion is applied only where needed).

**Docs (same session):** rewrite DOC-19 for the L1 world (keep value model + gate methodology, drop module-specific lists); update DOC-15, DOC-16.

**Why free-coded:** small, cohesive addition wiring existing pieces behind the acceptance gate; no technical design needed.



---

## Delivered (session 2026-07-21)

**Code (free_coded, sha `b7d32cce`, v0.0.167):**
- `tools/generate/src/l1/probes.ts` — analytic browser-free layout evaluator + the 3 probes (`sampleFidelityProbe` / `offSampleProbe` / `contentRobustnessProbe`), `threeProbeGate` (absolute-base fidelity + structure-overlay envelope), and demand-driven `promoteToFlow`. Exported from `tools/generate/src/l1/index.ts`.
- `tests/req86-e2e-repro.test.ts` — 4 UATs, all green: `_sample_fidelity`, `_offsample`, `_content_robustness` (the discriminator: FAILS on the pinned base, PASSES after demand-driven promotion), `_gate` (full gate passes with recovery, and is provably non-vacuous — fails without it).
- Regression: L1 family (req82/83/84/85/86) green; `tsc --noEmit` clean on generate / site-schema / framework.

**Docs (committed directly — no reconcile):**
- **DOC-19** rewritten for the L1 world: authoritative L1-pipeline header + 3-probe gate + "close gaps in L1, not modules"; value model & gate methodology kept; module catalog + module-mapping procedure marked superseded (kept as history).
- **DOC-15** (coverage program) and **DOC-16** (design-intelligence prompt layer) each given an L1-world update note.

**Design note:** the probes are analytic (not chromium-gated) on purpose — deterministic, always-run evidence. Sample-fidelity is a property of the absolute base; off-sample + content-robustness are properties of the structure-recovered overlay. Recovery is demand-driven (promote only regions a probe fails on).