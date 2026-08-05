---
uid: comment-ca6a2286
id: COMMENT-634
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-05T17:58:17.385627+00:00'
updated_at: '2026-08-05T17:58:17.385627+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d00ee952
  kind: note
---

Cluster 5 resolved. Report **REPORT-1276** (`report-d00ee952`) created with `report_kind=overlap_resolution`, `subject_uid=report-31234d67`, `cluster_id="5"`, `result=pass`.

## Decision: confirm all three — no ticket changes

The cluster's premise is that three gates all claim "the reproduction-fidelity verdict." Reading the ACs shows they answer three different questions about three different pairs of artifacts:

| Story | Capability | Verdict subject | Evidence |
|---|---|---|---|
| STORY-75 `story-d5de22a5` | CAP-63 `1c Capture & Diff Fidelity` | reference capture **vs** reproduction render, in a browser | All 10 ACs define a captured/compared property or a pairing rule (AC-629/630/631/632/633/711/712/713/714/715). None renders an acceptance decision — it's the *instrument*, not a verdict. |
| STORY-86 `story-24098299` | CAP-71 `L1 Reproduction Pipeline` | folded L1 document **vs** its retained oracle, plus unsampled widths and perturbed content | All 11 ACs are probes/gate/recovery/evaluator mechanics (AC-705–710, 724, 734–737), measured analytically with **no browser at all**. Captures no values, defines no diff axis. |
| STORY-83 `story-d0a8cfad` | CAP-70 `Framework Substrate` | authored L1 document **vs** a re-capture of its own output | AC-683 + AC-688 are emitter self-consistency — meaningful with no reference site in play. The other 10 ACs are typed-tree/validator/renderer. |

Each capability's Out-of-scope section already names the other two, and the three statements are mutually consistent — no capability claims another's gate.

**The two sharpest edges, checked directly:**

- **AC-683 runs on the CAP-63 spine.** Consumer relationship, not shared ownership — STORY-83's body states it: "reuses the capture + values-diff pipeline (CAP-63); this story adds the L1 render→capture wiring, not new diff axes."
- **Two pairing rules for repeated text.** AC-633 pairs by nearest rendered position (browser values-diff); AC-705/AC-724 pair by occurrence index in document order (browser-free analytic evaluator). Parallel rules for two different comparison engines on different inputs — neither test substitutes for the other.

No merges were performed, so no AC reassignment or `test_UAT_AC<N>_*` renaming was needed. No stories skipped; no ticket writes made.
