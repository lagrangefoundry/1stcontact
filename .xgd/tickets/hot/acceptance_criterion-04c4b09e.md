---
uid: acceptance_criterion-04c4b09e
id: AC-969
type: acceptance_criterion
title: 'Registering a mode is an added entry: a mode the panel has never heard of
  works end to end'
created_by: xgd
created_at: '2026-08-07T01:44:32.309608+00:00'
updated_at: '2026-08-07T01:58:17.858284+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A mode the panel has no knowledge of, contributed from outside it, becomes fully
usable without any change to the panel: it appears among the selectable modes,
switching to it displays what it declares, and the toolbar renders the controls
it names. Nothing about the panel branches on which specific modes exist.

## Verification

Mount the workspace, register an additional mode defined entirely in the test
(its own id, its own displayed source, its own declared control set), then
switch to it. Assert it is offered among the modes, that the pane displays the
source it declared, and that the toolbar shows exactly the controls that mode
named.