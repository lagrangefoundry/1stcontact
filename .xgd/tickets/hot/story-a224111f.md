---
uid: story-a224111f
id: STORY-55
type: story
title: Token-driven theme CSS and a versioned chrome module catalog
created_by: xgd
created_at: '2026-07-08T19:19:53.002381+00:00'
updated_at: '2026-07-08T19:19:53.002381+00:00'
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
**As a** platform operator building customer sites, **I want** the framework to turn a site's theme tokens into a deterministic stylesheet and to expose a versioned catalog of token-styled chrome sections (header, hero, footer) resolvable by id and version, **so that** a skeleton site — top navigation, hero, footer — renders with consistent, reproducible, token-driven styling and the generator can reliably resolve each section.

## Description
This story documents the framework's rendering foundation shipped in REQ-4:

**Theme token → CSS generation.** A generator produces a site stylesheet declaring one CSS custom property per theme-token slot on `:root`, with a deterministic naming scheme per group (`--color-<role>`, `--font-family-<name>`, `--font-size-<step>`, `--font-weight-<name>`, `--line-height-<name>`, `--space-<step>`, `--radius-<name>`, `--shadow-<name>`, `--container-<name>`, `--breakpoint-<name>`). Any slot the caller omits is filled from framework-supplied defaults, so the output always covers the full 55-token surface. When a dark palette is supplied, the output additionally emits a `prefers-color-scheme: dark` block overriding the palette colours.

**Module catalog.** A single registry maps a module `id` + `version` to its contract metadata and renderable component. Resolving a known module returns it; resolving an unknown one fails with a clear catalog-miss error. Every module exposes a contract (`moduleMeta`) declaring its id, version, finite variants, per-dial finite value enumerations, and per-field content schema.

**Chrome modules.** Three token-styled sections ship: `header` (top-nav; logo + nav entries; responsive hamburger collapse below the `md` breakpoint), `hero` (`bg-color` and `bg-image` variants; size/align/spacing/surface dials; fluid clamp-based heading type driven by the size dial; optional CTA), and `footer` (`minimal` variant; copyright rendered from a build-time-constant year for deterministic output plus an optional small-link row).

**In scope:** theme CSS generation, default-fill, dark-mode emission, the module registry + resolution contract, the module-contract shape, and the header/hero/footer modules.

**Out of scope (per intent):** content modules text-block/services-grid/contact-form (separate story); the static generator (`tools/generate`); actual site definitions/content; theme editing via UI/AI; per-instance dial validation and catalog-membership validation.

## Technical Context
- The theme-token shape is owned by the site-definition schema (CAP-49/50, `@1stcontact/site-schema`); this framework re-exports that contract and supplies defaults for every slot rather than redefining the shape. REQ-4 extended that schema to the 55-token superset (palette with a `text` role replacing `fg`; a 9-step type scale adding `5xl`; weights and lineHeights; numeric geometric spacing keys; `narrow/default/wide/bleed` containers).
- The renderer is server-side only (DOC-12 / DOC-7 §2.4) — there is no in-browser preview, so the render path is not constrained to browser-ESM purity.
- Modules are Astro components compiled by the consuming app; the framework does not precompile them. Contract shape follows DOC-7 §3.1.
- Code reviewed matches the intent: `packages/framework/src/tokens/{contract,defaults,css}.ts`, `modules/{registry,types,dials}.ts`, and `modules/{header,hero,footer}/`. No divergence between intent and implementation was observed.

## Dependencies
- Depends on plan item 2 (site-schema types + validation, CAP-49/50) — the theme-token contract this framework imports.

## Story Points
3
