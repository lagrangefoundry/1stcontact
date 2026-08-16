---
uid: acceptance_criterion-cc097b48
id: AC-1116
type: acceptance_criterion
title: The grid is reachable, navigable and announced as one single-selection group
  without a mouse, and holds the keyboard from the moment the dialog opens
created_by: xgd
created_at: '2026-08-12T16:24:20.058397+00:00'
updated_at: '2026-08-16T04:19:36.273868+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The grid is usable without a mouse and honest about what it is. It is exposed as
**one single-selection group**, named by the field it stands for, and its options
are real single-selection controls — so moving between them with the keyboard, the
invariant that exactly one is chosen, and the announcement of both come from the
platform rather than from a claim the grid makes and does not honour. Every option
is one of that single group: a second group would let two tiles be chosen at once,
and two pickers open in the same dialog must not be able to un-choose each other.

The grid **holds the keyboard from the moment the dialog opens** — on the tile the
region currently holds, or the first tile if it holds none — so the picker is
navigable the instant it appears rather than a Tab away. The keyboard lands there
once the dialog is actually on screen; focus offered to a dialog that is not yet
in the document is silently discarded and would leave the operator's keyboard
wherever it was before they clicked.

Each option's accessible name is its file name. The thumbnail beside it is not
described a second time — there is nothing to describe it with, since an image's
alt text belongs to the region that uses it and not to the file, and announcing
both would announce every tile twice.

## Verification

Open the dialog over an image region with no pointer input beyond the click that
opened it. Assert the grid is exposed as a single-selection group carrying the
field's label as its accessible name; that every option within it is a
single-selection control and all of them belong to exactly one group; and that the
keyboard is on the option matching the region's current handle. Assert choosing a
second option leaves exactly one chosen.