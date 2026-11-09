---
uid: acceptance_criterion-46e9debf
id: AC-1036
type: acceptance_criterion
title: A channel address resolves the same addresses it always did, the panel composes
  it from the channel root plus the reader's page, and it never answers outside its
  own channel
created_by: xgd
created_at: '2026-08-10T07:29:27.687900+00:00'
updated_at: '2026-11-09T00:10:51.379897+00:00'
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

Where a channel's bytes are decided does not change which addresses resolve. A
directory address answers with that channel's home page. An address with no file
extension answers with the corresponding page, matching the addresses the public
site serves.

The display panel builds the two addresses it shows for a site (its ordinary
rendering and its editable one) from one grammar: the channel root for that
site, followed by the path within the channel of the page the reader is on
([[REQ-215]]). On first opening a site, or after changing site, that path is
empty and the address is the channel root, as before. After the reader has
moved within the site, both addresses carry the same path, so a mode change
swaps the pane's source to the same page in the other channel. Nothing about
the pane or the toolbar is rebuilt around it. A path carried this way arrives
already percent-encoded and is not encoded a second time.

A channel address never answers from outside its own channel. An address naming
a page the channel does not contain, or a site the store does not hold, is
answered as not found rather than from a neighbouring page, channel or site.

That an address which walks *out* of a served tree is refused is not restated
here. AC-978 asserts that once, in both plain and percent-encoded form, across
every tree the origin serves (the rendered channels among them, alongside each
prefix of the built-artifact tree), and asserts the outcome is identical on
each. This criterion covers the addresses that stay inside the tree and still
must not be satisfied.

## Verification

Request a channel's directory address and assert it returns that channel's home
page. Request an extensionless page address and assert it returns the
corresponding page.

Assert the addresses the display panel resolves for the ordinary and editable
ways of looking at a freshly opened site are the two channel roots. Move the
frame to a page within the site, including one whose path holds a
percent-encoded character, and assert both addresses are the channel root plus
that same path, with the encoding unchanged.

Then request, under a channel address, a page the channel does not contain, and
a channel address for a site the store does not hold. Assert each is a
non-success answer that does not fall through to a neighbouring page's,
channel's or site's content. Traversal probes are AC-978's; they are not
repeated here.
