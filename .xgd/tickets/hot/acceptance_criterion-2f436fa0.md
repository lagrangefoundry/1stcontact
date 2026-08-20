---
uid: acceptance_criterion-2f436fa0
id: AC-1001
type: acceptance_criterion
title: A region with nothing editable says so plainly instead of opening an empty
  form
created_by: xgd
created_at: '2026-08-07T02:16:51.413505+00:00'
updated_at: '2026-08-20T03:37:27.038921+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Clicking an editable region that exposes no editable fields — a behavior-module
instance — opens a plain message stating there is nothing to edit on that kind of
region yet, rather than an empty form and rather than nothing at all. The message
names the kind of region clicked, so the operator understands the answer is "not
this one" rather than "this is broken".

The set of regions this applies to shrinks as the surface grows, and that is the
property rather than a caveat: a region offers a form exactly when the surface
gives it fields, so an image region stopped being a dead end when it gained a
picker, and a painted panel stopped being one when it gained its background
colour. A box or container that paints **nothing** never reaches this path at
all — it is not a region, carries no address and cannot be clicked, so there is
no click to answer.

## Verification

Click a region known to expose no fields and assert a message dialog appears
carrying that statement and naming the region's kind, and that it contains no
form controls. Assert that a region the surface does give fields to — a painted
panel among them — opens the form instead.
