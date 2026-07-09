---
uid: bundle-f39884d2
id: BUNDLE-2
type: bundle
title: BUG-1 + REQ-12 + REQ-13 + REQ-14 + REQ-15 + 5 more
created_by: xgd
created_at: '2026-07-09T19:58:46.435504+00:00'
updated_at: '2026-07-09T20:00:56.702446+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: ffdd60c1be14c5b7d95490d4755e5204b5034d9c
    reconcile_sha: null
    main_sha: null
  - working_sha: 306c2108d2d5f5b94545a07277e7bb99b9a07846
    reconcile_sha: null
    main_sha: null
  - working_sha: 19fdbf37d4b6e28f3fc85685290b89e900a0ded3
    reconcile_sha: null
    main_sha: null
  - working_sha: cf26a7d5bf037df6e3a3335e47cef96c920cf1ae
    reconcile_sha: null
    main_sha: null
  - working_sha: 80a7b7359a1cbf8157f302516b2704a4408ef180
    reconcile_sha: null
    main_sha: null
  - working_sha: 60b2a71215d99b5a2daaeef119b1ab0186bed4ca
    reconcile_sha: null
    main_sha: null
  - working_sha: 6328691dec5a63ebf3213af201c92eef8a549346
    reconcile_sha: null
    main_sha: null
  - working_sha: 1f7213dc026ba9b7d829303ff90c94d28e878ef1
    reconcile_sha: null
    main_sha: null
  - working_sha: 98569bf29a15ce8e66587d4f1d7119526506ea87
    reconcile_sha: null
    main_sha: null
  - working_sha: 492684e3de712b9477e37c63962a42eccdc3414f
    reconcile_sha: null
    main_sha: null
  - working_sha: 94cd1ecfda62b31719175d2cf2079d41387983c3
    reconcile_sha: null
    main_sha: null
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## BUG-1: Rendered sites are unstyled — render pipeline emits theme tokens but drops module component CSS

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


---

## REQ-12: 1c capture page: rendered page capture via headless browser (Playwright driver + bundle)

## Scope

Build `1c capture page <url>` — **rendered-only** page capture per [[DOC-13]] (Reference Capture Model). A headless browser navigates the live URL, JS hydrates, we intercept-cache every response, query the browser for computed signals, and write a structured **capture bundle** to a gitignored `references/<host>/<path>/`. No static-extraction path.

Design: [[DOC-13]] is authoritative. Supersedes first-contact's static-first extractor.

## Why free-coded

Construction of a model fully specified in [[DOC-13]]. One cohesive unit: driver seam + pipeline + schema only prove out together.

## Dependencies

- **Depends on:** REQ-9 (the `1c` CLI harness), REQ-10 (toolchain — adds Playwright as a dev/runtime dep). Catalog-agnostic: does **not** depend on the module catalog.

## Deliverables

### BrowserDriver seam (CF-Browser-Rendering-shaped)

- A pure `BrowserDriver` interface mirroring the CF Browser Rendering / `@cloudflare/puppeteer` surface: `navigate(url)`, `screenshot(viewport)`, `query(script)` → computed styles / resolved `background-image` / `document.fonts` / bounding boxes / **visibility**, `content()`, `close()`.
- A **local Playwright** implementation behind it. Injectable factory so tests use a fake driver (no real browser). A CF driver is a later, drop-in swap.

### Capture pipeline

- `navigate(url)` live → **intercept & cache every response** (HTML, CSS, JS, images, fonts) → wait for network idle → `query()` computed signals → full-page screenshot.
- **Never** `setContent()` a pre-fetched shell (re-creates static blindness — [[DOC-13]] §2.3).
- Browser failure → retry, never a static fallback.

### capture.json (catalog-agnostic essence)

Per [[DOC-13]] §4: `theme` (exact colors from computed styles with `var()` resolved, fonts + mirrored files, typeScale, spacing, container), `sections[]` (style-scope bands: `box`, `screenshot` crop, `background` incl. `overlay` for **text-over-image**, flat `layout`, role-tagged **verbatim** `content[]` with per-run exact color/font/size, flattened `items[]`), `assets[]`.

### Segmentation

- Style-signature segmentation (background + color scheme + type + spacing/container). Flat-styled page → one segment is valid. Segments are styling contexts, not modules/content-groups.

### Bundle + location

- Write `capture.json`, `screenshot.full.png`, `rendered.html` (escape hatch), `raw.html`, `assets/` to `references/<host>/<path>/` (gitignored). Fully self-contained for offline re-extraction.

## UATs (`test_UAT_FC_REQ-12_*`)

- `test_UAT_FC_REQ-12_capture_produces_bundle` — capturing a local fixture page writes the full bundle (capture.json, screenshot, rendered.html, assets/).
- `test_UAT_FC_REQ-12_colors_resolve_computed` — a fixture whose colors are behind `var()` yields the **painted** hex in `theme.colors`, not the var reference.
- `test_UAT_FC_REQ-12_background_image_captured` — a JS/CSS-applied hero `background-image` is captured with its `overlay`, and `layout.textOverImage=true`.
- `test_UAT_FC_REQ-12_visibility_filters_chrome` — a hidden element (display:none / closed drawer) is **not** in the capture.
- `test_UAT_FC_REQ-12_copy_verbatim` — all visible text runs appear verbatim, each with its exact color/font/size.
- `test_UAT_FC_REQ-12_style_segmentation` — a 2-style-band fixture → 2 segments; a uniformly-styled fixture → 1 segment.
- `test_UAT_FC_REQ-12_rendered_html_retained` — `rendered.html` (post-JS DOM) is present and matches the screenshot's content.
- `test_UAT_FC_REQ-12_offline_reextraction` — re-running extraction from the cached bundle needs no network.
- `test_UAT_FC_REQ-12_driver_seam_swappable` — a fake `BrowserDriver` can be injected (proves the CF-shaped seam).

## Out of scope

- `1c capture site <url>` (crawl) — later.
- AI mapping capture → draft site, and the module gap-backlog.
- The CF Browser Rendering driver (Playwright first).
- IP/copyright handling.


---

## Implementation approach (free-coding scope — decided 2026-07-01)

**Placement:** New `1c capture page <url>` subcommand. Code lives in `tools/generate/src/cli/capture/` (a `1c` command, not a new package). Dispatch added to `tools/generate/src/cli/index.ts`.

**Dependency:** `playwright` added as a **runtime** dependency of `@1stcontact/generate` (the local `BrowserDriver` impl; the CF driver is the later drop-in swap). Chromium provisioned via `playwright install chromium`.

**Config:** `references/` added to `.gitignore` (DOC-13 §2.10 — bundles are gitignored, self-contained, offline-re-extractable).

### Testing mechanism — authentic Playwright, golden fixtures, zero third-party network

Per operator decision: use real Playwright/Chromium in the UATs; rely on **no** live website.

- **Golden dataset:** self-contained fixture pages committed under `tests/fixtures/capture/` (HTML + CSS + a real raster image + a woff2 font), each engineered to exercise one fidelity dimension: `var()`-behind colors, JS/CSS-applied hero `background-image` + overlay, a `display:none`/closed-drawer element, verbatim copy with per-run computed color/font/size, and a 2-style-band vs uniform page for segmentation.
- **Serving:** fixtures served from an ephemeral local `http.createServer` on `127.0.0.1:0` (not `file://`) so real HTTP responses exist for the intercept-and-cache path to capture. Fully offline.
- **Real browser:** genuine Chromium via Playwright navigates, JS hydrates, computed signals queried. The fidelity UATs are therefore real evidence, not assertions against a mock.
- **Fake driver:** used only by `test_UAT_FC_REQ-12_driver_seam_swappable` to prove the CF-shaped seam is injectable.
- **Browser-absent handling:** real-browser UATs skip cleanly (not hard-fail) when no Chromium is installed, so a browser-less runner stays green; CI provisions Chromium via `playwright install --with-deps chromium`.

### Segmentation heuristic

DOC-13 leaves "signature shifts enough" deliberately open. Implemented as a style-signature comparison over {background, color scheme, type treatment, spacing/container}; a page whose signature never shifts collapses to a single segment (valid per DOC-13).


---

## REQ-13: 1c shot: page screenshot primitive (AI eyes)

## Scope

Build `1c shot` — a page **screenshot primitive** using the `BrowserDriver` from the capture REQ, to give the AI **eyes** ([[DOC-13]] §6): screenshot our own rendered draft/published output, or any URL.

## Why free-coded

Thin command over the existing driver + render/serve pipeline. Single intent.

## Dependencies

- **Depends on:** the capture REQ (the `BrowserDriver` seam), REQ-9 (`1c render` / `1c serve`).

## Deliverables

- `1c shot <slug> [--source draft|published] [--out <file>]` — `1c render` the chosen source, `1c serve` it locally, and screenshot the **served** page (localhost) so `/assets/` images load. Fixes first-contact's blank-screenshot bug (screenshotting a page that couldn't reach its own assets).
- `1c shot --url <url> [--out <file>]` — screenshot any URL via the same driver.
- Deterministic viewport (default desktop; `--viewport mobile|tablet|desktop`). PNG output; optional per-section crops when a capture/segmentation is available.

## UATs (`test_UAT_FC_REQ-13_*`)

- `test_UAT_FC_REQ-13_shot_draft_assets_load` — screenshot of a served draft is a non-blank PNG whose referenced `/assets/` images actually rendered (not the missing-asset bug).
- `test_UAT_FC_REQ-13_shot_url` — `--url` produces a PNG of an arbitrary (fixture) page.
- `test_UAT_FC_REQ-13_deterministic_viewport` — a given `--viewport` yields stable dimensions.

## Out of scope

- Multimodal AI comparison of screenshot vs capture (that's the AI mapping/closed-loop step, later).
- CF Browser Rendering driver.


---

## REQ-14: Framework: section background capability (color | image | gradient + overlay, text-over)

## Scope

Add a **section-level `background` capability** to `@1stcontact/site-schema` + `packages/framework`: a background can be **color, image, or gradient**, with an optional **overlay** (color + opacity) and **text-over** support. This is the single biggest reproduction gap identified during the capture design — real small-business sites lay text over background images, and first-contact's framework never could, which was "seriously limiting."

Design: [[DOC-7]] (framework), [[DOC-13]] §4 (capture models `background` incl. overlay as first-class). This is the first concrete **catalog-growth** item surfaced by the capture work.

## Why free-coded

A bounded framework capability with a settled shape (the capture schema already defines it). Translating a known contract into schema + renderer.

## Dependencies

- **Depends on:** REQ-3 (site-schema), REQ-4 (framework tokens/CSS generator/modules).

## What was built

### Site-schema (`packages/site-schema/src/schema.ts`)

- A `Background` **discriminated union on `type`** (cleaner realization of the `{ type, value?, asset?, gradient?, overlay?, fit? }` shape — each variant carries exactly the fields it needs):
  - `color` → `value` (hex)
  - `image` → `asset` (asset-ref) + optional `fit` (`cover` | `contain`)
  - `gradient` → `gradient` (CSS gradient string)
  - all three take an optional `overlay: { color: hex, opacity: 0..1 }`.
- Attached as an optional `background` field on `moduleInstanceSchema` (section/module level).
- Validated: hex colors, opacity 0..1, asset refs. Malformed values (bad hex, opacity>1) are rejected with JSON-pointer path-pointed errors. Derived types exported: `Background`, `BackgroundOverlay`, `BackgroundFit`.

### Framework rendering (`packages/framework/src/modules/background.ts`)

- `wrapWithBackground(moduleHtml, bg)` wraps a module's markup in three stacked layers — `fc-bg-section__layer` (background, z 0), `fc-bg-section__overlay` (optional tint, z 1), `fc-bg-section__content` (the module, z 2) — so **content renders on top** with legible contrast. Modules without a background are returned unchanged (background is **scoped to its own section**, never global).
- Per-instance layer/overlay styles are **framework-computed inline** (never raw instance CSS); the static stacking rules live in exported `SECTION_CSS`, folded into the per-site `theme.css` alongside module CSS.
- Wired into the server-side render path: `tools/generate` `renderModules` wraps each module carrying a `background`, and appends `SECTION_CSS` to `theme.css`. Deterministic output ([[DOC-7]] §2.4).

## UATs (`tests/req14-background.test.ts`, `test_UAT_FC_REQ-14_*`)

- `test_UAT_FC_REQ-14_schema_accepts_background` — color / image / gradient backgrounds with an overlay validate; malformed ones (bad hex, opacity>1) are rejected with a path-pointed error.
- `test_UAT_FC_REQ-14_renders_text_over_image` — a section with `background.type=image` + `overlay` + a heading renders the heading **over** the image with the overlay between them (DOM layer order asserted: layer → overlay → content).
- `test_UAT_FC_REQ-14_color_and_gradient_variants` — color and gradient backgrounds render.
- `test_UAT_FC_REQ-14_background_is_scoped` — end-to-end through `1c render`: with one of several modules carrying a background, exactly one section wrapper is emitted and `SECTION_CSS` reaches `theme.css`.

## Out of scope

- Capture/mapping (separate REQs).
- Parallax / video backgrounds — later if the corpus demands.


---

## REQ-15: Framework: `layer` module + z-compositing (free-positioned structured layout)

## Scope

The first concrete "grow the language" primitive ([[DOC-7]] §6, [[DOC-14]]): a **`layer` module** — a stack of freely-positioned children (images, text blocks, other modules) — plus **z-compositing** so a layer can sit over another module. All positioning is **structured data**, never raw CSS. Unlocks art-directed heroes (e.g. faelan.com's photo montage) while staying inside the model.

## Dependencies
REQ-3 (schema — adds structured layout types), REQ-4/5 (framework), REQ-14 (background/overlay). 

## Deliverables
- **Schema:** `Position` (`x`/`y`/`z`, size, per-breakpoint overrides), `Layer` (ordered positioned children), image **treatments** (`shape: circle`, `edge: soft-mask | torn-asset`), and a `reflow` fallback (stack on narrow viewports). Validated as structured data.
- **Framework rendering:** scoped, class/custom-property CSS generated from the structured props (never instance-supplied CSS); responsive via per-breakpoint values + reflow; z-compositing over a sibling/parent module.
- **Validator:** accepts structured positions/treatments; rejects raw CSS/HTML.

## UATs (`test_UAT_FC_REQ-15_*`)
- `test_UAT_FC_REQ-15_layer_positions_children` — children render at their structured x/y/z.
- `test_UAT_FC_REQ-15_text_over_image` — text renders over a layered image + overlay.
- `test_UAT_FC_REQ-15_treatments` — circle / soft-mask / torn-asset treatments render.
- `test_UAT_FC_REQ-15_per_breakpoint_reflow` — a narrow viewport reflows to the stack fallback.
- `test_UAT_FC_REQ-15_zcompositing` — a layer composites over another module.
- `test_UAT_FC_REQ-15_no_raw_css` — raw CSS/style props on an instance are rejected.

## Out of scope
Motion (separate REQ); generative/canvas visuals (later).

## Implementation approach (2026-07-02)

Mirrors the REQ-14 `background` pattern for coherence — one integration point, no new
render machinery:

- **`Layer` is an optional structured field on the module instance** (`moduleInstance.layer`),
  exactly like `background`. Its children composite *over* the host module's own markup,
  which delivers z-compositing over another module directly.
- **A registered `layer` module** is the standalone art-directed host: a bare positioning
  section whose `layer` field carries the children. `{type:'layer', layer:{…}}` is a pure
  art-directed section; `{type:'hero', layer:{…}}` composites a layer over a hero.
- **Structured position data** — `Position` = numeric `x`/`y`/`z` (+ optional `width`/`height`/
  `rotate` and per-breakpoint overrides). The framework emits these as computed CSS custom
  properties (`--fc-x`, `--fc-z`, …); the static positioning/reflow/treatment rules live in
  `LAYER_CSS` (folded into `theme.css` alongside REQ-14's `SECTION_CSS`). No instance-supplied CSS.
- **Children** — discriminated union (`image` | `text`); image children carry a `treatment`
  (`shape: none|circle|rounded`, `edge: none|soft-mask|torn-asset`). "Other modules" as children
  is deferred (reconciliation can extend the union).
- **`reflow`** — `stack` (default) collapses absolute positioning to normal flow below
  `reflowBelow` (default `sm`); `none` keeps positioning at every width.
- **Validator** — the layer/position/child schemas and the module-instance schema are `.strict()`,
  so a raw `style`/`css` prop on an instance (or a layer child) is a path-pointed validation error.

### Files
- `packages/site-schema/src/schema.ts` / `types.ts` — Position, Treatment, LayerChild, Layer; `layer` on module instance; strict.
- `packages/framework/src/modules/layer.ts` — `LAYER_CSS`, `renderLayer`, `wrapWithLayer`.
- `packages/framework/src/modules/layer/{meta.ts,index.astro}` — standalone host module.
- `packages/framework/src/modules/{registry,index}.ts`, `packages/framework/src/index.ts` — wire-up.
- `tools/generate/src/render/render.ts` — apply `wrapWithLayer` + fold `LAYER_CSS` into `theme.css`.
- `tests/req15-layer.test.ts` — the six UATs.


---

## REQ-16: Framework: structured motion primitive (entrance / scroll-reveal / hover)

## Scope

The highest-leverage language-growth primitive (surfaced by the sycamore.so analysis): a **structured motion system** — entrance animations, scroll-triggered reveals, hover states, stagger — expressed as **structured params** (which / trigger / duration / easing / delay), rendered server-side as CSS + a minimal island for scroll triggers. No raw CSS ([[DOC-7]] §6).

## Dependencies
REQ-4 (framework), REQ-3 (schema — motion fields).

## Deliverables (as built)

- **Schema** (`packages/site-schema/src/schema.ts`): `motionSchema` — a `.strict()` object attachable to a **module instance** *and* to a **layer child** (both discriminated-union variants):
  - `type`: `fade | slide | scale | stagger` (what animates)
  - `trigger`: `load | scroll | hover` (when)
  - `duration`, `delay`: non-negative integer **milliseconds** (optional; framework defaults apply)
  - `easing`: a **named enum** (`linear | ease | ease-in | ease-out | ease-in-out`) — a raw `cubic-bezier(...)` string is rejected, holding the DOC-7 §6.2 structured-only line.
  - Derived types exported: `Motion`, `MotionType`, `MotionTrigger`, `MotionEasing`.
- **Framework** (`packages/framework/src/modules/motion.ts`):
  - `MOTION_CSS` — static per-site CSS: `@keyframes` for fade/slide/scale, load/scroll animation binding, hover transitions, a `stagger` nth-child delay cascade (up to 12 children, 80ms step), and a `@media (prefers-reduced-motion: reduce)` block that disables all animation/transition and forces scroll-revealed content visible (motion never gates content).
  - `MOTION_SCRIPT` — a self-contained IntersectionObserver island (no imports) that adds `fc-motion--visible` as elements enter the viewport and unobserves them; degrades to revealing everything where IntersectionObserver is unavailable.
  - `wrapWithMotion` / `motionClasses` / `motionVars` — the framework (never the instance) turns params into trigger+type classes + framework-computed `--fc-motion-*` custom properties. Scroll motions carry `data-fc-motion-scroll` for the island.
- **Layer** (`layer.ts`): a layer child's motion wraps the child's **inner** content, not the positioned element — the child already owns `transform: rotate(...)`, which a slide/scale keyframe would otherwise clobber.
- **Render** (`tools/generate/src/render/render.ts`): motion wraps **outermost** (whole section animates as one unit, over REQ-14 background + REQ-15 layer); `MOTION_CSS` folded into the per-site `theme.css`; the island `<script>` injected **once per page**, only when the page (a module or any layer child) carries scroll-triggered motion.

## Design decisions during implementation

- **`easing` is a named enum, not free CSS** — keeps the structured-only guarantee; a raw cubic-bezier is a validation error (covered by a UAT).
- **`stagger`** is realised as an nth-child delay cascade on a group's direct children (bounded to 12), so it needs no per-child inline state.
- **Scroll island shipped inline** — the container render drops component `<script>` blocks (same as `<style>`), so the island is injected as a page-level inline `<script>` string rather than an Astro island bundle; it is emitted only when needed.
- **Reduced-motion is content-safe** — scroll-revealed elements are forced `opacity: 1` under `prefers-reduced-motion`.

## Test plan / UATs

`tests/req16-motion.test.ts` (node env — schema, CSS, params, end-to-end `1c` render):
- `test_UAT_FC_REQ-16_entrance_and_hover_render` — load/hover motions validate and render as trigger+type classes; raw-easing rejected.
- `test_UAT_FC_REQ-16_reduced_motion` — `prefers-reduced-motion` disables animation/transition and forces scroll content visible.
- `test_UAT_FC_REQ-16_params_drive_output` — duration/easing/delay flow into `--fc-motion-*`; omitted params fall through to defaults; layer-child motion wraps inner content; end-to-end render ships the island once and folds `MOTION_CSS` into `theme.css`.

`tests/req16-motion-island.test.ts` (jsdom — the shipped island, run against a stubbed IntersectionObserver; separated because esbuild/Astro cannot run under jsdom):
- `test_UAT_FC_REQ-16_scroll_reveal_hydrates` — the island reveals the element on intersection and stops observing it.
- `test_UAT_FC_REQ-16_scroll_reveal_degrades_without_observer` — content is revealed immediately where IntersectionObserver is absent.

All 5 UATs pass; full suite 102/102 green; site-schema / framework / generate typecheck clean.

## Out of scope
Generative/canvas animation (later); physics.


---

## REQ-22: Consolidate site-data trees under storage/

## Scope

Consolidate the four site-data trees under a single top-level **`storage/`** directory to declutter the repo root (clean code / data split):

```
storage/
  sites/        (git-tracked — authored sites)
  sandbox/      (gitignored — scratch)
  dist/         (gitignored — rendered output)
  references/   (gitignored — captured external sites)
```

Purely a **path/layout refactor** — no behaviour change. Touches the centralized path builders, `.gitignore`, tests, and the layout in the docs. Done now, before the flagship sites and `references/` captures accumulate content that would have to be moved later.

## Deliverables

- `tools/generate/src/store/paths.ts` — `siteDir` and `distDir` resolve under `storage/`.
- `tools/generate/src/cli/capture/bundle.ts` — capture bundles write under `storage/references/`.
- `.gitignore` — ignore `/storage/{sandbox,dist,references}/`; `storage/sites/` stays tracked.
- `git mv sites storage/sites` (and `dist` → `storage/dist`) to preserve history / move existing content.
- Update path assertions in existing UATs (REQ-9/11/12/13 tests).
- Update the layout in [[DOC-12]], [[DOC-13]], [[DOC-15]].

## UATs (`test_UAT_FC_REQ-22_*`)
- `test_UAT_FC_REQ-22_new_and_render_use_storage` — `1c new` creates under `storage/sites/<slug>/`, `1c render` outputs under `storage/dist/sites/<slug>/`.
- `test_UAT_FC_REQ-22_capture_writes_under_storage` — a capture bundle lands under `storage/references/<host>/`.
- `test_UAT_FC_REQ-22_gitignore_tracks_sites_ignores_rest` — `storage/sites/**` tracked; `storage/{sandbox,dist,references}/**` ignored.

## Out of scope
Any behaviour change; D1 paths (later).

## Shipped & verified (6328691)

- Path builders (`store/paths.ts`, `cli/capture/bundle.ts`, `cli/commands.ts` list scan) resolve under `storage/`.
- `.gitignore` retargeted: `storage/sites/` tracked; `storage/{sandbox,dist,references}/` ignored.
- `git mv sites storage/sites`; captured `gigabytealchemy.ai` bundle relocated to `storage/references/`.
- Fixed two spots tests missed (req14/15 paths, `cmdList` scan — now covered by a REQ-22 UAT).
- `1c list`/`render` work under `storage/`. **All 102 tests pass.** Layout updated in [[DOC-12]]/[[DOC-13]].


---

## REQ-23: Framework: storage schema must persist structured list content (object content values)

## Scope — framework gap

The storage/site schema cannot persist **structured list content** (arrays of objects), so any module whose content is a list of typed records cannot be authored on disk or rendered. This blocks `services-grid` (items), `contact-form` (fields), `footer` (links), and `header` (entries) — half the module catalog.

## Root cause — two validators disagree

- **Components** already consume structured objects: `services-grid/index.astro` reads `item.title` / `item.body` / `item.icon` / `item.cta`; `contact-form/index.astro` reads `field.name` / `field.label` / `field.type` / `field.required`; `footer/index.astro` reads `entry.label` / `entry.target`.
- **Module-level validator** `validateModuleContent` (`packages/framework/src/modules/validate.ts`) accepts them — it checks list presence and `minItems`/`maxItems` bounds only, treating elements as opaque. Its tests pass `items: [{ title, body }]`.
- **Storage schema** does NOT. `moduleInstanceSchema.content` is `z.record(z.string(), contentValueSchema)` and `contentValueSchema` (`packages/site-schema/src/schema.ts:50-53`) is only `string | assetRef | array<contentValue>` — no object form. `validateSite` (`packages/site-schema/src/validate.ts:23`, `siteSchema.safeParse`) therefore rejects any `{title, body}` / `{name, label, type}` / `{label, target}` element.

Both shipped sites (`1stcontact`, `harbor-cafe`) use empty `entries`/`links` and no grids, so the gap was never exercised until `gigabytealchemy` (REQ-20) became the first site to author structured lists.

## Reproduction

`node tools/generate/bin/1c.mjs render gigabytealchemy` →

```
/pages/0/modules/3/content/items   (services-grid)  Invalid input
/pages/0/modules/5/content/items   (services-grid)  Invalid input
/pages/0/modules/8/content/fields  (contact-form)   Invalid input
/pages/0/modules/9/content/fields  (contact-form)   Invalid input
/pages/0/modules/10/content/links  (footer)         Invalid input
```

## Acceptance criteria

- `contentValueSchema` in `packages/site-schema/src/schema.ts` permits typed **object** content values, so a list element may be a record of content values (recursively string | assetRef | object | array). The schema stays structural — it validates shape, not per-module field names (that remains `validateModuleContent`'s job, per the existing schema-layer comment).
- The raw `style` / `css` / `html` rejection line (`.strict()` on `moduleInstanceSchema`, DOC-7 §6.2) is preserved — allowing objects must NOT open a raw-CSS/HTML escape hatch.
- `1c render gigabytealchemy` validates and renders all 11 modules (grids, forms, footer links) with no schema errors.
- A UAT proves a site whose content includes list-of-object modules (services-grid items, contact-form fields, footer links) round-trips through `validateSite` → render.

## Notes

- Discovered while building the gigabytealchemy import reproduction (REQ-20). This is the storage-schema half of the "capture fidelity bar" the milestone drives out; REQ-20 stays blocked on it.
- Distinct, secondary fidelity gaps already logged against REQ-20 (Cinzel wordmark / `@font-face` emission, card badges + checklists, side-by-side dual forms, narrow left-aligned column) are NOT in scope here — this ticket is only the object-content schema fix.



---

## Implementation note (free-coded, 2026-07-02)

The fix widened `contentValueSchema` (`packages/site-schema/src/schema.ts`) to permit **object** content values (`z.record(z.string(), contentValueSchema)`, ordered after `assetRefSchema` so asset values still type as `AssetRef`).

**Scope extension beyond the original AC:** the reproduction (`1c render gigabytealchemy` with no schema errors) also required **boolean** scalars — `contact-form`'s `field.required` is a real boolean the component binds to an HTML attribute (`contact-form/index.astro` types `required: boolean`). Restricting content to strings would force stringify/parse round-trips at the module boundary. Per the DOC-7 §6.3 'grow the language, close the gap' principle, scalar content values were widened to `string | number | boolean` (number added as the natural primitive generalization) alongside the object and array forms.

The `.strict()` raw-prop rejection on `moduleInstanceSchema` (DOC-7 §6.2) is untouched — no raw CSS/HTML escape hatch is opened; content values remain a closed set of shapes.

**Verification:** all 11 gigabytealchemy modules render clean; `site-schema` UATs (12) + storage/content/structured-edit/generate regression scope (56 total) pass.

## Test plan (implemented)

- `tests/site-schema.test.ts`:
  - `test_UAT_FC_REQ-23_list_of_object_content_round_trips` — services-grid items, contact-form fields (with boolean `required` + number `maxLength`), and footer links round-trip through `validateSite`.
  - `test_UAT_FC_REQ-23_asset_ref_content_still_validates` — asset content values in a list still validate as `AssetRef` (union ordering preserved).


---

## REQ-24: Display-font slot + @font-face emission (Cinzel wordmark)

## Scope — module capability

Emit `@font-face` for site-supplied display fonts and expose a **display-font slot** so a module (starting with `header`) can render a wordmark in a bespoke font (not just the theme's `heading`/`body` families).

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference header is the wordmark **"GIGABYTE ALCHEMY" in gold Cinzel serif**, centered. The font (`cinzel.woff2`) is already mirrored into the site's `assets/`; nothing currently emitted an `@font-face` rule for it, and `header` had no way to select it.

## Acceptance criteria

- Framework emits a valid `@font-face` (into the per-site stylesheet) for a site-declared display font, referencing the mirrored `.woff2` asset. No raw CSS in the site definition.
- `header` (and ideally any heading-bearing module) can select the display family via a dial or theme typography slot.
- gigabytealchemy header renders "GIGABYTE ALCHEMY" in Cinzel — correct family, weight, and the gold/amber treatment — matching the captured values.

## What was implemented (free-coded — commit 492684e)

**Structured font declaration (site-schema).** New optional `theme.fonts[]` array — each entry `{ family, src, weight?, style?, display? }`, where `src` is an asset-relative path (same shape as `AssetRef.src`). New optional `theme.typography.family.display` third family slot. Both structured data validated by the schema; no raw `@font-face` CSS is expressible in the site definition (`FontFace` type exported).

**@font-face + display token emission (framework `generateThemeCss`).** Each `theme.fonts` entry becomes one `@font-face` rule emitted ahead of `:root`, with a `format(...)` hint derived from the asset extension and `font-display` defaulting to `swap`. A new `--font-family-display` custom property is always emitted (falls back to the heading family when no display family is declared), so **any** heading-bearing module can reach the display face, not just header.

**Header wordmark dials.** `header` gains two dials:
- `logoFont` (`heading` | `body` | `display`) — selects the wordmark family; `display` binds to `--font-family-display`.
- `logoTreatment` (`plain` | `gold`) — `gold` fills the wordmark glyphs with a metallic-gold gradient (`background-clip: text`) keyed to the site's `--color-accent`.
Both apply only to a text wordmark, not an image logo.

**Gold-gradient treatment decision.** The ticket flagged the gold treatment as possibly needing its own primitive. It rides this ticket cleanly as the structured `logoTreatment` dial (a per-instance colour treatment on the header wordmark) — no separate gradient-text primitive was required. If gradient text is later wanted on other modules, generalise `logoTreatment` into a shared text-treatment dial.

## Test plan

`tests/req24-display-font.test.ts` — UATs covering:
- schema accepts a structured font declaration; rejects a malformed one (missing `src`);
- `generateThemeCss` emits a well-formed `@font-face` (family, asset url, woff2 format hint, `font-display`), carries optional weight/style, emits `--font-family-display` (declared value + heading fallback), and omits `@font-face` when no fonts are declared;
- `header` meta exposes the `logoFont`/`logoTreatment` dials; the header renders the wordmark span with the display-font + gold classes, and defaults to heading/plain;
- **end-to-end render pipeline** (`1c` `cmdNew` → inject font → `cmdRender`): theme.css carries the `@font-face`, `--font-family-display`, and the gold wordmark CSS; index.html shows the wordmark with both hook classes; the font asset is copied through.

`tests/framework-tokens.test.ts` updated: token-surface count 55 → 56 (the new `--font-family-display`).

Verified in the real render: `1c render gigabytealchemy` produces the valid `@font-face` for Cinzel and the header wordmark; `1c shot` confirms "GIGABYTE ALCHEMY" in gold Cinzel serif on the dark header, matching the capture. (The gigabytealchemy site itself is REQ-20's untracked fixture and is not part of this commit; its `site.json`/`home.json` were updated to use the new capability and will land with REQ-20.)

## Notes

- Font declaration lives in the theme/site model (`theme.fonts` + `typography.family.display`), not per-module raw props.
- Unblocks REQ-20 fidelity gap #1.


---

## REQ-25: Header-over-hero: composite header onto shared image band

## Scope — structural capability

Allow a `header` (top chrome) to sit **over** the following section's background image as one continuous band, rather than rendering as its own separate band above it.

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference top is a single dark lab image with the wordmark centered over it and the hero copy below — header and hero share one image band. Our current output renders the header as a discrete dark band stacked above the hero image.

## Acceptance criteria

- A header can be composited over the adjacent hero/background image (shared image band), with content (wordmark) legible over it — reusing the REQ-14 overlay/legibility mechanism, no raw CSS.
- Expressed through the module/composition model (a dial, a "transparent/overlay" header variant, or the compositing path), not a per-site hack.
- gigabytealchemy renders header + hero as one continuous image band matching the reference.

## Notes

- Likely intersects REQ-15 (`layer`/compositing). Decide whether this is a `header` variant ("overlay") or a compositing-layer concern, and note the call.
- Blocks REQ-20 fidelity gap #2.

## Design decision (the "note the call" item)

**Call: compositing path in the render pipeline, expressed as a `header` `overlay` variant.**

- Add an `overlay` variant to the `header` module. It renders transparent (no surface fill, no bottom border) so the band behind it shows through continuously.
- The render pipeline (`tools/generate` `renderModules`) does *not* emit an `overlay` header as its own band. Instead it floats the header absolutely across the top of the **immediately-following** module's band, so header + next section share one continuous background band. New static structural CSS (`OVERLAY_BAND_CSS`) — no instance-supplied/raw CSS.
- The shared image is provided by the following band: the hero `bg-image` variant (the blessed image-hero path) or any module carrying a REQ-14 `background`. Legibility over the band reuses the REQ-14 overlay mechanism (dark image / overlay tint), not a new path.
- Why a variant + pipeline compositing rather than a `layer` (REQ-15) concern: REQ-15 composites children *within* one host module's box; here we need two sibling module instances (header + hero) to share one band, which is a cross-instance pipeline concern. Kept type-general: any `header@overlay` followed by a band, not a gigabyte hack.

**Commit scope note:** REQ-25 commits the framework capability + UATs only. The `storage/sites/gigabytealchemy/` tree is untracked REQ-20 import work; the home.json header→overlay flip is made to verify AC3 but is left for REQ-20 to commit (not staged into REQ-25).