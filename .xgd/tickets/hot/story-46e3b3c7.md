---
uid: story-46e3b3c7
id: STORY-82
type: story
title: 'Reproduction treatments: card veil/border, placeholder & inline contact form,
  and footer copyright/colour overrides'
created_by: xgd
created_at: '2026-07-19T03:34:08.590836+00:00'
updated_at: '2026-07-19T03:39:59.916855+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-938f26ec
  story_kind: feature
  story_points: 3
---

## Story
**As a** site author reproducing a real-world design, **I want** targeted card, contact-form, and footer authoring treatments, **so that** I can faithfully render translucent "frosted" card bands, compact placeholder-labelled or single-row contact forms, and footers whose copyright text and body/link colours depart from the section surface default — without hand-writing custom code per site.

## Description
This story documents module-level authoring treatments added to three existing modules during the gigabytealchemy reproduction. In scope:

- **services-grid**
  - `cardVeil` — instead of the solid section surface, paint a translucent white fill (`rgba(255,255,255,.NN)`) over the band at a chosen opacity step (`40`–`90`), so cards composite to the correct tint against the band behind them. `none` (default) leaves the solid surface.
  - `cardBorder` — `none` drops each card's default 1px hairline border (the frosted look), but a card that carries an accent still re-asserts its accent left bar.
- **contact-form**
  - `fieldLabels=placeholder` — move each field's label text into the input/textarea placeholder and visually hide the `<label>` (kept in the DOM for accessibility). `above` (default) keeps a visible stacked label.
  - `submitInline` — render a single field and the submit button together on one row.
  - `submitColor` — paint the submit button fill with an author-chosen colour (absolute `#hex` or palette role).
- **footer**
  - copyright override — a verbatim copyright line replacing the generated `© <year> <holder>` default.
  - `textColor` / `linkColor` — render the footer body/copyright text and the footer links in author-chosen colours (absolute `#hex` or palette role) instead of the surface default.

Out of scope: the general absolute-or-overlay colour/length value model these colour dials resolve through (CAP-67); the earlier text-block `accent` dial, which was added then removed as broken and redundant (manifesto left-bars are authored with the existing `> [!role]` fc-callout syntax, not a new dial).

## Technical Context
- Colour treatments (`submitColor`, footer `textColor`/`linkColor`, per-card accent/`checkColor`) resolve author input (literal or role) via the absolute-or-overlay value system — see CAP-67. This story covers the module-level rendered outcome; CAP-67 covers the resolution mechanism.
- Reuse-first: all items are dials / content fields on existing modules, per the reproduction attribution ladder (reuse dial → dial → variant → primitive → new module as last resort). No new modules were introduced.
- **Intent/code divergence to flag for regression:** `cardVeil`, `cardBorder`, `fieldLabels`, and per-card `accent`/`checkColor` are declared in their module `meta` schemas. However `submitInline`/`submitColor` (contact-form) and the footer `copyright`/`textColor`/`linkColor` overrides are consumed by the render code but are NOT yet declared in the module `meta` schema. The rendered behaviour exists and is authorable via the site definition; the schema formalization lags. The ACs describe the observable rendered behaviour (the intent); regression against the code will surface the missing schema entries.

## Dependencies
None.

## Story Points
3