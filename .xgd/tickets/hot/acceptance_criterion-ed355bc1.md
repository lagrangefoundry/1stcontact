---
uid: acceptance_criterion-ed355bc1
id: AC-1112
type: acceptance_criterion
title: The site's images are chosen from a grid of thumbnails, and the dropdown of
  paths it replaces is gone rather than offered alongside it
created_by: xgd
created_at: '2026-08-12T16:23:18.231101+00:00'
updated_at: '2026-08-16T04:19:31.478011+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The closed list of images a region offers is presented as a **grid of
thumbnails** — one tile per image the region offers and nothing else in the
grid. The count is exact in both directions: every option the region declares
has a tile, and nothing that is not one of its options appears there, so the
assets an image field could never point at (a font, a stylesheet sitting in the
same place) are absent from the grid as well as from the list behind it.

The dropdown of paths this replaces is **gone rather than offered alongside it**.
Two controls answering the same question is the failure this replaces, not a
fallback worth keeping: there is exactly one way to choose an image. The rest of
the dialog is unaffected — a field that is not an image choice is still drawn by
the shared form component, and the picker replaces only the control for the
closed list.

## Verification

Over an editable rendering served by the workspace origin, open the dialog for an
image region in a site whose asset directory also holds a font and a stylesheet.
Assert the grid holds exactly one tile per option the region offers, each tile
carrying a picture and a non-empty name, and that neither the font nor the
stylesheet appears anywhere in the dialog. Assert no dropdown control exists
anywhere in the dialog, that the grid does exist, and that the form drawing the
region's other fields still exists beside it.