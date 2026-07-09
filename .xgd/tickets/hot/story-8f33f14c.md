---
uid: story-8f33f14c
id: STORY-57
type: story
title: Rendered-only reference capture via headless browser (1c capture page)
created_by: xgd
created_at: '2026-07-09T20:11:20.209996+00:00'
updated_at: '2026-07-09T20:11:20.209996+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-4dd2cf78
  story_kind: feature
  story_points: 3
---

## Story
**As a** site builder (and the AI acting on my behalf), **I want** to capture a live web page exactly as a real browser renders it into a self-contained, offline-re-extractable bundle, **so that** I have a faithful, structured reference of the page's painted theme, layout, and verbatim content to reproduce it — without being blinded by content that only appears after JavaScript runs.

## Description
Provides the `1c capture page <url>` command. A real headless browser navigates the *live* URL, lets its JavaScript hydrate against its real origin, intercept-caches every network response, queries the rendered DOM for computed styling signals, and takes a full-page screenshot. From those signals it assembles a catalog-agnostic structured essence (`capture.json`) and writes a self-contained bundle to a gitignored `storage/references/<host>/<path>/` directory.

The bundle contains: `capture.json` (structured essence), `screenshot.full.png` (full-page render), `rendered.html` (post-JS DOM — the escape hatch), `raw.html` (original server response), and `assets/` (every mirrored subresource — images, fonts, stylesheets, scripts). Because every subresource is mirrored, the bundle is fully self-contained and the same essence can be re-extracted later with no network access.

`capture.json` carries: painted theme colors (with `var()` resolved to the actual hex), fonts plus their mirrored files, a type scale, spacing scale and container width; and a list of style-signature-segmented sections — each with its box, a screenshot crop, its background (color / image / gradient, including a text-over-image overlay), a flat layout descriptor, verbatim role-tagged content runs (each with its exact painted color / font / size / weight), and flattened repeated items.

**In scope:** single-page rendered capture of one URL; the CF-shaped BrowserDriver seam with a local Playwright implementation; style-signature segmentation; visibility filtering; offline re-extraction from a written bundle.

**Out of scope (per intent):** `1c capture site` (multi-page crawl); AI mapping of a capture into a draft site; the Cloudflare Browser Rendering driver (Playwright first); IP/copyright handling.

## Technical Context
- Design authority is DOC-13 (Reference Capture Model). The intent (REQ-12) is a construction of a model fully specified there; it supersedes first-contact's earlier static-first extractor.
- Depends conceptually on the `1c` CLI harness (REQ-9) and the toolchain (REQ-10, which adds Playwright as a runtime dependency). It is catalog-agnostic — it does not depend on the module catalog.
- The BrowserDriver interface deliberately mirrors the Cloudflare Browser Rendering / `@cloudflare/puppeteer` surface (navigate / screenshot / query / responses / content / close) and deliberately exposes **no** `setContent()`, because pre-fetching a shell would re-create the static blindness this capability exists to defeat (DOC-13 §2.3). The driver is supplied via an injectable factory so tests can inject a fake.
- There is intentionally **no** static-extraction fallback: on browser failure the pipeline retries and, if all attempts fail, errors — it never silently degrades to a blind static path.
- Offline re-extraction serves the written bundle over an ephemeral loopback server and runs the *same* pipeline against the mirrored bytes (a real navigation, not a `setContent()` shell), keeping it faithful to DOC-13 §2.3.
- Segmentation is a style-signature heuristic over {background, color scheme, type treatment, spacing/container}; a page whose signature never shifts collapses to a single valid segment (DOC-13 leaves the exact shift threshold open).

## Dependencies
None within this reconciliation bundle. (Item 2 — `1c shot` — depends on this item for the shared BrowserDriver seam.)

## Story Points
3
