---
uid: acceptance_criterion-e5c2749a
id: AC-2521
type: acceptance_criterion
title: A write reloads the page on screen in place and marks every other channel out
  of date, re-rendering none of them
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:39.106488+00:00'
updated_at: '2026-11-09T05:18:00.143382+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A write reloads the page on screen and marks the other channels out of date
([[BUG-79]]). The writes are a palette change, an assistant change and a segment
save. Each reloads the displayed document in place, where the frame actually
is, so a link the operator followed inside it is kept rather than replaced by
the page the mode first opened. Every other channel's frame is marked out of
date. It is not re-rendered at write time, because nobody is looking at it. The
next time it is shown it fetches, so it never serves the render from before the
write.

## Verification

Mount the real builder composition with both channels loaded. Start each write
through its real entry point, never by calling the panel's reload directly; only
the HTTP behind it is stood in for (the palette transport, the chat transport,
and the copy endpoint at `fetch`):

- **Palette change** (View shown): open the toolbar's Colors popup, change an
  entry's hex, apply it.
- **Segment save** (Edit shown): click a segment on the edit page, stage a
  colour in the segment modal, Save.
- **Assistant change** (View shown, after following a link inside it): run a
  turn whose stream announces a site change.

After each: the shown document's own window reloaded exactly once and its `src`
was not re-pointed; the idle frame was neither reloaded nor re-pointed nor
loaded. Then flip to the idle mode and, synchronously before any await, assert
the idle frame was navigated to its channel's preview address (for the
followed-link case, the linked page's address) and the pre-write document was
not announced. For the assistant case also assert the reloaded document is the
linked page.

Reference UATs: `tests/test_reconciliation_builder_flip_in_place.test.ts`:

- `test_UAT_AC2521_a_palette_change_reloads_the_shown_page_in_place_and_stales_the_others`
- `test_UAT_AC2521_a_segment_save_reloads_the_shown_page_in_place_and_stales_the_others`
- `test_UAT_AC2521_an_assistant_change_reloads_the_linked_page_in_place_and_stales_the_others`
