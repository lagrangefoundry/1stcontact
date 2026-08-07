---
uid: acceptance_criterion-08c7ebe8
id: AC-991
type: acceptance_criterion
title: 'No edit through this surface can produce raw HTML or CSS: markup in the words
  stays literal text'
created_by: xgd
created_at: '2026-08-07T02:02:54.192416+00:00'
updated_at: '2026-08-07T02:12:04.018125+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Every field this surface offers is a plain-text field; there is no field type,
option or mode through which markup, styles or script can be submitted as code.
Text containing markup saves successfully and is rendered as the region's literal
words — it creates no element and applies no style in the rendered page.

## Verification

Save a string containing script and style markup into a copy region. Assert the
save succeeds, that the rendered page shows that string as the region's text,
and that it introduced no corresponding element or active style. Separately, read
every region of a page and assert every offered field is of plain-string type.