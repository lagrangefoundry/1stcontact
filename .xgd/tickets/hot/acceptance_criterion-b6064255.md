---
uid: acceptance_criterion-b6064255
id: AC-2479
type: acceptance_criterion
title: Controls are matched by accessible name (label, aria-label, visible text, placeholder;
  menus by option label before value); no selector can be named
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:43:35.676473+00:00'
updated_at: '2026-11-08T21:43:35.676473+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A step names a control the way a person would, and it is matched only against what the page itself calls the control. No selector, id or markup attribute can be used to name one.

- `click` matches links, buttons, disclosure summaries, button-role elements and button-type inputs, by their `aria-label`, visible words, a button input's value, `title`, or the `alt` of an image inside them.
- `fill` matches text inputs, text areas and menus by their `<label>`, `aria-label`, `aria-labelledby` text or placeholder. A field's `name` attribute and `id` are not names it can be reached by. Checkboxes, radios, file and hidden inputs are not fillable.
- Matching ignores case and extra whitespace. An exact name wins over a partial one, and a partial name is accepted when it is the only match.
- Only visible controls compete for a name. A control inside a panel that is not open does not make a visible control of the same name ambiguous.
- A menu is set by the words on its option first, and by the option's value only when no option's words match.

The schema and the surface's declared absences say that nothing here takes a selector.

## Verification
On the sign-in page, the header has "Sign in" and the closed dialog has its own "Sign in" and "Close". Assert `click "sign in"` (lower case) opens the dialog without an ambiguity refusal. On a form whose email field has `id="email_input"` and `name="email_input"` but the label "Email", assert `fill "Email" with …` succeeds and `fill "email_input" with …` is refused as no-match. Assert `fill "Country" with "United Kingdom"` selects the option labelled United Kingdom whose value is `GB`. Assert the declaration lists "Naming part of the page by selector" among its absences.
