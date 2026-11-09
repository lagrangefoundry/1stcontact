---
uid: acceptance_criterion-dadda0fd
id: AC-2520
type: acceptance_criterion
title: A revealed document is announced like a loaded one, and the edit loop, Marked
  Points and the carry bind to the panel's announcement
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T03:11:37.438614+00:00'
updated_at: '2026-11-09T04:54:18.307069+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The panel announces the document the operator is looking at, whether it just
loaded or was just revealed ([[BUG-79]]). A frame that already holds a current
document fires no load when it is revealed, so the panel announces that document
itself on reveal, as it does when the shown frame loads. A load in a frame that
is not shown (a primed or idle channel) is not announced.

The edit loop, Marked Points and the carried page state ([[REQ-215]]) bind to
the panel's announcement, never to one frame. So after a flip they act on the
document now on screen: editing works in Edit, and the carried state is applied
to the revealed page.

## Verification

Mount the real builder composition, let both channels load, and subscribe to the
panel's document announcement. Switch mode and assert exactly one announcement
arrives, carrying the revealed frame's document, with no load fired. Assert the
edit loop and the carried state are bound to that document: the revealed page
is at the carried scroll offset, and in Edit a segment is editable.

Reference UAT: `tests/test_reconciliation_builder_flip_in_place.test.ts`
(`test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it`).
