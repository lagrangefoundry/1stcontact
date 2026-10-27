---
uid: acceptance_criterion-d41298df
id: AC-2035
type: acceptance_criterion
title: No looking operation changes the site
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:25.270806+00:00'
updated_at: '2026-10-27T19:42:25.270806+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Every operation on the looking surface, and its group, is declared with a read effect; and running every operation — list_references, describe_reference, screenshot, compare, and capture_site through its refusal path — against a real store leaves the site's change counter exactly where it was, with the stored site definition unchanged.

## Verification
Assert every operation and group in the looking declaration has effect read. Read the site's change counter, run each operation once, and assert the counter (and the stored definition) is unchanged afterwards.
