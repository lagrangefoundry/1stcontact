---
uid: acceptance_criterion-ea0d145e
id: AC-2491
type: acceptance_criterion
title: A loaded page's state reads as its open L1 panel ids plus scroll offset; an
  untouched page reads as no panel open
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:48:21.435618+00:00'
updated_at: '2026-11-09T00:07:50.292820+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Reading a loaded page's state returns two things:
- the ids of the L1 panels whose shells carry the open marker, in document order;
- the vertical scroll offset, rounded to whole CSS pixels.

The read works the same way on an edit document and a draft document. An untouched page reads as no panel open at offset 0, which is the page as a visitor first meets it:
- a draft page after its script has folded the panels away;
- an edit page that nobody has told anything, even though its settled panel is visible in flow.

A shell with no id never appears in the list. The framework also exposes this initial state ("no panel, offset 0") as a named value.

## Verification
In a DOM environment, load a draft render with two panels and let the script start. Read the state and assert `dialogs` is empty. Open the second panel by clicking its opener, scroll the page, and read again. Assert that `dialogs` lists exactly that panel's id and `scrollY` equals the offset. Load the edit render of the same document with no marker set and assert that it reads as no panel open.