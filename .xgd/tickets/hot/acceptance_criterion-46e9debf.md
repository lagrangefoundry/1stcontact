---
uid: acceptance_criterion-46e9debf
id: AC-1036
type: acceptance_criterion
title: A channel address resolves the same addresses it always did, and never anything
  outside its own channel
created_by: xgd
created_at: '2026-08-10T07:29:27.687900+00:00'
updated_at: '2026-09-10T09:49:37.136970+00:00'
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

Where a channel's bytes are decided does not change which addresses resolve. A
directory address answers with that channel's home page; an address with no file
extension answers with the corresponding page, matching the addresses the public
site serves; and the two addresses the display panel shows for a site — its
ordinary rendering and its editable one — are built the same way as before, so a
mode change swaps the pane's source and nothing about the pane or the toolbar is
rebuilt around it.

A channel address never answers from outside its own channel. An address naming
a page the channel does not contain, or a site the store does not hold, is
answered as not found rather than from a neighbouring page, channel or site.

That an address which walks *out* of a served tree is refused is not restated
here. AC-978 asserts that once, in both plain and percent-encoded form, across
all three trees the origin serves — the rendered channels among them — and
asserts the outcome is identical on each. This criterion covers the addresses
that stay inside the tree and still must not be satisfied.

## Verification

Request a channel's directory address and assert it returns that channel's home
page, and request an extensionless page address and assert it returns the
corresponding page. Assert the addresses the display panel resolves for the
ordinary and editable ways of looking at a site are the two channel addresses,
unchanged.

Then request, under a channel address, a page the channel does not contain, and
a channel address for a site the store does not hold — asserting each is a
non-success answer that does not fall through to a neighbouring page's,
channel's or site's content. Traversal probes are AC-978's; they are not
repeated here.
