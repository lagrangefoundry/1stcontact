---
uid: report-2aa5f48c
id: REPORT-1272
type: report
title: 'Overlap resolution: cluster 1'
created_by: xgd
created_at: '2026-08-05T17:39:52.562782+00:00'
updated_at: '2026-08-05T17:39:52.562782+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '1'
---

## Cluster 1 Resolution

**Boundary**: Per-viewport geometry keyframes: typed L1 axis (substrate) vs fold emitter and gate evaluator (pipeline)
**Stories resolved**: 3 (0 reassigned, 0 merged, 3 confirmed)

### Verdict

The overlap is **acceptable and already correctly partitioned**. Geometry
keyframes appear in both capabilities because they are a shared *vocabulary*,
not shared *behaviour*. Three distinct roles exist and each is owned exactly
once, with no AC duplicated across the boundary:

| Role | Owner | Evidence |
|------|-------|----------|
| **Define + render** the keyframe axis — schema, envelope validation, media-queried `calc()`/snap emission, round-trip identity | CAP-70 / STORY-83 | AC-684 (`interpolate` varies continuously, `snap` holds), AC-717 (per-viewport variation delivered by L1 keyframes), AC-683 (`capture(render(L1)) ≈ L1`) |
| **Emit** keyframes — derive the track, segment flags and visibility rule from a captured width ladder | CAP-71 / STORY-84 | AC-691 (one keyframe per sampled width matching the captured box), AC-692 (fluid → `interpolate`, reflow → `snap`), AC-693 (visibility rule from presence subrange) |
| **Verify** keyframes — mirror the renderer's geometry math analytically to gate a reproduction | CAP-71 / STORY-86 | AC-735 (half-open breakpoint intervals so a reflow at a captured breakpoint does not cascade) |

Each capability's declared scope already states this seam explicitly: CAP-70
lists "per-viewport geometry keyframes (`interpolate | snap`) and the round-trip
identity gate"; CAP-71 lists "collapsing the captured viewport ladder into ... an
L1 document with geometry keyframes" and "a browser-free layout evaluator that
mirrors the renderer's `interpolate | snap` geometry math". CAP-71's "Out of
scope" names the L1 typed tree, envelope validator and safe renderer; STORY-84
and STORY-86 each repeat the exclusion in their own bodies. The boundary is
documented on both sides, not merely implied.

No reassignment is warranted: moving the emitter or evaluator into CAP-70 would
pull pipeline mechanics into the substrate, and moving the axis definition into
CAP-71 would break the security envelope's single-owner invariant (DOC-2: the
renderer is the only emitter).

No merge is warranted: AC-684 asserts on rendered CSS behaviour, AC-692 asserts
on fold output shape, AC-735 asserts on evaluator interval resolution. Three
different artifacts, three different observations — none is a restatement of
another.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-3569e1a4 (STORY-81) | confirm | capability-ae9d65d6 | (no change) | Archived/superseded responsive-dials story. Its delivery mechanism (per-breakpoint module dials, `navCollapse`) was deleted by REQ-84; the only surviving claim — per-viewport variation via L1 geometry keyframes — is the substrate axis, so CAP-70 is the correct resting capability. Its live successor AC-717 already sits on CAP-70/STORY-83. It touches CAP-71 only as a consumer reference, never as an owner. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec | (no change) | Owns the fold *emitter* — how a captured ladder becomes a keyframe track, segment flags and visibility rules. This is pipeline mechanics over the substrate's vocabulary; the story explicitly excludes the L1 tree/envelope/renderer and its axis vocabulary as CAP-70's. |
| story-24098299 (STORY-86) | confirm | capability-2049c9ec | (no change) | Owns the analytic evaluator that *mirrors* keyframe math to gate a reproduction. Mirroring is not owning: the story explicitly excludes the renderer and envelope validator (CAP-70) and the fold (STORY-84), and its one keyframe AC (AC-735) was diagnosed as an evaluator defect requiring no fold or renderer change — direct evidence the seam holds under change. |

### Verification

- Every story belongs to exactly one capability; no story was skipped.
- No merges performed, so no AC relationships were disturbed. All 31 ACs across
  the three stories retain their original `story_uid`.
- No test renaming required (no AC moved between stories).

### Out-of-scope observation (not acted on)

STORY-81 is `archived`, but its 7 ACs (AC-666..AC-671, AC-673) remain `active`
and describe per-breakpoint module dials and `navCollapse` — code deleted by
REQ-84 and, per the story body, believed removed. These are stale matrix
entries under a superseded container. This is an AC-hygiene issue orthogonal to
the capability boundary, and outside the three actions this resolution step
permits (reassign / merge / confirm), so no change was made. Flagged for a
matrix-cleanup pass.
