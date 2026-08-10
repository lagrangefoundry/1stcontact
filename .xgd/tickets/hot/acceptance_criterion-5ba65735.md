---
uid: acceptance_criterion-5ba65735
id: AC-1069
type: acceptance_criterion
title: An origin that cannot be reached at all is reported in the pane rather than
  leaving it blank or waiting forever
created_by: xgd
created_at: '2026-08-10T08:47:30.279145+00:00'
updated_at: '2026-08-10T09:01:22.240772+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

When the conversation for the shown site cannot be opened at all, the pane still
presents its conversation surface and states in it that the assistant could not be
reached, including the underlying reason. The operator is not left with an empty pane,
a bare rail, or an indefinite wait, and the failure is reported in the same place and
the same form as an assistant that is merely unable to run.

## Verification

Open the workspace with the assistant origin failing every attempt to open a
conversation. Confirm the pane still contains a conversation surface, that a message in
it reports the assistant could not be reached and includes the underlying reason, and
that no spinner or blank pane persists.