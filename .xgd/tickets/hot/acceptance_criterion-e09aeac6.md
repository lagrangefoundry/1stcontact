---
uid: acceptance_criterion-e09aeac6
id: AC-2232
type: acceptance_criterion
title: Every text-bearing control in the builder (buttons, filters, selectors, toolbar
  links) resolves to the control font-size token, checked through the real mounted
  ancestry
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:50:11.803081+00:00'
updated_at: '2026-11-08T14:25:03.742626+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Every control in the builder that paints text uses the app's typeface at one
control type size, defined once. None falls back to the browser's own button
font or to the browser's default size.

- **One definition site.** A single control font-size token, 13px (the size the
  rest of the chrome uses), is declared once in the builder stylesheet. Every
  covered control takes its size from that token. None restates the size as a
  literal.
- **Every text-bearing control is covered, not a named list.** Every button,
  input, select and textarea the builder creates that paints text, plus the
  toolbar's "Open in new tab" link. This includes, among others:
  - the top bar's **Theme** and **About** buttons and the **business switcher**;
  - the toolbar's mode toggles, **Colors**, **Publish** and **Mark Points**, and
    its **Open in new tab** link. All of them share one size, so the bar has one
    typography;
  - the **Library** filter row: the search box and both selects;
  - the **Contacts** filter row, **Invite**, **Provision a business**, and the
    inputs and buttons of the Contacts dialogs;
  - the palette popup's text inputs, the upload sheet's buttons, and the
    signed-out notice's **Sign in again** button.
  A control added later with no size counts as a violation.
- **Resolved through the real ancestry.** A control may take the token from its
  own rule or by inheriting from a sized ancestor (the toolbar's link takes it
  from the sized toolbar). A control that inherits all the way up without
  meeting a declared size is a violation. So is a control with no font rule at
  all, which takes the browser's own font.
- **The token wins regardless of source order.** Where a control's rule resets
  the font with a shorthand, the size is declared immediately after that reset.
  So the last font or font-size declaration that applies to the control, taking
  every rule in source order, is the token, not a shorthand.
  - The top-bar buttons are the one exception. Their shorthand lives in the
    shared shell component's stylesheet, which the workspace loads before its own
    stylesheet. So a same-specificity override in the builder stylesheet is the
    later declaration.
- **Deliberately exempt.** Controls that paint no text: checkboxes, radios,
  colour, range and file inputs. Also the Marked Points overlay, which lives
  inside the preview's own document and is styled by that overlay's sheet.
  Also controls rendered by the shared out-of-repo components, which their own
  sheets style.
- **The filter row reads as one group.** The Contacts search box, filter selects
  and Invite share one padding, so they share one height.
- **Dialog buttons use the canonical class.** Every dialog button carries a class
  that a builder stylesheet rule actually matches. The affirmative action in each
  dialog (Invite, Provision) also carries the primary-button modifier, the same
  way every other dialog in the builder marks its confirming button. Dialog
  buttons keep their larger footer padding. Only the type size is unified with
  the filter row.

## Verification

Mount the builder shell, the business switcher, the Library and the Contacts tab
and both its dialogs against the real installed shell components. Assert that
every `builder-*` class they emit is matched by a rule in the builder
stylesheet.

For every text-bearing builder control on the mounted surfaces, walk its real
ancestry. At each element, take the last font or font-size declaration that
applies in source order. Assert that the walk reaches the control token before
it reaches the root, and before it reaches a control that has no font rule.
Assert that the toolbar's buttons and its link resolve to the same token.

Separately, enumerate every text-bearing control class the builder's modules
create (excluding the exempt types and the preview overlay). Assert that each
class resolves to a declared size, so surfaces that are not mounted are covered
too. Assert that the token resolves to a size smaller than the browser's
default, that the filter row's three kinds of control declare the same padding,
and that each dialog's affirmative button carries the primary modifier.
