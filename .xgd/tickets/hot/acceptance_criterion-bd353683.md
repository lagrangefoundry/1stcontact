---
uid: acceptance_criterion-bd353683
id: AC-2142
type: acceptance_criterion
title: Loopback dev-open mode serves the builder without a terms check
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:40:06.273478+00:00'
updated_at: '2026-11-01T10:46:01.340386+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
When the control app runs in loopback dev-open mode (Access not configured and dev-open explicitly enabled), there is no admission and no terms check. Navigations, assets and API routes are served without a terms page or terms refusal. In every other configuration the terms check applies to all admitted requests.

## Verification
Drive the Worker with Access unconfigured and dev-open enabled, request a builder navigation and an asset without any token, and assert the builder/assets body is served with no terms page and no 403 terms refusal. Assert that with Access configured, an admitted unaccepted person is gated as in the other criteria.