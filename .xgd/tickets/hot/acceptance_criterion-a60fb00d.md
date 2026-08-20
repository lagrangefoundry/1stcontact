---
uid: acceptance_criterion-a60fb00d
id: AC-1279
type: acceptance_criterion
title: A region that exposes a colour gets a colour row that opens the site's palette
  to pick from, and the pick saves in the same change as the words
created_by: xgd
created_at: '2026-08-20T03:38:45.045656+00:00'
updated_at: '2026-08-20T03:39:44.089953+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A dialog opened over a region that exposes a colour carries a **colour row** for
it: the colour that region actually paints, shown as a swatch, labelled with what
that colour is called. A run of copy gets one for its own colour; a painted panel
gets one for its background. The row is in the parameter sheet beneath the words,
never in the editing box.

Activating the row **opens the site's palette in its picking mode**, asking with
whatever palette entry the region currently holds so that entry is the one shown
as chosen — and asking with nothing where the region holds a raw colour rather
than a palette entry, because a raw colour names no entry to pre-select. What
comes back is a **palette reference and never a raw colour**, so from a region
the operator cannot invent a colour the site does not have; the swatch and its
name update to what was chosen. Backing out of the palette without choosing
leaves the row exactly as it was rather than clearing it.

The pick is **staged, not committed**. Nothing is posted, the page behind the
dialog does not re-render and the origin is not reached until Save; on Save the
chosen colour travels in the **same change** as anything else the dialog is
holding, so a dialog in which both the words and the colour were changed is one
change and one re-rendering.

A colour the surface refuses comes back the way every other refusal does: the
dialog stays open holding what was chosen, showing the reason, with the page and
the draft unchanged.

## Verification

Open the dialog over a run of copy and assert a colour row is present in the
parameter sheet and not in the editing box. Assert activating it asks the palette
for a colour, and asks with the entry the run holds — or with nothing where the
run holds a raw colour. Answer with a palette entry and assert the row now shows
it. Answer with nothing and assert the row is unchanged rather than cleared.

Assert that nothing has been posted at any point before Save. Then change the
words as well, Save once, and assert a single change lands carrying both, that
the region's colour is stored as a palette reference rather than a raw colour,
and that the page repaints with it. Repeat over a painted panel for its
background colour. Submit a colour the surface refuses and assert the dialog stays
open with the reason shown and the draft unchanged.