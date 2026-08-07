---
uid: capability-aa030c83
id: CAP-63
type: capability
title: 1c Capture & Diff Fidelity
created_by: xgd
created_at: '2026-07-19T02:17:11.713654+00:00'
updated_at: '2026-08-07T23:13:35.447828+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: 1c_capture_diff_fidelity
  uat_coverage: fail
---

# Capability: 1c Capture & Diff Fidelity

The `1c` reproduction toolchain's **capture → compare** spine, and the CLI surface
that makes it scriptable. `1c capture` records a reference site's per-element
rendered values across the viewport ladder; the diff commands compare those against
a reproduction render and emit per-element deltas by property.

The animating invariant across every story here is **"0 value-diffs ⟺
pixel-faithful"** — a clean diff must mean the reproduction genuinely renders like
the reference. Each axis closes a blind spot where the gate reported clean while the
render visibly differed, or fixes a pairing/false-delta bug in the other direction.

## Scope

- **Intrinsic value axes and pairing** — the captured-and-compared per-element
  properties (rendered-text extent, composited surface fill, box border, typography
  treatments, element effects, image crop), their tolerances and severities, and the
  element-pairing rules that decide which two elements are compared.
- **Gradients as a first-class value** — text-fill (`background-clip: text`) and
  panel/surface gradients captured with direction and ordered colour stops
  (including stop position offsets), authorable, and diffed as a fidelity axis.
- **Size-aware and cross-size diffing** — the shared `--size` viewport selector on
  `values-diff` and pixel `diff`, the per-width reference screenshots capture
  persists, and the standalone `responsive-diff` N-way cross-size node analysis with
  its change classifier.
- **CLI argument parsing and output hygiene** — boolean flags parse as boolean and
  do not swallow following positionals; in `--json` mode stdout carries only the
  single JSON document, with render/bootstrap diagnostics routed to stderr.

## Out of scope

The L1 typed tree, its envelope validator and safe renderer, and the fold/gate
reproduction pipeline that consume these captures. Those are separate capabilities.

## History

Consolidated 2026-08-05 by structural rebalance from `1c Values-Diff Fidelity`
(survivor, CAP-63), `1c Gradient Fidelity` (CAP-64), `1c Size-Aware Diffing`
(CAP-65), and `1c CLI Argument Parsing & Output Hygiene` (CAP-66) — each of which
was individually below the matrix minimum UAT threshold while covering one facet of
the same capture-and-compare pipeline.