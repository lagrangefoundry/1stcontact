---
uid: comment-1b348242
id: COMMENT-602
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-02T17:44:17.772099+00:00'
updated_at: '2026-08-02T17:44:17.772099+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8bc8d791
  kind: note
---

Report created and verified: **REPORT-1072** (`report-8bc8d791`) — kind `overlap_survey`, subject `report-98fc5946`, result `fail`, 8 items, body 11,638 chars. No tickets were modified.

## Survey result: 8 overlap clusters

Surveyed all 11 capabilities and 12 stories (plus each story's AC titles — ownership ambiguity shows up at AC level, not title level). The already-resolved CAP-68/STORY-81 retirement is honoured and not re-flagged.

**Structural candidates — a capability holding only ACs whose mechanism lives elsewhere:**
1. **CAP-67 vs CAP-70** — STORY-80's sole AC-716 ("L1 leaf axes carry the absolute literal, validated by the envelope") is not behaviourally distinguishable from STORY-83's AC-682/686/725/726. CAP-67's other half (named overlay) is parked in an unbuilt L2. Same shape as CAP-68 before it was retired.
2. **CAP-69 vs CAP-70 vs CAP-72** — STORY-82's AC-718 and STORY-85's AC-701 assert the same observable (contact-form presentation as L1 in named slots); AC-719 asserts L1 leaf axis rendering. STORY-82's own body says the mechanisms are owned by the other two.

**Boundary-articulation issues — both capabilities substantive, seam unwritten:**
3. **Gradient (CAP-64 / CAP-63 / CAP-70)** — diff-side ACs reuse CAP-63's tolerance/pairing machinery; authoring-side AC-637/638 name the `text-block` module deleted by REQ-84, with gradient authoring now an L1 axis.
4. **`values-diff` split (CAP-65 / CAP-63)** — one command's contract in two buckets, plus *two different* duplicate-text pairing rules (AC-633 nearest-centre vs AC-651/AC-724 occurrence-index).
6. **`1c capture` ownership (CAP-63/64/65/71)** — four capabilities assert behaviour of one command with no arbitration rule.
7. **Geometry semantics (CAP-70 / CAP-73)** — the analytic evaluator "mirrors the renderer"; STORY-86 records a defect diagnosed as an evaluator-vs-renderer divergence, so this is a live failure mode.
8. **Two acceptance gates (CAP-70 round-trip / CAP-73 probes, both on CAP-63's spine)** — best-documented of the eight, but "where is reproduction acceptance defined?" still has two answers.

**Probable misfile:**
5. **CAP-66** — AC-739 ("Astro container constructed only for pages carrying behavior modules") is a render-pipeline/CAP-72 condition filed under CLI hygiene; AC-656/657 are stated purely as `values-diff` behaviour; AC-720's `aligned-crops` pipeline is claimed by no capability body.

Incidental (not a cluster): STORY-86 cites CAP-72 for the `values-diff` duplicate-text pairing — correct citation is CAP-63.
