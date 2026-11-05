---
uid: acceptance_criterion-489eafdc
id: AC-2332
type: acceptance_criterion
title: A behavior module may declare a link control, emitted as a real anchor carrying
  an allowlisted href
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:26:17.771237+00:00'
updated_at: '2026-11-05T21:26:17.771237+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
A behavior module may declare a **link** (`a`) as one of its controls, alongside
the form affordances (`input`, `textarea`, `button`, `select`, and the invariant
`span`). Not every control is part of a form: a navigation painted as a button
cannot be opened in a new tab, its target cannot be copied, and assistive
technology announces it as the wrong thing.

When an L1 `control` node names a declared link control, the published page
emits a real `<a>`:

- it carries L1's class, geometry and paint, like any other control;
- the module supplies only its `href` and its behavioural marker attribute;
- the `href` is a URL that has already passed the module's URL safety check, so
  a link control can never point anywhere the safety layer refused (for example
  a `javascript:` URL is refused at render, not emitted).

`account-chrome`'s portal and builder controls are links of this kind, and its
Sign In, submit and close controls stay buttons.

## Observable at
The published HTML of a page mounting a module that declares a link control.
