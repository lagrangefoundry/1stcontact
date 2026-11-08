---
uid: comment-883b7f17
id: COMMENT-636
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-05T18:03:47.772812+00:00'
updated_at: '2026-08-05T18:03:47.772812+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3ef8d717
  kind: note
---

Cluster 7 resolved. **Both stories confirmed in place — no reassignment, no merge.**

## The finding

The cluster flags a shared noun, not a shared behavior. STORY-82 and STORY-84 both talk about "card surface / veil / fill", but they sit on opposite sides of a one-way dependency:

| | STORY-82 → CAP-70 (substrate) | STORY-84 → CAP-71 (pipeline) |
|---|---|---|
| Verb | author **declares** a treatment | folder **reconstructs** a treatment nobody declared |
| Input | designer intent | multi-viewport capture with fill composited onto text runs |
| Asserts | which validated colour/border/opacity leaf axes exist; deleted module dials are gone | band election, backing-box emission, document ordering |
| Fails when | an axis is missing, unvalidated, or still a dial | wrong fill elected as band; run on the band wrongly emits a box; boxes not ordered ahead of content |

Neither story's tests can detect the other's defect, and the AC sets don't overlap in behavior — STORY-82 carries 2 ACs (AC-719 authored axes, AC-718 contact-form config + slots) against STORY-84's 13 fold-pipeline ACs. AC-730/AC-731 assert fold-algorithm outcomes that AC-719 never states or implies.

Both story bodies already declare the boundary consistently — STORY-84's *Out of scope* names "the axis vocabulary (owned by the L1 Layout Substrate capability)", STORY-82's names "the L1 substrate itself" — so no edit was needed to make the split legible.

## Alternatives rejected

- **Merge** — no behavioral duplication to collapse.
- **Reassign STORY-82 → CAP-71** — its title ("Reproduction treatments") is the only genuine pull, but it isn't a stage of capture → fold → render → gate. It documents re-homing after the REQ-84 module deletion, and verifies against the module catalog and L1 validator. Moving it would also invert the dependency direction: STORY-84 depends on CAP-70's vocabulary; CAP-70 has no knowledge of the fold.

No ticket mutations were made, so all 15 AC relationships are intact and no test renaming applies. Resolution report `REPORT-1278` (`report-3ef8d717`) created with `cluster_id="7"` verified as a string, so the iterator will skip this cluster.
