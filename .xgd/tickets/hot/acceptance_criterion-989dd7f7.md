---
uid: acceptance_criterion-989dd7f7
id: AC-2515
type: acceptance_criterion
title: A published form carries its instance id; the edit render still cannot post
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:39.249919+00:00'
updated_at: '2026-11-09T00:54:13.117582+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every published `contact-form` carries a hidden field holding its own instance id and the honeypot field, so a submission says which form it came from. The edit-channel rendering of the same form has no `method="post"` and no `action`, so it still cannot submit.

## Verification
Render a form instance with id `beta-form` and assert the hidden instance-id input with value `beta-form` and the honeypot input. Render the same instance in edit mode and assert that `method="post"` and the configured action are absent.