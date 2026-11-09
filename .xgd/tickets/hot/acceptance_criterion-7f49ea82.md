---
uid: acceptance_criterion-7f49ea82
id: AC-2550
type: acceptance_criterion
title: With no usable renderer, or when rendering fails, the material file route serves
  the stored bytes with 200
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:26:00.878034+00:00'
updated_at: '2026-11-09T18:26:00.878034+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
The material file route still answers 200 with the picture's stored bytes in two situations, and never with an error or an empty body:
- the deployment cannot render (no Images binding, or one that cannot transform);
- rendering an edited picture fails.

## Verification
1. With no binding, fetch a picture whose record carries a recipe and assert 200 with the original bytes.
2. With a binding double whose transform throws, fetch an edited picture and assert 200 with the original bytes and content type.
