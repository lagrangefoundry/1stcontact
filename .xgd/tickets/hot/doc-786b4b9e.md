---
uid: doc-786b4b9e
id: DOC-23
type: doc
title: L1 Layout Substrate — the typed element tree
created_by: xgd
created_at: '2026-07-20T20:51:27.239081+00:00'
updated_at: '2026-08-31T19:43:08.762677+00:00'
completed_at: null
last_field_updated: system_kb
status: null
fields:
  doc_kind: architecture
---

# L1 Layout Substrate — the typed element tree

**Status:** Founded by REQ-82 (Phase B1 of the framework pivot, [[DOC-79]]/REQ-79).
This spec is **grounded on the hero spike**, not frozen — later phases (capture→L1
fold, capability contract) refine it.

## 1. What L1 is

L1 is the **one** low-level, CSS-faithful layout substrate. It replaces the
semantic layout modules (header/hero/footer/text-block/…) with a single typed
tree of positioned/flowed leaves. Its value is **safety, robustness, and
cross-browser fidelity by construction** — not aesthetic rails (see the Framework
Purpose doc). Aesthetics come from Claude authoring L1 directly under the
envelope, plus its eyes ([[DOC-13]]).

## 2. The tree

A document is `{ widths: number[], background?: hex, root: L1Node }`. `widths` is
the viewport ladder it is authored against (the 6 captured widths).

Nodes are a discriminated union on `kind`:

| kind | role | notable fields |
|---|---|---|
| `container` | layout parent | `layout: stack\|row\|grid`, `gapPx`, `columns`, `distribution`, `align`, `sizing`, `children[]` |
| `box` | painted surface / nesting | `axes` (surfaceFill/radius/opacity), `sizing`, `children[]?` |
| `text` | styled run | `text`, `axes` (colour/font*/align/transform/style/spacing) |
| `image` | media | `src`, `alt`, `axes` (objectFit/radius/opacity), `sizing` |
| `slot` | capability seam | `name`, `capability?` — inert placeholder in B1; where a capability module mounts in Phase D |

Leaf **axes are typed literals** — a subset of the ~48 captured `ValueElement`
axes ([[DOC-13]] / values-diff). One value = one literal field; no shared styles
or dials in the substrate (those are authoring conveniences above L1).
Serialization from a capture is therefore *transcription*.

**One exception, added by §5:** a colour-valued axis may hold a **palette
reference** instead of a literal. It is the single admitted indirection, and it is
admitted on the same terms as structure in §3 — an optional overlay over an
always-valid absolute base, never a prerequisite.

## 3. Geometry: observed keyframes

`geometry = { keyframes: {at,x,y,width,height?}[], segments?: (interpolate|snap)[] }`.
Each keyframe pins absolute band coordinates at a captured width. `height` is
optional — a text leaf's height is **natural** (the glyph box); box/image leaves
may pin it. Per-segment `interpolate` (default) emits a fluid `calc()` between the
two keyframe values driven by `100vw`; `snap` holds the lower keyframe until the
next breakpoint. The renderer compiles a base rule + `@media (min-width:…)`
overrides; the cascade of ascending breakpoints yields the ladder.

**Absolute-base, structure-overlay** ([[DOC-79]]/REQ-79 D1): absolute per-viewport
transcription is always a valid layout form and closes the round-trip with zero
inference. Structure (below) is the optional refinement the AI *recovers*, never a
prerequisite.

## 4. Structure primitives (capture leaves empty; the AI recovers)

Capture sees painted geometry but not **relationships** — containment, flow,
fluid-vs-fixed, distribution, "hugs content". So L1 carries structure primitives
the AI fills: container `layout`/`distribution`/`align`/`gap`, per-axis `sizing`
(`fixed | fluid | hug` + min/max), and `visibility` (from/until px). Framing:
**capture sets PARAMETERS, the AI recovers RELATIONSHIPS** (Type-A vs Type-B).

## 5. Colour: literal base, palette overlay

### 5.1 Why colour gets a palette

Colour is the one axis a non-technical user changes constantly and cannot be
allowed to change *individually*. Picking colours one at a time produces
incoherent sites — the same conceptual colour drifts across a page because
nothing ties its uses together. **Colours are managed from a palette; a palette
entry is the unit of change.** Editing a colour means editing a palette entry and
having every use follow.

The palette is **of arbitrary size** — deliberately not a fixed slot set. A rich
design may carry a dozen or more colours (the San Francisco "painted ladies" are
the reference image: painters there price by *palette size*, not painted area,
because each colour is the real unit of cost and complexity). Our palette must
stretch to that without a schema change.

### 5.2 The model, mirroring §3

Colour takes exactly the shape geometry already has:

| | absolute base | overlay |
|---|---|---|
| geometry (§3) | per-viewport keyframes | recovered structure |
| **colour (§5)** | **literal hex** | **palette reference** |

- **A literal hex is always valid.** Transcription from a capture stays lossless
  and inference-free; nothing about the fold is gated on a palette existing.
- **A palette reference is the refinement.** A reference resolves to a palette
  entry whose value is a hex, so the rendered output is identical either way.
  Round-trip identity (§7) is unaffected by construction.

This is why the palette does not violate §2's "no indirection" rule in spirit: it
is not a *styling* abstraction sitting above the substrate, it is the same
absolute-base/overlay discipline applied to a second axis family.

### 5.3 Palette + variation, not palette of near-duplicates

Measured on the real folded sites in `storage/`:

| site | distinct colours | distinct RGB ignoring alpha |
|---|---|---|
| `gigabytealchemy` | 29 | 29 |
| `xgd` | 17 | **15** |
| `joyful` | 10 | 10 |
| `joyfulculinary` | 5 | 5 |

These are small, and — decisively — **they are already palette-structured**,
because the captured sites were themselves designed from palettes. Two structures
dominate:

- **Alpha variants of one base.** `xgd` carries `#2e86a3`, `#2e86a3a6` (α .65) and
  `#2e86a355` (α .33) — *one* colour at three opacities. Collapsing these is
  **exact and inference-free**: one entry plus the existing opacity axis.
- **Lightness ramps within one hue.** `xgd`'s neutrals run hue 215–220 at
  lightness 17/34/46/65/84; its brand teal runs hue 192–196 at 33/41/54/95; its
  warm surfaces run hue 49–53 at 87/94/99. `gigabytealchemy` shows the same shape
  across ~6 hue families. These are ramps of one role, not unrelated colours.

**Correction to an earlier assumption in this programme:** reproduction was
expected to yield sprawling palettes of near-duplicate measured colours, making
palette-driven colour a threat to fidelity. The data does not support it. Captured
sites arrive with strong, visible palette structure, so a *good* palette is
derivable — mechanically for alpha variants, and with mild, reviewable inference
for ramps. The palette-blocks-reproduction concern is withdrawn for colour;
literal-always-valid (§5.2) already removes the residual risk.

### 5.4 The standard role vocabulary

A starting set, so the design stage has names to work from. It is a **vocabulary,
not a schema** — a palette may add arbitrary named entries beyond it, and need not
fill every one.

| Group | Roles |
|---|---|
| Surfaces | `bg`, `surface`, `surface-subtle`, `surface-inverse` |
| Text | `text`, `text-muted`, `text-inverse` |
| Line | `border`, `border-strong` |
| Brand | `primary`, `secondary`, `accent` |
| Utility | `scrim`, `shadow` |
| Feedback | `success`, `warning`, `danger`, `info` |

Two notes on shape:

- **A ramp belongs to a role, but it is not stored.** The legacy 15-slot theme set
  (`packages/site-schema/src/schema.ts` `paletteTokensSchema`) baked ramp positions
  into role names — `accentLight` / `accentMid` / `accentDeep`. §5.3 shows ramps are
  real, so a role must carry its ramp rather than the vocabulary carrying three
  sibling names per hue. **REQ-137 settles how**: the ramp is *generated* from the
  entry, not stored beside it — see §5.6.
- **Alpha is not a palette entry.** `l1Color` admits 8-digit hex, but a palette
  entry is an opaque colour and translucency stays a separate axis (§5.3's first
  structure). Otherwise one colour occupies N entries and the entry stops being the
  unit of change.

### 5.5 The legacy theme palette is replaced, not coexisted with

`paletteTokensSchema` is a **closed set of exactly 15 roles**, each resolving to
`var(--color-<role>)`. It predates the pivot and does not reach L1 — which is why
L1 is literal-only today (`l1Color`: *"hex only. No `url()`, no `rgb(var(--…))`,
no keywords"*), and therefore why **every colour in every site is currently an
individually chosen literal**. The palette model generalises that closed set
(arbitrary size, extensible names, a generated ramp per entry — §5.6) and connects
it to L1, rather than introducing a parallel vocabulary.

**It is deleted, not deprecated** (REQ-114 §4). Two colour systems is precisely
the legacy-mode state the project forbids, and the legacy one is barely load-bearing:
the only live `--color-*` consumption on the L1 path is a single `body` rule (two
uses in a rendered page), whose replacement — the L1 document's own `background`
field (§2) — already exists. The dark-mode palette override has no callers at all.
The retirement covers the colour group only: typography, spacing, radius, shadow
and breakpoint tokens are a different axis family and stay.

`l1Color` is a single type alias used in **12 places** in the L1 schema (gradient
stops, shadows, borders, textures, link states, surface fills…). Widening it once
propagates to all 12 — the change is small now and grows with every new colour
axis and every folded site.

### 5.6 An entry is one colour; its family is generated (REQ-137)

§5.4's second note — alpha lives on the *reference*, because an entry carrying it
would make one conceptual colour occupy N entries and the entry would stop being
the unit of change — is a general argument, and **REQ-137 applies it one axis
over.**

Named *steps* were the mistake that note warns about. `primary`, `primary/500`
and `primary/700` were three stored hexes that nothing kept related, so changing
"the brand teal" repainted the references to the base and left the ones on its
steps at the old colour. The entry was not the unit of change after all.

So the light↔dark family is **not stored**. It is generated from the entry, and
the position within it is carried by the reference:

- **Entry**: `{ value: "#rrggbb" }` — exactly one colour, nothing else.
- **Reference**: `{ ref, shade?, alpha? }`. `shade` is a **continuous** signed
  scalar on `[-1, +1]`: negative mixes the entry toward black, positive toward
  white, **in Oklab**. `0` or absent resolves to the entry's own hex, byte-exact.
- `shade` and `alpha` are independent axes on the same reference, which is what
  they are.

**Oklab, because the axis is a slider.** An sRGB lerp bunches the perceived change
at the dark end and HSL's `L` distorts hue-dependently; Oklab is built so equal
numeric steps read as equal steps, which is the property a linear control needs.
Changing the entry now moves the whole family by construction rather than by a
convention someone has to maintain, and the operator never edits a shade directly
— they pick an entry and move a slider.

**A shade can only remove chroma.** Mixing toward black or white drives the Oklab
`a`/`b` coordinates toward zero, so a colour *more saturated* than the entry is
not a shade of it. This is load-bearing rather than a limitation: it is what makes
the axis honest. When the retrofit meets such a colour it files it as **its own
entry**, exact and unapproximated, instead of grouping it under a family it is not
part of. On the two stored sites that split seven colours out — four of
`gigabytealchemy`'s "blues" were never a ramp — and the palettes grew (`xgd` 6→7
entries, `gigabytealchemy` 8→15) while becoming more truthful.

**The cost, measured.** [[REQ-114]] AC3 guaranteed the palette retrofit was
pixel-identical; re-expressing genuine ramp members as shades cannot be, so that
guarantee is superseded by a bounded one: **≤8/255 per channel**, worst observed
Δ5 on `xgd` and Δ8 on `gigabytealchemy`, with no colour added or lost. Everything
outside the bound stays an exact literal in its own entry, so the bound is a
statement about ramp members only.

## 6. Safe / robust / cross-browser by construction

- **Safe** — every field is a typed scalar/enum; strict objects reject freeform
  keys; colours are hex literals **or validated palette references that resolve to
  hex** (§5); escaped text; sanitised font-family; URL-scheme allowlist. The
  renderer is the *only* emitter. See the Security Policy ([[DOC-2]]).
- **Robust** — the envelope validator (`validateL1`) bounds numeric ranges and
  caps tree depth (32) and node count (2000); out-of-range / oversize input is
  rejected before it can reach the browser. A palette reference that names a
  missing entry is a validation failure, not a render-time fallback.
- **Cross-browser** — a feature allowlist + the existing 3-engine capture gate.
  The spike renders equivalently across chromium/webkit/firefox (position/size
  within the calibrated tolerance; authored axes engine-invariant).

## 7. Acceptance — round-trip identity

The gate is `capture(render(L1)) ≈ L1`, measured on the existing capture /
values-diff spine (REQ-82, [[DOC-79]] D6). Authored (Type-A) axes must reproduce
**exactly** at every captured width; emergent geometry (Type-B) is measured, not
pinned. Reproduction of a captured site becomes near-mechanical: capture →
serialize to L1 → render → gate; residual delta = a serializer bug or a missing
L1 axis, i.e. a *framework* fix. The site is disposable; the language hardens.

Palette adoption is gated the same way and more strictly: because a reference
resolves to the entry's hex, **converting literals to references must be
pixel-identical**. Any delta is a bug in the conversion, never an accepted cost.

## 8. Where it lives

- Schema + types + envelope validator: `packages/site-schema/src/l1`.
- Renderer (the emitter): `packages/framework/src/l1/render.ts`.
- Round-trip gate (on the capture/values-diff spine): `tools/generate/src/l1`.
- UATs: `tests/req82-l1-substrate.test.ts`.

## 9. Related

[[DOC-2]] (Security Policy) · [[DOC-7]] (framework principles, being split in
Phase C) · [[DOC-13]] (capture / ValueElement / eyes) · [[DOC-20]] (conformance
ACs — the envelope's per-module form) · [[DOC-28]] (the page editor — the palette's
first interactive consumer) · REQ-79 (pivot umbrella) · REQ-82 (this).