---
uid: acceptance_criterion-29dd375d
id: AC-1802
type: acceptance_criterion
title: 'An arrival is announced once: the boundary document and everything sharing
  its instant are not reported again'
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:36.562179+00:00'
updated_at: '2026-09-14T06:28:36.562179+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

An arrival is announced to a conversation **once**. The document that sat on the
boundary of the last sweep is not re-announced on the next turn, or on any turn
after it, and neither are any of the documents that arrived in the same instant
as it — a bulk import writes many documents at one moment, and remembering only
one of them would re-announce the rest forever.

A turn on which a genuinely newer document arrives moves the boundary forward and
carries only that document; what the conversation has already been told about
ceases to be tracked once the boundary has passed it, so what is remembered is
bounded by one instant's worth of ties and never grows with the size of the
client's knowledge.

## Verification

Open a conversation, upload a document, and take a turn; confirm the notice names
it. Take a further turn with nothing uploaded in between and confirm the document
is not named again and no notice appears. Repeat with several documents written
at the same instant: confirm all are named on the first turn after they arrive
and none is named on the next. Upload a newer document and confirm it alone is
announced.
