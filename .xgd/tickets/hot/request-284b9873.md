---
uid: request-284b9873
id: REQ-15
type: request
title: 'Framework: `layer` module + z-compositing (free-positioned structured layout)'
created_by: xgd
created_at: '2026-07-02T00:19:58.473214+00:00'
updated_at: '2026-07-09T21:42:37.095281+00:00'
completed_at: '2026-07-09T21:42:37.095281+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  story_points: 5
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 80a7b7359a1cbf8157f302516b2704a4408ef180
  version: 0.0.12
  bundled_in: bundle-f39884d2
---

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