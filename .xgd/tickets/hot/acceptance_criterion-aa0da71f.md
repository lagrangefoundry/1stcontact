---
uid: acceptance_criterion-aa0da71f
id: AC-1798
type: acceptance_criterion
title: A document uploaded mid-conversation is known by name on the next turn, with
  no map rebuild in between
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:21.007340+00:00'
updated_at: '2026-09-14T06:28:21.007340+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A document uploaded to a site's knowledge **during** a conversation is known to
the assistant on the very next turn of that same conversation, by name, and can
be searched and answered from — **without** the client's map having been rebuilt
in between.

This is the criterion the whole story exists for; everything else is mechanism.
The arrival is reported as a count and one or more titles: a single document
reads as one document, in the singular.

## Verification

Open a conversation for a site whose client map has not been published or
rebuilt at all, and take a turn asking whether any material exists. Confirm the
new document's title is absent from that turn's context. Upload a document.
Without rebuilding the map, take a second turn on the same conversation, and
confirm the context for that turn names the uploaded document's title and
reports that one document arrived. Confirm the assistant can then retrieve that
document's content through an ordinary search.
