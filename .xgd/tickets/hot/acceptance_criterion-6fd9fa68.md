---
uid: acceptance_criterion-6fd9fa68
id: AC-2191
type: acceptance_criterion
title: When the server rejects a save, the panel rolls the cell back and shows the
  server's message
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:02.673693+00:00'
updated_at: '2026-11-01T19:33:02.673693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
If a save from Who they are is rejected, for example because another person in this business already holds the address, the edited cell goes back to its last saved value and the rejection message is shown next to that field. The typed value is not left in the cell as if it had been saved.

## Verification
Mount the panel with a transport whose save rejects with a specific message. Edit Email to a well-formed address and confirm. Assert the cell shows the original address again and the rejection message is visible in the panel.
