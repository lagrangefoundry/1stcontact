---
uid: acceptance_criterion-fc728fd7
id: AC-2495
type: acceptance_criterion
title: A behaviour module's own panel is untouched by state application and keeps
  its declared settled state
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:48:29.618427+00:00'
updated_at: '2026-11-09T00:07:48.966898+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Reading and applying page state reaches only L1 dialog shells. A panel owned by a behaviour module (for example `account-chrome`'s sign-in dialog, or the account portal's erasure disclosure) has no L1 dialog id. It never appears in a read state or in the list of panels a page declares, and applying any state leaves it exactly as it was. In the edit render it keeps the settled state the module declares for that channel.

## Verification
In a DOM environment, render a page that has an L1 panel and a mounted behaviour module with its own hidden panel. Read the state and list the declared panels, and assert that neither includes the module's panel. Apply a state naming the L1 panel, and also one naming the module's panel element id. Assert that the module's markup and attributes are unchanged and that its edit-channel settled presentation is unchanged.