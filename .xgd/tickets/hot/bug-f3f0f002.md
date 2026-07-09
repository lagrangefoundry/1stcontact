---
uid: bug-f3f0f002
id: BUG-1
type: bug
title: Rendered sites are unstyled — render pipeline emits theme tokens but drops
  module component CSS
created_by: xgd
created_at: '2026-07-01T01:39:48.982890+00:00'
updated_at: '2026-07-09T20:00:46.641497+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - ffdd60c1be14c5b7d95490d4755e5204b5034d9c
  version: 0.0.8
  story_points: 2
  bundled_in: bundle-f39884d2
---

## Symptom

Rendered sites are **unstyled**. Both example sites (`1stcontact`, `harbor-cafe`) render with correct structure and content but no component styling — layout, spacing, and module appearance are missing. Only the base font/colors (from body defaults) apply.

## Reproduction

```
node tools/generate/bin/1c.mjs render harbor-cafe
node tools/generate/bin/1c.mjs serve  harbor-cafe --source draft --port 4322
# open http://localhost:4322/ → unstyled page
```

## Diagnosis / root cause

`theme.css` is **linked and served correctly** (HTTP 200 at `./theme.css`), but it contains **only the design-token `:root` variables — zero component rules**:

- Rendered HTML carries **25 module class attributes** (`class="hero variant-bg-color size-lg align-center surface-accent ..."`, `header__inner`, `footer__tagline`, etc.).
- `theme.css` contains **0 class-selector rules** to match them (56 `:root`/`--var` lines only).

`tools/generate/src/render/render.ts` renders each module via Astro's `experimental_AstroContainer.renderToString()`, which returns the component **HTML but not its scoped `<style>`**. The Container API does not hoist component styles into output the way a full Astro build does — they must be collected explicitly. The renderer writes `theme.css = generateThemeCss(site.theme)` (tokens only) plus a small inline reset, and **never gathers the modules' `<style>` blocks**, so all component CSS is discarded.

The framework modules DO define their styles (hero / header / services-grid / text-block each have a `<style>` block + class-based markup) — they are simply dropped at render time.

## Expected

The per-site CSS must include the module component styles so the served page is fully styled — as the original `tools/generate` design (source REQ-6) specified via a `loadModuleStyles()` helper that extracted each module's `<style>` and folded it into the per-site CSS. REQ-9's implementation omitted that step.

## Fix

1. In the render pipeline, **collect each rendered module's `<style>` block and emit it** into `theme.css` (or a linked `modules.css`). Restore the `loadModuleStyles()`-equivalent step.
2. Watch the **scoping**: the module classes in output are plain (`.hero__inner`, `surface-accent`, `spacing-top-xl`), not Astro-hashed, so extracting the raw source `<style>` blocks should line up — verify selectors match the emitted classes.

## Test gap (why it passed)

REQ-9's render UATs assert `theme.css` contains the token variables, but **not** that the page carries component styles — so the unstyled output passed CI. Add a UAT asserting the served/rendered homepage's CSS contains **class rules matching the rendered module classes** (e.g., a `.hero` / `surface-*` / `spacing-*` selector), not just `:root` vars.

## Affected

- `tools/generate/src/render/render.ts` (drops module styles) — introduced by **REQ-9**.
- Framework module styles live in `packages/framework/src/modules/*/index.astro` (present, correct).
- Related design: source **REQ-6** (`loadModuleStyles`), [[DOC-7]] §4.2 (generated CSS file).

-