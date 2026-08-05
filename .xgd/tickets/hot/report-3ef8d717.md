---
uid: report-3ef8d717
id: REPORT-1278
type: report
title: 'Overlap resolution: cluster 7'
created_by: xgd
created_at: '2026-08-05T18:03:22.380914+00:00'
updated_at: '2026-08-05T18:03:22.380914+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-31234d67
  cluster_id: '7'
---

## Cluster 7 Resolution

**Boundary**: Card veil / backing surface treatment: authored L1 leaf axes (substrate) vs surfaces the folder reconstructs from a composited capture (pipeline)
**Stories resolved**: 2 (both confirmed in place — no reassignment, no merge)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-46e3b3c7 (STORY-82) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the *authoring* surface: which validated colour/border/opacity leaf axes exist so an author can declare a frosted card veil or a colour-departed footer, and that the deleted `services-grid`/`footer` dials are gone. That is substrate vocabulary + envelope, never a pipeline stage. |
| story-8acc338d (STORY-84) | confirm | capability-2049c9ec (CAP-71) | (no change) | Owns the *mechanical recovery* step: given a capture that composited a card/panel fill onto text runs, elect a dominant background band and emit backing box leaves ordered ahead of content. It consumes the axis vocabulary CAP-70 owns and adds no axes of its own. |

### Why this overlap is acceptable

The two stories share a visual noun ("card surface / veil / fill") but nothing else. They
differ on every axis that matters for capability ownership:

- **Verb and actor.** STORY-82 is an author *declaring* a treatment in an L1 tree. STORY-84 is
  the folder *reconstructing* a treatment nobody declared, from composited pixels.
- **Input.** Designer intent vs. a multi-viewport capture where the fill was attributed onto runs.
- **Failure mode.** AC-719 fails if an axis is missing, unvalidated, or still a module dial.
  AC-731 fails if band election picks the wrong fill, a run on the band wrongly emits a backing
  box, or backing boxes are not ordered ahead of content leaves. Neither test can detect the
  other's defect.
- **Dependency direction is one-way and already declared.** STORY-84 depends on CAP-70 for the
  axis vocabulary; CAP-70 has no knowledge of the fold. Collapsing them would invert this.

Both story bodies already state the boundary explicitly and consistently: STORY-84's *Out of
scope* names "the L1 typed tree / envelope / renderer themselves, including the axis vocabulary
(owned by the L1 Layout Substrate capability)"; STORY-82's *Out of scope* names "the L1
substrate itself". No edit was required to make the split legible.

### Merge / reassignment considered and rejected

- **Merge rejected.** The AC sets do not overlap in behaviour: STORY-82 carries 2 ACs (AC-719
  authored card/footer axes, AC-718 contact-form config + slots), STORY-84 carries 13 fold-pipeline
  ACs. AC-730/AC-731 (box leaf, reconstructed run surfaces) assert fold-algorithm outcomes —
  band election, backing-box emission, document order — none of which AC-719 states or implies.
- **Reassigning STORY-82 to CAP-71 rejected.** Its title says "Reproduction treatments", which is
  the only genuine pull toward the pipeline capability, but it is not a stage of capture → fold →
  render → gate. It documents that treatments were re-homed onto substrate authoring surfaces
  after the REQ-84 module deletion, and its verification inspects the module catalog and the L1
  validator — substrate concerns.

### Verification

- Each story belongs to exactly one capability; both `capability_uid` values are unchanged and correct.
- Neither story was skipped; both were read in full along with their ACs.
- No merges performed, so all 15 AC relationships are untouched and no test renaming is required.
