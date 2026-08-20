---
uid: capability-2049c9ec
id: CAP-71
type: capability
title: 'L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-07-22T19:41:21.754682+00:00'
updated_at: '2026-08-20T12:06:01.939202+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  name: l1_reproduction_pipeline
  uat_coverage: fail
---

# Capability: L1 Reproduction Pipeline — Fold & Acceptance Gate

The mechanical pipeline that turns a multi-viewport site capture into a renderable
L1 reproduction document, and the acceptance boundary that decides whether the
result is good enough: **capture → fold → render → gate**. That boundary is wider
than the analytic probes alone — it ends at a single reconciled verdict over every
eye that grades a reproduction.

## Scope

- **The fold** — collapsing the captured viewport ladder into a single absolute-base
  L1 document with geometry keyframes, plus oracle retention and the advisory
  structural-hint sidecar (read for direction, never executed by the render path).
- **The 3-probe acceptance gate** — the analytic probes over a browser-free layout
  evaluator that mirrors the renderer's `interpolate | snap` geometry math and CSS
  flow stacking: sample-fidelity against the retained oracle at captured widths,
  off-sample envelope behaviour at unsampled intermediate widths, and
  content-robustness under perturbed content.
- **Demand-driven structure recovery** — repairing only the regions that fail a
  probe (recursively promoting colliding regions to flow) and returning a valid L1
  document.
- **The cross-gate acceptance verdict** — the reconciliation over the three eyes
  that grade a reproduction, because each is blind where the others see and
  nothing compared them to each other. The two browser-free signals (the geometry
  gate above, and reference coverage over the bundle) run first, so a stale or
  half-captured bundle fails before a headless browser starts; the perceptual and
  value eyes then run through the same offline seams their own verbs expose. It
  carries a perceptual floor that fails a run regardless of what the value gates
  say, names the likely cause and the one next step it implies rather than just
  passing or failing, treats value deltas as evidence rather than exit code, and
  refuses outright a bundle with no retained reference manifest — coverage
  measured against nothing reports clean.

## Out of scope

The L1 typed tree, envelope validator, and safe renderer themselves (framework
substrate capability), and the `1c` capture/values-diff axes the fold consumes
(capture & diff fidelity capability). The perceptual and value eyes' own
measurement contracts are likewise out of scope — they are reconciled here, not
defined here.

## History

Consolidated 2026-08-05 by structural rebalance from `Capture-to-L1 Reproduction
Fold` (survivor, CAP-71) and `End-to-End Reproduction Gate (3-Probe)` (CAP-73).
Both sat below the matrix minimum UAT threshold and describe adjacent halves of one
pipeline — the gate is meaningless without the fold that produces its input and the
oracle it measures against.