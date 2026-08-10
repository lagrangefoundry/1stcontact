---
uid: acceptance_criterion-46e9debf
id: AC-1036
type: acceptance_criterion
title: A channel address resolves the same addresses it always did, and never anything
  outside its own channel
created_by: xgd
created_at: '2026-08-10T07:29:27.687900+00:00'
updated_at: '2026-08-10T07:39:48.130517+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Where a channel's bytes are decided does not change which addresses resolve. A
directory address answers with that channel's home page; an address with no file
extension answers with the corresponding page, matching the addresses the public
site serves; and the two addresses the display panel shows for a site — its
ordinary rendering and its editable one — are built the same way as before, so a
mode change swaps the pane's source and nothing about the pane or the toolbar is
rebuilt around it.

A channel address never reaches outside its own channel. An address that walks
out of the site's own assets, in plain or percent-encoded form, is not satisfied
and returns none of the targeted file's contents; an address naming a page the
channel does not contain, or a site the store does not hold, is answered as not
found rather than from a neighbour.

## Verification

Request a channel's directory address and assert it returns that channel's home
page. Assert the addresses the display panel resolves for the ordinary and
editable ways of looking at a site are the two channel addresses, unchanged.
Then request, under a channel address: a path escaping the site's assets using
traversal segments, the same path percent-encoded, a page the channel does not
contain, and a channel address for a site that does not exist — asserting each is
a non-success answer whose body carries none of the targeted file's contents.