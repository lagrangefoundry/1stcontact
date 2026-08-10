---
uid: acceptance_criterion-871fba3a
id: AC-1063
type: acceptance_criterion
title: The pane shows what that site's conversation already contains, on first open
  and after the workspace is reloaded
created_by: xgd
created_at: '2026-08-10T08:46:30.897019+00:00'
updated_at: '2026-08-10T08:46:30.897019+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

The messages shown in the pane are the turns that site's conversation already holds, in
the order they were spoken and with each turn attributed to whoever said it. This is
true when the workspace is first opened and again after it is reloaded, so what the
assistant remembers is what the operator can see. A site with nothing said yet shows an
empty conversation with an invitation to type, not another site's messages and not a
blank pane.

## Verification

Open the workspace for a site whose conversation already holds turns; compare the
messages rendered in the pane against the turns the conversation reports, including
their order and their speakers. Reload the workspace and confirm the same turns are
shown again. Repeat for a site with no history and confirm an empty conversation with
its invitation to type.
