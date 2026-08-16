---
uid: comment-9c7af7e9
id: COMMENT-1030
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-16T00:32:04.965633+00:00'
updated_at: '2026-08-16T00:32:04.965633+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-57a1db2f
  kind: note
---

Cluster 5 resolved. `cluster_id` is stored as the string `"5"`, so the iterator will skip this cluster.

## Resolution: both stories confirmed in place — no ticket changes

| Story | Action | Capability |
|---|---|---|
| story-b3de4571 (STORY-107) | **confirm** | capability-2d32662d (CAP-94) |
| story-c46abfa6 (STORY-102) | **confirm** | capability-b4ac88fc (CAP-89) |

**Why the overlap is acceptable.** The two stories sit on opposite sides of a write/read seam over one shared listing.

- **STORY-107 (CAP-94)** is an authoring operation. Generated images are one of four things it covers, and its image-side ACs are all about the *act of writing*: the closed-by-construction SVG validator (AC-1106), whole refusal of executable/embedding content (AC-1105), filename generation and replace-conflict (AC-1107), and drawing-as-its-own-grantable-capability (AC-1108).
- **STORY-102 (CAP-89)** is an inventory surface. Its six ACs describe only how the listing itself behaves — the two-source union, provenance flags, handle vocabulary, usage kind, CLI/origin reachability. None mentions generated images; none writes an asset.

**The single point of contact is an integration assertion, not a duplicate claim.** AC-1104 asserts the written drawing shows up in "the same listing every image picker reads." Its UAT (`tests/reconciliation-beyond-l1-authoring.test.ts:612`) calls `write_image`, then makes exactly one `list_assets` assertion — that the handle appears with `kind: 'image'`. That proves the write lands in the *one* shared inventory rather than a parallel one, which is the load-bearing claim of both capabilities. It asserts nothing about how the listing derives its answer, so moving it to STORY-102 would be wrong and deleting it would strip STORY-107 of real evidence.

I verified the evidence is unshared: STORY-102's UATs are in `tests/reconciliation-site-asset-listing.test.ts` (AC1018–AC1023), STORY-107's in `tests/reconciliation-beyond-l1-authoring.test.ts`. No test is claimed twice.

Reassignment would be worse in either direction — moving STORY-107 drags settings/components/page-metadata (three quarters of it) into a materials capability, and moving STORY-102 pulls a read surface into an authoring capability when CAP-89 explicitly declares "the site asset store" as one of its four scope sections. Merging is unavailable: disjoint behaviours, no duplicated AC.

One observation recorded in the report but **not** actioned: CAP-89's per-entry provenance distinguishes *declared* from *file-present*, and a machine-composed drawing is arguably a third origin kind. No current AC claims that, so nothing is stale — but if it's ever wanted, it belongs to CAP-89 as a new criterion. I did not create a story for it, per this step's constraints.

Report: **REPORT-2029** (`report-57a1db2f`), result `pass`. All 21 ACs keep their existing `story_uid` and test names.
