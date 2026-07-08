---
uid: acceptance_criterion-acf4fba7
id: AC-447
type: acceptance_criterion
title: text-block renders a heading only when one is provided
created_by: xgd
created_at: '2026-07-08T19:28:54.468998+00:00'
updated_at: '2026-07-08T19:28:54.468998+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
The text-block heading is optional. When a heading is provided it renders as a heading element containing that text; when no heading is provided, no heading element is emitted.

## Verification
Render a text-block with a heading and assert a heading element with the given text is present; render one without a heading and assert no heading element is present.
