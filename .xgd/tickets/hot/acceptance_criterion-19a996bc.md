---
uid: acceptance_criterion-19a996bc
id: AC-2026
type: acceptance_criterion
title: Every picture is named with one declared shape whose schema the model is shown
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:05.175968+00:00'
updated_at: '2026-10-27T19:42:05.175968+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Every looking operation that takes a picture takes it in one shape: `kind` (required, one of `reference`, `draft`, `edit`, `revision`, `url`), plus `bundle`, `page`, `revision` (integer), `url` and `viewport` (one of `mobile`, `tablet`, `desktop`). The tool schema offered to the model for each such parameter lists exactly these keys with those enums and disallows additional properties. No operation carries its own reference/actual/source/size-style parameter. A picture with an unknown key or an out-of-enum `kind`/`viewport` is refused before the operation runs.

## Verification
Inspect the offered tool schemas for `screenshot` and `compare` and assert the picture parameter's properties, enums and additionalProperties:false; assert no operation declares ref/actual/source/size parameters. Call `screenshot` with an extra key and with `kind: 'page'` and assert each is refused as invalid parameters.
