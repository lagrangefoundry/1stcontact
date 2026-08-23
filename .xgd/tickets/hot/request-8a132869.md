---
uid: request-8a132869
id: REQ-136
type: request
title: 'Image editor: non-destructive framing and colour adjustment'
created_by: xgd
created_at: '2026-08-12T00:49:07.170993+00:00'
updated_at: '2026-08-12T23:10:20.605436+00:00'
completed_at: '2026-08-12T23:07:50.986265+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: a23c4c512e0cf233376dc128bea8b124ca9c5dc4
  version: 0.1.38
  story_points: 5
  merged_at_commit: a23c4c512e0cf233376dc128bea8b124ca9c5dc4
  chat_comment: comment-28658562
result: pass
---

## Intent

An image *editor* alongside the image *picker* (REQ-132) in the web editor's segment
modal. Once an image is chosen, the operator can crop, rotate, scale, reshape and
colour-adjust it — and what they see while adjusting is what the page shows, because
it is the same render.

## Approach — adjust the view, never the bytes

Confirmed and load-bearing: **no operation touches a file.** Every tool writes a typed
L1 axis on the node; the renderer applies it. This is already the mandated model
(DOC-28 §9.2 — "parameters the renderer applies, never a newly baked file"), and the
reasons compound:

- **One asset, many framings.** The asset store stays a store of what was uploaded.
- **Edits are ordinary structured diffs.** Same validator, same change map, same
  one-modal-one-diff, same undo. A baked file would be a second write path with none
  of that.
- **No image-processing pipeline.** Decoding arbitrary uploaded bytes server-side is a
  new attack surface (DOC-2) and a new binary churning through the versioned store
  (DOC-12 §8).
- **The adjustment stays legible.** The AI can read `saturate: 0.4` and reason about
  it; it cannot read pixels. The capability matrix keeps meaning something.

**The cost, named:** bytes on the wire. A 4000px hero cropped to a 300px thumbnail
still ships 4000px. This is a performance concern, not a correctness one, and the fix
is additive — a derived-render cache keyed on `(asset, adjustment)`, no model change.
Deferred deliberately.

## Editor/page parity is structural, not a feature

The editor's preview **is** the edit render channel (DOC-28 §5.1) — same renderer, same
L1 document. So if every adjustment is an L1 axis, parity is not something to build or
maintain; it is unavoidable. AC-8 asserts it anyway rather than assuming it, because the
day someone adds a second emitter for drag feedback is the day it can stop being true.

Two things that could break it, and their answers (both still standing, neither needed
in phase 1 because nothing here is drag-driven yet):

1. **Drag-time feedback.** A server round-trip per pointer-move is not 60fps. The
   adjustment→CSS mapping is extracted as a **pure function shared with the renderer**
   and applied by the modal as inline style to the live element while dragging;
   reverted on Cancel, re-rendered from the origin on Save. One emitter, two callers.
2. **A copy of the image in the modal.** Rejected. The preview iframe is same-origin
   and the bridge already reaches into that document, so crop handles are drawn **over
   the real element in the page** and the modal is a control panel.

---

# Phase 1 — DELIVERED

## What landed in L1

Three axis families, all typed, all closed, all rendered by the sole emitter.

| Axis | Where | Notes |
|---|---|---|
| `image.axes.objectPosition` | image leaf only | `{xPct, yPct}` — the pan half of a crop. **Both components required**: CSS silently defaults an unspecified one to 50%, so a half-written position is a value the document never said. Not hoisted to the shared surface group — `background-position` is a different family and is still pinned by BUG-13. |
| `filter` | **shared** surface group (every painting kind) | `grayscale` / `sepia` / `invert` / `saturate` / `brightness` / `contrast` / `hueRotateDeg` / `blurPx`. CSS-canonical **fractions**, because that is what `getComputedStyle` reports and therefore what the fold can write unconverted. **Emission order is fixed in the renderer** — filter functions compose in sequence, so taking order from an object's key order would let identical axes paint two ways. Distinct from `backdropBlurPx` (what is *behind* the node). |
| `mask.shape` + `slantPct` / `roughness` / `seed` | node level (already existed) | `parallelogram` and `blob` join `circle` / `ellipse` / the feathers. |

Envelope: `L1_ENVELOPE.filterAmount = {min: 0, max: 4}` bounds the three scaling
functions (a `brightness(400)` is not an adjustment, it is a way to delete content the
page still pays to download); `hueRotateDeg` takes the existing rotation bounds; `blurPx`
takes the effect-length bounds. Checked in `checkSurface`, so an **interaction state's**
filter delta is bounded by the same rule as the base — the hole REQ-99 named for shadows.

## The shape question, answered

Asked: circular, rounded corners, parallelogram, random splat. All four now work.

| Shape | How | Was it already possible? |
|---|---|---|
| Circle / ellipse | `mask.shape` | **Yes** — existed, unexposed |
| Rounded corners | `axes.borderRadiusPx` (shared surface) | **Yes** — existed, unexposed |
| Parallelogram | `mask.shape: 'parallelogram'` + `slantPct` (±45) | New |
| Random splat | `mask.shape: 'blob'` + `roughness` (0..1) + `seed` | New |

Both new shapes compile to `clip-path: polygon(…)` built **entirely by the renderer**
from those numbers — the document names an intent and never geometry, so the shape
vocabulary widens without the attack surface widening.

**A blob is deterministic in its seed.** 24 vertices at evenly-spaced angles, radius
perturbed by a seeded hash and smoothed across neighbours (24 independent radii read as
a spiky star, not a blob). Determinism is not polish: a shape that differed between two
renders of one document would break round-trip identity (DOC-23 §7) and make the picture
twitch on every editor save. Vertex count is a renderer constant, on the same rule as
`pointerAccent`'s lobe count — how many points make an outline organic is not a design
decision the document should reach into.

Rounding and masking are independent, so a rounded blob is expressible and neither
control clobbers the other.

## What the image segment now exposes

`src` (picker) · `alt` · then, in the property sheet: **Fill mode** · **Pan across/down
(%)** · **Shape** · **Corner rounding (px)** · **Rotate (°)** · **Scale (%)** ·
**Brightness / Contrast / Saturation / Black & white (%)** · **Hue shift (°)** ·
**Blur (px)**.

Every one is a bounded integer or the axis's own keyword list — no free-form control, so
widening this surface never widens the *attack* surface (DOC-28 §3).

Design rules the write path holds to:

- **Identity removes the axis.** `fill` is the CSS initial `object-fit`, 50/50 the initial
  `object-position`, 1 the identity of every scaling filter, 0 of the rest. Writing any of
  them in would grow the definition on every save, make a no-op produce a diff, and — for
  `objectFit` — put a value in the file the fold deliberately omits, so a folded page and
  an edited page would disagree about what "unset" looks like.
- **No empty bags.** Emptying `filter` / `transform` drops the container; an identity edit
  on a picture with no `axes` at all leaves it with none.
- **Percentages are a projection, fractions are the axis.** REQ-135's `italic`-over-
  `fontStyle` precedent: where a control is a projection the names differ on purpose, and
  `edit.ts` is the single place that knows which is which.
- **The shape list carries what the node already holds**, even a `featherBottom` this
  control does not offer. Same union rule as REQ-118's handle list and REQ-135's weight
  list: a select whose options omit its own value renders with the *first* option
  selected, so without it, opening an AI-feathered picture and saving its alt text would
  silently square it off.
- **Framing is offered on the `image` leaf only.** On a painted surface the same intent
  lands on a different CSS family, and BUG-13's `cover / center / no-repeat` pin is still
  in place. Phase 2.

**No new plumbing was needed.** The ticket anticipated a numeric field type and a slider;
REQ-135's `'integer'` descriptor with `min`/`max` already covers every control here, and
the modal's existing `type !== 'string'` split routes them into the property sheet with
no client change at all.

## Two capture gaps closed, not just a UI gap

`capture/extract.ts` read `objectPosition` (per image) and `filter` (per painted element)
all along; `fold.ts` dropped both because L1 had nowhere to put them — and `filter` was
already a **Type-A axis the values-diff compares**, so every target painting one reported
a delta nothing could close. `foldObjectPosition` and `foldFilter` now carry both:

- The browser's own default (`50% 50%`, `filter: none`, any function at its identity)
  folds to nothing — an axis is worth carrying only when it says something the browser
  would not do anyway.
- A ratio written as a percentage and as a number are the same filter; both land as the
  fraction.
- **The identity differs per function.** `grayscale(0)` and `saturate(1)` are both no-ops;
  `grayscale(1)` and `saturate(0)` are both extremes. One rule for "skip the identity"
  would be wrong for half of them, and the failure would be silent — a fully desaturated
  photograph would fold to no filter at all.
- A form the fold cannot read (`left top`, a px pair) is a residual, never a guess.
- `drop-shadow` is deliberately **not** read: L1 already has a typed shadow, and folding
  it here would give the substrate two ways to say one thing.

## Supersession — "an image segment exposes exactly src + alt"

Five existing suites pinned the image segment's field list as exactly `['src','alt']`.
REQ-136 changes that deliberately (an **intent conflict**, not an implementation one), so
those assertions are re-stated as their actual subject rather than as an exhaustive list —
the same treatment REQ-135 had already applied on the copy side, for the same reason.

| Suite | AC | Restated as |
|---|---|---|
| `reconciliation-copy-edit-image-selection` | AC-1024, AC-981, AC-988 | the pair comes **first, in that order**; values checked with `toMatchObject` |
| `reconciliation-copy-edit-write-path` | AC-981 | same |
| `reconciliation-copy-edit-background-selection` | AC-1045, AC-1049 | the panel's picker is **absent** from an image's fields; empty-versus-not |
| `req118-image-selection` | AC-1028 (×2) | same |
| `reconciliation-copy-edit-form-presentation` | AC-1044 | the claim is *more than one field → none opened*, not a row count |

Order is load-bearing and is asserted: the modal opens into the picker, and that depends
on `src` being first.

## Test plan — `tests/test_UAT_FC_REQ-136_image_framing.test.ts` (9 ACs, all passing)

Driving the real `1c copy get|set` (the same entry point `/api/copy` and the AI use) plus
the real renderer — no new command, no new route, no new value vocabulary. The fixture is
the awkward shapes: an image with **no axes at all**, one carrying a **feathered mask the
control does not offer**, and one whose radius is the `rounded-full` **sentinel** outside
the control's range.

1. an image offers framing, shape and colour beside the picker; every control closed;
   a bare picture reads back what a browser would paint, not blanks
2. a pan writes a typed `objectPosition` pair and renders `object-position`; centre removes it
3. adjustment lands as fractions, renders **one** `filter` in a **fixed order**; identity
   drops the axis and empties the group
4. circle / parallelogram / blob render as `clip-path`; rounding is independent; **a blob
   is deterministic in its seed** and differs between seeds; `rectangle` removes the mask
5. the shape list carries a shape the control does not offer; re-saving it is a no-op
6. a framing edit disturbs no other axis, un-rotating removes `transform`, and an identity
   save invents no empty bag
7. out-of-range is **refused, never clamped**, leaving the draft byte-identical; the bound
   binds a change and not the status quo; **the asset directory is untouched by every edit**
8. **parity** — the edit render paints an adjustment exactly as the page render does
9. the fold now carries a captured pan and colour adjustment (per-function identities included)

Regression: full suite, 1446 passing. The 13 remaining failures (REQ-122 chat host,
REQ-127 session binding, assistant-conversation) are **pre-existing on `xgd-working`** and
unrelated — verified against the branch point.

---

# Phase 2 — still open

- **Zoom / true source-rect crop.** Phase 1 gives pan only. `object-view-box` is the
  semantically exact primitive but is **not Baseline** (unsupported in Firefox), so it
  fails the 3-engine gate. Recommended: L1 keeps a one-node `crop` rect and the *renderer*
  emits a wrapper `<span>` with the clip — one L1 node, two DOM elements, construction
  owned entirely by the sole emitter (precedent: `link` already wraps the img in
  `<a style="display:contents">`). Rejected alternative: an `overflow` axis plus an
  authored wrapper box, which re-opens the "two nodes for one element" hole REQ-98/105 closed.
- **Tint / duotone over an `<img>`** — needs the same wrapper. The existing `overlay` scrim
  **cannot** tint an `<img>` (background paints behind replaced content), though it does
  tint a background surface. That asymmetry is why filters were phase 1 and tint is not.
- **Background-surface framing** — unpin BUG-13's `cover / center / no-repeat` so a painted
  surface gets the same crop vocabulary.
- **Drag-driven crop handles** — the shared-emitter mechanism above, once there is a
  gesture to drive them.
- **Derived-render cache** keyed on `(asset, adjustment)`, for the bytes-on-the-wire cost.
- **`sepia` / `invert`** exist in L1 and in the fold but are not offered in the editor —
  stylisation rather than adjustment, and thirteen rows is already a full control panel.