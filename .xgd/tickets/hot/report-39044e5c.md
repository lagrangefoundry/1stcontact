---
uid: report-39044e5c
id: REPORT-1718
type: report
title: 'Overlap resolution: cluster 9'
created_by: xgd
created_at: '2026-08-09T01:42:43.796504+00:00'
updated_at: '2026-08-09T01:42:43.796504+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '9'
---

## Cluster 9 Resolution

**Boundary**: The standard width ladder is a shared constant claimed by scaffold, L1 substrate and reproduction fold
**Stories resolved**: 3
**Action taken**: confirm (no ticket changes) — see rationale

### Finding

The three stories do not co-claim the width ladder; they touch it in three
structurally different roles, and none of them *defines* it. The defining
capability is a fourth, outside this cluster: `RESPONSIVE_VIEWPORTS` is declared
in `tools/generate/src/cli/capture/values-diff.ts:1023`, which belongs to
**CAP-63 "1c Capture & Diff Fidelity"**. CAP-71 already names this explicitly in
its own *Out of scope* section ("the `1c` capture/values-diff axes the fold
consumes"). So the cluster is a shared-*reference* cluster, not shared behaviour.

The three roles:

- **Type** (CAP-70 / STORY-83) — L1 owns the ladder as a *shape*: a document
  declares its own `widths` array and geometry keyframes keyed to them. Every
  ladder-touching AC here is generic over whatever ladder the document declares
  (AC-684 interpolate/snap segments; AC-1009–1012 no-wrap floor and cumulative
  rung overrides). No concrete width values are asserted.
- **Consumed sample set** (CAP-71 / STORY-84) — the fold reads the ladder off the
  capture bundle it is given. AC-689 asserts the folded document's declared widths
  *equal the sampled ladder*, AC-691 asserts one keyframe per sampled width
  matching the captured box. Both are conformance-to-input assertions; neither
  fixes the ladder's membership.
- **Derived constant** (CAP-89 / STORY-93) — the scaffold makes exactly one claim
  on the constant, AC-872: the scaffolded ladder *is* the capture ladder, derived
  rather than restated. This is verified against the real derivation in
  `tools/generate/src/cli/scaffold.ts:25`
  (`STARTER_WIDTHS = RESPONSIVE_VIEWPORTS.map((v) => v.width)`), which is a
  scaffold-side property and belongs nowhere else.

No two ACs across the three stories assert the same behaviour, so there is
nothing to merge and no misfiled story to reassign. AC-872 in particular is not
a capture AC in disguise — it asserts *non-drift of the scaffold from capture*,
which is only observable at the scaffold.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the ladder as a *type* only — documents declare their own widths; every AC is generic over any ladder and asserts no width values. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec (CAP-71) | (no change) | Consumes the ladder from the capture bundle; ACs assert conformance to the sampled ladder, never its membership. CAP-71 already excludes the capture axes explicitly. |
| story-86c7c21b (STORY-93) | confirm | capability-b4ac88fc (CAP-89) | (no change) | Sole claim (AC-872) is that the scaffold *derives* the constant from capture rather than restating it — a scaffold-side non-drift property, verified against `STARTER_WIDTHS`. |

### Verification

- Each story remains in exactly one capability; no `capability_uid` was changed.
- No story was skipped: all three in the cluster are accounted for above.
- No merges performed, so no AC re-parenting and no test renaming was required;
  all AC→story relationships are untouched (STORY-93: 8 ACs, STORY-83: 38 ACs,
  STORY-84: 16 ACs, all unchanged).
