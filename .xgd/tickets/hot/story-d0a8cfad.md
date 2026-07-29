---
uid: story-d0a8cfad
id: STORY-83
type: story
title: L1 layout substrate rendered safe by construction
created_by: xgd
created_at: '2026-07-22T19:31:28.526898+00:00'
updated_at: '2026-07-29T04:02:26.154389+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-cceaba25
---

## Story
**As a** site owner, **I want** my site's layout defined as validated structured
data that only ever reaches the browser through a single safe emitter, **so
that** my published site is faithful to its intended design, renders equivalently
across every browser, and can never be broken or hijacked by malformed or
malicious content.

## Description
This story documents the **L1 layout substrate** — the one low-level,
CSS-faithful layout representation introduced by the framework pivot (REQ-79) to
replace the former semantic layout modules. A site's layout is a typed element
tree: `box`, `text`, `image`, and `slot` leaves plus `stack | row | grid`
containers. Each leaf carries a subset of the captured style axes (colour,
font family/size/weight, line-height, letter-spacing, alignment, transform,
style; surface fill, radius, opacity; object-fit) as **typed literals or closed
enums** — never a freeform CSS/HTML/JS string. Responsive layout is expressed as
**per-viewport geometry keyframes** with a per-segment `interpolate | snap`
flag; per-axis sizing (`fixed | fluid | hug`), distribution, alignment, and
viewport-range visibility are the structure primitives that capture leaves empty
and an author recovers. The `slot` leaf is the Phase-D seam: it carries a
required name and an optional **`behavior`** field naming the behavior module
intended to mount there.

### Language power — a typed axis for every pixel-mover
The axis vocabulary has grown to cover every captured **pixel-mover** the
substrate previously had no way to express (the DOC-27 rule: an axis earns its
place iff it moves a pixel). Beyond the original scalars, a document may carry:

| Target | Axes |
|---|---|
| **text** | gradient fill (glyphs painted by a text-clipped gradient), decoration line, glyph shadow, small-caps, list marker |
| **box** | surface gradient, background image (scheme-checked), translucent scrim overlay, border, drop shadow, backdrop blur, blend mode |
| **image** | blend mode, border, drop shadow |
| **any node** | transform (rotation + uniform scale), mask (circular / elliptical crop, feathered edge) |

Each non-scalar family is carried as a **typed structured form** — a gradient is
an angle plus hex stops; a shadow is offsets/blur/spread/hex colour/inset; a
border is width/hex colour/line style; a mask is a named shape plus a feather
width; a transform is rotation and scale; a scrim is a hex colour plus opacity.
The renderer re-derives the CSS from those numeric, enum, and hex fields, so a
structured axis is never a passthrough style string, and an identity or no-op
value (unit transform, `normal` blend, `none` decoration/marker) is omitted
rather than emitted. A box's scrim, gradient, and background image composite as
ordered background layers over the solid fill.

### Language form — handles bound to substance
L1 also carries a **document-level resource table** that closes the *form* hole
in the language: a leaf's `fontFamily` axis is only a **handle** (a name), and
without something binding it to the **substance** that determines its glyphs —
a served font asset — a named face paints as a generic serif fallback. The table
binds `family → served src` (with optional weight and style), and the renderer
emits one `@font-face` rule per entry through the same sole safe sink, ahead of
the rules that reference the family. Images need no entry: an image leaf already
carries its own source.

### The safety envelope
The substrate's value is a **safety envelope by construction** — security,
robustness, and cross-browser fidelity, not aesthetic constraint. Two layers
enforce it:
- an **envelope validator** that accepts only documents whose axes are typed and
  in-range, whose objects carry no unknown keys, whose colours are hex, whose
  image sources pass a URL-scheme allowlist, and whose tree respects depth and
  node-count caps; and
- a **single safe renderer** — the only path from an L1 tree to HTML/CSS — that
  re-checks and neutralises every value at emit time (escaped text, re-validated
  hex colours, sanitised font-family, numeric lengths, unsafe image sources
  dropped) and compiles geometry keyframes to media-queried CSS.

Both layers grew with the vocabulary rather than beside it: the envelope bounds
the structured effect lengths and the transform scale, requires hex stops and
border colours, runs a box background image **and every font-face source**
through the same URL allowlist as an image source, bounds a declared font
weight to the CSS range, and — because every structured form is closed — refuses
an unknown key rather than ignoring it. The renderer drops a non-hex colour, an
off-allowlist URL, and an unsanitisable font name instead of emitting them, so
no raw CSS escapes the sink through any of the new families.

A **round-trip identity gate** wired to the existing capture/values-diff spine
measures `capture(render(L1)) ≈ L1` on the authored (literal) axes, and a
cross-browser check confirms equivalent layout across the three engines.

**In scope**: the typed L1 shape (including the grown axis vocabulary and the
document resource table), the envelope validator, the safe renderer (including
geometry keyframe compilation and `@font-face` emission), and the round-trip /
cross-browser fidelity guarantees.

**Out of scope**: mechanically folding a multi-viewport capture into an L1
document — including *populating* the new axes and the resource table from a
capture (REQ-83 / REQ-92, a separate story), behavior-module mounting into
`slot` leaves (REQ-85, a separate story), and the end-to-end 3-probe
reproduction gate (REQ-86, a separate story). In L1, a `slot` renders as an
inert labelled placeholder — a `div` carrying its slot name and, when declared,
its target behavior-module id, with no module code and no behaviour attached.

## Technical Context
- L1 is the substrate on which the platform's structured-only security boundary
  rests (Security Policy §1–2, DOC-2/DOC-7): the validator is the schema+envelope
  layer and the renderer is the sole emitter (defence in depth).
- The absolute-or-overlay value affordance, per-viewport variation, and module
  reproduction treatments formerly delivered by layout-module dials are re-homed
  in L1 leaf axes and geometry keyframes — tracked as supersessions in the
  STORY-80 / STORY-81 / STORY-82 upgrades in this same reconciliation.
- The round-trip gate reuses the capture + values-diff pipeline (CAP-63); this
  story adds the L1 render→capture wiring, not new diff axes.
- The implementation matches the intent closely; no divergence between the
  REQ-82 spec and the code was found. Browser-dependent acceptance (round-trip,
  cross-browser) is proven with a real engine and skips cleanly where engines
  are unavailable, while the validator/emitter behaviours are engine-free.
- **REQ-87 slot-seam rename.** The slot leaf's optional module-id field was
  named `capability` until REQ-87 renamed the runtime module type to *behavior
  module*, freeing "capability" to mean only the XGD capability matrix. The
  field is now `behavior` and the emitted attribute is `data-l1-behavior`. The
  operator decided this explicitly (REQ-87 dialogue: pre-launch, no live site
  data, keeps the L1 schema consistent with the renamed type), and REQ-87
  forbids a back-compat alias. Because the slot object is `.strict()`, the
  consequence is stronger than a deprecation: a document authored with the
  legacy key is now *rejected* by the envelope as an unknown key — recorded in
  AC-686. Nothing about the typed-tree, envelope, round-trip, or cross-browser
  obligations changed; only the field's name.
- AC-723 pins the emitted `data-l1-slot` and `data-l1-behavior` attributes as an
  obligation of the L1 emitter itself, asserted directly by this story's
  reconciliation UATs rather than left to the incidental coverage they had in the
  CAP-72 / generate tests.
- **REQ-91 / REQ-90 — language power and form (this reconciliation).** The two
  extensions were deliberately sequenced *before* the folder rebuild (REQ-88's
  "language first, then rebuild the folder once"): the folder is only worth
  rebuilding against a completed language. Both were **co-designed against real
  captures** rather than invented — the gigabytealchemy gold→orange wordmark
  gradient, its `#00d492` accent bar and panel gradient, a joyful drop shadow, a
  faelan hero scrim, and a joyful Oswald webfont were folded through the new
  axes as the design check and reused verbatim as test fixtures.
- **Where the new capability stops at this story's boundary.** Populating the new
  axes and the resource table *from a capture* is the folder's job and is
  documented on the capture→L1 fold story, not here. At the time REQ-91 landed
  the fold carried only the cleanly-structured text families; the box/image
  effect families and the resource table were folded in by the folder rebuild.
  This story's obligation is that the language accepts, bounds, and safely emits
  them — not that any particular capture produces them.
- **No raw-CSS escape hatch was added.** Every new family is a typed scalar,
  closed enum, hex colour, or closed structured object; the corresponding CSS is
  re-derived at emit time. This is the DOC-7 §6.3 rule in practice: when a design
  could not be expressed, a typed primitive was added to L1 rather than a
  passthrough style string opened.

## Dependencies
None (this is the foundational substrate; plan items 2, 3, 4, 6, 7, 8 depend on it).

## Story Points
3

## Merged from STORY-81 (overlap cluster 2 resolution)
The reconciliation `upgrade` story STORY-81 ("Responsive dials …", CAP-68, now
archived) recorded that the former **per-breakpoint module length dials**
(`{ base, sm?, md?, lg?, xl? }`) and the header `navCollapse` dial were deleted by
the REQ-79 pivot. Their responsive-across-widths intent is re-homed here: per-viewport
variation is carried by this substrate's geometry keyframes (interpolate|snap).
`navCollapse` was removed with no L1 successor. STORY-81's sole AC (AC-717) was a
behavioural duplicate of AC-684 and was reassigned here; the AC-level dedup pass
(per REPORT-795) has since collapsed AC-717 into AC-684 — AC-717 is archived, its
provenance note folded into AC-684, and its duplicate test file
(tests/reconciliation-responsive-keyframes.test.ts) retired. That behaviour remains
covered by tests/reconciliation-l1-substrate.test.ts.