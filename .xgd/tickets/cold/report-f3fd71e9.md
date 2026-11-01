---
uid: report-f3fd71e9
id: REPORT-879
type: report
title: 'Overlap resolution: cluster 2'
created_by: xgd
created_at: '2026-07-24T06:20:17.277709+00:00'
updated_at: '2026-07-24T06:20:17.277709+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '2'
---

## Cluster 2 Resolution

**Boundary**: Per-viewport diffing operates on the values-diff command surface
**Stories resolved**: 3

### Decision: Confirm (No Change) for all three

The two capabilities in this cluster extend the *same* `values-diff` CLI command
surface, but along **orthogonal axes**, so the shared surface is incidental — the
conceptual boundary between them is clean:

- **CAP-63 (capability-aa030c83) — 1c Values-Diff Fidelity** owns *which per-element
  value axes are captured and compared* at a single width (the fidelity value-set;
  goal "0 value-diffs ⟺ pixel-faithful").
- **CAP-65 (capability-18a822ac) — 1c Size-Aware Diffing** owns *at which viewport
  width the comparison runs* (the size dimension), plus the standalone `responsive-diff`
  command that reads the persisted ladder.

The overlap survey flagged the cluster because STORY-77's `values-diff --size` touches
the same command that CAP-63 owns. But on inspection every story's ACs stay strictly on
one side of the value-set / viewport-width boundary — no behavioral duplication exists
between any pair, so no merge is warranted, and each story is already in its correct
capability, so no reassignment is warranted.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-16f2793c (STORY-77) | confirm | capability-18a822ac (CAP-65) | (no change) | ACs 639–647 are all about the `--size` viewport selector, per-width reference screenshots, and fail-loud-on-missing-ladder. Pure viewport-width dimension; adds no value axis. Correctly homed in Size-Aware Diffing. Its use of the `values-diff` command surface is incidental. |
| story-2c7069fe (STORY-78) | confirm | capability-18a822ac (CAP-65) | (no change) | ACs 648–721 define the standalone `responsive-diff` cross-size N-way node table. A separate command, entirely about the viewport ladder. Correctly homed in Size-Aware Diffing; no overlap with the value-axis capability. |
| story-d5de22a5 (STORY-75) | confirm | capability-aa030c83 (CAP-63) | (no change) | ACs 629–715 add per-element value axes (rendered-text extent, composited fill, box border, typography, effects, image crop) plus duplicate-text pairing and FOUT suppression. Pure fidelity value-set; no viewport-size selection. Correctly homed in Values-Diff Fidelity. |

### Verification

- Every story belongs to exactly one capability (unchanged, all correct).
- No stories skipped (3/3 resolved).
- No merges performed, so all AC relationships (8 + 9 + 10 = 27 ACs) are preserved intact.
