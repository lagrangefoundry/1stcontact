---
uid: report-db2699bb
id: REPORT-877
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-07-24T06:18:01.439125+00:00'
updated_at: '2026-07-24T06:18:01.439125+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: Gradient comparison as a values-diff fidelity axis
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-82eb6908 (STORY-76) | confirm | capability-36dd68c5 (CAP-64 gradient_fidelity) | (no change) | Cohesively the *gradient vertical* — capture + diff + author. Includes gradient authoring ACs (AC-637 gradient panel render, AC-638 gradient content-field validation) that are entirely outside CAP-63's comparison-only scope. Its organizing concept is "gradient", so CAP-64 (purpose-built to own gradients as a first-class value) is the correct home. |
| story-d5de22a5 (STORY-75) | confirm | capability-aa030c83 (CAP-63 values_diff_fidelity) | (no change) | Covers only non-gradient values-diff axes (rendered-text extent, composited solid surface fill, box border, duplicate-text pairing, typography treatments, element effects, fontLoad). Body explicitly declares "gradient axes (separate story)" out of scope. Correctly in CAP-63. |

### Why the overlap is acceptable (clean boundary, no change)

The survey flagged a **conceptual** overlap: gradient comparison (STORY-76's AC-634/635/636) is the *same kind* of work as a values-diff fidelity axis, yet lives in CAP-64 rather than CAP-63. But the two capabilities already resolve this seam deliberately, and it is documented on both sides:

- **CAP-63's own body defers gradients**: it owns the solid composited `surfaceFill` and calls the gradient surface "a sibling captured alongside the surface gradient" — an explicit hand-off to CAP-64.
- **STORY-75's body carves gradients out**: "Out of scope: gradient axes (separate story)."
- **CAP-64's own body claims the diff axis**: "1c values-diff compares gradients as an axis of the fidelity gate" — gradient is deliberately a cross-cutting first-class value spanning capture, diff, and authoring, not a pipeline stage.

Reassigning STORY-76 to CAP-63 would be a strictly worse fit: it would drag gradient *authoring* ACs (AC-637, AC-638) into a comparison-only pipeline that does not own authoring. A story belongs to exactly one capability, and STORY-76's cohesive concept is the gradient value across its full lifecycle — CAP-64.

### AC-level check: zero duplication

The two stories cover completely disjoint AC sets, so this is not a merge candidate:

- STORY-76 ACs: AC-634, AC-635, AC-636 (gradient diff axes) + AC-637, AC-638 (gradient authoring).
- STORY-75 ACs: AC-629, AC-630, AC-631, AC-632, AC-633, AC-711, AC-712, AC-713, AC-714, AC-715 (non-gradient values-diff axes).

No AC describes the same behaviour across the two stories. Every story belongs to exactly one capability; no stories skipped; no AC relationships touched (no reassign or merge performed).
