---
uid: story-46e3b3c7
id: STORY-82
type: story
title: 'Reproduction treatments: card veil/border, placeholder & inline contact form,
  and footer copyright/colour overrides'
created_by: xgd
created_at: '2026-07-19T03:34:08.590836+00:00'
updated_at: '2026-07-22T20:44:28.050127+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-938f26ec
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** site author reproducing a real-world design, **I want** the card/band, footer, and contact-form reproduction treatments to be expressed through the framework's post-pivot surfaces — visual look via L1 leaf axes, and contact-form presentation via its capability config plus named L1 slots — **so that** I can faithfully render translucent "frosted" card bands, footers whose text/link colours depart from the surface default, and compact placeholder-labelled or single-row contact forms, without hand-writing custom code per site and without bespoke per-module aesthetic dials.

## Description
This story originally documented module-level authoring treatments (dials/content fields) added to the `services-grid`, `contact-form`, and `footer` modules during the gigabytealchemy reproduction. The **REQ-79 framework pivot** superseded that delivery mechanism:

- **REQ-84** deleted the `services-grid` and `footer` modules (along with `header`/`hero`/`text-block`/`layer` and their ~20 dials). The visual treatments they carried — the card veil/tint, the card border toggle, and the footer copyright/text/link-colour overrides — are now owned by **L1 leaf axes**: each L1 box/text/image node carries its own validated colour / border / opacity literals (or a named overlay role), so a frosted card band or a colour-departed footer is authored directly in the L1 tree rather than through a module dial. This is intentional supersession per the REQ-79 reconciliation note, not lost work.
- **REQ-85** reframed `contact-form` from a dial-driven module into a **capability module**. Its functional core stays vetted framework code (field schema, a11y `<label>`s, honeypot + Turnstile, the no-JS `<form method=post>` baseline, and the shipped `client.js` fetch enhancement). What used to be aesthetic dials — `submitColor`, `submitInline`, `fieldLabels=placeholder`, submit look — is gone: the submit button's appearance is authored as L1 mounted into the `submit` slot, decorative framing into the `intro` slot, and field labelling stays part of the core as an accessibility obligation (not a styling option).

In scope for this upgrade: repoint the story's ACs from the deleted module dials to the two surviving surfaces (L1 leaf axes; contact-form capability config + L1 slots).

Out of scope: the L1 substrate itself (see the L1 Layout Substrate story) and the capability-module contract (see the Capability Modules story) — this story documents that the *reproduction treatments* are re-homed there, not those mechanisms.

## Technical Context
- **Delivery moved, capability preserved.** The card/footer/contact-form *look* still reproduces faithfully; only the mechanism changed from bespoke module dials to L1 leaf axes (colour/border/opacity literals or overlay roles) and, for contact-form, capability config + L1 presentation slots.
- The eight module-dial ACs (AC-674..681) are archived as superseded, not deleted — the behaviours they described no longer exist in code because their host modules were removed or reframed.
- Card/band/footer visual literals are validated by the L1 envelope (hex-only colours, finite ranges, no freeform CSS); contact-form slot content is validated as an L1 subtree by the capability validators. Both are covered by their owning stories (L1 substrate; Capability Modules).

## Dependencies
Depends on the L1 Layout Substrate story (L1 leaf axes) and the Capability Modules story (contact-form config + slots).

## Story Points
2