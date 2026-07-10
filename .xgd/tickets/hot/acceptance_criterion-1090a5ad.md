---
uid: acceptance_criterion-1090a5ad
id: AC-559
type: acceptance_criterion
title: Rejection error names the offending field and value
created_by: xgd
created_at: '2026-07-10T00:33:58.436041+00:00'
updated_at: '2026-07-10T00:33:58.436041+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-38de5800
  kind: behavior
  regression_only: false
---

## Criterion
When content is rejected, the failure is a distinct content-safety error (not a
generic crash) whose message identifies the sink context (the field where the value
appeared) and includes the offending value, and states the reason (unsafe URL scheme
or dangerous HTML). This makes the failure a recoverable content failure that the
generating author can locate and correct.

## Verification
Trigger a rejection for both an unsafe URL and dangerous HTML; assert the raised
error is the content-safety error type and its message contains the field context,
the offending value, and the reason.
