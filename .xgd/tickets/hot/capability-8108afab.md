---
uid: capability-8108afab
id: CAP-73
type: capability
title: End-to-End Reproduction Gate (3-Probe)
created_by: xgd
created_at: '2026-07-22T20:06:21.233054+00:00'
updated_at: '2026-07-22T20:06:21.233054+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: reproduction-gate-3probe
---

# Capability: End-to-End Reproduction Gate (3-Probe)

The **acceptance boundary** of the L1 reproduction pipeline (post framework-pivot,
REQ-79 / REQ-86). Where the fold (CAP-71) turns a multi-viewport capture into an
absolute-base L1 document plus a retained oracle, and the renderer (CAP-70) is the
single safe emitter, this capability is the **gate** that decides whether a
reproduced document is *good enough* — and the **demand-driven structure recovery**
that repairs only the regions that fail.

Acceptance is defined by three analytic probes over a browser-free layout evaluator
that mirrors the renderer's `interpolate|snap` geometry math and CSS flow stacking
and estimates text natural height:

- **sample-fidelity** — reproduced geometry matches the retained oracle at the
  captured widths, within tolerance.
- **off-sample** — the envelope holds (no overlap / clip) at intermediate widths
  the fold never sampled.
- **content-robustness** — the envelope holds under perturbed (longer / taller)
  content.

Being analytic rather than gated on a live browser, each probe is always-run,
deterministic evidence. Every residual a probe reports names a framework gap
(a missing axis, a missing hint, a region needing promotion) to feed back — so
"zero residuals" is a trustworthy verdict that a reproduction is faithful *and*
robust, not merely pixel-matched at capture time.
