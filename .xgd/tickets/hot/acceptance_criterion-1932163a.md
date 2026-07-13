---
uid: acceptance_criterion-1932163a
id: AC-620
type: acceptance_criterion
title: Markdown shorthands are accepted for authoring and desugar to the model
created_by: xgd
created_at: '2026-07-13T21:00:36.181769+00:00'
updated_at: '2026-07-13T21:00:36.181769+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
When parsing, ergonomic markdown shorthands are accepted as authoring conveniences: `*x*` / `**x**` / `***x***` desugar to runs with italic / bold / bold-italic emphasis; `#` through `######` at line start produce a heading of the matching level; `> ` produces a blockquote; and `- ` / `N. ` line prefixes produce bullet / ordered list items. A paragraph containing no markup desugars to a single run that inherits every style axis.

## Verification
Parse inputs using each shorthand form and assert the produced blocks/runs match the expected model (emphasis flags, heading level, blockquote container, list items); parse a plain line and assert a single inherited run.
