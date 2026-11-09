---
uid: acceptance_criterion-2f024b4b
id: AC-2497
type: acceptance_criterion
title: A panel open in View is showing in Edit, and editing copy inside it (through
  its post-save reload) does not close it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:10:58.474498+00:00'
updated_at: '2026-11-09T00:10:58.474498+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A panel open in View is showing in Edit, and editing copy inside it does not
close it ([[REQ-215]] "The rule", acceptance 8 and 10).

When the operator switches from View to Edit with one of the page's panels open,
the edit render shows that same panel open, laid over the page as it is in View.
The copy inside it can be edited like any other copy on the page. Switching back
to View shows the panel open again.

The carried state is the builder's, not the document's, so it is re-applied to
every document the pane loads on the same page, not only after a channel switch.
An edit that lands re-renders the page and reloads the frame, and the panel is
still open when the reload arrives. Without this, the first save would close the
panel the operator was editing inside.

How each channel is put into the state (activating the page's own opener in
View, setting the open markers in Edit) belongs to the framework's page-state
and the edit render. This criterion covers what the workspace does with them:
the state survives the switch and the reload.

## Verification

Mount the workspace over a page that declares an L1 panel. In View, open the
panel through the page's own opener. Switch to Edit and assert the edit
document shows that panel open and the others closed. Edit a text segment
inside the panel through the ordinary editing gesture and let the save complete
and the frame reload. Assert the reloaded edit document still shows the panel
open. Switch back to View and assert the panel is open in the ordinary channel.
