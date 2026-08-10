---
uid: acceptance_criterion-6a9ace26
id: AC-1042
type: acceptance_criterion
title: The previewed size is clamped to an editing range while every other presentation
  axis is exact — the box previews style, not layout
created_by: xgd
created_at: '2026-08-10T07:48:14.730623+00:00'
updated_at: '2026-08-10T07:48:14.730623+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

The rendered size of the copy in the editing box is brought into a legible
editing range in both directions, while family, weight, style, colour and
background are reproduced exactly. Size is the one axis deliberately not
mirrored: a display headline at its page size is unusable inside a dialog and a
fine-print line is unreadable, and the page itself is directly behind the dialog
for anything about layout. The box previews **style**, not layout.

The clamped size is still derived from the page, so a headline still previews
larger than body copy and ordinary copy previews at its own size; only the
extremes are brought in. A region whose size cannot be read at all previews at
the range's lower bound rather than at nothing.

## Verification

Open the form over copy set far above the editing range and assert the box
renders it at the range's upper bound, not the page's size; repeat for copy set
far below and assert the lower bound. Open it over copy inside the range and
assert its size is reproduced exactly. Assert that in each case family, weight,
style and colour are the page's own. Assert an unreadable or absent size yields
the lower bound.
