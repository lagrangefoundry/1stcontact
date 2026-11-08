---
uid: report-d00ee952
id: REPORT-1276
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-08-05T17:57:44.578990+00:00'
updated_at: '2026-08-05T17:57:44.578990+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: Ownership of the reproduction-fidelity verdict: 0-value-diffs gate (1c) vs 3-probe acceptance gate (pipeline) vs round-trip identity gate (substrate)
**Stories resolved**: 3 (all confirmed in place — no ticket changes)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d5de22a5 (STORY-75) | confirm | capability-aa030c83 (CAP-63, 1c Capture & Diff Fidelity) | (no change) | Owns the *measuring instrument*, not a verdict about a site. Every one of its 10 ACs defines a captured/compared per-element property or a pairing rule (rendered-text extent AC-629/630, composited fill AC-631, box border AC-632/713, duplicate-text pairing AC-633, typography AC-711, effects AC-712, object-position AC-714, FOUT suppression AC-715). None asserts an acceptance decision about a reproduced document. |
| story-24098299 (STORY-86) | confirm | capability-2049c9ec (CAP-71, L1 Reproduction Pipeline: Fold & Acceptance Gate) | (no change) | Owns the *pipeline acceptance boundary* over a browser-free analytic evaluator. Its 11 ACs are the three probes (AC-705 sample fidelity vs the retained oracle, AC-706 off-sample envelope, AC-707 content robustness), the combined non-vacuous gate (AC-708), demand-driven recovery (AC-709), evaluator mechanics (AC-734/735/736), report channels (AC-710/737), and value-render idempotence (AC-724). No AC captures a browser value or defines a values-diff axis. |
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 (CAP-70, Framework Substrate) | (no change) | Owns the *emitter self-consistency* verdict. AC-683 (`capture(render(L1))` reproduces every authored literal axis at all widths) and AC-688 (cross-browser equivalence) measure the renderer against the document it was given — not a reproduction against a reference site. Its other 10 ACs are typed-tree, envelope-validator, and safe-renderer obligations. |

### Why the overlap is acceptable

The three gates answer three different questions about three different pairs of
artifacts. They are sequential layers, not competing owners:

1. **CAP-63 — "do these two rendered pages agree?"** Subject: reference capture vs
   reproduction render, in a real browser. Owns *which* per-element properties are
   captured, their tolerances and severities, and the element-pairing rules. It is
   the instrument that produces a value-delta list; it renders no verdict about
   whether a reproduction is acceptable.
2. **CAP-71 — "is this folded document good enough and robust?"** Subject: a folded
   L1 document vs its retained capture oracle, plus its behaviour at widths never
   sampled and under perturbed content. Measured analytically with no browser at
   all, by an evaluator that mirrors the renderer's `interpolate|snap` geometry and
   flow stacking. Consumes CAP-63's captures as input; adds no capture axes.
3. **CAP-70 — "does the emitter render what was authored?"** Subject: an authored L1
   document vs a re-capture of its own rendered output. This is an identity/
   self-consistency property of the substrate, meaningful even with no reference
   site in play.

Each capability's Out-of-scope section already names the other two explicitly and
the three statements are mutually consistent — CAP-63 excludes "the L1 typed tree,
its envelope validator and safe renderer, and the fold/gate reproduction pipeline";
CAP-71 excludes "the L1 typed tree, envelope validator, and safe renderer
themselves ... and the 1c capture/values-diff axes the fold consumes"; CAP-70
excludes "the fold and 3-probe acceptance gate ... and the 1c capture/diff axes".

### The two sharpest edges, and why they hold

- **Round-trip gate reuses the 1c spine.** AC-683 runs on the capture/values-diff
  pipeline owned by CAP-63. This is a *consumer* relationship, not shared ownership:
  STORY-83's body states it explicitly — "The round-trip gate reuses the capture +
  values-diff pipeline (CAP-63); this story adds the L1 render→capture wiring, not
  new diff axes." If a diff axis changes, it changes in CAP-63 and AC-683 inherits
  it; AC-683 never defines one.
- **Two pairing rules for repeated text.** AC-633 (CAP-63) pairs duplicate text by
  nearest rendered position inside browser values-diff; AC-705/AC-724 (CAP-71) pair
  by occurrence index in document order inside the browser-free analytic evaluator.
  These are parallel rules belonging to two different comparison engines operating on
  different inputs, not a duplicated obligation. Neither test can substitute for the
  other.

### Verification

- Each of the three stories carries exactly one `capability_uid` and it matches the
  capability whose declared scope covers all of that story's ACs.
- No story was skipped; no merge was performed, so no AC relationships were altered
  and no test renaming is required.
- No ticket writes were made in resolving this cluster.
