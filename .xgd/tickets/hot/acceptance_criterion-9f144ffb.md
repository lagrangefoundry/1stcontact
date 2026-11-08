---
uid: acceptance_criterion-9f144ffb
id: AC-2391
type: acceptance_criterion
title: The image credential is scrubbed from anything shown to a person
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:33.632940+00:00'
updated_at: '2026-11-08T06:42:33.632940+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
The value of the image credential never appears in any error message, tool result, log line or response the control app shows to a person. Wherever it would have appeared, it is redacted, just as the conversation model's credential is.

## Verification
Configure a known credential value and trigger a provider failure whose error would echo it. Assert that the text shown to the person does not contain the value.