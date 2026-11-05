---
uid: acceptance_criterion-22912e9f
id: AC-2326
type: acceptance_criterion
title: An event's row is indistinguishable from the same row in a re-read list; the
  description text is re-read only for the material whose detail is open, and not
  while its description editor is in edit mode
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:07:08.141277+00:00'
updated_at: '2026-11-05T21:21:58.280448+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

An `enter` or `update` event carries a finished material row of exactly the shape, and with
exactly the values, that the list read returns for that material — built from the change itself,
with no second read of the store per event — together with the change kind (`enter`, `exit`,
`update`), its cause (distinguishing a newly created material from one changed into the list) and
whether the description moved. An `exit` carries the uid alone. A row-visible field change (for
example the description status) redraws the row from the event alone.

The description text is not carried by the feed. When an event reports that the description of the
material whose detail is open has changed, the pane re-reads that one material and repaints its
description with what the store now holds — exactly one item read. The same event for a material
whose detail is not open causes no read. While the open detail's description editor is in edit
mode, no read is made at all and what the operator has typed is left exactly as it is.

## Verification

Compare the row in an `update` event with the same material's row from a fresh list read: equal.
Change a material's description status and observe its row redraw with no request. With a detail
open, write its description elsewhere and observe exactly one item read and the new text shown;
write another material's description and observe no read. Open the description editor, type,
write the description elsewhere, and observe no read and the typed text unchanged.