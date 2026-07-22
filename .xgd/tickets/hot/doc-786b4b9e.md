---
uid: doc-786b4b9e
id: DOC-23
type: doc
title: L1 Layout Substrate — the typed element tree
created_by: xgd
created_at: '2026-07-20T20:51:27.239081+00:00'
updated_at: '2026-07-20T20:51:27.239081+00:00'
completed_at: null
last_field_updated: created_at
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
axes ([[DOC-13]] / values-diff). One value = one literal field; no shared styles,
dials, or theme-role indirection in the substrate (those are authoring
conveniences above L1). Serialization from a capture is therefore *transcription*.

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

## 5. Safe / robust / cross-browser by construction

- **Safe** — every field is a typed scalar/enum; strict objects reject freeform
  keys; hex-only colours; escaped text; sanitised font-family; URL-scheme
  allowlist. The renderer is the *only* emitter. See the Security Policy ([[DOC-2]]).
- **Robust** — the envelope validator (`validateL1`) bounds numeric ranges and
  caps tree depth (32) and node count (2000); out-of-range / oversize input is
  rejected before it can reach the browser.
- **Cross-browser** — a feature allowlist + the existing 3-engine capture gate.
  The spike renders equivalently across chromium/webkit/firefox (position/size
  within the calibrated tolerance; authored axes engine-invariant).

## 6. Acceptance — round-trip identity

The gate is `capture(render(L1)) ≈ L1`, measured on the existing capture /
values-diff spine (REQ-82, [[DOC-79]] D6). Authored (Type-A) axes must reproduce
**exactly** at every captured width; emergent geometry (Type-B) is measured, not
pinned. Reproduction of a captured site becomes near-mechanical: capture →
serialize to L1 → render → gate; residual delta = a serializer bug or a missing
L1 axis, i.e. a *framework* fix. The site is disposable; the language hardens.

## 7. Where it lives

- Schema + types + envelope validator: `packages/site-schema/src/l1`.
- Renderer (the emitter): `packages/framework/src/l1/render.ts`.
- Round-trip gate (on the capture/values-diff spine): `tools/generate/src/l1`.
- UATs: `tests/req82-l1-substrate.test.ts`.

## 8. Related

[[DOC-2]] (Security Policy) · [[DOC-7]] (framework principles, being split in
Phase C) · [[DOC-13]] (capture / ValueElement / eyes) · [[DOC-20]] (conformance
ACs — the envelope's per-module form) · REQ-79 (pivot umbrella) · REQ-82 (this).
