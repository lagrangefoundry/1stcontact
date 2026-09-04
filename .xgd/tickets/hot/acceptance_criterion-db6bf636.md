---
uid: acceptance_criterion-db6bf636
id: AC-1574
type: acceptance_criterion
title: 'Every answer is reachable without dragging: activating one opens the file
  chooser and creates under that same answer'
created_by: xgd
created_at: '2026-09-04T04:51:49.314946+00:00'
updated_at: '2026-09-04T04:51:49.314946+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1144410d
  kind: behavior
  regression_only: false
---

## Criterion

Every answer is reachable without dragging. Activating an answer directly — by pointer or by
keyboard, as an ordinary control — opens the system's own file chooser, and the files chosen there
are created under exactly the answer that was activated, with the same outcome as releasing a drag
onto it. Choosing the same file again immediately afterwards works a second time.

## Verification

Activate each answer in turn without any drag, select a file, and confirm material is created under
that answer's role. Repeat with the same file to confirm a second selection is accepted rather than
silently ignored.
