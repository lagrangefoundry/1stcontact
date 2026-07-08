---
uid: story-903e3e3a
id: STORY-56
type: story
title: 'Content module catalog: prose, services grid, and no-JS contact form'
created_by: xgd
created_at: '2026-07-08T19:28:31.921362+00:00'
updated_at: '2026-07-08T19:28:31.921362+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-4dbbfc15
  story_kind: feature
  story_points: 3
---

## Story
**As a** platform operator building customer sites, **I want** the framework's module catalog to also supply content sections — a markdown prose block, a bounded grid of service cards, and a contact form that works without JavaScript and upgrades to an in-page JSON submit — each token-styled and contract-conforming, **so that** a marketing site's body (manifesto, services, lead capture) can be composed and rendered from the same versioned catalog as the chrome sections.

## Description
This story documents the three content modules shipped in REQ-5, completing the 6-module Phase 0 catalog. Each follows the same module contract (`id` + `version`, finite variants, per-dial value enumerations, per-field content schema) established for the chrome modules, and is resolvable through the single catalog registry.

**text-block** (variants `prose`, `landing`). Renders an optional heading plus a required markdown `body`. Markdown supports headings, lists, links, images, blockquotes, and code; rendered images are lazy-loaded. The content column width is fixed by the variant (`prose` = narrow, `landing` = default) rather than by a dial, so the two variants stay meaningful. Body type scale follows the `size` dial.

**services-grid** (variants `three-col`, `two-col`). Renders an optional heading/subhead and a list of service cards (icon, title, markdown body, optional CTA). Both variants are mobile-first: a single column by default, expanding to the multi-column grid from the `md` breakpoint up. The card list is bounded to 2..6 items.

**contact-form** (variant `inline`). A server-rendered form that fully submits without JavaScript — a real form that POSTs to the configured `action` URL and reloads. It renders one labelled control per configured field (a textarea for `textarea`-typed fields, an input otherwise), a hidden honeypot field, and a Turnstile mount point for later anti-spam wiring. Progressive enhancement: when JS runs, submit is intercepted and sent as a JSON POST to `action`; on a successful response the form is replaced with the (markdown) success message, and on a failed response an inline error is shown without navigating away.

**Content validation.** A framework-level content validator enforces required-field presence and declared list-size bounds from a module's content schema (services-grid `items` 2..6, contact-form `fields` 1..8), reporting field-located errors. This is general over the contract, not specialised to one module.

In scope: the three modules, their rendered markup/styling, the progressive-enhancement behaviour, content-schema list-bound validation, and extension of the catalog to all six modules. Out of scope (later REQs): the real form endpoint/persistence, email notification, the live Turnstile widget script, `srcset` image generation, and any actual site content.

## Technical Context
- Extends CAP-51 (Website Framework: Theming & Module Catalog); reuses the module contract, dials, and registry established by the chrome modules (STORY-55).
- Consumes theme tokens/CSS variables from CAP-51; the theme-token shape is owned by the site-definition schema (CAP-49/50).
- Markdown rendering uses the same remark/rehype stack Astro applies to page content; `srcset` is deferred to a later REQ, so lazy loading is the responsive-image portion available now.
- The contact-form endpoint is a stub in this phase — no backend behaviour, persistence, email, or Turnstile verification ships here; the module only renders the mount points those later REQs attach to.
- Structural site-definition validation (CAP-49/50) checks shape only; this story's content validation closes the catalog-content-contract half (DOC-7 §6.5 layer 1).

## Dependencies
Depends on plan item 3 (CAP-51 theme tokens, CSS generation, module registry, and chrome modules).

## Story Points
3
