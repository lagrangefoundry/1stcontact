---
uid: acceptance_criterion-a44d10a6
id: AC-2477
type: acceptance_criterion
title: A draft picture may carry 'after' in exactly two forms (click "X"; fill "X"
  with "Y"); quotes optional; anything else is refused before a browser is leased,
  naming both forms
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:28.226890+00:00'
updated_at: '2026-11-08T21:43:28.226890+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A `draft` picture may carry `after`: an ordered list of phrases, each in exactly one of two forms:
- `click "X"` — activate the control called X;
- `fill "X" with "Y"` — put the text Y in the field called X.

Quotes around a name or value are optional (one matching pair of `"` or `'` is stripped). Quoting the name is how a name containing the word `with` is written. Any phrase that is not one of the two forms is refused before a browser is leased:
- a phrase with neither verb is refused, and the refusal states both forms (`click "Sign in"` and `fill "Email" with "someone@example.com"`);
- a `fill` with no `with …` is refused, and the refusal shows the `fill` form;
- a `click` or `fill` that names nothing is refused saying so.

An empty or absent `after` takes the picture exactly as an undriven one.

## Verification
Through `screenshot` with a counting browser seam: `click Sign in`, `click "Sign in"`, `fill Email with a@b.c` and `fill "Name with title" with "Dr X"` all parse and drive. `hover "Menu"`, `fill "Email"` and `click ""` are each refused as invalid parameters, the first naming both forms, and the browser is never launched.
