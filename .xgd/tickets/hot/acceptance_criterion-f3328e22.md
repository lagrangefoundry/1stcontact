---
uid: acceptance_criterion-f3328e22
id: AC-718
type: acceptance_criterion
title: contact-form presentation treatments are authored via capability config + L1
  slots, not module dials
created_by: xgd
created_at: '2026-07-22T20:43:49.826626+00:00'
updated_at: '2026-08-20T07:44:57.060691+00:00'
completed_at: null
last_field_updated: body
status: deprecated
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
  uat_coverage: deprecated
  lifecycle: deprecated
---

**DEPRECATED** by REQ-96 (via BUNDLE-11, `bundle-ee56a66e`) on 2026-08-06:
REQ-96 deleted `contact-form`'s `intro` and `submit` slots — the exact surface
this criterion pins — replacing them with a single required `form` slot carrying
`control` leaves (a breaking change that bumped contact-form v3→v4;
`packages/framework/src/modules/contact-form/meta.ts` now declares
`slots: { form: { required: true } }` and nothing else). The criterion's second
claim is also contradicted by REQ-93: `fieldLabels=placeholder` was not removed
as an aesthetic dial but reframed as behavioural config
`config.fields[].labelMode`, a captured a11y fact. The surviving obligations are
carried by STORY-85 (the v4 contract) and AC-719 (the L1-axis half).

[Original AC body preserved below for history.]
---
## Criterion
The contact-form capability exposes no aesthetic dials for its former treatments (`fieldLabels=placeholder`, `submitInline`, `submitColor`). Instead:
- The submit button's appearance (its fill colour and look) is authored as an L1 subtree mounted into the capability's named `submit` slot; with the `submit` slot absent, the button renders as a plain functional button.
- Decorative framing (an intro heading/subhead) is authored as L1 in the `intro` slot.
- Field labelling is a fixed obligation of the vetted core: every field renders a programmatic `<label>` (accessibility), driven by the capability `config.fields` schema — it is not a styling toggle.

The capability's typed `config` carries only behavioural/functional params (`action`, `fields`, `successMessage`); presentation is L1.

## Verification
Inspect the contact-form capability meta: confirm its `config` contains no `fieldLabels`/`submitInline`/`submitColor` (or equivalent aesthetic) keys, and that `submit`/`intro` are declared L1 slots. Author a contact-form instance with an L1 subtree in the `submit` slot and confirm the rendered submit button reflects that L1 look; omit the slot and confirm a plain functional button renders. Confirm each configured field renders a programmatic `<label>` regardless of presentation.
