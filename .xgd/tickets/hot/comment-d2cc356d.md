---
uid: comment-d2cc356d
id: COMMENT-1025
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-16T00:18:39.519125+00:00'
updated_at: '2026-08-16T00:18:39.519125+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ee8a0d79
  kind: note
---

Cluster 1 resolved. **Both stories confirmed in place — no ticket changes.**

## The boundary

The cluster's premise was that field-level region edit and element-level replace "both change what a page holds." They do, but at different granularities for different callers, and the separation is deliberate:

| | CAP-86 / STORY-100 | CAP-93 / STORY-106 |
|---|---|---|
| **Reach** | Values inside an element that already exists | Which elements exist, and their whole structure |
| **Shape** | Closed derived field list | Verbatim subtree read/replace, full L1 vocabulary |
| **Audience** | Operator click-to-edit modal | Assistant composing a page |
| **Security rests on** | The *controls* being narrow (AC-08c7ebe8) | The *vocabulary* being closed (AC-4d4ac81f) |

They aren't competing implementations — CAP-93 delegates to the write path CAP-86 owns ("no new validation was written"), and CAP-93's body lists the operator's click-to-edit form as explicitly out of scope.

## Evidence

`tools/generate/src/cli/edit.ts:570-592` states the boundary in-source, with both pairs living side by side: `editCopyGet`/`editCopySet` ("the click-to-edit modal's contract: four fields, the granularity a non-technical operator clicking a heading needs") and `editL1Get`/`editL1Set` ("the AUTHORING pair… deliberately the whole language rather than a projection of it"). The same comment records the security relocation that gives the two capabilities distinct claims.

The AI surface (`l1-surface.json`) offers exactly one page-changing operation and no field-level copy edit — so STORY-106's retirement of the copy-field pair was scoped to *that surface only*. The field-level path stays live for the operator gesture and the CLI, which is why CAP-86 isn't superseded. Test families are disjoint (11 `reconciliation-copy-edit-*` files vs. the page-composition/authoring-envelope set).

## Near-misses checked individually

Three AC pairs sat close enough to the line to read in full:

- **AC-4bf1f692 vs AC-4d4ac81f** — both mention byte-for-byte unchanged drafts, but one asserts atomicity across four refusal classes (plus unchanged render output), the other asserts vocabulary closure across six named injection vectors.
- **AC-bcc448ea vs AC-4bd36a69** — refusal shape at two layers; STORY-106's weaker assertion is a deliberately recorded divergence (the tool layer drops the per-call detail), not an accidental restatement.
- **AC-d1bda2c2 / AC-84b87d8a** — these exercise CAP-86's gesture, so I checked for mis-parenting. Correctly on STORY-106: the subject is an *assistant-composed element*, and the guarantee is CAP-93's own non-regression obligation.

## Verification

Both stories read in full along with all 45 ACs (33 + 12); each belongs to exactly one capability; no story skipped. No merges, so no AC relationships disturbed and no test renaming needed.

Report created: `REPORT-2025` (`report-ee8a0d79`), `result=pass`, with `cluster_id="1"` confirmed present so the iterator will skip this cluster.
