---
uid: acceptance_criterion-35ddcab3
id: AC-1294
type: acceptance_criterion
title: An unrecognised form of the command is refused with usage and a failing exit,
  and builds nothing
created_by: xgd
created_at: '2026-08-20T04:16:36.184734+00:00'
updated_at: '2026-08-20T04:37:27.608926+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A form of the command that is not recognised is refused: the refusal names the unrecognised word, prints the usage listing the forms that do exist and what each needs, goes to the error stream rather than the output stream, and the command exits non-zero. Nothing is built and nothing on disk is touched.

## Verification

Invoke the command with an unrecognised form; assert a non-zero exit, that the offending word and the usage text appear on the error stream, that the output stream carries no report, and that the knowledge base tree is unchanged.