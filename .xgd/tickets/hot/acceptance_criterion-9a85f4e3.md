---
uid: acceptance_criterion-9a85f4e3
id: AC-1669
type: acceptance_criterion
title: The map rebuild a material write triggers is deferred, not awaited in the turn
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:38.209835+00:00'
updated_at: '2026-09-11T04:01:57.145671+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

The map rebuild a material write triggers is handed to the caller's deferral
point rather than awaited: the material-written notification returns while the
rebuild is still in progress, so the conversation never waits on a description.

Concretely, with a corpus above the listing budget so that rebuilding costs a
description step:

- the notification has returned while the description step is still blocked, and
  at that moment no new map is published;
- the rebuild is present at the deferral point the caller supplied, and is the
  same in-flight work the notification handed back to the caller, so a caller
  that *does* want to wait (a queue consumer, a test) can;
- the rebuild is genuinely running rather than merely not-yet-started — the
  description step has been reached;
- once the description step completes, the map is published and is a clustered
  description of territories rather than a listing.

## Verification

Open a client knowledge base with a listing budget of zero, so any corpus is
above the floor, and with a deferral point that collects work rather than running
it. Add several material documents. Supply a describer that records that it was
reached and then blocks on a barrier the test controls.

Await the material-written notification. Assert: it returned; no map is
published; the collected deferral work is exactly the rebuild the notification
handed back; and, after yielding, the describer records having been reached while
the map is still unpublished. Release the barrier, await the rebuild, and assert
a map is now published and that the build reports the clustered form.