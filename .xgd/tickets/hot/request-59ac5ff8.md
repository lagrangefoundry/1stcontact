---
uid: request-59ac5ff8
id: REQ-374
type: request
title: Per-side borders in the page vocabulary (e.g. a left rule on a pull quote)
created_by: xgd
created_at: '2026-10-03T19:59:20.362346+00:00'
updated_at: '2026-10-03T19:59:20.362346+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-99edb1e5
---

## What I was trying to do
Style a pull quote with a 4px coloured rule on its **left side only**, with padding between the rule and the text. This is a very common editorial treatment. The same need comes up for divider lines above or below a band (a top border on a footer or trust strip), card accents, and tab indicators.

## What stopped me
`axes.border` only takes a single `{ color, widthPx }` that applies to all four sides. The builder confirmed that the vocabulary has no per-side form. So the quote either got a full box, which looks like a form field and is wrong, or no rule at all. In the same build, a request for "a 1px top border" on a section silently became a border on all four sides.

## What would let me finish
Some way to set a border on individual sides. For example, `border` could accept either the current shorthand or `{ top?, right?, bottom?, left? }`, each `{ color, widthPx }`. Validation could stay as strict as it is now.

## Workarounds considered
Nesting a thin filled box beside the text as a fake rule. That works for a left rule, but it's fragile across stacking breakpoints and adds elements that have no meaning. It's not a fix.