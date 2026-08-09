---
uid: acceptance_criterion-c9bec9a2
id: AC-1012
type: acceptance_criterion
title: With its text unedited, a page lays out identically at every ladder width whether
  or not a run's width is floored
created_by: xgd
created_at: '2026-08-07T02:57:42.053252+00:00'
updated_at: '2026-08-09T05:41:56.190402+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The relaxation is **invisible for content that has not been edited**. Because the
floor's value is exactly the width that was captured, a page rendered from its
reference content lays out identically with the floor in force: every node's
bounding box at every width on the ladder matches the box the same content
produced when the width was fixed, and matches the captured reference within the
round-trip tolerance.

Relaxing the width therefore costs no reproduction fidelity — it changes what an
**edited** run does, and nothing else.

## Verification

Take a folded reproduction document and, in a real browser, measure every node's
bounding box at each width on the ladder, with the run widths floored and with
them held fixed. Observe the two sets of boxes are identical for every node at
every width while the text is the reference text, and that the same document's
round-trip fidelity against the original capture is unchanged.