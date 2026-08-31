---
uid: acceptance_criterion-0d6bc58c
id: AC-1385
type: acceptance_criterion
title: Every storage question answers identically over all three live stores, with
  the render cases a named exception
created_by: xgd
created_at: '2026-08-31T09:47:17.168052+00:00'
updated_at: '2026-08-31T09:47:17.168052+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The same body of storage questions produces the same answers from all three live stores: the
operator's filesystem tree, the filesystem-free store used for tests, and the cloud store running
inside the Workers runtime against real database and object-store bindings.

Every question the editing surface asks is covered: whether a site has a draft; its definition;
its pages in load order; applying one whole change; listing assets; reading one asset's bytes; the
change count; recording a change; the changes since a given count; the site version; and
assembling and validating the current draft. For the same starting site, each store gives the same
answer to each.

**Named exception, deliberately stated rather than silently absent**: the two questions that
*render* the draft are answered by the filesystem-hosted stores only, because at this point the
render still runs through a build transform the Workers runtime has none of. That exclusion is
declared, not discovered — every other question is answered by all three.

## Verification

Run one shared set of assertions against each store in the runtime that store can exist in, and
observe that the pass/fail outcome is identical for every question except the two declared render
exceptions. A question added to the set must be answerable by all three, so a store that answers
differently fails on the same assertion text rather than being absent from a second copy of the
suite that quietly fell behind.
