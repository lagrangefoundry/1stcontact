---
uid: report-cb8b9597
id: REPORT-889
type: report
title: 'Overlap resolution: cluster 7'
created_by: xgd
created_at: '2026-07-24T06:34:57.018382+00:00'
updated_at: '2026-07-24T06:34:57.018382+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '7'
---

## Cluster 7 Resolution

**Boundary**: The 3-probe gate's sample-fidelity probe is a per-width text-box diff
**Stories resolved**: 3

All three stories are correctly assigned to distinct capabilities. The flagged
overlap is conceptual (all three involve a "per-width comparison") but the
boundaries are clean along three axes: mechanism, data source, and purpose.

- **STORY-86 / CAP-73 (3-Probe Gate)** — a *browser-free analytic* layout
  evaluator whose sample-fidelity probe matches reproduced L1 boxes against a
  *retained fold oracle*. It is the accept/repair gate (three probes + combined
  gate + demand-driven structure recovery + diagnostic residuals).
- **STORY-75 / CAP-63 (Values-Diff Fidelity)** — the *live-render* `1c values-diff`
  CLI comparing captured rendered CSS values per element (glyph extent, composited
  fill, border, typography, effects, object-position, duplicate-text pairing, FOUT).
- **STORY-77 / CAP-65 (Size-Aware Diffing)** — the shared `--size` viewport-ladder
  selector on the two `1c` diff commands, per-viewport reference screenshots, and
  fail-loud on missing ladder data.

The sample-fidelity probe (AC-705) compares analytic L1 geometry to a retained
oracle; values-diff (CAP-63) compares live browser-captured values; size-aware
diffing (CAP-65) selects the viewport width for those CLI diffs. Different inputs,
different mechanisms, different intents — no duplication, nothing to reassign or
merge. AC ownership is already correct on every story, and each story belongs to
exactly one capability.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-24098299 (STORY-86) | confirm | capability-8108afab (CAP-73) | (no change) | Browser-free analytic 3-probe accept/repair gate over an L1 doc + retained oracle; not a live-render CLI diff |
| story-d5de22a5 (STORY-75) | confirm | capability-aa030c83 (CAP-63) | (no change) | Live-render `1c values-diff` rendered-value axes; distinct mechanism/data from the analytic gate |
| story-16f2793c (STORY-77) | confirm | capability-18a822ac (CAP-65) | (no change) | `--size` viewport-ladder selector for the `1c` diff commands; a width-selection concern, not the analytic gate |
