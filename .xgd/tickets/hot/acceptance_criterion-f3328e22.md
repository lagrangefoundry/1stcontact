---
uid: acceptance_criterion-f3328e22
id: AC-718
type: acceptance_criterion
title: The captured contact-form treatments are reachable through behavioural config
  and the required form slot, with no module dial left
created_by: xgd
created_at: '2026-07-22T20:43:49.826626+00:00'
updated_at: '2026-09-10T11:59:23.233844+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The contact-form reproduction treatments captured during the gigabytealchemy
reproduction — the compact **placeholder-labelled** form and the **inline**
(single-row) submit — survive the pivot, and are reachable through the two
surviving surfaces only: the module's behavioural config and the required `form`
L1 slot. No per-module aesthetic dial is left anywhere in the path.

- **The dials are gone, not relocated.** The published contract carries no
  `fieldLabels`, `submitInline` or `submitColor` key (and no `dials` map at all);
  its config is functional only — `action`, `fields`, `successMessage`,
  `submitLabel`.
- **The look is L1, in one slot.** The form's whole presentation is a single L1
  subtree in the **required `form`** slot at contact-form v4; the pre-pivot
  `intro` and `submit` presentation slots no longer exist (REQ-96). Inside that
  subtree a `control` leaf paints each element — one per `config.fields` entry,
  named by that field's `name`, plus the optional `submit` affordance. The former
  `submitInline` treatment is therefore wherever the L1 subtree puts the submit
  leaf, and the former `submitColor` is that leaf's own `surfaceFill`: ordinary
  L1 axes, not concepts the module has an opinion about.
- **The invariant elements are never bound.** `label`, `honeypot` and `turnstile`
  are fixed by obligation rather than taste and are never reachable from an L1
  node, so no reproduction can reveal the honeypot or unhide a programmatic label.
- **Placeholder labelling is a captured fact, not a dial.** This story's headline
  "compact placeholder-labelled" promise is delivered by
  `config.fields[].labelMode: 'visible' | 'placeholder'`, read from the
  reference's a11y tree `nameSource` — `placeholder` puts the words inside the
  box, `visible` leaves them to be authored as an L1 text run beside the control.
  Either way the programmatic accessible name is still emitted.

Scope note: this is the *reproduction-treatment* claim — that these captured
looks are reachable through the surviving surfaces and through no dial. The
behavior contract itself (slot/control validation, the functional form, the
anti-spam surface) is STORY-85's AC-701, and the L1 axes that paint the leaves
are STORY-83's.

## Verification

Introspect the shipped contact-form contract and assert: its config keys are
exactly the functional four, none of `fieldLabels`/`submitInline`/`submitColor`
survives, no `dials` map exists, its slots are exactly `['form']` with the slot
required, and `label`/`honeypot`/`turnstile` are declared invariant. Then render
an instance whose `form` subtree binds a `control` leaf per field plus a submit
leaf carrying its own `surfaceFill`, and confirm the submit button is painted by
that leaf's L1 rule with no competing module paint, while each field keeps its
associated programmatic `<label>`. Finally render the same config once with a
field at `labelMode: 'placeholder'` and once at `visible`, and confirm the
placeholder text appears on the control in the first case and not the second,
with the accessible name emitted in both.
