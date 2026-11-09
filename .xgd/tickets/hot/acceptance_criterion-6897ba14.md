---
uid: acceptance_criterion-6897ba14
id: AC-2499
type: acceptance_criterion
title: Edit alone offers a panel selector naming the page's panels by their text;
  a page with none shows no control; a pick applies without reloading
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:11:01.720588+00:00'
updated_at: '2026-11-09T00:11:01.720588+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Edit alone offers a panel selector, and it reads the page in front of the
operator ([[REQ-215]] §6, acceptance 9).

- **Edit only.** The edit mode's toolbar carries a "Panel" selector. The view
  mode's toolbar never does: in View, which panel is open is the reader's own
  hand, and that channel behaves exactly as published.
- **Read from the rendered document.** The options are "No panel" followed by
  one entry for each panel the loaded page declares with an id. The selector
  needs nothing from the site's definition and cannot offer a panel the render
  does not have. It is re-read whenever the pane loads a document.
- **Named by what is written in it.** Each panel is labelled by its accessible
  name if it has one, else its first heading, else the first text it contains.
  Long text is cut to 40 characters and followed by an ellipsis. Its id appears
  only when the panel contains no text at all.
- **No panels, no control.** On a page that declares no panel, the selector is
  not shown at all, not shown empty.
- **The selection reflects the carried state.** On arrival the selector shows
  the panel that is currently open. If the page no longer declares the carried
  panel, the selector reads "No panel" and the carried state follows it.
- **Picking applies without reloading.** Choosing a panel shows it over the
  page, and choosing "No panel" closes it. Both apply to the document already
  loaded, so the frame does not reload and the operator keeps their place. The
  pick is carried like any other open panel: it survives the post-save reload
  and a switch to View.

## Verification

Mount the workspace over a page declaring two panels. One has an accessible
name, and the other has only a heading. Mount it also over a page declaring
none.

In Edit on the first page, assert the selector lists "No panel" and the two
panels by their accessible name and heading text, not by their ids. Pick one
and assert it is shown open in the loaded document, and that the frame's
document is the same object (no reload occurred). Pick "No panel" and assert
nothing is open. Switch to View and assert no panel selector is in the strip.
Load the page with no panels in Edit and assert no selector is shown.
