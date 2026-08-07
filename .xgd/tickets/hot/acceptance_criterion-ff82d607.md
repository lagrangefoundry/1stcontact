---
uid: acceptance_criterion-ff82d607
id: AC-993
type: acceptance_criterion
title: Hovering an editable region on the page marks that region, and only that region,
  as the live one
created_by: xgd
created_at: '2026-08-07T02:16:15.374191+00:00'
updated_at: '2026-08-07T02:16:15.374191+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

On an editable rendering of a page, moving the pointer over an editable region
puts that region into the highlighted state the rendering defines. Before the
pointer arrives, the region is not highlighted. Moving the pointer to a
different editable region highlights that one and clears the previous one, so at
most one region is highlighted at a time; moving the pointer off the page's
editable content clears the highlight entirely.

The highlight must not change the page's layout: the position and size of every
region are the same highlighted as not, because the rendering being edited must
keep the geometry of the page it represents.

## Verification

Drive a real browser over the page displayed in the workspace's edit mode.
Observe that a region carries no highlighted state initially, carries it while
hovered, loses it when a sibling region is hovered, and loses it when the
pointer leaves. Compare the region's rendered box before and while highlighted.
