---
uid: acceptance_criterion-760957b5
id: AC-2085
type: acceptance_criterion
title: Selecting a captured reference shows its screenshot as the preview, addressed
  as one member of the capture
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:17:13.195085+00:00'
updated_at: '2026-11-01T02:17:13.195085+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A captured reference appears in the Library as a *capture*-kind row, and selecting it shows the
capture's full-page screenshot as the preview — a picture of the site, not the capture's other
files. The picture is fetched as **one named member** of the capture, by the screenshot's own
name, and not as whichever of the capture's files would come back first for the material as a
whole.

The capture's detail shows **no reader window**, even when its content type names a text or JSON
member the reader could draw: the screenshot is the only thing shown for it. The picture carries
the capture's title as its text alternative.

If the screenshot cannot be fetched — the capture holds none, or its bytes are gone — the
preview is replaced by the same plain statement that the file is no longer in storage that any
other unreadable material shows, rather than a broken image.

## Verification

Adopt a capture whose members include its full-page screenshot and a JSON member, so that the
capture's row is listed in the Library. Select it and observe a picture whose address names the
capture and the screenshot member explicitly, rendering the screenshot's bytes, with the
capture's title as its alternative text. Observe that no reader window is present in the pane.
Select a capture whose screenshot cannot be served and observe the "no longer in storage"
statement in place of the picture.
