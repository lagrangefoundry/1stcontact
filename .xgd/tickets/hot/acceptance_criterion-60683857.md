---
uid: acceptance_criterion-60683857
id: AC-970
type: acceptance_criterion
title: The toolbar renders exactly the controls the active mode declares, and re-derives
  them when the mode changes
created_by: xgd
created_at: '2026-08-07T01:44:36.665871+00:00'
updated_at: '2026-08-07T01:58:17.517424+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

At any moment the toolbar shows exactly the controls named by the currently
active mode — no more and no fewer — and switching to a mode that names a
different set replaces the strip's contents with that set. A mode that names no
document-oriented control does not get one, so the strip never assumes a
document is displayed beneath it.

## Verification

Register two modes declaring different control sets, mount, and assert the
rendered control ids equal the active mode's declared list. Switch modes and
assert the rendered ids equal the second mode's list. Register a mode naming a
control that does not exist and assert the workspace reports it rather than
rendering a partial strip.