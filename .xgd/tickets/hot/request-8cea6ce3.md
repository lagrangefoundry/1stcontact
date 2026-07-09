---
uid: request-8cea6ce3
id: REQ-14
type: request
title: 'Framework: section background capability (color | image | gradient + overlay,
  text-over)'
created_by: xgd
created_at: '2026-07-01T00:44:39.290601+00:00'
updated_at: '2026-07-09T20:00:46.807623+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  story_points: 5
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - cf26a7d5bf037df6e3a3335e47cef96c920cf1ae
  version: 0.0.11
  bundled_in: bundle-f39884d2
---

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