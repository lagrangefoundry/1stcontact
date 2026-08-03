---
uid: acceptance_criterion-9a964e70
id: AC-790
type: acceptance_criterion
title: Contact-form labelling mode reproduces a placeholder-named control without
  a visible label row
created_by: xgd
created_at: '2026-08-03T03:35:04.111945+00:00'
updated_at: '2026-08-03T03:42:21.785859+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
Each configured contact-form field carries an optional typed labelling mode
(`visible` | `placeholder`, defaulting to `visible`, rejected by config
validation for any other value). In `placeholder` mode the field's label text is
rendered **inside** the control as its placeholder and no label row is drawn
above it, so a form reproducing a placeholder-named reference does not push each
successive field down the page. The accessibility obligation is moved out of the
visual flow, never traded away: the `<label>` element is still emitted, still
programmatically associated with its control, and still carries the same words —
it is only removed from flow (visually hidden, still exposed to assistive
technology). In `visible` mode — the default, and the behaviour of any config
that does not state a mode — the label renders above the control exactly as
before. The mode is a per-field setting: a form may mix placeholder-named and
visibly-labelled fields.

## Verification
Render a contact-form whose field declares `labelMode: 'placeholder'` and assert
the rendered markup puts the label's words in the control's `placeholder`
attribute, emits a `<label for=...>` matching the control's id with the same
text, and marks that label visually hidden. Render the same field with no
labelling mode and with `visible` and assert the label renders in flow with no
placeholder. Assert a config stating an unrecognised labelling mode is rejected
by the behavior's config validation.