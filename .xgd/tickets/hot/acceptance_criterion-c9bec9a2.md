---
uid: acceptance_criterion-c9bec9a2
id: AC-1012
type: acceptance_criterion
title: With its text unedited, a page lays out identically at every ladder width whether
  or not a run's width is floored
created_by: xgd
created_at: '2026-08-07T02:57:42.053252+00:00'
updated_at: '2026-09-10T12:38:00.689620+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion

The relaxation is **invisible for content that has not been edited**. Because the
floor's value is exactly the width that was captured, a page rendered from its
reference content lays out identically with the floor in force: every node's
bounding box at every width on the ladder matches the box the same content
produced when the width was fixed.

Relaxing the width therefore costs no reproduction fidelity — it changes what an
**edited** run does, and nothing else. (That a folded document still reproduces
its capture axis-for-axis is the round-trip gate AC-683 owns and proves against a
real capture; this criterion compares the floored render against its own fixed-
width counterfactual, not against a capture.)

## Verification

Two arms, because only one of them can run without a browser engine.

**Engine-free.** Take a folded reproduction document, render it, and synthesise
the counterfactual stylesheet by holding every floored run's width fixed again.
Observe that the two stylesheets are identical once the width declarations are
removed from both — the floor is the only thing that differs between the runs,
which is the necessary condition for the layouts to coincide.

**In a real browser** (engine-gated: reported as skipped, never as a pass, where
no engine is available). Measure every node's bounding box at each width on the
ladder, with the run widths floored and with them held fixed, and observe the two
sets of boxes are identical for every node at every width while the text is the
reference text.
