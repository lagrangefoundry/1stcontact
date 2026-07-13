---
uid: acceptance_criterion-f2fb9d1c
id: AC-621
type: acceptance_criterion
title: Literal delimiters and leading block markers are escaped so they round-trip
  as text
created_by: xgd
created_at: '2026-07-13T21:00:38.845390+00:00'
updated_at: '2026-07-13T21:05:59.620165+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
Inline text containing literal notation delimiters (`[`, `]`, `{`, `}`, `*`) or beginning with a character that would otherwise start a block (`-`, a digit-then-`.`, `>`, `#`, `:`) is serialized in an escaped form and re-parses as the same literal inline text — never as a style span, link, or block-structure marker. A paragraph whose text merely starts like a list/heading/quote marker is preserved as a paragraph, not reinterpreted as structure.

## Verification
Serialize runs whose text contains each literal delimiter and each leading marker, parse the output, and assert the text is recovered verbatim and no spurious structure block is produced.