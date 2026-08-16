---
uid: acceptance_criterion-a044b294
id: AC-1062
type: acceptance_criterion
title: The workspace's secondary pane is a working conversation surface for the site
  being displayed, with no action from the operator
created_by: xgd
created_at: '2026-08-10T08:46:25.975622+00:00'
updated_at: '2026-08-16T04:42:02.958023+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When the workspace opens, the pane beside the display panel contains a working
conversation surface — a message list and a composer that can be typed into and sent
from — for the site the display panel is currently showing. It is present before the
operator does anything: no button to start a conversation, and no line of placeholder
text standing in for one.

## Verification

Open the workspace with at least one site in the store. Observe that the secondary pane
contains a message area and a composer, that the conversation it holds is the one for
the site the display panel reports as current, and that no interaction was required to
get there.