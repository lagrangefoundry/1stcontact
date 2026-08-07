---
uid: comment-a656b435
id: COMMENT-753
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-07T15:39:43.286328+00:00'
updated_at: '2026-08-07T15:39:43.286328+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9d3d87ad
  kind: note
---

`result: fail` is recorded at the top level of the report frontmatter (per REQ-282), as intended.

## Cross-Capability Overlap Survey — complete

**Report**: `report-9d3d87ad` (REPORT-1574), kind `overlap_survey`, subject `report-17a279f7`, result **fail**, 9 clusters.

**Method note worth flagging:** `xgd ticket list --type story --filter "fields.capability_uid=..."` returned **stale** assignments — five stories (92, 93, 97, 98, 102) each matched two capabilities, with inconsistent update dates. I rebuilt the map by reading each of the 25 story tickets' own `fields.capability_uid`. Anything downstream that trusts that filter index will get a wrong matrix.

### Two kinds of overlap found

**Clusters 1–5 — consolidation residue, the same defect five times.** A recent rebalance moved every story off **CAP-80, CAP-81, CAP-83, CAP-84, CAP-88** into two new consolidated capabilities (**CAP-89**, **CAP-87**), copying their scope prose across — but left all five originals `status: active`, no `merged_into`, zero stories. The earlier rebalance resolved the identical situation correctly (CAP-64/65/66/67/68/69/72/73 all carry `merged_into` + `status: deprecated`), so the fix pattern already exists and simply wasn't applied.

Cluster 5 is the one with real consequences beyond bookkeeping: STORY-98 scopes *itself* as "renderer-side only" with the editor UI out of scope — exactly the CAP-84/CAP-87 line the consolidation erased — and two sibling stories still name CAP-84 as a live owner in their Technical Context ("the editable render belongs to CAP-84" in STORY-99; "Depends on the edit rendering (CAP-84)" in STORY-101). Dependency prose and actual homes now disagree.

Cluster 4 has a quieter cost: CAP-83 carried an explicit boundary against CAP-70 for the palette *model*; that resolution did not travel to CAP-89 with the story.

**Clusters 6–9 — genuine content boundaries no capability body resolves:**
- **6** — STORY-76 is "captured, authored, **and** diffed"; the authorable L1 surface-fill value lands in CAP-63, which explicitly disclaims the L1 tree.
- **7** — STORY-79's CLI guarantees are global (asserted over `help`/`list`/`repro`/`l1-gate`, and a store flag reaching "the render/**serve** it triggers"), but homed on CAP-63 by inheritance from merged CAP-66.
- **8** — CAP-82 and CAP-85 both own a host serving rendered bytes locally. STORY-99 documents the collision itself: a cache directive added under CAP-85 changed behaviour on the CAP-82 preview server via shared code neither capability claims.
- **9** — the editable-region address is defined (CAP-86), stamped (CAP-84/87) and read (CAP-87) with one shared implementation and no single named owner.

I also recorded five candidates I checked and judged clean (STORY-82/84, the STORY-100↔101 producer/consumer split, STORY-102's three consumers) so a later reader doesn't re-litigate them.

No tickets were modified.
