---
uid: capability-aa030c83
id: CAP-63
type: capability
title: 1c Values-Diff Fidelity
created_by: xgd
created_at: '2026-07-19T02:17:11.713654+00:00'
updated_at: '2026-07-19T02:17:11.713654+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: values_diff_fidelity
---

# Capability: 1c Values-Diff Fidelity

The `1c` reproduction toolchain's intrinsic-value comparison pipeline: `1c capture`
records a reference site's per-element rendered values, and `1c values-diff` compares
those against a reproduction render, emitting per-element deltas by property.

The animating goal is the invariant **"0 value-diffs ⟺ pixel-faithful"** — a clean
values-diff must mean the reproduction genuinely renders like the reference. Every
captured-and-compared axis this capability adds closes a blind spot where the old
gate reported clean while the render visibly differed, or fixes a pairing bug that
produced false deltas.

Stories under this capability document the axes, tolerances, and element-pairing
rules of the capture + values-diff pipeline.
