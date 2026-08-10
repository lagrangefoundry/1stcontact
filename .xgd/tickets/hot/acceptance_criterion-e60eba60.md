---
uid: acceptance_criterion-e60eba60
id: AC-1070
type: acceptance_criterion
title: Switching sites faster than the answers arrive still leaves the pane on the
  site last chosen
created_by: xgd
created_at: '2026-08-10T08:47:35.145335+00:00'
updated_at: '2026-08-10T09:01:21.922584+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

If the operator changes site again before the previous site's conversation has been
retrieved, the pane ends up showing the conversation for the site chosen last. The
late-arriving conversation for the abandoned site is discarded: none of its turns appear
in the pane, and a message sent afterwards goes to the last-chosen site's conversation.

## Verification

With the first site's conversation held unanswered, switch to a second site and let the
second answer immediately; then release the first. Confirm the pane shows the second
site's conversation, that none of the first site's turns are present, and that a message
sent afterwards is addressed to the second site's conversation.