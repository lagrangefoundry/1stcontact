---
uid: story-903e3e3a
id: STORY-56
type: story
title: 'Content module catalog: prose, services grid, and no-JS contact form'
created_by: xgd
created_at: '2026-07-08T19:28:31.921362+00:00'
updated_at: '2026-07-09T22:11:54.838671+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-4dbbfc15
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-adc60ee8
---

## Story
**As a** platform operator building customer sites, **I want** the framework's module catalog to also supply content sections — a markdown prose block, a bounded grid of service cards that can carry per-card art-direction treatments, and a contact form that works without JavaScript, upgrades to an in-page JSON submit, and can sit half-width beside a sibling form — each token-styled and contract-conforming, **so that** a marketing site's body (manifesto, services, lead capture) can be composed and rendered faithfully from the same versioned catalog as the chrome sections.

## Description
This story documents the three content modules that complete the 6-module Phase 0 catalog, together with the structured card/form/prose treatments and the generalized recursive content-contract validation those treatments depend on. Each module follows the same module contract (`id` + `version`, finite variants, per-dial value enumerations, per-field content schema) established for the chrome modules, and is resolvable through the single catalog registry. All treatments are structured, closed-value and token-backed — no raw CSS/HTML reaches the site definition or the page.

**text-block** (variants `prose`, `landing`). Renders an optional heading plus a required markdown `body`. Markdown supports headings, lists, links, images, blockquotes, and code; rendered images are lazy-loaded. The content column width is fixed by the variant (`prose` = narrow, `landing` = default) rather than by a dial. Body type scale follows the `size` dial.

**services-grid** (variants `three-col`, `two-col`, `stacked`). Renders an optional heading/subhead and a list of service cards (icon, title, markdown body, optional CTA), bounded to 2..6 items. The multi-column variants are mobile-first (single column below `md`, multi-column from `md` up); the `stacked` variant holds each card full-width in one column at every breakpoint. A grid `size` dial (`sm`/`md`/`lg`) scales the grid's intro, and each card carries an optional per-card `size` so a grid can mix a featured card with a quieter companion. Each card can additionally carry structured, token-backed treatments surfaced by the founder-site import: an **accent left border** (palette-role enum), a **status badge** pill (`{label, variant}`), a **✓ checklist** (rendered as real leading text runs, not pseudo-elements, keyed to the badge/status colour), and a card **surface** fill (`default`/`muted`/`neutral-cool`). All treatments are optional; a card declaring none renders exactly as before.

**contact-form** (variant `inline`). A server-rendered form that fully submits without JavaScript (POSTs to `action` and reloads) and progressively enhances to a JSON `fetch`. It renders one labelled control per field, a hidden honeypot, and a Turnstile mount point. A `width` dial (`full`/`half`) lets a form flex to half-width; consecutive half-width bands are grouped by the render pipeline into a shared `fc-row` so, e.g., a subscribe and a contact form sit side by side (stacking back to one column on narrow viewports). A `submitTreatment` dial (`primary`/`neutral`) sets the submit-button colour, and the submit button inherits the site font/size.

**Shared markdown treatments.** The shared markdown renderer used by every `markdown` content field transforms GFM-alert blockquotes (`> [!accent] …`, `> [!secondary italic] …`) into semantic left-bar callouts rendered at medium (500) weight, the accent being a closed palette role; and renders verbatim (smartypants disabled) so straight quotes and `--` are preserved and rendered text equals its authored/captured source.

**Content validation.** A framework-level content validator enforces the module content contract. The contract supports `values` (enum) and `itemSchema` (list/object) field specs, and the validator recurses through `itemSchema`, enforcing required-field presence, declared list-size bounds, and enum membership to arbitrary depth, reporting each violation against a dotted/indexed field path (e.g. `items[0].badge.variant`). It is general over the contract, not specialised to any one module.

In scope: the three modules, their rendered markup/styling and structured treatments/variants, the progressive-enhancement behaviour, half-width row grouping, the shared markdown callout/verbatim behaviour, and the recursive content-schema validation. Out of scope (later REQs): the real form endpoint/persistence, email notification, the live Turnstile widget script, `srcset` image generation, and any actual site content.

## Technical Context
- Extends CAP-51 (Website Framework: Theming & Module Catalog); reuses the module contract, dials, and registry established by the chrome modules (STORY-55). The card/form/prose treatments are new dials/variants/structured content fields on the existing three modules and a generalization of the shared content-contract validator — no new modules or parallel implementations (CLAUDE.md generalize-first).
- Card accent/surface roles and callout roles are palette roles consumed as CSS custom properties from CAP-51; badge/checklist ticks key off those roles.
- The half-width `fc-row` grouping and the callout CSS are static, per-site-identical structural blocks assembled into the site stylesheet by the render pipeline; no instance-supplied CSS reaches the page.
- Markdown rendering uses the same remark/rehype stack Astro applies to page content, with smartypants disabled for verbatim fidelity; `srcset` is deferred to a later REQ, so lazy loading is the responsive-image portion available now.
- The contact-form endpoint is a stub in this phase — no backend behaviour, persistence, email, or Turnstile verification ships here.
- Structural site-definition validation (CAP-49/50) checks shape only; this story's content validation closes the catalog-content-contract half (DOC-7 §6.5 layer 1), now generalized to nested/enum item schemas.

## Dependencies
Depends on plan item 3 (CAP-51 theme tokens, CSS generation, module registry, and chrome modules).

## Story Points
3