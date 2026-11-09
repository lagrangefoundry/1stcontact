---
uid: acceptance_criterion-e2cece6c
id: AC-2496
type: acceptance_criterion
title: Switching between View and Edit keeps the page and the scroll offset the operator
  was at
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:10:56.482429+00:00'
updated_at: '2026-11-09T03:11:31.205010+00:00'
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
as one page with a toggle. A switch navigates neither channel ([[BUG-79]]), so
the document being left keeps its own place, and the document being revealed is
one that is already laid out. The workspace reads where in the channel the
outgoing document is and how far down it is scrolled, and applies that to the
document revealed. Because that document is already laid out, the offset lands
exactly rather than being re-applied against a layout that is still arriving.
If the operator moved to another page in the channel they are leaving, the
channel they flip to shows that same page. Switching back does the same in
reverse.

This is a property of the builder chrome, not of either render. The rendered
documents ship nothing to make it happen, and the edit render stays as inert as
it was.

## Verification

Mount the workspace over a site with at least two pages, one long enough to
scroll. In View, navigate the frame to the long non-home page and scroll it to a
known offset. Switch to Edit and assert the shown document is that page in the
edit channel and its scroll offset is the one set in View. Scroll to a different
offset, switch back to View, and assert the ordinary channel shows the same page
at the new offset.
