---
uid: acceptance_criterion-922c2d11
id: AC-976
type: acceptance_criterion
title: Every option declared for every declared tab reaches the workspace chrome intact
created_by: xgd
created_at: '2026-08-07T01:45:03.595854+00:00'
updated_at: '2026-09-10T11:07:22.332843+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A tab is declared once, whole, and every property of **every** declared tab's
declaration is honoured by the chrome that mounts it — including options beyond
identity and label, such as the viewport-filling behaviour. Adding a new option to
a tab declaration requires no change to the mounting step, and no declared option
is silently discarded.

The claim is stated over the declaration rather than over a single tab, because a
one-tab workspace cannot distinguish "every declared tab's options are delivered"
from "the only tab's options are delivered":

- Every declared identifier addresses a mounted panel; the identifier the
  workspace opens on is the **first** declared tab's, not every tab's.
- Every declared label appears in the chrome.
- Exactly the tabs that declare the viewport-filling option receive it, and a tab
  that did not declare it does not; the opened filling panel is the one holding
  the display panel.

## Verification

Declare tabs carrying every supported option and assert the mounted chrome
received each declared key, iterating over each declaration's own keys rather than
a fixed list, so an option added later is covered automatically and an option
nothing accounts for fails rather than passing silently. For each key assert the
delivered value against the tab it was declared on: an identifier resolves to a
mounted panel, and for the first declared tab only, is also the opened one; a
label is present in the chrome's text; the viewport-filling option yields as many
filling panels as there are tabs declaring it, and the opened filling panel
contains the display panel. Mutation check: removing the viewport-filling option
from the site tab's declaration must cause the displayed-area measurement to fail,
proving the option is load-bearing and actually delivered.
