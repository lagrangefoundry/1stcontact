---
uid: acceptance_criterion-e2cece6c
id: AC-2496
type: acceptance_criterion
title: Switching between View and Edit keeps the page and the scroll offset the operator
  was at
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:10:56.482429+00:00'
updated_at: '2026-11-09T03:44:20.228622+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Switching between View and Edit keeps the page and the scroll offset the
operator was at ([[REQ-215]] acceptance 1 and 2; [[BUG-79]]).

The two channels are two renders of one page, and the operator experiences them
as one page with a toggle. Each channel keeps its own frame, and the idle one is
primed at the page the operator is on. So a switch to a channel that already
holds that page navigates neither channel ([[BUG-79]]): the document being left
keeps its own place, and the document revealed is one that is already laid out.
The workspace reads where in the channel the outgoing document is and how far
down it is scrolled, and applies that to the document revealed. Because that
document is already laid out, the offset lands exactly rather than being
re-applied against a layout that is still arriving.

If the operator moved to another page in the channel they are leaving, the
channel they flip to shows that same page. When the frame being flipped to holds
a different page (for example, the operator followed a link inside that channel
earlier, so the frame is no longer at the address the pane gave it), that one
frame is pointed at the operator's page. The carried offset is applied when that
page arrives. Switching back does the same in reverse.

This is a property of the builder chrome, not of either render. The rendered
documents ship nothing to make it happen, and the edit render stays as inert as
it was.

## Verification

Mount the workspace over a site with at least two pages, one long enough to
scroll. In View, navigate the frame to the long non-home page and scroll it to a
known offset. Let the Edit channel be primed at that page. Switch to Edit and
assert the shown document is that page in the edit channel, revealed with no
load, and that its scroll offset is the one set in View. Scroll to a different
offset and switch back to View. Assert the ordinary channel is pointed at the
same page, and that the page arrives at the new offset.

Reference UAT: `tests/test_reconciliation_builder_page_carry.test.ts`
(test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset).
