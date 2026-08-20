---
uid: story-46e3b3c7
id: STORY-82
type: story
title: 'Reproduction treatments: card veil/border, placeholder & inline contact form,
  and footer copyright/colour overrides'
created_by: xgd
created_at: '2026-07-19T03:34:08.590836+00:00'
updated_at: '2026-08-20T08:03:13.524932+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-31e474b9
  uat_coverage: stale
---

## Story
**As a** site author reproducing a real-world design, **I want** the card/band, footer, and contact-form reproduction treatments to be expressed through the framework's post-pivot surfaces — visual look via L1 leaf axes, and contact-form presentation as an L1 subtree in the module's `form` slot plus its `control` leaves — **so that** I can faithfully render translucent "frosted" card bands, footers whose text/link colours depart from the surface default, and compact placeholder-labelled or single-row contact forms, without hand-writing custom code per site and without bespoke per-module aesthetic dials.

## Description
This story originally documented module-level authoring treatments (dials/content fields) added to the `services-grid`, `contact-form`, and `footer` modules during the gigabytealchemy reproduction. The **REQ-79 framework pivot** superseded that delivery mechanism, and two later intents moved the contact-form half again:

- **REQ-84** deleted the `services-grid` and `footer` modules (along with `header`/`hero`/`text-block`/`layer` and their ~20 dials). The visual treatments they carried — the card veil/tint, the card border toggle, and the footer copyright/text/link-colour overrides — are now owned by **L1 leaf axes**: each L1 box/text/image node carries its own validated colour / border / opacity literals (or a palette reference), so a frosted card band or a colour-departed footer is authored directly in the L1 tree rather than through a module dial. This is intentional supersession per the REQ-79 reconciliation note, not lost work.
- **REQ-85** reframed `contact-form` from a dial-driven module into a **behavior module** — the type REQ-87 subsequently renamed from `Capability*` to `Behavior*`, with no back-compat alias. Its functional core stays vetted framework code (field schema, a11y label association, honeypot + Turnstile, the no-JS `<form method=post>` baseline, and the shipped `client.js` fetch enhancement).
- **REQ-96** then replaced the module's presentation surface wholesale, bumping `contact-form` v3→v4. The `intro` and `submit` slots it had after REQ-85 are **deleted**. In their place is a single **required `form` slot** carrying the form's entire presentation as one L1 subtree, with each interactive element authored as a **`control` leaf** inside it: one `field` control per `config.fields` entry, and an optional `submit` control for the button. The slot is required deliberately — a form with no authored presentation has no visible controls at all, and failing that loudly at validation beats rendering an empty box.

### What went, and what survived as behavioural config
The aesthetic dials are gone: `submitColor`, `submitInline`, and the submit button's look generally. The button's appearance is now entirely the `submit` control node's own L1 axes, and "inline vs stacked" ceased to be a concept once each control carries its own geometry rather than inheriting a module's layout decision.

**`fieldLabels=placeholder` was not deleted.** Placeholder labelling survives, reframed rather than removed: REQ-93 landed it as behavioural config on each field — `config.fields[].labelMode: 'visible' | 'placeholder'`. It belongs in `config` and not in L1 because it is **not an aesthetic dial**: it is a captured *fact* about the control's accessible name, read from the reference's a11y tree, which is its only witness. `placeholder` puts the label inside the box (the control gets a `placeholder` attribute); `visible` leaves the words to be authored as an L1 text run beside the control. Either way the programmatic label association remains a fixed obligation of the vetted core, never a styling toggle — which is what lets this story's promise of a *compact placeholder-labelled* form be kept without trading away accessibility.

In scope for this upgrade: repoint the story's ACs from the deleted module dials to the surviving surface this story keeps a criterion of its own for — L1 leaf axes for the card/band and footer treatments (AC-719). The contact-form half is documented here but its **criterion** moved to AC-701 under STORY-85 when AC-718 was deprecated: the required `form` slot, a `control` leaf per field, the optional submit control, inline-vs-stacked as ordinary L1 geometry, and the `placeholder`/hidden-label pairing are all asserted there, and restating them here would duplicate that criterion clause for clause rather than add coverage. `labelMode` remains the one presentation-adjacent parameter that is behavioural config because it records an a11y fact.

Out of scope: the L1 substrate itself (STORY-83) and the behavior-module contract (STORY-85) — this story documents that the *reproduction treatments* are re-homed there, not those mechanisms.

## Technical Context
- **Delivery moved, capability preserved.** The card/footer/contact-form *look* still reproduces faithfully; only the mechanism changed — from bespoke module dials to L1 leaf axes (colour/border/opacity literals or palette references) and, for contact-form, to one required `form` slot of L1 plus `control` leaves.
- The eight module-dial ACs (AC-674..681) are archived as superseded, not deleted — the behaviours they described no longer exist in code because their host modules were removed or reframed. AC-718 is likewise retired: it described the REQ-85-era `intro`/`submit` slots that REQ-96 deleted.
- Card/band/footer visual literals are validated by the L1 envelope (hex-only colours, finite ranges, no freeform CSS). The `form` slot's subtree is validated as an L1 node by the behavior validators (`validateBehaviorSlots` / `validateBehaviorInstance`) — the security line, since slot content can never smuggle raw HTML/CSS/JS past the envelope — and each `control` binding is checked in both directions. Both are covered by their owning stories (STORY-83; STORY-85).
- **The v4 form's look has a starting point, not a ceiling.** Deleting the module stylesheet would leave a form authored *without* a capture to transcribe with no look at all, so the former default is re-homed as an **L2 preset** returning an ordinary L1 subtree a caller drops straight into the `form` slot. Reproduction work overrides it from the capture; greenfield work keeps it.
- **Measured outcome.** On the gigabytealchemy reproduction, moving these treatments onto L1 closed every form delta the intent named — field surface (fill / border / radius as L1 axes) and field height taken from the capture rather than a module default.

## Dependencies
Depends on the **L1 layout substrate** story (STORY-83) for the leaf axes and the `control` node kind, and on the **behavior modules** story (STORY-85) for the contact-form contract: its behavioural `config`, the required `form` slot, and the `control` declarations.

## Story Points
2