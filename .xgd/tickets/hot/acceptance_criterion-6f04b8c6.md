---
uid: acceptance_criterion-6f04b8c6
id: AC-791
type: acceptance_criterion
title: Contact-form surrenders its own submit paint to an authored submit subtree
created_by: xgd
created_at: '2026-08-03T03:35:31.999307+00:00'
updated_at: '2026-08-03T03:42:21.644254+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
When a contact-form instance supplies a `submit` slot, the authored L1 subtree is
the submit control's entire look: the module renders that subtree as the button's
content and drops its own decoration (padding, background fill, corner rounding,
text colour and weight), so the authored chip is never nested inside a second,
differently-coloured button and the module's default `Send` button does not
appear alongside it. The element remains a real `<button type="submit">` inside
the form — only its paint is surrendered, so keyboard focus, submission and the
no-JS baseline are unchanged. With no `submit` slot the module paints its own
default button exactly as before.

## Verification
Render a contact-form with a `submit` slot carrying its own fill and rounding and
assert: the authored text appears in the rendered markup, no default `Send`
button remains, the submit element still renders as a `<button type="submit">`,
and the module's own painted styling is not applied to it (the surrendered-paint
state is observable on the rendered button). Render the same config with no
`submit` slot and assert the plain default painted button is present.