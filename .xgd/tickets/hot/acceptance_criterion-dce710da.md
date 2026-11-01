---
uid: acceptance_criterion-dce710da
id: AC-2220
type: acceptance_criterion
title: Without scripting the erasure explanation is shown in full
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:14.814382+00:00'
updated_at: '2026-11-01T20:16:14.814382+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
The server-rendered HTML of /account, before any script runs, contains the complete erasure explanation ("Closing your account", what is destroyed, the three survivors with reasons) in a visible state, not hidden. A visitor with no scripting therefore sees the whole explanation and never a control whose effect depends on a script that did not run.

## Verification
Fetch /account and parse the HTML without executing scripts. Check the explanation's headings and survivor text are present and not marked hidden.
