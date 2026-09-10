---
uid: story-46e3b3c7
id: STORY-82
type: story
title: 'Reproduction treatments: card veil/border, placeholder & inline contact form,
  and footer copyright/colour overrides'
created_by: xgd
created_at: '2026-07-19T03:34:08.590836+00:00'
updated_at: '2026-09-10T11:18:53.591117+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  updated_by: request-f26cbe32
  uat_coverage: stale
---

## Story
**As a** site author reproducing a real-world design, **I want** the card/band, footer, and contact-form reproduction treatments to be expressed through the framework's post-pivot surfaces — visual look via L1 leaf axes, and contact-form presentation via its behavioural config plus named L1 slots — **so that** I can faithfully render translucent "frosted" card bands, footers whose text/link colours depart from the surface default, and compact placeholder-labelled or single-row contact forms, without hand-writing custom code per site and without bespoke per-module aesthetic dials.

## Description
This story originally documented module-level authoring treatments (dials/content fields) added to the `services-grid`, `contact-form`, and `footer` modules during the gigabytealchemy reproduction. The **REQ-79 framework pivot** superseded that delivery mechanism:

- **REQ-84** deleted the `services-grid` and `footer` modules (along with `header`/`hero`/`text-block`/`layer` and their ~20 dials). The visual treatments they carried — the card veil/tint, the card border toggle, and the footer copyright/text/link-colour overrides — are now owned by **L1 leaf axes**: each L1 box/text/image node carries its own validated colour / border / opacity literals (or a named overlay role), so a frosted card band or a colour-departed footer is authored directly in the L1 tree rather than through a module dial. This is intentional supersession per the REQ-79 reconciliation note, not lost work.
- **REQ-85** reframed `contact-form` from a dial-driven module into a **behavior module**. Its functional core stays vetted framework code (field schema, a11y accessible names, honeypot + Turnstile, the no-JS `<form method=post>` baseline, and the shipped `client.js` fetch enhancement). What used to be aesthetic dials — `submitColor`, `submitInline`, submit look — is gone: the form's entire presentation is authored as **one L1 subtree in the required `form` slot**, with a `control` leaf per element (`field`, one per `config.fields` entry named by that field's `name`; and the optional `submit` affordance). The invariant elements the module fixes because an obligation fixes them — `label`, `honeypot`, `turnstile` — are never bound to an L1 node.
  - **Slot supersession (REQ-96, 2026-08-06).** The pivot's original shape gave contact-form two slots, `intro` (decorative framing) and `submit` (the button's appearance). REQ-96 deleted both and replaced them with the single required `form` slot above, bumping contact-form v3→v4 as a breaking contract change; `submit` survives only as a `control` entry. `packages/framework/src/modules/contact-form/meta.ts` is the live record of both.
  - **Placeholder labelling is a captured fact, not a dial (REQ-93, 2026-07-25).** The pre-pivot `fieldLabels=placeholder` dial did not simply disappear — REQ-93 re-expressed it as `config.fields[].labelMode: 'visible' | 'placeholder'`, read from the reference's a11y tree `nameSource`. `placeholder` puts the label inside the box (the control gets a `placeholder` attribute); `visible` leaves the words to be authored as an L1 text run beside the control. It is behavioural config because it is a **captured fact about the control's accessible name**, with the a11y tree as its only witness — not an aesthetic choice an author makes. This is the mechanism that delivers this story's headline "compact placeholder-labelled contact form" promise. Field labelling itself remains a core accessibility obligation either way: the accessible name is always emitted, only its presentation differs.

In scope for this upgrade: repoint the story's ACs from the deleted module dials to the two surviving surfaces (L1 leaf axes; contact-form behavioural config + the `form` L1 slot and its `control` leaves).

Out of scope: the L1 substrate itself (see the L1 Layout Substrate story, STORY-83) and the behavior-module contract (see the Behavior Modules story, STORY-85) — this story documents that the *reproduction treatments* are re-homed there, not those mechanisms.

## Technical Context
- **Delivery moved, capability preserved.** The card/footer/contact-form *look* still reproduces faithfully; only the mechanism changed from bespoke module dials to L1 leaf axes (colour/border/opacity literals or overlay roles) and, for contact-form, behavioural config + the required `form` L1 presentation slot.
- The eight module-dial ACs (AC-674..681) are archived as superseded, not deleted — the behaviours they described no longer exist in code because their host modules were removed or reframed.
- Card/band/footer visual literals are validated by the L1 envelope (hex-only colours, finite ranges, no freeform CSS); contact-form slot content is validated as an L1 subtree by the behavior validators. Both are covered by their owning stories (L1 substrate, STORY-83; Behavior Modules, STORY-85).
- **Vocabulary.** REQ-87 (2026-07-24) renamed the runtime type `capability module` → **behavior module** (and `slot.capability` → `slot.behavior`), with no back-compat alias, precisely to end the collision with the XGD capability matrix. This story uses the post-REQ-87 names throughout; the published types are `Behavior*`.

## Dependencies
Depends on the L1 Layout Substrate story, STORY-83 (L1 leaf axes) and the Behavior Modules story, STORY-85 (contact-form config + the `form` slot).

## Story Points
2