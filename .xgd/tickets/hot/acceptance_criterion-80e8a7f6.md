---
uid: acceptance_criterion-80e8a7f6
id: AC-2555
type: acceptance_criterion
title: Only raster image material is offered the editor; captures, drawings and every
  other kind are not, and a direct edit request for them is refused 403
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:27.973754+00:00'
updated_at: '2026-11-09T19:53:52.907264+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Exactly one rule decides which material is a picture the editing tools apply to, and the Library,
the chat and the edit route all apply that same rule, so the surface can never offer an editor
the route then refuses:

- **an editable picture is image-kind material whose content type is not SVG** (a content-type
  parameter or letter case does not change the answer);
- a **capture** — its screenshot is drawn in the detail pane like a picture — is not offered the
  editor: its picture is not inside an opening button, and clicking it opens nothing;
- a **drawing** (an SVG, which is filed as an image) is likewise not offered the editor;
- documents, fonts and every other kind are not offered it;
- a direct request to store edits on material outside the rule is **refused 403** and leaves the
  record's edits unchanged. The refusal says which refusal it is: for a drawing, that it is
  changed by redrawing rather than by cropping; for everything else, that it is not a picture
  and there is nothing to crop, turn or adjust.

## Verification

Select a raster image row and observe the picture inside an opening button. Select a capture row
and an SVG image row and observe the picture drawn with no opening button, and that clicking it
opens no dialog. Post a recipe for the SVG material and observe 403 with the drawing sentence and
its stored edits unchanged; post one for a PDF document and for a capture and observe 403 with
the not-a-picture sentence and nothing stored.