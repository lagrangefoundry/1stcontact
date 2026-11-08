---
uid: acceptance_criterion-386378cc
id: AC-2435
type: acceptance_criterion
title: Without the script the panel lays out in flow and open
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:25.994380+00:00'
updated_at: '2026-11-08T13:09:25.994380+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Every overlay rule (fixed covering position, scrim, placement) applies only when the document carries a marker that only the dialog script sets. Until the script runs, the shell contributes no box, the panel sits in normal flow where it would have been unwrapped, and its content is visible and usable. When the script starts it closes every panel, sets the marker, and sets each opener `aria-expanded` to `false`.

## Verification
Inspect the emitted stylesheet and assert every rule containing a fixed position is scoped to the script-set marker, and that the unmarked shell has no box of its own. In a DOM environment, run the script and assert the panels are hidden, the marker is set, and the openers report `aria-expanded` false.