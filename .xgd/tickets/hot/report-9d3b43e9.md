---
uid: report-9d3b43e9
id: REPORT-2027
type: report
title: 'Overlap resolution: cluster 3'
created_by: xgd
created_at: '2026-08-16T00:25:35.953485+00:00'
updated_at: '2026-08-16T00:25:35.953485+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-7ef6a9ea
  cluster_id: '3'
---

## Cluster 3 Resolution

**Boundary**: The palette: overlay mechanism vs retrofit migration vs authored setting
**Stories resolved**: 3 (all confirmed in place — no reassignment, no merge, no ticket mutation)

### Verdict

The three stories touch the word "palette" but own three genuinely different
subjects, and the capability bodies already state the split explicitly. The
overlap is nominal, not structural.

| Story | Subject | Owning question |
|-------|---------|-----------------|
| STORY-80 (story-c490f1cf) | The colour **model** | *What is an admissible colour value?* |
| STORY-97 (story-5e7eb0c5) | The **migration** onto that model | *How does an existing site get there without moving a pixel?* |
| STORY-107 (story-b3de4571) | The **write path** for settings | *How does any settings object reach the site definition safely?* |

Each survives the deletion of the other two: the model holds for a
hand-authored reference with no retrofit in existence; the retrofit is a
one-shot migration pass that could be deleted without weakening the model;
the settings write path is payload-agnostic and would still be needed with
no palette in the product at all.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-c490f1cf | confirm | capability-ae9d65d6 | (no change) | Owns the palette *model* — the L1 colour axis admitting hex-literal-or-reference, the palette declaration shape, resolution at the load boundary, and opacity as an axis of the reference (AC-716, AC-928..AC-931). CAP-70 scopes this under "Absolute-or-overlay value system"; CAP-89 names it as its own explicit exclusion ("the palette colour *model* itself — owned by the framework substrate capability"). The matrix already agrees on this ownership. |
| story-5e7eb0c5 | confirm | capability-b4ac88fc | (no change) | Owns the *retrofit trip*, not the destination: `1c colors` census, palette derivation (exact alpha collapse, then hue-family ramp grouping), lossless-or-refuse write, re-runnable assignment (AC-932, AC-939..AC-947). CAP-89 declares "Site colour census & palette retrofit" as a named scope section. This is a measurement-and-migration tool over an existing site's material inventory — the same subject as the asset store and provenance index it sits beside — and it consumes the model rather than defining it. |
| story-b3de4571 | confirm | capability-2d32662d | (no change) | Does not own palette semantics at all. Its palette mentions are *exemplar payload* for a payload-agnostic deep-merge write contract: AC-1095 uses a multi-family palette to demonstrate that objects merge at every depth while lists and scalars replace whole. None of its 15 ACs (AC-1095..AC-1109) is palette-specific; the story's other three subjects (components, page metadata, generated images) share the same control-surface write path. Reassigning it on the strength of one worked example would drag components, SEO metadata and the generated-image validator into a colour capability. |

### Verification

- Every story belongs to exactly one capability; no `capability_uid` was changed.
- No story was skipped: all 3 in the cluster are accounted for above.
- No merges performed, so all 30 AC relationships (5 + 10 + 15) are untouched
  and no test renaming is required.

### Residual note (no action taken)

AC-930 (model: "translucency is an axis of the reference") states its
*verification* in terms of converting a site's literals — i.e. it reaches for
the retrofit as its exercise vehicle, which is the behaviour AC-942 owns on
STORY-97. The criteria themselves are distinct: AC-930 asserts a property of
the model (a reference carries alpha; every alpha byte round-trips exactly
across the whole range), AC-942 asserts a property of the migration (an alpha
family collapses to one entry and the entry stores no opacity). This is a
verification-method adjacency at the AC level, not a story-ownership question,
so it is recorded rather than resolved here. If a future pass wants AC-930's
evidence independent of the retrofit, it should exercise a hand-authored
reference instead — a change to that AC's verification text, not a move.
