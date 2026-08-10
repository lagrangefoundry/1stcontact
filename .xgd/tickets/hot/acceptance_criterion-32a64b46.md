---
uid: acceptance_criterion-32a64b46
id: AC-1065
type: acceptance_criterion
title: A message sent from the pane goes to the conversation on screen and the reply
  arrives progressively in the message list
created_by: xgd
created_at: '2026-08-10T08:46:55.320006+00:00'
updated_at: '2026-08-10T09:01:23.587561+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

Sending from the composer addresses the conversation the pane is currently showing, and
only that one. The operator's message appears in the list as sent, and the assistant's
reply appears as it is produced rather than only once the turn has finished, ending as
a single completed assistant message. After a site switch, a message sent goes to the
newly shown site's conversation, with nothing identifying the previous site carried
into it.

## Verification

Switch the workspace to a second site, then send a message from the pane. Confirm the
turn is addressed to that site's conversation and carries only that conversation and the
typed text. Confirm the sent message and the assistant's reply both appear in the list,
that reply content is rendered before the turn completes, and that exactly one assistant
message results.