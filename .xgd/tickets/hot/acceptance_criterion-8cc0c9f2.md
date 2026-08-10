---
uid: acceptance_criterion-8cc0c9f2
id: AC-1110
type: acceptance_criterion
title: A control the toolbar replaces stops reacting, so a workspace held open accumulates
  nothing
created_by: xgd
created_at: '2026-08-10T11:19:04.966985+00:00'
updated_at: '2026-08-10T11:28:01.127639+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A control the toolbar replaces is released together with whatever it was using
to keep itself current. Once replaced it is inert: it no longer follows changes
to what is displayed, and only the controls presently in the strip react. So
re-deriving the strip any number of times — every mode switch and every site
switch, for as long as the workspace stays open — leaves exactly one live
updater for each control on screen and none for the controls that preceded
them. A workspace held open all day does not accumulate updaters writing to
controls that are no longer in the document.

Tearing the workspace's chrome down releases the strip's controls the same way,
along with the strip's own responsiveness to what is displayed, so mounting the
chrome again does not leave the previous strip still reacting alongside it.

## Verification

Mount the workspace with a control that keeps itself current — the
open-in-a-new-tab control, whose target follows the displayed document. Capture
that control, then change what is displayed so the strip is re-derived. Change
what is displayed once more and assert the captured control did not follow the
second change while the control now in the strip did: the replaced one is frozen
at the moment it was replaced.

Drive many re-derivations and assert the count of live subscribers on the
display panel does not grow with the number of re-derivations. Count them at the
panel rather than inferring from what is on screen, because an accumulating
updater writes to a detached element and is invisible in a correct-looking
strip — which is exactly how it escaped notice.

Finally tear the chrome down, change what is displayed, and assert nothing
reacts; mount it again and assert only the new strip does.