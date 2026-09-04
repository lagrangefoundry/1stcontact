---
uid: acceptance_criterion-922c2d11
id: AC-976
type: acceptance_criterion
title: Every option declared for a tab reaches the workspace chrome intact
created_by: xgd
created_at: '2026-08-07T01:45:03.595854+00:00'
updated_at: '2026-09-04T05:30:48.007128+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A tab is declared once, whole, and every property of that declaration is honoured by
the chrome that mounts it — including options beyond identity and label, such as the
viewport-filling behaviour. Adding a new option to a tab declaration requires no change
to the mounting step, and no declared option is silently discarded. The identity a tab
declares is the address its panel answers to; the tab the chrome opens on is the
**first** declared one, not every declared one.

## Verification

Declare tabs carrying every supported option and assert the mounted chrome received
each declared key, iterating over the declaration's keys rather than a fixed list, so
an option added later is covered automatically. For the identity option, assert every
declared tab has an addressable panel, and assert the active tab is the first declared
tab only — asserting it for every tab was indistinguishable from this claim while the
workspace declared one tab, and a second declared tab is what makes the two readings
come apart. For the viewport-filling option, assert the number of panels opting into
the fill chain equals the number of tabs declaring it. Mutation check: removing the
viewport-filling option from a declaration must cause the displayed-area measurement
to fail, proving the option is load-bearing and actually delivered.
