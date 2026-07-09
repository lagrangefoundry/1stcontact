---
uid: request-19c3f8fa
id: REQ-12
type: request
title: '1c capture page: rendered page capture via headless browser (Playwright driver
  + bundle)'
created_by: xgd
created_at: '2026-07-01T00:44:32.759250+00:00'
updated_at: '2026-07-09T20:00:46.696915+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  story_points: 5
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 306c2108d2d5f5b94545a07277e7bb99b9a07846
  version: 0.0.9
  bundled_in: bundle-f39884d2
---

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