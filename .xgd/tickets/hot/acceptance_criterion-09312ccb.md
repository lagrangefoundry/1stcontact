---
uid: acceptance_criterion-09312ccb
id: AC-2134
type: acceptance_criterion
title: Terms gate responses are not cacheable and not indexable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:52.059178+00:00'
updated_at: '2026-11-01T10:39:52.059178+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
Every response produced by the terms gate carries `Cache-Control: no-store` and `X-Robots-Tag: noindex`. That includes the terms page served in place of a navigation, the `/terms` page, the 403 refusal, and the accept endpoint's responses.

## Verification
As an admitted, unaccepted person, request a navigation, `/terms`, and a non-navigation asset. Assert each response has `cache-control: no-store` and `x-robots-tag: noindex`.
