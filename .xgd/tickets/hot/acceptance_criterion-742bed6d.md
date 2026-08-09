---
uid: acceptance_criterion-742bed6d
id: AC-701
type: acceptance_criterion
title: Contact-form renders a functional form whose every control is painted by L1
created_by: xgd
created_at: '2026-07-22T19:54:45.992184+00:00'
updated_at: '2026-08-09T05:40:28.570873+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A contact-form instance renders a fully functional, accessible form from its
config: one labelled control per configured field (carrying the field's
submission name, its type of text / email / tel / textarea, and its required
flag), a real `<form method="post">` whose action is the configured (safe)
endpoint so the form submits with no JavaScript, plus the anti-spam surface — a
visually-hidden, off-tab-order honeypot field and a Turnstile mount point.

**Presentation is entirely L1, down to the controls themselves.** The instance
supplies one **required** `form` slot holding the form's whole presentation as an
L1 subtree; inside it, each field's control and the submit button are `control`
nodes naming the module-declared elements. Each carries its own geometry and paint
— surface fill, border, radius, height, position — so a field's measured size and
an inline-versus-stacked submit button are ordinary L1 values rather than concepts
the module has an opinion about. The earlier `intro` and `submit` presentation
slots are gone, replaced by that single subtree.

The module's remaining contribution to each control is behavioural only: the
element's tag, `type`, `name`, `required`, the id its label points at, and — when
the reference labelled the control with a placeholder — the `placeholder` text.
The programmatic `<label>` per field stays module-authored and associated for
assistive technology (an accessibility obligation, not a presentation choice); a
field labelled with visible words carries them as an L1 text run beside the
control.

The submit control is optional — a single-field form still submits on Enter, so a
reference that painted no button reproduces faithfully — while a field control is
required, so a field the author never dressed fails validation rather than
vanishing from the page.

## Verification
Render a contact-form with a multi-field config and an L1 `form` subtree binding
a control node per field plus the submit, and assert: one control per field with
the correct element, input type, submission name and required attribute; a
post-method form pointing at the endpoint that works with no JS; a hidden honeypot
and a Turnstile mount present; and each control's rendered rule carrying the
subtree's own geometry and paint (fill / border / radius / height / position)
rather than any module default. Assert the `form` slot is required, and that a
placeholder-labelled field emits both the `placeholder` attribute and the
associated hidden label.