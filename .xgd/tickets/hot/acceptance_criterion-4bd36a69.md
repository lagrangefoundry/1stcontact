---
uid: acceptance_criterion-4bd36a69
id: AC-1090
type: acceptance_criterion
title: A refused change tells the caller nothing was written and what to do instead
  of resending it
created_by: xgd
created_at: '2026-08-10T09:20:12.311805+00:00'
updated_at: '2026-08-16T02:37:34.890007+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A refusal is correctable within the same exchange: it carries the failure code **and** a
recovery strategy — that nothing was written, that the same call must not be sent again
unchanged, and that the way forward is to read the element back and send a corrected
replacement.

**Known limit, deliberately recorded:** this caller does not receive the specific
offending field, although the write path reports it and a command-line user sees it. The
tool layer renders only the declared meaning of the failure code. The declared meaning
therefore carries the strategy rather than promising specifics it cannot deliver. This
criterion asserts the strategy; it does not assert the field name.

## Verification

Send a replacement with a wrongly-typed value for a typed appearance property. Assert the
reply carries the schema-invalid code and states all three of: nothing was written, do not
resend unchanged, read the element back.