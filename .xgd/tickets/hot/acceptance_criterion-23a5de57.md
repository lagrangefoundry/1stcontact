---
uid: acceptance_criterion-23a5de57
id: AC-2137
type: acceptance_criterion
title: After acceptance the same URLs answer normally
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:59.186021+00:00'
updated_at: '2026-11-01T10:46:02.464132+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
After a successful acceptance, the same URLs that previously answered with the terms page or a 403 refusal answer normally. A navigation to a builder URL receives the builder, assets are served, and API routes respond as they would for any admitted person. The terms page's accept control completes by reloading the current URL, not by navigating to a different address.

## Verification
As an admitted, unaccepted person, request a builder navigation and an asset, and observe the terms page and a 403. Post a JSON acceptance, then repeat the same two requests and assert the recognisable builder/assets body is returned with a success status. Assert the served terms page's accept script reloads the current location on success.