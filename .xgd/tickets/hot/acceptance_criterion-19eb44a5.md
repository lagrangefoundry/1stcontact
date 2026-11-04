---
uid: acceptance_criterion-19eb44a5
id: AC-2277
type: acceptance_criterion
title: Both senders refuse a message missing to/from/subject or with an empty body,
  naming the missing fields, before delivering or recording
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:12.269991+00:00'
updated_at: '2026-11-04T17:32:12.269991+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Both the delivering and the recording sender refuse the same malformed messages, before any network call or capture: a message whose `to`, `from` or `subject` is missing or whitespace-only is refused with an invalid-message error naming every missing field, and a message with an empty `body` is refused with an invalid-message error stating a body is needed. A refused message is neither delivered nor recorded.

## Verification
For each malformed variant (blank `to`, blank `from`, blank `subject`, several blank together, empty `body`), send through both the credentialed sender (with a recording provider double) and the uncredentialed sender. Assert both reject with an invalid-message error whose text names the missing field(s), the provider double received zero requests, and the captured list is unchanged.
