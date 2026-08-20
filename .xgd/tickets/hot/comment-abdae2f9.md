---
uid: comment-abdae2f9
id: COMMENT-1200
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-20T00:55:07.780568+00:00'
updated_at: '2026-08-20T00:55:07.780568+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d2b77967
  kind: note
---

Survey complete. Report **report-d2b77967** (`overlap_survey`, result `fail`, subject `report-2485c83c`) created with 6 clusters.

## What I surveyed

All 13 active capabilities read in full (scope + out-of-scope + history) and all 30 stories mapped by `fields.capability_uid`. Every story is assigned; no orphans. The 13 deprecated/superseded capabilities hold zero stories.

## Not flagged (boundaries already explicitly resolved)

The matrix has been rebalanced and several boundaries carry written ownership rules — I did not re-litigate those: the `1c` CLI mechanism-vs-meaning rule (CAP-63, recorded as *overlap cluster 3, 2026-08-08*), the value-axis "follows the layer that renders it" rule (CAP-63, *cluster 4*), the assistant trio CAP-90/91/92, the workspace/write-path/gesture trio CAP-85/86/87, and the fold's reciprocal disclaimers CAP-71/63/70.

## The 6 clusters (each is a boundary with *no* rule written on either side)

1. **Palette across CAP-70 / CAP-89 / CAP-94** — model vs retrofit is resolved; STORY-107 making the palette a writable settings group is the unresolved third claim. CAP-94's body has no Scope/Out-of-scope section at all (977 chars of prose), so it names neither neighbour.
2. **Generated images (CAP-94) vs the asset store (CAP-89)** — STORY-107 writes into exactly the registry/directory STORY-102 owns the reading of; STORY-107 defers fonts to CAP-89 while claiming images.
3. **Behaviour instances (CAP-94) vs the module contract (CAP-70)** — catalog, instance-config validation and the "vetted default look" (an L2 preset per CLAUDE.md/DOC-25) are claimed on both sides. The most architecture-sensitive of the six.
4. **CAP-86 vs CAP-93** — STORY-106 explicitly *retires* the copy-field pair from the control surface, so CAP-86's stated identity ("one path, two producers") no longer describes the split.
5. **CAP-71's gate evaluator vs CAP-70's renderer** — the renderer's layout semantics are implemented twice; STORY-86's own body records two defects that were the two disagreeing.
6. **CAP-82 vs CAP-85** — two local HTTP surfaces serve pages; neither out-of-scope names the other on *serving*.

One non-cluster note is recorded in the body: STORY-102 defers licence/provenance to CAP-80, which was superseded into CAP-89 — the capability the story now sits in, next to STORY-92 which owns that work. Stale rather than wrong, but a reader resolving cluster 2 will hit it.

No tickets were modified. The ticket-store `git push` reported the remote unreachable (offline); the report is committed locally.
