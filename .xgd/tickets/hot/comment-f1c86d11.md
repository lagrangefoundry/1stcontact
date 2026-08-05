---
uid: comment-f1c86d11
id: COMMENT-635
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-05T18:01:27.216827+00:00'
updated_at: '2026-08-05T18:01:27.216827+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ae68a81b
  kind: note
---

Cluster 6 resolved. Report **REPORT-1277** (`report-ae68a81b`) created with `cluster_id: "6"`, result `pass`.

## Decision: confirm all three stories — no ticket changes

The cluster is a shared *noun*, not a shared *behavior*. Both capabilities already carve the ladder explicitly in their own scope statements and each names the other as out of scope:

- **CAP-63 (1c Capture & Diff Fidelity)** claims "the per-width reference screenshots capture persists" — what capture **writes so the diff commands can read it**.
- **CAP-71 (L1 Reproduction Pipeline)** claims "oracle retention" — what the fold **must not destroy and the gate measures against**.

Same artifact, different verbs: *produce-for-diff* vs *preserve-and-measure-for-gate*.

I checked the seam ACs rather than taking the scope prose at face value, and they assert different things at different pipeline stages, with three distinct test files:

| AC | Story | Asserts | Verified after |
|----|-------|---------|----------------|
| AC-647 | STORY-77 | per-width screenshot siblings exist; value matrix has no image bytes | plain capture |
| AC-690 | STORY-84 | fold augments rather than replaces; ladder widths match the document's declared widths | the fold |
| AC-705 | STORY-86 | probe pairs/measures reproduced leaves against the oracle | inside the gate |

No assertion is repeated, so a merge would have removed coverage, not duplication — neither capability's UATs would catch the other's regression.

Per-story rationale:
- **STORY-77** stays in CAP-63 — seven of eight ACs are the `--size` CLI surface; the one capture-side AC exists solely to give the pixel diff a same-width reference to pair against.
- **STORY-84** stays in CAP-71 — "augments, does not discard" is an invariant *of the fold*, only statable where the fold is; its other twelve ACs are pure fold-emission.
- **STORY-86** stays in CAP-71 — it *reads* the oracle but defines none of the capture-side artifact contract.

No `capability_uid` was modified, no merges performed, so no AC relationships were disturbed and no test renames were required. All three stories remain assigned to exactly one capability.
