---
uid: report-b96ad392
id: REPORT-773
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-07-23T06:09:03.553057+00:00'
updated_at: '2026-07-23T06:09:03.553057+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-9260fc31
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: A gradient (text-fill stop positions, panel/card surface fill) captured and compared as a values-diff fidelity axis
**Capabilities**: CAP-64 `gradient_fidelity` (capability-36dd68c5), CAP-63 `values_diff_fidelity` (capability-aa030c83)
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| STORY-76 (story-82eb6908) | confirm | CAP-64 gradient_fidelity | (no change) | All 5 ACs are gradient-only (text-fill stop-position drift, evenly-distributed stop colour-only compare, panel *surface gradient* delta, gradient panel authoring, gradient-typed content field). Squarely within CAP-64's declared scope. |
| STORY-75 (story-d5de22a5) | confirm | CAP-63 values_diff_fidelity | (no change) | All 10 ACs are non-gradient values-diff axes (rendered-text extent, **solid alpha-composited** surfaceFill, box border + line style, duplicate-text pairing, typography treatments, element effects, object-position, FOUT correction). Squarely within CAP-63's declared scope. |

### Why the overlap is acceptable (clean boundary, no change needed)

The survey clustered these because the phrase **"surface fill"** appears in both stories. That is shared *vocabulary*, not shared *behaviour*:

- **CAP-63 / STORY-75, AC-631** — captures the element's **solid, effective alpha-composited** surface colour (painter's "over" until opaque). A *colour*.
- **CAP-64 / STORY-76, AC-636** — captures a **gradient sweep** painted as the element's surface (direction + ordered stops). A *gradient*.

These are explicitly designed as **sibling axes captured alongside each other**, and each story names and disclaims the other's concern:

- STORY-76 puts out of scope: *"the solid composited surface-fill axis (that is `values_diff_fidelity`'s surfaceFill, a sibling captured alongside the surface gradient)."* Its Technical Context: *"Sits alongside `values_diff_fidelity` (CAP-63), which owns the composited solid surfaceFill axis and element pairing this comparison relies on."*
- STORY-75 puts out of scope: *"gradient axes (separate story)."*

No AC crosses the line: no STORY-75 AC tests a gradient; no STORY-76 AC tests a solid composited fill. The split is gradient-values → CAP-64, all other (incl. solid composited) values-diff axes → CAP-63. Each story belongs to exactly one capability; no reassignment or merge is warranted.

### Verification
- Every story belongs to exactly one capability (unchanged).
- No stories skipped (both examined AC-by-AC).
- No merges performed, so all AC relationships preserved intact.
