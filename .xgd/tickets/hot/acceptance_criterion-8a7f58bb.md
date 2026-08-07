---
uid: acceptance_criterion-8a7f58bb
id: AC-1005
type: acceptance_criterion
title: 'A page being viewed behaves exactly as published: nothing is highlighted,
  nothing is intercepted, no form opens'
created_by: xgd
created_at: '2026-08-07T02:17:09.671496+00:00'
updated_at: '2026-08-07T02:36:27.643403+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

On a rendering that is not marked editable — the page as a visitor sees it —
the edit gesture does not attach: hovering highlights nothing, clicking is not
intercepted and does whatever the page itself does, and no form or message
dialog can open.

This holds as a property of the gesture rather than of the workspace's
housekeeping: even when the workspace attaches the gesture to whatever page it
is currently displaying, a page without the editable marker is left entirely
alone.

## Verification

Display a non-editable rendering of a site in the workspace, attempt to hover
and click the places that are editable in the editable rendering, and assert no
highlight appears, no dialog opens, and the page's own click behaviour is
unaltered.