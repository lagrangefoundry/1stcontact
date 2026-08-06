---
uid: comment-46b7150f
id: COMMENT-734
type: comment
title: Comment on goal GOAL-6
created_by: xgd
created_at: '2026-08-06T21:34:25.929679+00:00'
updated_at: '2026-08-06T21:34:25.929679+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: goal-026f16b5
  kind: note
---

## Requirements observed while running this exercise manually (2026-08-06)

Building the lagrange-biz goal map by hand, using xgd as the substrate. It works, but these gaps showed up in one sitting:

**1. Expiring opportunities are a distinct date semantic — `target_date` cannot express them.**
Two of the highest-priority goals created today are bounded by *expiry*, not by a target: the class window (they use another tool if 1c is not ready by end of August) and a summer break. Miss either and the goal is **void, not late**. Two instances in a single session is a strong signal. A goal needs to distinguish "when I plan to finish" from "after which this is worthless", and the second should drive urgency in the frontier far harder than the first.

**2. Cross-project goal migration should be one operation.**
Moving the XGD-site outcome layer from here to lagrange-biz took: reparent 2 goals, archive 11, and hand-write "moved here from GOAL-23" into 11 new bodies. Traceability survived only because it was written by hand, in one direction. This is a routine consequence of the placement rule (a goal belongs to the project that can complete it) and will recur every time the rule is applied to existing goals.

**3. Decision dates should be derived from evidence, never asked for.**
All five decision dates were recovered mechanically — git first-commit dates for the two new repos, doc `updated_at` for the design records. No recall was required from the operator. This is exactly the detection job in DOC-19 §5.3, and it is automatable rather than a chat ritual.

**4. The ready frontier must span projects, or it shows nothing.**
Today's frontier is 3 goals in lagrange-biz, 2 in xgd, 3 here. Any per-project view of it is actively misleading.

**5. Calendar view and recurring requirements.** (Operator's own examples.)

**6. The prompts are the product.**
The session shape that produced a usable map: read the project docs → derive dates from evidence → propose a tree and iterate in conversation → create in bulk → verify by rendering the tree back. That loop, not the schema, is what needs productizing.
