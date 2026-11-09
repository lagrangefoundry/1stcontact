---
uid: acceptance_criterion-e2cece6c
id: AC-2496
type: acceptance_criterion
title: Switching between View and Edit keeps the page and the scroll offset the operator
  was at
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:10:56.482429+00:00'
updated_at: '2026-11-09T04:28:06.962940+00:00'
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
channel they flip to shows that same page. Whether a frame already holds that
page is judged by the page it ACTUALLY holds, not by the address the pane last
gave it: a frame the operator moved by following a link inside it is at the page
it arrived at. So a frame that already holds the operator's page is revealed in
place even if the pane never pointed it there, and a frame is re-pointed only
when the page it actually holds differs from the operator's page. In that case
that one frame is pointed at the operator's page, and the carried offset is
applied when that page arrives. Switching back does the same in reverse.

This is a property of the builder chrome, not of either render. The rendered
documents ship nothing to make it happen, and the edit render stays as inert as
it was.

## Verification

Mount the workspace over a site with at least two pages, one long enough to
scroll. In View, follow a link so the frame moves by itself to the long non-home
page (the pane never points it there), and scroll it to a known offset. Let the
Edit channel be primed at that page. Switch to Edit and assert the shown
document is that page in the edit channel, revealed with no load, and that its
scroll offset is the one set in View. Scroll to a different offset and switch
back to View. Assert the View frame is not re-pointed (no `src` write) and no
load fires, that the shown document is still the very View document the
operator left, that the pane reports the ordinary channel at the same page, and
that the offset carried from Edit is applied to that document.

Reference UAT: `tests/test_reconciliation_builder_page_carry.test.ts`
(test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset).
