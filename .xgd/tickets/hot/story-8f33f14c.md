---
uid: story-8f33f14c
id: STORY-57
type: story
title: Rendered-only reference capture via headless browser (1c capture page)
created_by: xgd
created_at: '2026-07-09T20:11:20.209996+00:00'
updated_at: '2026-07-10T01:42:13.149703+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-4dd2cf78
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-adc60ee8
  - bundle-df065afc
---

## Story
**As a** site builder (and the AI acting on my behalf), **I want** to capture a live web page exactly as a real browser renders it into a self-contained, offline-re-extractable bundle — including the computed per-element style values, per-element geometry/shape/a11y facts, and multi-state/multi-viewport/multi-engine projection a mechanical fidelity diff needs — **so that** I have a faithful, structured reference of the page's painted theme, layout, verbatim content, structure, and interaction/responsive/engine behaviour to reproduce it and value-check it, without being blinded by content that only appears after JavaScript runs, only in a hover state, only at a different width, or only in a different engine.

## Description
Provides the `1c capture page <url>` command. A real headless browser navigates the *live* URL, lets its JavaScript hydrate against its real origin, intercept-caches every network response, queries the rendered DOM for computed styling signals, and takes a full-page screenshot. From those signals it assembles a catalog-agnostic structured essence (`capture.json`) and writes a self-contained bundle to a gitignored `storage/references/<host>/<path>/` directory.

The bundle contains: `capture.json` (structured essence), `screenshot.full.png` (full-page render), `rendered.html` (post-JS DOM — the escape hatch), `raw.html` (original server response), and `assets/` (every mirrored subresource — images, fonts, stylesheets, scripts). Because every subresource is mirrored, the bundle is fully self-contained and the same essence can be re-extracted later with no network access.

`capture.json` carries: painted theme colors (with `var()` resolved to the actual hex), fonts plus their mirrored files, a type scale, spacing scale and container width; and a list of style-signature-segmented sections — each with its box, a screenshot crop, its background (color / image / gradient, including a text-over-image overlay), a flat layout descriptor, verbatim role-tagged content runs (each with its exact painted color / font / size / weight), and flattened repeated items.

### Per-element computed value manifest (REQ-31 / REQ-35)
Beyond the base painted styling, each captured text/box run also records the computed per-element values a mechanical value-level fidelity diff consumes, all read from headless computed styles with Tailwind utilities and `var()` chains already resolved to concrete values:
- `lineHeightPx` — computed line-height in px when resolvable to a length.
- `letterSpacingPx` — computed letter-spacing in px (0 for `normal`).
- `gradient` — a normalized text-fill gradient (`{angleDeg, stops[]}`) when the element paints one via `background-clip: text`; the angle is a concrete degree value so a horizontal-vs-vertical sweep is a comparable field rather than an eyeball judgement.
- `borderLeft` — a left-edge accent bar treatment (`{widthPx, color}`) when the element paints one.
- `paddingLeftPx` — computed left padding/indent in px.

At the section level, capture also records two treatments that belong to a whole band rather than a single run:
- a **scrim** — a visible full-bleed (≥60% band cover) descendant painting a semi-transparent (0 < alpha < 1) background, i.e. a *separate* overlay div distinct from the band's own background, routed onto `Background.overlay` (taking precedence over any gradient-in-image overlay); and
- a **content vertical-anchor ratio** (`Layout.contentAnchorRatio`) — the content block's centre as a fraction of band height (0 = top, 0.5 = centred, 1 = bottom), measured from geometry so it reads identically whether achieved by padding or flex justification (`null` when the band paints no text).

A run whose painted colour is unresolvable (transparent/unpainted) is flagged `colorInferred` and its colour falls back to a `#000000`/`#ffffff` sentinel, marking the value low-confidence. All of these per-element/section fields are optional, so pre-REQ-31/REQ-35 bundles still parse unchanged.

### Rich per-element geometry / shape / a11y projection (REQ-47 Part A)
The projection descends from the section level down to **every rendered element**, expressed in rendered / geometric / a11y terms — never a CSS mechanism (no `flex-direction`, no tag/class). Each content run additionally records:
- `box` — its `getBoundingClientRect()` rectangle in full-page document coords (per element, not just per section).
- `borderRadiusPx`, `boxShadow` — rendered shape treatments.
- `a11yRole` — the browser's framework-agnostic accessibility role.
- `arrangement` — `row` vs `stack`, derived from geometry relative to the previous element in the section (so inline-right vs stacked-below is a comparable field, not a `flex-direction` guess).

**Text-free elements** (form controls — `input`/`textarea`/`select` — `hr` dividers, and media `img` children) carry no text join key, so they are captured as a per-section `fields[]` list to be paired by `a11yRole + document order` (an unmatched element fails safe as a *presence* delta). Each field records its `box`, its resolved `accessibleName`, and a **`nameSource`** — `placeholder` (name is *inside* the box) vs `label`/`aria`/`alt`/`text` (name is *outside*) — the exact a11y fact that separates placeholder-inside from label-above, which no geometry can see. Media fields additionally record `objectFit` and `intrinsicAspect` (natural w/h). Capture descends into layer/montage children so a text-free photo child is captured (previously whole child sets rendered as empty `items`, invisible to the diff).

### Additional rendered axes + multi-state / multi-dimension capture (REQ-48)
Each element also projects the axes a single static frame cannot hold:
- `zIndex` — effective paint order (`auto` → 0), so correctly-positioned-but-wrongly-stacked is visible.
- `filter`, `textShadow`, `maskEdge` (`mask-image`/`clip-path`) — treatments beyond box-shadow (glow, feather-halo, shaped edge), captured as raw computed value when painted else null (the diff compares *presence*).
- `transformRotateDeg`, `transformScale` — a decomposed 2D transform (`box` is already the effective post-transform rect, so translation needs no field; rotation/scale are first-class).
- `motion` — declared `animation` / `transition` / `both` / null; a hover-scale or entrance leaves no signal at rest but its declaration does.
- `fontLoaded` — per-run fact: false when the intended named face did not resolve (a fallback with different metrics rendered), so a FOUT contamination is visible rather than silently poisoning every downstream delta.

Capture is orchestrated across the full **`engines × viewports × interaction-states`** matrix (`runMultiStateCapture`): a responsive viewport ladder `{320, 375, 768, 1024, 1280, 1440}` (each projection carries a `viewport` tag), a cross-engine driver seam over `chromium | webkit | firefox` (unavailable engines are skipped and *noted*, never silently absent), and an interaction-state loop actuating `:hover`/`:focus`/`:active` on the already-open page via CDP `CSS.forcePseudoState` (no re-navigation per state). Each cell is a provenance-tagged `ValueManifest` stamped with its `{engine, viewport, state}`; the matrix is persisted to `multistate.json` in the bundle (read back by the diff, and null when a bundle predates multi-state capture). A driver that cannot actuate (a non-Blink engine, a test fake) is honestly held to `rest` and noted — never a hover cell filled with an unactuated frame that would read as a false "clean".

**Capture-timing preconditions (determinism):** after `networkidle`, capture awaits `document.fonts.ready` so the intended web fonts have loaded before signals are read (FOUT guard), and it emulates `prefers-reduced-motion: reduce` so animations collapse to their end state and the projection is deterministic frame-to-frame.

**In scope:** single-page rendered capture of one URL; the CF-shaped BrowserDriver seam with a local Playwright implementation; style-signature segmentation; visibility filtering; the per-element computed value manifest (line-height, letter-spacing, text-fill gradient, left-bar, padding) plus section scrim/content-anchor and the `colorInferred` sentinel; the REQ-47 per-element geometry/shape/a11y projection, text-free `fields[]` with `nameSource`, and geometry-derived arrangement; the REQ-48 additional axes (z-order, filter/text-shadow/mask-edge treatments, media object-fit/intrinsic-aspect, decomposed transform, declared motion, per-run font-loaded), the fonts-ready + reduced-motion capture preconditions, and the multi-viewport / cross-engine / multi-state (`runMultiStateCapture` → `multistate.json`) orchestration; offline re-extraction from a written bundle.

**Out of scope (per intent):** `1c capture site` (multi-page crawl); AI mapping of a capture into a draft site; the Cloudflare Browser Rendering driver (Playwright first); IP/copyright handling. The mechanical values-diff that *consumes* this manifest and the multi-state matrix — including the severity-ranked structural comparator, new-axis delta kinds, and `diffMultiState` cell pairing — is a separate command (STORY-62), not part of capture.

## Technical Context
- Design authority is DOC-13 (Reference Capture Model). The intent (REQ-12) is a construction of a model fully specified there; it supersedes first-contact's earlier static-first extractor. The per-element value manifest, section scrim/anchor, and `colorInferred` sentinel are the REQ-31/REQ-35 extension of that captured essence; the REQ-47/REQ-48 per-element geometry/shape/a11y projection and the multi-state/multi-dimension orchestration are the further enrichment of the *reference half* of the fidelity loop. The diff that reads them (severity ranking, new-axis compares, multi-state pairing) is a separate capability (STORY-62).
- Every projected field is expressed in rendered / geometric / a11y terms — the a11y tree (`a11yRole`, `nameSource`) is the browser's own framework-agnostic semantic projection, the correct normalisation target for structural facts geometry cannot see. No CSS-mechanism field (no `flex-direction`, no tag/class) reaches the projection: `arrangement` is derived from geometry, not read from `flex-direction`.
- All REQ-31/35/47/48 per-element and per-run fields are optional, so a bundle captured before a schema growth still parses; the enrichment is additive.
- Depends conceptually on the `1c` CLI harness (REQ-9) and the toolchain (REQ-10, which adds Playwright as a runtime dependency). It is catalog-agnostic — it does not depend on the module catalog.
- The BrowserDriver interface deliberately mirrors the Cloudflare Browser Rendering / `@cloudflare/puppeteer` surface (navigate / screenshot / query / responses / content / close) and deliberately exposes **no** `setContent()`, because pre-fetching a shell would re-create the static blindness this capability exists to defeat (DOC-13 §2.3). The driver is supplied via an injectable factory so tests can inject a fake. The seam is extended for REQ-48: `navigate(url, viewport?)` takes an optional viewport; `actuate(state)` / `canActuate()` drive interaction pseudo-states via CDP `forcePseudoState` (Blink-only — WebKit/Gecko launch and project but cannot actuate, and are honestly noted); `createEngineDriver(engine)` and `engineAvailable(engine)` add the cross-engine seam so a runner missing an engine skips cleanly rather than hard-failing.
- There is intentionally **no** static-extraction fallback: on browser failure the pipeline retries and, if all attempts fail, errors — it never silently degrades to a blind static path.
- Offline re-extraction serves the written bundle over an ephemeral loopback server and runs the *same* pipeline against the mirrored bytes (a real navigation, not a `setContent()` shell), keeping it faithful to DOC-13 §2.3.
- Segmentation is a style-signature heuristic over {background, color scheme, type treatment, spacing/container}; a page whose signature never shifts collapses to a single valid segment (DOC-13 leaves the exact shift threshold open).
- The scrim detection deliberately picks the *most-covering* qualifying descendant and treats it as a section-level overlay separate from the band's own background — a `bg-slate-950/xx` layer over a hero image that the band background could never itself reveal. The content-anchor ratio is derived purely from geometry, so `pt-80` padding and flex `justify-end` read the same.
- The multi-state matrix is honest about gaps by design (per the REQ-48 anti-self-grading stance): unavailable engines and non-actuating drivers are recorded as `notes` on the persisted matrix rather than dropped, so a "clean" verdict is only clean on the axes actually shot.

## Dependencies
None within this reconciliation bundle. (Item 2 — `1c shot` — depends on this item for the shared BrowserDriver seam; STORY-62 values-diff depends on this item's enriched projection + `multistate.json` for its new-axis and multi-state compares.)

## Story Points
3