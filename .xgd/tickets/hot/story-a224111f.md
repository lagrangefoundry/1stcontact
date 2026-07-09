---
uid: story-a224111f
id: STORY-55
type: story
title: Token-driven theme CSS and a versioned chrome module catalog
created_by: xgd
created_at: '2026-07-08T19:19:53.002381+00:00'
updated_at: '2026-07-09T21:59:09.985293+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-4dbbfc15
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-f39884d2
---

## Story
**As a** platform operator building customer sites, **I want** the framework to turn a site's theme tokens into a deterministic stylesheet — including each catalog module's own component styles, `@font-face` rules for site-declared display fonts, and a display-font slot — and to expose a versioned catalog of token-styled chrome sections (header, hero, footer) that carry structured, token-backed art-direction dials (alignment, sizing, heading/wordmark colour treatment, scrim/anchor, footer layout) resolvable by id and version, where the header can carry a bespoke wordmark and sit over the following section's image band, **so that** a rendered site is fully styled, top-to-bottom, with reproducible token-driven CSS and richly art-directable chrome — with no raw CSS ever expressed in the site definition.

## Description
This story documents the framework's rendering foundation shipped in REQ-4 and extended in BUNDLE-2 (BUG-1, REQ-24, REQ-25) and BUNDLE-3 (REQ-28, REQ-32, REQ-33, REQ-20 import):

**Theme token → CSS generation.** A generator produces a site stylesheet declaring one CSS custom property per theme-token slot on `:root`, with a deterministic naming scheme per group (`--color-<role>`, `--font-family-<name>`, `--font-size-<step>`, `--font-weight-<name>`, `--line-height-<name>`, `--space-<step>`, `--radius-<name>`, `--shadow-<name>`, `--container-<name>`, `--breakpoint-<name>`). Any slot the caller omits is filled from framework-supplied defaults, so the output always covers the full token surface. When a dark palette is supplied, the output additionally emits a `prefers-color-scheme: dark` block overriding the palette colours.

**Expanded palette roles.** Beyond the base roles, the palette accepts optional `secondary`, `neutralCool`, `accentLight`, `accentDeep`, and `accentMid` roles. `secondary`/`neutralCool`/`accentLight`/`accentDeep` are backfilled from defaults so their `--color-*` properties are always emitted; `accentMid` is emitted (`--color-accent-mid`) only when the site declares it. All are optional, so pre-existing themes keep validating. Role names are kebab-cased in the emitted properties (`neutralCool` → `--color-neutral-cool`), and the kebab set (`primary`, `accent`, `secondary`, `muted`, `neutral-cool`, `accent-light`, `accent-deep`, `accent-mid`) is the closed set of stop/accent roles a gradient or callout treatment may reference.

**Module component CSS folding (BUG-1).** The per-site stylesheet does not stop at design-token `:root` variables — it also carries each catalogued module's own component CSS, so a rendered page is fully styled. The server-side render draws modules through Astro's container API, which returns module HTML but drops each module's scoped `<style>`; the framework therefore extracts each catalogued module's raw `<style>` blocks (their selectors are plain class names that match the emitted markup) and folds them into the generated per-site stylesheet. Without this, pages rendered with correct structure and content but no component styling.

**Display fonts + display-font slot (REQ-24).** From a structured `theme.fonts` declaration (each font a `{ family, src, weight?, style?, display? }` record referencing a mirrored asset — never raw CSS), the generator emits one `@font-face` rule per font ahead of `:root`, deriving a `format(...)` hint from the asset extension and defaulting `font-display` to `swap`. It always emits a `--font-family-display` custom property — the site's declared display family, or the heading family as fallback — so any heading-bearing module can reach a bespoke display face.

**Module catalog.** A single registry maps a module `id` + `version` to its contract metadata and renderable component. Resolving a known module returns it; resolving an unknown one fails with a clear catalog-miss error. Every module exposes a contract (`moduleMeta`) declaring its id, version, finite variants, per-dial finite value enumerations, and per-field content schema — including structured content fields such as the gradient-treatment (`logoGradient` / `headingGradient`) objects.

**Chrome modules + art-direction dials.** Three token-styled sections ship: `header`, `hero` (`bg-color` and `bg-image` variants), and `footer` (`minimal` variant). Beyond the base surface/spacing dials they carry structured, closed-value art-direction dials, every value drawn from a finite enumeration with no raw CSS in the site definition:

- **hero** — `size`, `align`, and `spacingTop`/`spacingBottom`; a `height` dial (`auto`/`fold`, `fold` filling the viewport to the fold with content vertically centred); a `contentAnchor` (`top`/`center`/`bottom`) anchoring content within a `fold` band; a `scrim` (`none`/`light`/`medium`/`strong`) painting a dark legibility tint over the `bg-image` background; a `headingTreatment` (`plain`/`accent`/`gold`/`gradient`) colouring the heading independently of the surface text colour; a `subheadColor` (palette role or `inherit`) tinting the whole subhead block; a `subheadSize` (`sm`/`md`/`lg`) scaling the lead + body copy independently of the heading; a markdown-rendered subhead; and an optional CTA rendered only when present.
- **footer** — a `layout` dial (`center`/`spread`) where `spread` justifies copyright and links to opposite ends of one row; deterministic build-time-constant copyright year plus an optional small-link row.

**Header chrome (extended).** `header` is top-nav chrome: logo + nav entries with a responsive hamburger collapse below the `md` breakpoint. It exposes an `align` dial (`left`/`center`) placing the content within the band, a `logoSize` dial (`sm`/`md`/`lg`/`xl`, `xl` at display scale) sizing a text wordmark, and an `xl` step on the spacing dial. Its wordmark dials: `logoFont` (`heading`/`body`/`display`) selecting the wordmark family — `display` binding to `--font-family-display` and rendering with tight tracking and the display face's true (semibold) weight rather than a synthesised faux-bold — and `logoTreatment` (`plain`/`gold`/`gradient`) where `gold` fills the wordmark glyphs with a fixed metallic-gold gradient and `gradient` reads a structured `logoGradient` treatment; all apply only to a text wordmark, not an image logo. `header` also supports an `overlay` variant (REQ-25): transparent chrome (no surface fill, no bottom border) that the render pipeline floats across the top of the immediately-following module's band, so header + the next section (e.g. a hero `bg-image` or any module carrying a section background) share one continuous background image band. Legibility over the shared image reuses the section-background overlay mechanism; an overlay header with no following band still renders.

**Generalized gradient text treatment.** The header wordmark and hero heading share one structured, palette-role-backed gradient treatment (REQ-32): a `direction` from the eight principal directions plus two or more `stops` (each a palette-role name with an optional 0–100 position, evenly distributed when omitted). The framework — never the instance — computes the clipped `linear-gradient` (`background-clip: text`). Under-specified treatments (fewer than two stops) yield no gradient and fall back to the inherited colour; the fixed `gold` treatment is preserved as its own dial value.

**In scope:** theme CSS generation, default-fill, dark-mode emission, the expanded palette roles, module-component-CSS folding, `@font-face` emission + the display-font slot, the module registry + resolution contract, the module-contract shape, the header/hero/footer modules and their art-direction dials, the header wordmark dials, the generalized gradient text treatment, and the header overlay variant.

**Out of scope (per intent):** content modules text-block/services-grid/contact-form (separate story); the static generator's own commands (`tools/generate`); actual site definitions/content; theme editing via UI/AI; per-instance dial validation and catalog-membership validation; the section-background / layer / motion primitives (their own stories).

## Technical Context
- The theme-token shape is owned by the site-definition schema (CAP-49/50, `@1stcontact/site-schema`); this framework re-exports that contract and supplies defaults for every slot rather than redefining the shape. REQ-4 extended that schema to the token superset; REQ-24 added the optional `theme.fonts[]` array and the optional `theme.typography.family.display` slot; BUNDLE-3 added the optional `secondary`/`neutralCool`/`accentLight`/`accentDeep`/`accentMid` palette roles (all structured data, no raw CSS expressible in the site definition).
- The renderer is server-side only (DOC-12 / DOC-7 §2.4) — there is no in-browser preview.
- The container render drops both `<style>` and `<script>` blocks; the module-CSS folding compensates for the former. Module CSS is read once from each catalogued module's `index.astro` and cached (module sources are immutable at runtime), keeping render output deterministic.
- The `--font-family-display` custom property is always emitted, so the token surface count grew by one relative to REQ-4's baseline (heading-family fallback when no display font is declared).
- Gradient treatments and heading/subhead colour treatments are emitted as framework-computed inline styles keyed to palette-role custom properties — the instance carries only structured, closed-value data (direction + role stops, or a role name), never raw colour or raw CSS, mirroring the section-background mechanism.
- Header-over-hero is a cross-instance pipeline concern (two sibling instances share one band), realised as a `header` `overlay` variant plus render-pipeline compositing with a static structural CSS block — deliberately not folded into the layer/compositing primitive (which composites children within one host module's box).
- Code reviewed matches the intent; no divergence between intent and implementation was observed. The BUNDLE-3 dials/roles/treatments are generalizations of the existing hero/header/footer modules and the theme-token generator (CLAUDE.md generalize-first), not new modules or a new surface.

## Dependencies
- Depends on the site-schema types + validation (CAP-49/50) — the theme-token, `theme.fonts`, display-family, and expanded palette-role contract this framework imports.

## Story Points
3