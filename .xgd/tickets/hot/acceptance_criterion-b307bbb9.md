---
uid: acceptance_criterion-b307bbb9
id: AC-2382
type: acceptance_criterion
title: A missing image credential does not make the product report itself unconfigured
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:27.080248+00:00'
updated_at: '2026-11-08T07:13:47.538247+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
Whether the product reports AI as configured depends only on the conversation model's credential. With the Anthropic credential present and no image credential, the product reports itself configured, and the assistant is offered exactly as it would be if image generation were available.

## Verification
With the Anthropic credential set and the image credential unset, query the control app's configured state or open the assistant. Assert that it reports configured and the assistant is usable.