---
uid: acceptance_criterion-e09aeac6
id: AC-2232
type: acceptance_criterion
title: Every chrome button and filter control resolves to the single control font-size
  token, as the last font declaration on each control's rules
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:50:11.803081+00:00'
updated_at: '2026-11-01T21:29:09.089739+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The builder chrome's controls share one type size, defined once. They do not
fall back to the browser's default size.

- **One definition site.** A single control font-size token, 13px (the size the
  rest of the chrome already uses), is declared once in the builder stylesheet.
  Every control below takes its size from that token. None restates the size as
  a literal.
- **The controls covered:**
  - the top bar's **Theme** and **About** buttons;
  - the Contacts tab's filter row: the search box, the filter selects and
    **Invite**;
  - **Provision a business** in the person detail pane;
  - the buttons in the dialogs those controls open: **Invite**, **Provision** and
    their **Close** partners.
- **The token wins regardless of source order.** Each control's own rule resets
  the font with a shorthand. On every one of those rules, the size is declared
  immediately after that reset. So for each control, the **last** font or
  font-size declaration that applies to it, taking every rule in source order,
  is the token, not a shorthand.
  - The top-bar buttons are the one exception. Their shorthand lives in the
    shared shell component's stylesheet, which the workspace loads before its own
    stylesheet. So a same-specificity override in the builder stylesheet is the
    later declaration.
- **The filter row reads as one group.** The search box, the filter selects and
  Invite share one padding, so they share one height.
- **Dialog buttons use the canonical class.** Every dialog button carries a class
  that a builder stylesheet rule actually matches. The affirmative action in each
  dialog (Invite, Provision) additionally carries the primary-button modifier,
  the same way every other dialog in the builder marks its confirming button.
  Dialog buttons keep their larger footer padding. Only the type size is unified
  with the filter row.

## Verification

Mount the Contacts tab and both its dialogs against the real installed shell
components. Assert that every `builder-*` class they emit is matched by a rule in
the builder stylesheet.

Then, for each covered control, walk every rule in the stylesheets the workspace
loads, in the order it loads them. Assert that the last font or font-size
declaration applying to the control is the control token, and that the token
resolves to a size smaller than the browser's default. Assert that the filter
row's three kinds of control declare the same padding. Assert that each dialog's
affirmative button carries the primary modifier.