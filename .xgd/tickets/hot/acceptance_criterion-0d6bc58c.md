---
uid: acceptance_criterion-0d6bc58c
id: AC-1385
type: acceptance_criterion
title: Every storage question answers identically over all three live stores, the
  render included
created_by: xgd
created_at: '2026-08-31T09:47:17.168052+00:00'
updated_at: '2026-09-10T06:46:37.921946+00:00'
completed_at: null
last_field_updated: title
status: active
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

**The two render questions are named apart from the compared answer vector, and asked of every
store.** Rendering the draft is not a verb the port has — the renderer is a *consumer* of the
store — and what it returns is an artifact rather than a value two adapters can be compared on
field-for-field, so it is named separately rather than folded into the vector. Apart is not
absent: both render questions are asserted in the shared contract body, so every one of the three
stores answers them, the cloud store included. There is no runtime barrier to state: the render
runs in the Workers runtime as well as on the host, and no build transform stands between the two
runtimes at all.

## Verification

Run one shared set of assertions against each store in the runtime that store can exist in, and
observe that the pass/fail outcome is identical for every question. A question added to the set
must be answerable by all three, so a store that answers differently fails on the same assertion
text rather than being absent from a second copy of the suite that quietly fell behind.

The two render questions are verified the same way — one body, registered once per adapter — by
driving the preview renderer over whichever store the fixture built: a draft page comes back as
rendered markup, a preview asset comes back as its bytes with its media type, and a path that
walks out of the assets root resolves to nothing. That the Workers runtime renders is separately
evidenced by the cloud-loaded draft rendered inside workerd and by the real preview request served
over the database and object-store bindings.