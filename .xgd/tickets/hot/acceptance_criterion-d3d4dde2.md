---
uid: acceptance_criterion-d3d4dde2
id: AC-2029
type: acceptance_criterion
title: A published revision is pictured with its own assets, not today's draft assets
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:12.701391+00:00'
updated_at: '2026-10-27T19:42:12.701391+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A `revision` picture renders the frozen snapshot of that revision, and every asset the page loads is served from the bytes stored with that revision. If an asset with the same name has since been replaced in the draft, the revision picture still shows the revision's original bytes, and a `draft` picture of the same page shows the new ones.

## Verification
Publish a revision whose page references `/assets/logo.png` with bytes A; replace the draft's `logo.png` with bytes B. Screenshot the page as `revision` and as `draft` and assert the asset requests the browser made were answered with A and B respectively.
