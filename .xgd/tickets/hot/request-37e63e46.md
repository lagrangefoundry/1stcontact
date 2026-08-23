---
uid: request-37e63e46
id: REQ-103
type: request
title: 'L1 cannot express texture: typed pattern axis (dot-grid, hairline grid, lines)
  and radial gradients'
created_by: xgd
created_at: '2026-07-27T21:23:15.235392+00:00'
updated_at: '2026-08-06T04:54:57.581904+00:00'
completed_at: '2026-08-06T04:54:57.581904+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: bd00ddd94f326055d678a466e30b98594042f257
    reconcile_sha: null
    main_sha: null
  version: 0.0.224
  story_points: 4
  bundled_in: bundle-ee56a66e
  chat_comment: comment-989af6be
---

## The gap

**L1 could not express texture.** Every surface it could paint was a flat colour
or a single linear gradient, and there was no way to make a surface repeat,
radiate, or carry grain.

Two independent walls:

**1. Gradients were linear-only.**

```ts
// packages/site-schema/src/l1/schema.ts
export const l1GradientSchema = z.object({
  angleDeg: finite.optional(),
  stops: z.array(l1GradientStopSchema).min(2),
}).strict()
```

No radial, no conic, no `repeating-` form. A soft glow behind a headline — a
radial falloff, the single most common device in dark-theme marketing design —
had no representation at all.

**2. A background image could not tile.** The renderer pinned the sizing triple:

```ts
// packages/framework/src/l1/render.ts:284
if (hasBgImageUrl) {
  out.push('background-size: cover', 'background-position: center', 'background-repeat: no-repeat')
}
```

That is the right default for a hero backdrop (BUG-13, which set it), but it was
the *only* behaviour. A 24×24 dot-grid asset could not repeat across a section.

## Why it mattered

Dot-grids, hairline grids, radial glows and film grain are what separates a
premium page from a flat one. With both routes closed, an L1 page was flat colour
on flat colour everywhere, and the only remaining lever was contrast between
adjacent bands.

This bit REQ-95 directly. **XGD's own logo motif is a warped wireframe grid** —
the brand's defining graphic could not be drawn by the substrate that renders the
brand's site, so xgd.dev carried it as full-bleed SVG assets stretched by `cover`,
with stroke weights hand-tuned inside the asset files.

It is also a capability-gap of exactly the kind CLAUDE.md says belongs in L1: this
is presentation, it is not behavioural, and the fix is a typed axis, not a module.
There was **no workaround inside the substrate** — only a single full-bleed raster
which (a) distorts at every viewport it was not authored for, (b) costs a binary
asset per section, and (c) pushes design decisions out of L1 and back into
hand-authored files, precisely what the substrate exists to prevent (DOC-23,
DOC-24).

## What changed

Proposal (b) — the typed `pattern` axis — plus proposal (a), the radial gradient
branch named in the title. Proposal (c) (`backgroundRepeat`/`backgroundSizePx`)
was **not** taken: it re-opens BUG-13's default and still needs a real asset per
texture, so it is worse than (b) on both counts.

**1. `pattern` on the shared surface axis group** (`l1PatternSchema`, spread into
every box-rendering kind via REQ-98's `surfaceAxesShape`):

```ts
pattern: {
  shape: 'dots' | 'grid' | 'lines',
  spacingPx: number,          // the tile period
  thicknessPx?: number,       // line width; dot DIAMETER for `dots` (default 1 / 2)
  color: L1Color,             // hex only, incl. #rrggbbaa
  angleDeg?: number,          // tilts `lines`; inert elsewhere, as l1Mask.featherPx is
}
```

The renderer compiles it to repeating gradients — `dots` to one tiled
`radial-gradient`, `grid` to two tiled `linear-gradient` layers (a CSS gradient
runs along one axis, so a grid is one rule set per axis), `lines` to a single
`repeating-linear-gradient` which carries its own period and so tilts without the
tile shearing. No asset, no raw CSS: every token is re-derived from a number, a
hex colour or a closed enum.

**2. `l1GradientSchema` becomes `linear | radial`.** `l1LinearGradientSchema`
keeps `angleDeg` and takes `kind: 'linear'` as *optional*;
`l1RadialGradientSchema` requires `kind: 'radial'` and carries a typed `origin`
(the nine CSS box positions, never an `at 30% 40%` string) and `extent`. The
branch axes do not mix — a radial with an `angleDeg` is rejected by the schema
rather than silently ignored by the renderer. Linear-by-default is not a
compatibility shim: linear is what a capture folds to, and a discriminator every
folded gradient would have to restate is noise on the common case. `foldGradient`
is typed to the linear branch accordingly.

**3. The background sizing triple became positional.** `background-size` /
`-position` / `-repeat` are emitted as one value per layer, in layer order, when a
pattern is present — so a tiled texture and a `cover` backdrop coexist on one box.
With no pattern the renderer emits exactly the single value BUG-13 set, so no
existing surface changed by a byte.

**Layer order, top-most first: scrim → texture → gradient wash → image → fill.**
A dot-grid over a radial glow over a dark fill — the ordinary stack — is what the
axes say.

**4. Envelope.** `spacingPx` is bounded `[1, 1000]` and `thicknessPx` `[0, 1000]`,
checked inside the shared `checkSurface` so an interaction-state pattern delta is
bounded by the same rule as the base node. The spacing floor is a robustness rule,
not taste: a sub-pixel period tiles a full-bleed band millions of times and is a
way to hang a compositor. A rule wider than its own period saturates at the
spacing rather than bleeding into the next tile.

**5. xgd.dev.** The two untextured cream bands (`problem`, `close`) now carry the
grid motif from the axis — a 48px hairline grid in the brand brown at 10% alpha —
instead of nothing. The `papers` band stays clean so the pull-quote keeps its air.

## Residual: the warped grid is still an asset

`xgd-grid-hero.svg` and the two echo grids stay as assets, and the ticket's
framing ("the brand's defining graphic cannot be drawn by the substrate") is only
partly answered. Those grids are a **perspective projection** — a grid warped
toward a vanishing point, with a fade mask. A repeating gradient tiles a constant
cell by construction and cannot express a projection, so this axis reaches the
motif at rest but not the motif in perspective. Whether that warrants a further
L1 primitive (a projected/warped variant) is a separate design question, not a
gap in this axis. Grain/noise remains out of scope for the reason originally
given: it needs a generated asset, not an axis.

## Acceptance criteria

1. ✅ A `container` paints a dot-grid at a chosen spacing and colour with no image
   asset and no raw CSS.
2. ✅ A `container` paints a hairline grid, ditto (plus `lines`).
3. ✅ The pattern composes with `surfaceFill`, `surfaceGradient`, `overlay` and a
   `backgroundImageUrl` in the defined order above.
4. ✅ Every existing L1 page renders unchanged when it declares no pattern — the
   single-valued BUG-13 triple is preserved, asserted over every shipped page.
5. ✅ The envelope bounds `spacingPx` / `thicknessPx` and `color` goes through
   `l1Color`.
6. ◑ xgd.dev uses it to carry the grid motif on its previously-flat bands, and the
   page was re-shot and judged. The full Tier-1 re-judge is REQ-95's, and the
   warped-perspective grids remain assets (see Residual).

## Test plan

`tests/req103-l1-texture.test.ts` — 6 UATs through the real entry points
(`renderL1Document`, `validateL1`, the exported schemas):

- `test_UAT_FC_REQ-103_container_paints_a_dot_grid_with_no_asset`
- `test_UAT_FC_REQ-103_container_paints_a_hairline_grid_and_rules`
- `test_UAT_FC_REQ-103_texture_composes_with_fill_gradient_scrim_and_backdrop`
- `test_UAT_FC_REQ-103_a_radial_gradient_paints_a_glow`
- `test_UAT_FC_REQ-103_envelope_bounds_the_texture_numbers_and_its_colour`
- `test_UAT_FC_REQ-103_untextured_documents_render_unchanged`

Regression scope: full suite — 128 files / 900 tests, all passing. Clean
`pnpm -r build` + workspace typecheck (no new errors in the touched files).

## Evidence

REQ-95 pass 2, on `storage/sites/xgd/draft/pages/home.json` — 169 L1 nodes,
7 sections, zero textured surfaces available anywhere in the vocabulary.