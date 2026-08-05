---
uid: comment-d4856411
id: COMMENT-628
type: comment
title: Claude response for overlap_survey report
created_by: xgd
created_at: '2026-08-05T17:37:04.703984+00:00'
updated_at: '2026-08-05T17:37:04.703984+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-56449702
  kind: note
---

Survey complete. Report created and verified: **REPORT-1269 (`report-56449702`)** — kind `overlap_survey`, subject `report-31234d67`, result **fail** (7 clusters), 7 items in `fields.items`.

## Matrix as surveyed

The 2026-08-05 structural rebalance left **3 live capabilities** holding all 12 stories; the other 8 capabilities carry `merged_into` and hold no current stories (their appearance in `ticket list` is stale index entries).

| Capability | Stories |
|---|---|
| CAP-70 `capability-ae9d65d6` Framework Substrate | STORY-80, 81, 82, 83, 85 |
| CAP-71 `capability-2049c9ec` L1 Reproduction Pipeline | STORY-84, 86 |
| CAP-63 `capability-aa030c83` 1c Capture & Diff Fidelity | STORY-75, 76, 77, 78, 79 |

## Clusters found (7)

1. **Per-viewport geometry keyframes** (CAP-70 ↔ CAP-71) — STORY-81's entire remaining scope after REQ-84 is L1 keyframes, which its own body attributes to `foldToL1` (STORY-84). The axis, emitter, and interval semantics are stated across three stories in two capabilities with no named owner.
2. **Gradients: authored vs captured/diffed** (CAP-63 ↔ CAP-70) — STORY-76 is titled "captured, **authored**, and diffed"; its authoring third (`resolveSurfaceGradient` → panel fill, literal-or-role stop colours) is CAP-70 territory (STORY-83/80).
3. **`1c` CLI hygiene spans pipeline commands** (CAP-63 ↔ CAP-71) — STORY-79 explicitly names `l1-gate` and `repro`, CAP-71's commands, while sitting under CAP-63's "CLI surface" claim.
4. **Element/occurrence pairing contract** (CAP-63 ↔ CAP-71) — specified three times: STORY-75, STORY-78 ("mirroring values-diff pairing"), and STORY-86's independent "sample-fidelity pairing contract".
5. **Fidelity-verdict ownership** (CAP-63 ↔ CAP-71 ↔ CAP-70) — "0 value-diffs ⟺ pixel-faithful", the 3-probe gate, and STORY-83's round-trip `capture(render(L1)) ≈ L1` are three verdicts over the same evidence in three capabilities.
6. **Persisted viewport ladder / oracle** (CAP-63 ↔ CAP-71) — flagged at lower confidence: STORY-77 *changes* the artifact contract (adds per-viewport screenshots at capture time), while the retention guarantee the gate depends on is stated only in CAP-71's stories.
7. **Card veil / backing surface** (CAP-70 ↔ CAP-71) — STORY-82 authors the frosted veil as L1 leaf axes; STORY-84's fold independently reconstructs the same pixel as a backing box.

Four items were checked and dismissed (documented in the report body), notably STORY-82 ↔ STORY-85 contact-form overlap — real, but now intra-CAP-70 and therefore out of scope for a cross-capability survey. No tickets were modified.
