---
uid: capability-938f26ec
id: CAP-69
type: capability
title: Framework Reproduction Module Treatments
created_by: xgd
created_at: '2026-07-19T03:33:43.924201+00:00'
updated_at: '2026-07-23T08:07:42.298113+00:00'
completed_at: null
last_field_updated: intent_uid
status: active
fields:
  name: reproduction-module-treatments
  intent_uid: bundle-ab9e0cb6
  updated_by: bundle-31e474b9
---

# Framework Reproduction Module Treatments

Authoring treatments that faithful site reproduction forced onto the framework:
translucent "frosted" card veils/borders, footers whose copyright and
link/body colours depart from the surface default, and compact
placeholder-labelled / inline contact forms. This capability covers the
author-observable rendering of those treatments.

Originally (gigabytealchemy reproduction, BUNDLE-6) these were delivered as
per-module dials/content fields on the `services-grid`, `contact-form`, and
`footer` modules. The **REQ-79 framework pivot (BUNDLE-7)** superseded that
delivery mechanism while preserving the treatments themselves:

- **REQ-84** deleted the `services-grid` and `footer` modules (with
  `header`/`hero`/`text-block`/`layer` and their ~20 dials). The visual look
  they carried — the card veil/tint, the card border toggle, and the footer
  copyright/text/link-colour departures — is now owned by **L1 leaf axes**:
  each L1 box/text/image node carries its own validated colour / border /
  opacity literals (or a named overlay role), so a frosted card band or a
  colour-departed footer is authored directly in the L1 tree.
- **REQ-85** reframed `contact-form` from a dial-driven module into a
  **capability module**. The compact / placeholder-labelled / inline form is
  now expressed through the contact-form capability config plus named L1
  presentation slots (submit look as L1 mounted in the `submit` slot,
  decorative framing in the `intro` slot); field labelling stays part of the
  vetted core as an accessibility obligation, not a styling option.

So the reproduction treatments remain in-intent, but the mechanism a site
author uses is (a) L1 leaf axes for the card/footer look and (b) contact-form
capability config + L1 slots for the form — not bespoke per-module dials.

Scope: the author-observable rendering of these treatments via the surviving
post-pivot surfaces. The underlying absolute-or-overlay colour resolution the
literals/roles consume belongs to the Absolute-or-Overlay Value System
capability (CAP-67); the L1 substrate and the capability-module contract that
host these surfaces are owned by their own capabilities (L1 Layout Substrate;
Capability Modules).
