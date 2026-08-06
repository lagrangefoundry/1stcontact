---
uid: acceptance_criterion-2f2ae0af
id: AC-954
type: acceptance_criterion
title: Content inside a behavior module's seam is addressable, rooted at the instance
  rather than the page
created_by: xgd
created_at: '2026-08-06T21:26:42.282183+00:00'
updated_at: '2026-08-06T21:39:08.534637+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
---

## Criterion

Copy and images placed into a behavior module's presentation seam are editable
regions like any other: stamped with a region kind and an address. Their
addresses are rooted at the **instance**, not the page, and each item mounted
into a seam is rooted independently rather than continuing the page's numbering.

The surrounding markup identifies which behavior instance and which seam the
region belongs to, so an address inside a module and an identical-looking address
on the page are distinguishable, and one resolution rule serves both whole pages
and mounted fragments.

## Verification

Seed a page with a behavior module carrying two items in one of its seams.
Render the edit channel. Assert the copy of each item is stamped as an editable
copy region, that the two items carry the first and second instance-rooted
addresses respectively, and that the enclosing markup names both the behavior
instance and the seam. Assert the page-rooted addresses resolve against the
definition without the module's regions being drawn into that namespace.