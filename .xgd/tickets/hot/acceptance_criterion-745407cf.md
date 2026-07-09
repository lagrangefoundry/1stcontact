---
uid: acceptance_criterion-745407cf
id: AC-468
type: acceptance_criterion
title: Browser failure retries then errors, never falling back to a static path
created_by: xgd
created_at: '2026-07-09T20:13:06.996563+00:00'
updated_at: '2026-07-09T20:13:06.996563+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
When a navigation attempt fails, the pipeline retries the browser capture. If every attempt fails, the command reports a capture error naming the URL and attempt count; it never silently degrades to a static, non-browser extraction path. There is no static fallback.

## Verification
Run the pipeline with an injected driver whose `navigate` always throws. Assert the pipeline makes the configured number of attempts (more than one) and then rejects with an error identifying the target URL, rather than returning any capture result.
