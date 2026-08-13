---
uid: acceptance_criterion-6a9ace26
id: AC-1042
type: acceptance_criterion
title: The size the box OPENS at is clamped to an editing range while every other
  presentation axis is exact — the box previews style, not layout
created_by: xgd
created_at: '2026-08-10T07:48:14.730623+00:00'
updated_at: '2026-08-13T01:08:23.874832+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

**The size the box opens at** is brought into a legible editing range in both
directions, while family, weight, style, colour and background are reproduced
exactly. Size is the one axis deliberately not mirrored: a display headline at
its page size is unusable inside a dialog and a fine-print line is unreadable,
and the page itself is directly behind the dialog for anything about layout. The
box previews **style**, not layout.

The clamped size is still derived from the page, so a headline still previews
larger than body copy and ordinary copy previews at its own size; only the
extremes are brought in. A region whose size cannot be read at all previews at
the range's lower bound rather than at nothing.

This is the opening dressing, and the range applies to it alone. A size the
operator subsequently *changes* in the parameter sheet is previewed by the scale
this opening dressing established — the ratio between what the box shows and
what the run is set to — rather than being put through the range again, which
for a run already sitting on the upper bound would answer every increase with no
visible difference at all. That live rule, and the bound it does keep, are their
own criterion; nothing about the size the box opens at changes.

## Verification

Open the form over copy set far above the editing range and assert the box
renders it at the range's upper bound, not the page's size; repeat for copy set
far below and assert the lower bound. Open it over copy inside the range and
assert its size is reproduced exactly. Assert that in each case family, weight,
style and colour are the page's own. Assert an unreadable or absent size yields
the lower bound. Every assertion is made on the freshly opened form, before any
parameter is touched.