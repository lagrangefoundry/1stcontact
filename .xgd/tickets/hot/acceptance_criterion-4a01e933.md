---
uid: acceptance_criterion-4a01e933
id: AC-2594
type: acceptance_criterion
title: In Mark Points mode the hovered segment is outlined dimmed, a click still places
  a point on it, and the overlay stylesheet carries no copy of the renderer's region
  stamp
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-10T00:14:39.988403+00:00'
updated_at: '2026-11-10T00:54:52.257288+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-44d0a572
  kind: behavior
  regression_only: false
---

## Criterion

With Mark Points on, the segment under the pointer keeps the edit render's hover
outline, drawn dimmed (a thin, translucent outline) instead of the render's own
hot-segment treatment, whatever that treatment asked for. Hovering a segment the
renderer has stamped as editable still marks it as the hot segment, and a click
on it places a point against that segment (no editor opens). Turning the mode
off gives the render's own hover treatment back.

The stylesheet the builder injects into the preview for this mode selects the
hovered segment only by the renderer's hot-segment marker. It carries no copy of
the renderer's region-stamp attribute, so the overlay does not restate the
renderer's markup contract and does not need to change if that stamp is renamed.

## Verification

On the edit render, turn Mark Points on and hover a stamped segment:

- the segment is marked hot and its computed outline is the dimmed overlay
  outline, not the render's own hot outline;
- clicking it places a point and opens no editor;
- turning the mode off restores the render's own hover outline;
- the overlay stylesheet injected into the preview document does not contain
  the renderer's region-stamp attribute name.