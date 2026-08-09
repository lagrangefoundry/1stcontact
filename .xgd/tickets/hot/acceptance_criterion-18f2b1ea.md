---
uid: acceptance_criterion-18f2b1ea
id: AC-834
type: acceptance_criterion
title: A control row reflows to a column with one input per field, and stagger counts
  no phantom peers
created_by: xgd
created_at: '2026-08-06T02:37:02.135777+00:00'
updated_at: '2026-08-09T05:41:06.352432+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The case that had **no representation at any cost** before this axis: a row of form
controls that must become a column at mobile.

- A container of control leaves declaring `stack@0 → row@640` publishes a form in which
  each field appears **exactly once** in the markup — one `name` per field, one `id` per
  control, and every `<label for="…">` resolving to an input that exists — **at every
  width**, while the pair's container genuinely stacks below 640px and rows above it.
- This holds because the reflow is one subtree. The duplicate-subtree workaround could
  never hold it: duplicating a control duplicates a form field, and both copies then
  share one `name` and one `id`. A duplicate id breaks the label association the behavior
  module exists to guarantee, and hiding a copy by viewport width is presentational, not
  `disabled` — the hidden copy still submits.
- A container's reveal **stagger indexes only children that exist once**: three revealing
  children in a reflowing row take three consecutive slots, not six. The duplicated
  subtree fed the count peers the reader never sees, desynchronising every reveal after
  the first duplicate.

## Verification
Through the ordinary render of a real workspace — so the module's attribute bundle, the
label wiring and the L1 emission are the shipping ones — publish a contact form whose
first-name/last-name pair is one container declaring `stack@0 → row@640`. Assert each
field name occurs exactly once in the markup, that every emitted control id is unique,
and that each label's `for` names one of those ids; assert the stylesheet's 640px block
flows the pair as a row. Separately, publish a reflowing row of three revealing children
under a stagger interval and observe three successive delays (0, 1×, 2× the interval),
not six.