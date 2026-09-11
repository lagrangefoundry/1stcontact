---
uid: comment-ba171628
id: COMMENT-312
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-07-23T06:06:57.586232+00:00'
updated_at: '2026-07-23T06:06:57.586232+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d022ad58
  kind: note
---

Overlap survey complete. Report **REPORT-771 (report-d022ad58)** created, kind `overlap_survey`, subject `report-9260fc31`, result **fail** (4 clusters found — the expected outcome when overlaps exist).

## Summary

The matrix is a near-perfect 1:1 capability→story mapping (11 capabilities / 12 stories; only Size-Aware Diffing holds two). I flagged **4 boundary-ambiguity clusters** — in each, a story's own body invokes another capability's machinery:

1. **Gradient ↔ Values-Diff fidelity axis** — STORY-76 / STORY-75. Gradient is "compared by `values-diff` as a fidelity axis," the same machinery Values-Diff Fidelity extends. Strong overlap.

2. **Responsive dials ↔ Capture-to-L1 Fold ↔ L1 Substrate** — STORY-81 / STORY-84 / STORY-83. Post-pivot, "responsive dials" are re-homed into `foldToL1` and per-viewport L1 keyframes — the capability is now almost entirely someone else's machinery. Strong overlap.

3. **L1 Substrate ↔ Absolute-or-Overlay Values ↔ Reproduction Treatments** — STORY-83 / STORY-80 / STORY-82. All three operate on the same typed L1 leaf-axis surface (colour/length/radius dials, literal-or-overlay resolution, treatments-via-leaf-axes).

4. **CLI Arg Parsing ↔ Size-Aware Diffing** — STORY-79 / STORY-77. The `--size` flag's parsing/propagation vs its diff semantics — canonical "CLI command that operates on X" seam. Weakest; likely cross-cutting by design, flagged per the err-toward-flagging rule.

Two seams recur and drive most of the ambiguity: the shared **values-diff fidelity-axis** surface, and the **framework-dials → L1-substrate + capture-fold** collapse from the REQ-79 pivot. No tickets were modified — survey only.
