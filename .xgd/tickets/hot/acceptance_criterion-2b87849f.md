---
uid: acceptance_criterion-2b87849f
id: AC-2557
type: acceptance_criterion
title: Crop, rotate, resize and adjust each commit one operation to the material's
  recipe, and the modal then shows the re-fetched rendered picture; no control sends
  or rewrites bytes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:32.414786+00:00'
updated_at: '2026-11-09T19:53:52.179733+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The modal's tools are the shared editing vocabulary and nothing more — **crop, rotate, resize
and adjust** — and each commits exactly **one operation** to the material's recipe:

- **Crop** shows a box over the picture, starting inset a tenth from each edge, which can be moved
  and resized from its corners; it never leaves the picture, never inverts, and never shrinks
  below a twentieth of the picture in either direction. *Use this crop* commits it; *Cancel*
  drops it and commits nothing;
- **Turn left** and **Turn right** each commit a quarter turn (stored as 270° and 90°);
- **Resize** takes a width, opening at the picture's own width; a width below 1 commits nothing;
- **Brightness**, **Contrast** and **Saturation** are sliders over multipliers. Dragging previews
  the change; releasing commits one adjustment carrying **only the sliders that moved**, and the
  sliders then return to neutral, because the picture on screen already carries what was
  committed;
- only the operation **in progress** is drawn locally, over the picture on screen. Committing
  sends the whole recipe — a list of operations, never image bytes — to
  `POST /api/material/recipe`; on success the modal **re-fetches** the picture at a new address,
  so what the client then sees is the renderer's own output and not a cached earlier rendition;
- the material's stored original bytes are never rewritten by any control: what is stored is the
  ordered recipe on the material's record;
- there is no focal-point control.

## Verification

Open the modal on a picture, turn it right, and observe one POST whose body is the uid and a
one-entry recipe with a 90° rotate, then a new request for the picture. Crop, drag a corner past
the edge, commit, and observe a crop entry with insets clamped to the picture. Enter a width and
resize; move the brightness slider and release, and observe an adjust entry carrying brightness
alone, with the sliders back at neutral. Inspect every request and observe that none carries
image bytes, and that the material's stored original is byte-identical before and after.