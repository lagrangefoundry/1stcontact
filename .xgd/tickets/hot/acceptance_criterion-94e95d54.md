---
uid: acceptance_criterion-94e95d54
id: AC-626
type: acceptance_criterion
title: Blockquotes are containers of child blocks supporting nesting and multiple
  paragraphs
created_by: xgd
created_at: '2026-07-13T21:00:54.270920+00:00'
updated_at: '2026-07-13T21:00:54.270920+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
A blockquote is a container holding child blocks (not a per-paragraph flag). A multi-paragraph blockquote, a blockquote nested inside another blockquote, and a blockquote containing a list all round-trip losslessly, preserving the nested block structure.

## Verification
Round-trip each of a multi-paragraph blockquote, a nested blockquote, and a blockquote containing a list; assert the child-block structure is reproduced.
