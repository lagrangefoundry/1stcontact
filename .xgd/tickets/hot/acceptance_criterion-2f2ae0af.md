---
uid: acceptance_criterion-2f2ae0af
id: AC-954
type: acceptance_criterion
title: Content inside a behavior module's seam is addressable, rooted at the instance
  rather than the page
created_by: xgd
created_at: '2026-08-06T21:26:42.282183+00:00'
updated_at: '2026-08-16T04:18:41.094620+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
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

**Marking the seam is the module's own declaration, and every module in the
catalog that exposes one makes it.** Only the module knows which of its elements
is a seam — the same reason it, and not the channel, declares what its
behaviour-off state looks like. A module that leaves its seam unmarked leaves the
copy inside it carrying a bare address that cannot be told apart from a
page-rooted one, and therefore unresolvable; so this holds for the contact form's
form seam as much as for the carousel's slide, and for any module added after
them. The marker is structural and inert: the module declares it in every
channel, and it carries no behaviour and no styling of its own.

## Verification

For each module in the catalog that exposes a presentation seam, seed a page
mounting an instance with two items of copy in that seam and render the edit
channel. Assert the copy of each item is stamped as an editable copy region, that
the two items carry the first and second instance-rooted addresses respectively,
and that the enclosing markup names both the behavior instance and the seam — so
the scope of every seam-rooted address is recoverable from the markup around it.
Assert the page-rooted addresses resolve against the definition without the
module's regions being drawn into that namespace.