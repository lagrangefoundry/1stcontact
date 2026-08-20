---
uid: acceptance_criterion-bf681cf0
id: AC-1284
type: acceptance_criterion
title: A tracked run previews at the page's own letter-spacing on the words themselves,
  an untracked run is given none, and the parameter sheet stays dressed as chrome
created_by: xgd
created_at: '2026-08-20T03:39:09.341914+00:00'
updated_at: '2026-08-20T03:39:57.147127+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

The editing box mirrors the page's **tracking** all the way to the glyphs: a run
the page sets with letter-spacing opens with the operator's words previewed at
that spacing, and a run that asks for none is given none rather than whatever the
last region was set in.

What has to be true is that the **words** carry it, not the box around them. The
words are drawn by a control inside the box, and a value that lands on the box
and stops there previews nothing — which is what happened for the whole life of
this defect, and why it is asserted on both: the box holding the value proves the
dressing read the page, the words holding it proves the dressing reached them.
Tracking is not a control the operator can move, so its failure never read as a
dead control — only as the box quietly mis-mirroring any headline set tight,
which is why it went unreported and why nothing asserted it at all.

The rule that carries it in is **scoped to the editing box**, which is the only
place in the workspace that dresses a control in the page's typography rather
than the workspace's own. The parameter sheet's controls sit outside it and keep
reading as chrome, at the chrome's own tracking, so widening that scope shows up
here rather than in the operator's eyes.

## Verification

Open the dialog over a run the page sets with a distinctive letter-spacing.
Assert the box carries that spacing **and** that the element the words are
actually drawn in carries it too, at the page's own value rather than at the
property's default. Open the dialog over a run that declares no letter-spacing
and assert the words are given none. In that same dialog, assert the parameter
sheet renders controls of its own and that every one of them is drawn at the
chrome's own tracking.

Measure in a real browser engine against the shipped stylesheets: a DOM
implementation with no user-agent stylesheet and no inherited-property resolution
can represent neither the reset that broke this nor the rule that restores it,
and a check over the stylesheet text proves only that a declaration exists —
which was true throughout the defect. Where no browser can be launched, report
the criterion loudly as unverified rather than reducing it to something weaker.