---
uid: acceptance_criterion-bcc448ea
id: AC-985
type: acceptance_criterion
title: A refused edit reports a machine-readable fault code, the path at fault and
  a hint naming what to do, with a failing exit status
created_by: xgd
created_at: '2026-08-07T02:02:26.847011+00:00'
updated_at: '2026-08-10T07:40:20.798213+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A refusal is reported as a structured failure, not prose: it carries a fault code
a caller can branch on, the path at which the fault occurred, and a hint naming
the concrete next action. In machine-readable output mode it arrives as the
platform's standard failure envelope, and the invocation exits with a failing
status. A successful edit exits zero and emits the standard success envelope.

## Verification

Drive a rejected edit in machine-readable mode; assert the failure envelope
carries a non-empty code, a path identifying the offending region or field, a
hint, and a non-zero exit status. Drive a successful edit and assert a zero exit
status and a success envelope.