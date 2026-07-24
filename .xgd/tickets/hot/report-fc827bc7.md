---
uid: report-fc827bc7
id: REPORT-884
type: report
title: 'Overlap resolution: cluster 5'
created_by: xgd
created_at: '2026-07-24T06:27:27.533745+00:00'
updated_at: '2026-07-24T06:27:27.533745+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-b1a287b0
  cluster_id: '5'
---

## Cluster 5 Resolution

**Boundary**: Where per-breakpoint variation lives: module dials vs L1 substrate vs capture fold
**Stories resolved**: 3

### Decision

All three stories **confirmed in place — no change**. The overlap is lexical
(per-breakpoint / per-viewport variation appears in all three) but the ownership
boundaries are already cleanly drawn in the ticket bodies and ACs, and each story
already sits in exactly one, correct capability.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-3569e1a4 (STORY-81) | confirm | capability-bd0b722e (CAP-68) | (no change) | Retired predecessor. Both CAP-68 (`superseded_by_uid: capability-ae9d65d6`) and the story are already **archived**; the per-breakpoint *module-dials* + `navCollapse` delivery mechanism was deleted by the REQ-79 pivot and its surviving concern re-homed to L1. No active behaviour, no live overlap, no ACs to strand. |
| story-d0a8cfad (STORY-83) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the L1 *substrate*: the typed keyframe **shape**, the envelope validator, and the safe renderer that **compiles** geometry keyframes to media-queried CSS (AC-682..688; AC-684 = render semantics of interpolate/snap). Correctly placed. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec (CAP-71) | (no change) | Owns the capture *fold*: ladder → one L1 doc that **emits** and **classifies** the keyframes (AC-689..696; AC-692 = fold classification fluid→interpolate / reflow→snap). Its body explicitly lists the L1 typed tree / envelope / renderer as out-of-scope (owned by CAP-70). Correctly placed. |

### Why the overlap is acceptable (clean boundaries)

The three capabilities form a pipeline with non-overlapping responsibilities:

- **CAP-68 (superseded/archived)** — the deleted module-dials predecessor. No
  remaining behaviour; retained only as a supersession pointer to CAP-70/CAP-71.
- **CAP-70 (substrate)** — *defines and renders* geometry keyframes. Owns the
  typed shape + envelope + the compile-to-CSS semantics of interpolate/snap.
- **CAP-71 (fold)** — *produces* geometry keyframes from a capture ladder. Owns
  the fold, oracle retention, and the fluid→interpolate / reflow→snap
  classification.

The sharpest near-overlap — AC-684 ("keyframes produce per-viewport layout:
interpolate varies continuously, snap holds") vs AC-692 ("fluid transitions fold
to interpolate; reflows fold to snap") — is in fact the cleanest demonstration of
the seam: identical vocabulary, distinct behaviour (renderer compile semantics vs
fold classification). Supersession of CAP-68 already resolved the historical
ambiguity; the two active capabilities split definition-vs-production cleanly.
