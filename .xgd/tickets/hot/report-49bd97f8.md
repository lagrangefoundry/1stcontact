---
uid: report-49bd97f8
id: REPORT-1715
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-08-09T01:31:49.402875+00:00'
updated_at: '2026-08-09T01:31:49.402875+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: The same geometry semantics defined once and implemented twice: renderer and browser-free gate evaluator
**Stories resolved**: 3 (all confirmed in place — no reassignment, no merge, no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d0a8cfad | confirm | capability-ae9d65d6 | (no change) | Owns the **normative** geometry semantics and their compilation to CSS by the sole safe emitter. Its ACs are browser-observable (AC-684 is verified by a real-browser capture of the rendered ladder). This is the definition, not a mirror of one. |
| story-3569e1a4 | confirm | capability-ae9d65d6 | (no change) | Owns a new **L1 language axis** (per-width layout mode + wrapping row). Its "one cascade, two consumers" clause (AC-835) is a single-source-of-truth obligation on the axis owner, discharged in CAP-70 code and *imported* by the gate — an ownership claim, not shared residence. |
| story-24098299 | confirm | capability-2049c9ec | (no change) | Owns the **analytic evaluator's own model** and everything the probes conclude from it (AC-734 row tiling, AC-735 half-open intervals, AC-736 backing-surface exception). Matches CAP-71's declared scope verbatim: "the analytic probes over a browser-free layout evaluator that mirrors the renderer's `interpolate | snap` geometry math". |

### Why this overlap is acceptable

The cluster's premise is accurate — the geometry semantics really are implemented
twice — but the duplication is **structurally required and correctly partitioned**,
not an ownership ambiguity. Four independent checks:

**1. The two implementations are not fungible, and where sharing was possible the
code already shares.** The artifacts are disjoint:

| Capability | Artifact |
|---|---|
| CAP-70 (substrate) | `packages/site-schema/src/l1/schema.ts`, `packages/framework/src/l1/render.ts` |
| CAP-71 (pipeline) | `tools/generate/src/l1/probes.ts`, `tools/generate/src/l1/fold.ts`, `tools/generate/src/cli/gate.ts` |

The renderer's output is *CSS declarations compiled to media queries*
(`render.ts` `lerpCalc` / `min-width` stacking); the evaluator's output is
*numeric boxes at a given width* (`probes.ts:99-147`). One cannot be expressed as
the other. The one part that *is* pure enum resolution with no emission
difference — the layout-mode cascade — has already been collapsed to a single
shared function: `resolveLayoutMode` is defined once in
`packages/site-schema/src/l1/layout.ts` (CAP-70) and **imported** by the evaluator
at `tools/generate/src/l1/probes.ts:33`. That import is the cluster boundary made
executable: definition in CAP-70, consumption in CAP-71.

**2. The evaluator is an explicit approximation, so a merge would assert a fidelity
claim the story disclaims.** story-24098299 records: "The row width model is an
analytic stand-in, not a flex implementation… Grid is modelled as a stack…
deliberate approximations of the renderer, not claims of fidelity to it."
Rehoming AC-734 into CAP-70 would read as "the substrate's row semantics are
equal-shares tiling and grid is a stack", which is false of the renderer.

**3. The ACs are separately falsifiable, and one was separately fixed.** AC-735's
technical context records the half-open-interval bug was diagnosed as "an
*evaluator* defect, not a fold defect… No fold change was required to close it" —
and no renderer change either. A defect repairable in exactly one of the two
artifacts is proof the boundary is real rather than notional. The verification
clauses differ in kind: AC-684 confirms with a real-browser capture; AC-735
folds a synthetic capture and evaluates it browser-free.

**4. A consistent ownership rule accounts for every cross-reference.** The three
places these stories name each other (AC-803's "the layout gate wraps against it",
AC-835's "one cascade serves both", story-24098299's dependency on CAP-70) all
resolve under one rule:

> An axis's home story (CAP-70) owns the normative semantics **and the obligation
> that the analytic mirror tracks the axis** — an axis whose mirror is stale makes
> the gate report phantom findings, so the axis is not complete until the mirror
> moves. CAP-71 owns the evaluator's **own** model (flow direction, interval
> resolution, envelope findings, text-height estimation) and every verdict the
> probes draw from it.

Under that rule each cross-reference is a dependency statement, not a competing
ownership claim, and no AC in this cluster is a behavioural duplicate of another.

### Verification

- Each of the 3 stories carries exactly one `capability_uid`; none was skipped.
- No merges performed, so all AC relationships are untouched (16 ACs on
  story-24098299, 38 on story-d0a8cfad, 6 on story-3569e1a4 — all unchanged).
- No test renaming required, since no AC changed story.
- The two CAP-70 stories were also checked against each other for a same-capability
  merge and are cleanly delimited: story-d0a8cfad owns per-width variation of
  *values*, story-3569e1a4 owns per-width variation of the *layout mode*, and each
  names the other in its own out-of-scope section.
