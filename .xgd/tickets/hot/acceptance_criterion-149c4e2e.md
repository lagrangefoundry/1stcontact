---
uid: acceptance_criterion-149c4e2e
id: AC-2517
type: acceptance_criterion
title: 'A View/Edit switch navigates neither channel: each keeps the same document
  and address across a switch and back'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:32.496281+00:00'
updated_at: '2026-11-09T04:28:31.512954+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A View/Edit switch navigates neither channel ([[BUG-79]]). Each document mode
has its own frame. Switching away from a channel and back to it reveals the
same document it held before: the same document object, at the same frame
address. Neither the channel left behind nor the channel revealed is
re-fetched, so the pane does not blank and the render does not restart.

This holds as well after the operator has followed a link inside a channel. The
pane judges what a frame holds by the page it actually arrived at, not by the
address the pane last gave it, so a frame the operator moved to another page,
with the idle channel primed at that same page, is revealed in place on every
flip rather than re-pointed at the page it already shows.

## Verification

Mount the real builder composition with View and Edit registered, and let both
channels load. Record each channel's document object and frame address. Switch
to the other mode and back. Assert each channel's frame still holds the same
document object and the same address, and that no load fired on either frame
during the switches.

Then deliver a document to View at another page of the site, as a followed link
does (the pane writes no `src` on View), and assert Edit is primed at that page
in the edit channel. Let it arrive, switch to Edit and back to View, and assert
no `src` write and no load on either frame, that each still holds the document
it was showing, and that the pane reports the ordinary channel at the linked
page.

Reference UAT: `tests/test_reconciliation_builder_flip_in_place.test.ts`
(test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel).
