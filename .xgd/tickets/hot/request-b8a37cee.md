---
uid: request-b8a37cee
id: REQ-373
type: request
title: Per-side borders in the page vocabulary (e.g. a left rule on a pull quote)
created_by: xgd
created_at: '2026-10-03T19:58:54.769433+00:00'
updated_at: '2026-10-04T00:46:23.445641+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-7ce3825e
---

## What I was trying to do

Style a pull quote with a 4px coloured rule on its **left side only**, with padding between the rule and the text. This is a very common editorial treatment. The same need comes up for divider lines above or below a band (a top border on a footer or trust strip), card accents, and tab indicators.

## What stopped me

`axes.border` only takes a single `{ color, widthPx }` that applies to all four sides. The builder confirmed that the vocabulary has no per-side form. So the quote either got a full box, which looks like a form field and is wrong, or no rule at all. In the same build, a request for "a 1px top border" on a section silently became a border on all four sides.

## What would let me finish

Some way to set a border on individual sides. For example, `border` could accept either the current shorthand or `{ top?, right?, bottom?, left? }`, each `{ color, widthPx }`. Validation could stay as strict as it is now.

## Workarounds considered

Nesting a thin filled box beside the text as a fake rule. That works for a left rule, but it's fragile across stacking breakpoints and adds elements that have no meaning. It's not a fix.

---

## Status note (REQ-373 session)

This ticket's body is identical to **REQ-374** (request-59ac5ff8). REQ-374 already implements it: `borderTop` / `borderRight` / `borderBottom` beside `borderLeft` on the shared surface group, per-side overriding `border`, the same strict validation, and web and email rendering. The commits are 48032818cb and a77293dcb7, both on xgd-working, and REQ-374 is at ready_to_reconcile. No code was written under REQ-373. It is a duplicate and needs no further work.