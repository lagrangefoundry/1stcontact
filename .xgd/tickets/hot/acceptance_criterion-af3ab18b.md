---
uid: acceptance_criterion-af3ab18b
id: AC-1726
type: acceptance_criterion
title: Dropping files into an area commits that role and withdraws the overlay
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:19.818586+00:00'
updated_at: '2026-09-11T05:32:19.818586+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

Dropping files into one of the two areas commits that role: the files are handed to the platform
for ingestion with that role attached and with the entry point they came from, and the overlay
withdraws so the client is not left deciding something they have already decided.

Dropping into the *just for you to read* area hands over `reference`; dropping into the *put it on
the site* area hands over `site`. Every file carried by the drop is handed over, and no other
gesture on the overlay hands anything over.

## Verification

With the overlay raised, drop a file into each area in turn and assert that exactly one handover
occurs per drop, carrying the dropped file(s) and the role identifier of the area dropped into,
and that the overlay is no longer showing afterwards.
