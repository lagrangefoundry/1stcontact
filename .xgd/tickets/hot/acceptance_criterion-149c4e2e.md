---
uid: acceptance_criterion-149c4e2e
id: AC-2517
type: acceptance_criterion
title: 'A View/Edit switch navigates neither channel: each keeps the same document
  and address across a switch and back'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:32.496281+00:00'
updated_at: '2026-11-09T03:11:32.496281+00:00'
completed_at: null
last_field_updated: created_at
status: pending
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

## Verification

Mount the real builder composition with View and Edit registered, and let both
channels load. Record each channel's document object and frame address. Switch
to the other mode and back. Assert each channel's frame still holds the same
document object and the same address, and that no load fired on either frame
during the switches.

Reference UAT: `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`
(a_mode_switch_does_not_navigate_either_channel).
