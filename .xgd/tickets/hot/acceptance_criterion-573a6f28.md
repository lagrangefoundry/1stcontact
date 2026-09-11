---
uid: acceptance_criterion-573a6f28
id: AC-1727
type: acceptance_criterion
title: Every area is activatable without dragging and commits the same role
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:23.812269+00:00'
updated_at: '2026-09-11T05:42:22.329352+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

Every area is reachable without dragging. Activating an area directly — clicking it, or reaching
it by keyboard and activating it — opens the platform's file chooser, and the files chosen there
are handed over with exactly the role of the area that was activated, identically to a drop into
that area.

Each area is an activatable control (not decorative text), so it is focusable and announced as
something that can be activated.

## Verification

Assert each of the two areas is an activatable control. Activate one, supply a file through the
chooser it opens, and assert one handover occurs carrying that file and the activated area's
role — the same handover a drop into that area produces.