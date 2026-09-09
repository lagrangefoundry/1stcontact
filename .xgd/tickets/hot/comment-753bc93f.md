---
uid: comment-753bc93f
id: COMMENT-2360
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-09-09T23:07:38.818031+00:00'
updated_at: '2026-09-09T23:07:38.818031+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-669d7e37
  kind: note
---

Cluster 2 resolved and reported. `REPORT-3567` (`report-669d7e37`) carries `report_kind=overlap_resolution`, `subject_uid=report-e37a6b4a`, `cluster_id="2"`, result `pass` — the iterator will now skip this cluster.

## Decision: **Confirm** — STORY-124 stays in CAP-63

The one story in the cluster, STORY-124 (cloud browser capture), is correctly filed under `capability-aa030c83` (CAP-63, 1c Capture & Diff Fidelity). The overlap with CAP-102 is acceptable because both sides already state their own half of the boundary:

- **CAP-102 / STORY-119 owns the configuration.** AC-1341 asserts every Worker's named environment repeats every top-level variable and binding, with bindings identified *structurally* — deliberately so a binding kind introduced later (like this story's browser binding) is covered without editing the check. Evidence: the parsed configuration.
- **CAP-63 owns the runtime consequence.** AC-1461 asserts what a *running* deployment does when the capability is absent — boots fine, editing/rendering/publishing unaffected, only a screenshot fails with a named catchable error. Evidence: a started deployment exercised through a real screenshot request.

A static property of config files and a dynamic property of a running deployment can't absorb each other. I checked all 10 ACs on STORY-124 against all 18 on STORY-119: no restatement. The other near-adjacent pair (AC-1468 module-graph/dependency assertion vs. AC-1426 build refusal mechanism) is checker-vs-checked-fact, also distinct.

This also matches cluster 1 from earlier today, which confirmed the sibling story STORY-125 in CAP-63 and recorded the governing rule — *how a capture is taken is owned here* — while already naming story-080c6036 as the other half of the `bundle-8eef3846` pair and diagnosing the same survey signal ("deployed-runtime capture rather than `1c` CLI capture").

**Writes made**: no story reassigned, merged, archived or content-edited; no AC reparented, so no `test_UAT_AC<n>_*` renaming was needed. One documentation write appending the boundary rule to CAP-63's body, matching the clusters 1/3/4 precedent in that capability's own History so the question isn't re-litigated next survey.

**One thing worth your attention** — a defect I found but deliberately did not repair, since a confirm makes no content change and this step is constrained against editing story content:

STORY-124's Technical Context reads *"Filed under CAP-102 (1c Capture & Diff Fidelity)."* The parenthetical name is right and matches where the story actually sits; the **numeral is stale** — CAP-102 is the deployment capability it's being distinguished *from*, and the scope phrase that same sentence quotes ("adding a browser-driving verb") is CAP-63's own text. A reader of the body sees CAP-102 named as its home while `capability_uid` points at CAP-63, which is very likely what generated this cluster in the first place. It will keep resurfacing on future surveys until a step permitted to edit story content corrects it to CAP-63.
