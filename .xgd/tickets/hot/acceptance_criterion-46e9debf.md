---
uid: acceptance_criterion-46e9debf
id: AC-1036
type: acceptance_criterion
title: A channel address resolves the same addresses it always did, and never anything
  outside its own channel
created_by: xgd
created_at: '2026-08-10T07:29:27.687900+00:00'
updated_at: '2026-08-20T01:54:59.903436+00:00'
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

Moving the decision must not have opened a hole either. The paragraph that
follows is a **regression rider**, not an independent guarantee: confinement of
the served trees is owned by AC-978 and not-found for something this origin does
not serve at all is owned by AC-979, and this rider re-runs their probes against
the new request-time mechanism so a reader knows the mechanism change was tested
against them rather than assumed safe. A channel address never reaches outside
its own channel: an address that walks out of the site's own assets, in plain or
percent-encoded form, is not satisfied and returns none of the targeted file's
contents; an address naming a page the channel does not contain, or a site the
store does not hold, is answered as not found rather than from a neighbour.

## Verification

Request a channel's directory address and assert it returns that channel's home
page. Assert the addresses the display panel resolves for the ordinary and
editable ways of looking at a site are the two channel addresses, unchanged.

Then, as the regression rider, request under a channel address: a path escaping
the site's assets using traversal segments, the same path percent-encoded, a
page the channel does not contain, and a channel address for a site that does
not exist — asserting each is a non-success answer whose body carries none of
the targeted file's contents. These re-run AC-978's and AC-979's probes through
the request-time path; the general statement of those properties, over every
served tree and every unserved name, stays with those criteria.
