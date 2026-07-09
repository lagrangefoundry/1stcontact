---
uid: story-a224111f
id: STORY-55
type: story
title: Token-driven theme CSS and a versioned chrome module catalog
created_by: xgd
created_at: '2026-07-08T19:19:53.002381+00:00'
updated_at: '2026-07-09T21:10:16.519431+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-4dbbfc15
  story_kind: upgrade
  story_points: 3
---

## Story
**As a** platform operator building customer sites, **I want** the framework to turn a site's theme tokens into a deterministic stylesheet — including each catalog module's own component styles, `@font-face` rules for site-declared display fonts, and a display-font slot — and to expose a versioned catalog of token-styled chrome sections (header, hero, footer) resolvable by id and version, where the header can carry a bespoke wordmark and sit over the following section's image band, **so that** a rendered site is fully styled, top-to-bottom, with reproducible token-driven CSS and art-directable chrome.

## Description
This story documents the framework's rendering foundation shipped in REQ-4 and extended in BUNDLE-2 (BUG-1, REQ-24, REQ-25):

**Theme token → CSS generation.** A generator produces a site stylesheet declaring one CSS custom property per theme-token slot on `:root`, with a deterministic naming scheme per group (`--color-<role>`, `--font-family-<name>`, `--font-size-<step>`, `--font-weight-<name>`, `--line-height-<name>`, `--space-<step>`, `--radius-<name>`, `--shadow-<name>`, `--container-<name>`, `--breakpoint-<name>`). Any slot the caller omits is filled from framework-supplied defaults, so the output always covers the full token surface. When a dark palette is supplied, the output additionally emits a `prefers-color-scheme: dark` block overriding the palette colours.

**Module component CSS folding (BUG-1).** The per-site stylesheet does not stop at design-token `:root` variables — it also carries each catalogued module's own component CSS, so a rendered page is fully styled. The server-side render draws modules through Astro's container API, which returns module HTML but drops each module's scoped `<style>`; the framework therefore extracts each catalogued module's raw `<style>` blocks (their selectors are plain class names that match the emitted markup) and folds them into the generated per-site stylesheet. Without this, pages rendered with correct structure and content but no component styling.

**Display fonts + display-font slot (REQ-24).** From a structured `theme.fonts` declaration (each font a `{ family, src, weight?, style?, display? }` record referencing a mirrored asset — never raw CSS), the generator emits one `@font-face` rule per font ahead of `:root`, deriving a `format(...)` hint from the asset extension and defaulting `font-display` to `swap`. It always emits a `--font-family-display` custom property — the site's declared display family, or the heading family as fallback — so any heading-bearing module can reach a bespoke display face.

**Module catalog.** A single registry maps a module `id` + `version` to its contract metadata and renderable component. Resolving a known module returns it; resolving an unknown one fails with a clear catalog-miss error. Every module exposes a contract (`moduleMeta`) declaring its id, version, finite variants, per-dial finite value enumerations, and per-field content schema.

**Chrome modules.** Three token-styled sections ship: `header`, `hero` (`bg-color` and `bg-image` variants; size/align/spacing/surface dials; fluid clamp-based heading type driven by the size dial; optional CTA), and `footer` (`minimal` variant; copyright rendered from a build-time-constant year for deterministic output plus an optional small-link row).

**Header chrome (extended).** `header` is top-nav chrome: logo + nav entries with a responsive hamburger collapse below the `md` breakpoint. It exposes two wordmark dials (REQ-24): `logoFont` (`heading` | `body` | `display`) selecting the wordmark family — `display` binding to `--font-family-display` — and `logoTreatment` (`plain` | `gold`) where `gold` fills the wordmark glyphs with a metallic-gold gradient; both apply only to a text wordmark, not an image logo. `header` also supports an `overlay` variant (REQ-25): transparent chrome (no surface fill, no bottom border) that the render pipeline does not emit as its own band — instead it floats it across the top of the immediately-following module's band, so header + the next section (e.g. a hero `bg-image` or any module carrying a section background) share one continuous background image band. Legibility over the shared image reuses the section-background overlay mechanism; an overlay header with no following band still renders.

**In scope:** theme CSS generation, default-fill, dark-mode emission, module-component-CSS folding, `@font-face` emission + the display-font slot, the module registry + resolution contract, the module-contract shape, the header/hero/footer modules, the header wordmark dials, and the header overlay variant.

**Out of scope (per intent):** content modules text-block/services-grid/contact-form (separate story); the static generator's own commands (`tools/generate`); actual site definitions/content; theme editing via UI/AI; per-instance dial validation and catalog-membership validation; the section-background / layer / motion primitives (their own stories).

## Technical Context
- The theme-token shape is owned by the site-definition schema (CAP-49/50, `@1stcontact/site-schema`); this framework re-exports that contract and supplies defaults for every slot rather than redefining the shape. REQ-4 extended that schema to the token superset; REQ-24 added the optional `theme.fonts[]` array and the optional `theme.typography.family.display` slot (both structured data, no raw `@font-face` CSS expressible in the site definition).
- The renderer is server-side only (DOC-12 / DOC-7 §2.4) — there is no in-browser preview.
- The container render drops both `<style>` and `<script>` blocks; the module-CSS folding compensates for the former. Module CSS is read once from each catalogued module's `index.astro` and cached (module sources are immutable at runtime), keeping render output deterministic.
- The `--font-family-display` custom property is always emitted, so the token surface count grew by one relative to REQ-4's baseline (heading-family fallback when no display font is declared).
- Header-over-hero is a cross-instance pipeline concern (two sibling instances share one band), realised as a `header` `overlay` variant plus render-pipeline compositing with a static structural CSS block — deliberately not folded into the layer/compositing primitive (which composites children within one host module's box).
- Code reviewed matches the intent; no divergence between intent and implementation was observed.

## Dependencies
- Depends on the site-schema types + validation (CAP-49/50) — the theme-token, `theme.fonts`, and display-family contract this framework imports.

## Story Points
3