---
uid: story-c490f1cf
id: STORY-80
type: story
title: 'Absolute values re-homed in L1: every colour, length, and radius is carried
  as a validated literal, with a palette overlay for colour'
created_by: xgd
created_at: '2026-07-19T03:09:25.918607+00:00'
updated_at: '2026-08-09T05:42:04.692823+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-0385746c
  uat_coverage: pass
---

## Story

**As a** site author reproducing a captured site (or designing one from scratch),
**I want** every concrete value — colour, length, radius — to be carried directly
as a validated absolute literal in the layout substrate, and colour to additionally
accept a reference into a site palette, **so that** I can land a captured site's
exact values precisely while still being able to change one conceptual colour and
have every use of it follow.

## Description

The reproduction mandate is *absolute values are the base; a named scale is an
overlay of constants*. Both halves of that model now live in the **L1 layout
substrate**: the **absolute base** for every value type, and — for colour — the
**overlay**.

Following the framework pivot (REQ-79), the semantic *layout* modules (header,
hero, footer, text-block, services-grid, layer) and their ~20 colour/length/radius
dials were deleted (REQ-84). The absolute-or-overlay capability those dials
delivered is **re-homed in L1 leaf axes**: each L1 leaf (box / text / image)
carries the concrete value directly as a typed literal, and the envelope validator
guarantees it is well-formed and within range.

How each value TYPE is now carried in L1:

- **Colour** — a hex literal (`#rgb` / `#rrggbb` / `#rrggbbaa`) used verbatim, **or**
  a reference to an entry in the site's palette. A non-hex string is still rejected
  (no `rgb()`, no keyword, no `url()`), and a reference resolves to an entry whose
  value is a hex, so the painted result is identical either way.
- **Length / geometry** — a finite numeric px literal, used verbatim, bounded by
  the envelope (font-size 1–400, geometry ±100k, length ±100k / 100k); an
  out-of-range or non-finite value is rejected by the validator.
- **Radius / corner** — a finite numeric px literal, used verbatim, within the
  envelope length bounds.

### The colour overlay (REQ-114 / DOC-23 §5)

Colour takes exactly the shape geometry already has — an absolute base that is
always valid, plus an optional overlay refining it:

| | absolute base | overlay |
|---|---|---|
| geometry | per-viewport keyframes | recovered structure |
| **colour** | **hex literal** | **palette reference** |

- **A hex literal is always valid**, so transcription from a capture stays lossless
  and inference-free, and nothing is gated on a palette existing. The capture→L1
  fold still emits literals only; palette assignment is a separate, re-runnable
  pass over an already-folded site.
- **A palette is declared once per site**, not per page — the whole point is that an
  entry is the unit of colour change, so a per-page palette would make one change N
  edits. It is an arbitrary-size map of free-form kebab-case names to entries, each
  entry an **opaque** hex value plus optional named steps (a ramp belongs to its role,
  rather than being spread across sibling role names).
- **Translucency is an axis of the reference, not a property of the entry.** If an
  entry could carry alpha, one conceptual colour would occupy several entries and the
  entry would stop being the unit of change. So the same colour at three opacities is
  one entry at three alphas.
- **A dangling reference is a validation failure**, never a render-time fallback: the
  document is rejected before it can be rendered, and a consumer that skipped
  validation gets a loud failure rather than a substituted default colour.
- **Resolution happens once, at the load boundary**, not at each of the dozen colour
  sinks. Everything downstream — the renderer, the analytic evaluator, the round-trip
  gate, values-diff — therefore reads exactly the document it would have seen had the
  colours been written as literals, which is what makes converting a site's literals
  to references **pixel-identical by construction**.

## Technical Notes

- **Delivery moved; capability preserved.** The prior module-dial delivery
  (AC-660..665) is superseded by the pivot — an intentional supersession per the
  REQ-79 reconciliation note and the REQ-85 superseded-AC list, **not** a lost-work
  overwrite. The absolute-base capability itself survives, re-homed in L1 leaf
  literals.
- **The "overlay parked in L2" position is superseded, for colour.** REQ-79
  language-triviality principle #2 ("one value = one literal field — no theme-role
  indirection IN L1") kept the substrate literal-only, on the assumption that a
  named-colour indirection threatened reproduction fidelity. DOC-23 §5.3's measured
  evidence withdrew that assumption: because a reference resolves to a hex before
  anything paints, the overlay costs no fidelity. REQ-114 therefore lands the colour
  overlay **in L1**, not above it. Length, geometry and radius remain literal-only —
  no named scale exists for them, and this story's scope for them is unchanged.
- **The overlay is one type alias wide.** A colour axis is a single alias used in a
  dozen places (gradient stops, shadows, borders, textures, link states, surface
  fills…), so widening it once reaches all of them, and a reference reachable
  anywhere in a page — including inside a behavior module's slot content — is checked.
- **Scope boundary.** The retirement of the legacy 15-slot theme colour palette, the
  removal of colour custom properties from rendered output, and the re-homing of
  page-level background/text colour onto the L1 document belong to the L1 substrate /
  emitter story, not here. The colour census and retrofit tooling that makes the model
  adoptable on existing sites is its own capability.
- **Retrofit reach, as built.** Of the four stored sites, the two carrying L1 pages
  (`xgd`, `gigabytealchemy`) were converted to references — 6 entries from 16 distinct
  RGB and 8 from 30 respectively, colour-lossless. The other two carry pre-L1
  module-based pages with no L1 colour axes to convert; they remain valid with no
  palette at all, which is the "palette is optional" guarantee in action.
- **Detailed L1 axis + envelope coverage is owned by the L1 substrate story**
  (item 1); this story owns the value *model* — what forms a value may take and how
  the two colour forms relate.