---
uid: acceptance_criterion-557f94f1
id: AC-2553
type: acceptance_criterion
title: Clicking an editable picture in the Library detail pane opens the image modal,
  showing the picture as it currently stands and its Library name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:23.647508+00:00'
updated_at: '2026-11-09T19:53:53.593921+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

In the Library detail pane, a picture the editor applies to (stated separately) is drawn inside a
real, labelled **button**, so opening the editor is reachable from the keyboard and not only with
a mouse. Clicking or activating it opens **the image modal** in the workspace's own dialog shell:

- the modal shows, first, the material's **Library name** in an editable field (stated
  separately), then the picture, then the four editing tools, then **Undo** and **Redo**, and a
  **Close** button;
- the picture on the stage is fetched from the material's own file address, which serves the
  picture **as it currently stands** — the stored original with every committed edit already
  applied by the platform's renderer — so a picture already cropped opens cropped;
- the modal opens holding the edits already on the material's record, so its first commit adds
  to them rather than starting the picture over;
- pressing the button again while the modal is open does not open a second dialog over the
  same picture;
- selecting a different row closes the modal, so it never stays open over a material that is no
  longer the one in the pane;
- Escape, the backdrop and the close button behave as the workspace dialog shell already does.

## Verification

Select an editable picture in the Library and observe the picture rendered inside a focusable
button carrying an accessible label. Activate it from the keyboard and observe the modal open
with the name field above the picture, the crop, turn, resize and adjustment controls, Undo,
Redo and Close. For a material whose record already carries a crop, observe the stage request
the material's file address and show the cropped picture. Activate the button a second time and
observe still exactly one dialog. With the modal open, select another row and observe the modal
gone.