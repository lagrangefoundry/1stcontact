---
uid: request-59ac5ff8
id: REQ-374
type: request
title: Per-side borders in the page vocabulary (e.g. a left rule on a pull quote)
created_by: xgd
created_at: '2026-10-03T19:59:20.362346+00:00'
updated_at: '2026-10-03T23:30:04.899495+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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

---

## Scope (free-coded)

### User-visible change
The shared surface group (every node kind that paints: `box`, `container`, `text`, `image`, `control`, and interaction-state deltas) gains three per-side border axes beside the existing `borderLeft` (BUG-14):

- `borderTop`, `borderRight`, `borderBottom`. Each is the same typed `border` shape as `border` / `borderLeft`: `{ widthPx, color, style? }`, strict, with hex or palette colour and a `solid|dashed|dotted|double` style.
- `border` stays the uniform all-four-sides shorthand. A per-side axis **overrides that side only**. So `border` + `borderTop` paints all four sides, with the top restyled. A lone `borderTop` paints the top only. A lone `borderLeft` is the pull-quote rule.
- Validation stays as strict as it is now. Each side's `widthPx` takes the same envelope bound as `border`. An unknown key such as `borderTopLeft` is still rejected.
- The builder sees the new axes automatically. It is primed from the Zod schemas (`l1-vocabulary-core.ts`, BUG-182), and the schema doc comments state the override rule.
- Email pages honour the four per-side axes as well (`L1_EMAIL_TARGET.surfaceAxes`). A per-side inline `border-<side>` is a table-and-inline-styles declaration every client supports, and a divider above an email footer is the email form of the same need. Before this change, an email page refused `borderLeft`.

### Design decision: per-side axes, not a union on `border`
The ticket suggested `border` accept either the shorthand or `{ top?, right?, bottom?, left? }`. We chose sibling per-side axes instead, for three reasons:
- L1 already has `borderLeft` as a per-side axis. Adding a union would create a second way to say "left border", and the schema refuses that kind of drift.
- Keeping `border`'s type unchanged means none of its readers change (renderer, email emitter, validator, capture fold, values-diff, editor). Each new axis is additive.
- It follows CSS's own `border` / `border-<side>` cascade, so the override rule is one sentence.

### Not covered
The capture side (extract → fold → values-diff) still records a one-sided border as the uniform thickest side, plus `borderLeft`, as `coverage.ts` documents. Reproducing a reference page's one-sided top or bottom border is a separate fidelity capability. This change covers authoring and rendering.

## Why free-coded
This adds three schema axes, their envelope bounds, two emitters and the email allowlist. It is small and follows the existing `borderLeft` pattern exactly.

## Test plan
`tests/test_UAT_FC_REQ-374_per_side_borders.test.ts`, driven through the real `validateL1` / `renderL1Document` / email-render entry points:
- A pull quote with only `borderLeft` validates and renders a `border-left` declaration and no uniform `border`.
- `border` + `borderTop` renders the uniform `border` followed by the `border-top` override, in that order.
- Each of `borderTop` / `borderRight` / `borderBottom` alone renders that side only.
- An out-of-envelope side width is rejected at `…/borderTop/widthPx`, and a malformed side (unknown key, non-hex colour) is rejected.
- A per-side border in an interaction state (hover) renders and is bounded.
- An email page accepts the per-side axes and emits inline `border-<side>` declarations.
- The builder's vocabulary priming lists `borderTop`, `borderRight`, `borderBottom` and `borderLeft`.

Regression scope: the L1 security, robustness and vocabulary suites, plus the email render tests.
