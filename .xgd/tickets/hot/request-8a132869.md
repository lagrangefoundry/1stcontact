---
uid: request-8a132869
id: REQ-136
type: request
title: 'Image editor: non-destructive framing and colour adjustment'
created_by: xgd
created_at: '2026-08-12T00:49:07.170993+00:00'
updated_at: '2026-08-12T00:57:57.030863+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Intent

An image *editor* alongside the image *picker* (REQ-132) in the web editor's segment
modal. Once an image is chosen, the operator can crop, rotate, scale and colour-adjust
it — and what they see while adjusting is what the page shows, because it is the same
render.

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
maintain; it is unavoidable. The two things that could break it, and their answers:

1. **Drag-time feedback.** A server round-trip per pointer-move is not 60fps. The
   adjustment→CSS mapping is extracted as a **pure function shared with the renderer**
   and applied by the modal as inline style to the live element while dragging;
   reverted on Cancel, re-rendered from the origin on Save. One emitter, two callers —
   the same discipline as the shared validator. Not a second rendering path.
2. **A copy of the image in the modal.** Rejected. The preview iframe is same-origin
   and the bridge already reaches into that document, so the crop handles are drawn
   **over the real element in the page** and the modal is a control panel. There is
   then no copy that can drift.

## What each tool maps to

| Tool | L1 expression | Status |
|---|---|---|
| Rotate | `transform.rotateDeg` | **exists** |
| Scale (the element) | `transform.scale`, `sizing` | **exists** |
| Crop — pan | `axes.objectFit` + `axes.objectPosition` | fit exists, **position missing** |
| Crop — zoom | source rect (see below) | **missing, needs a decision** |
| Colorize | typed `filter` group | **missing** |

Two ambiguities to settle with the operator: *scale* means either the element's size on
the page or the picture's zoom inside a fixed frame — different axes; and *colorize*
means either adjustment (saturate / brightness / warmth / B&W) or a true tint/duotone,
which needs a compositing layer rather than a filter.

## Two kinds of image on a page

An `image` leaf (`<img>`) and a painted surface's `backgroundImageUrl`. The picker
already serves both (REQ-132), so the editor should too — but the CSS families differ
(`object-*` vs `background-*`), so the axes are named at intent level and the renderer
picks the property family per node kind.

Finding: the existing `overlay` scrim **cannot tint an `<img>`** — it is a background
layer, and background paints behind replaced content. It does tint a background
surface. That asymmetry is why tint is phase 2 and filters are phase 1.

## This closes two capture gaps, not just a UI gap

`tools/generate/src/cli/capture/extract.ts` already reads `objectPosition` (per image)
and `filter` (per painted element). `fold.ts` drops both, because L1 has no axis to put
them in. So these axes shrink the "expressible axes" qualifier on round-trip identity
(DOC-23 §7, DOC-29) — reproduction fidelity, not only editor capability.

## Phasing

**Phase 1 — cross-browser, closes both capture gaps.**
- `axes.objectPosition` on the image leaf (pan-crop).
- A typed `filter` group on the shared surface shape: `grayscale`, `sepia`, `saturate`,
  `brightness`, `contrast`, `hueRotateDeg`, `blurPx`, `invert` — bounded scalars, fixed
  emission order, never a raw string. Distinct from the existing `backdropBlurPx`.
- `objectFit` exposed as a choice; rotate reuses `transform.rotateDeg`.

**Phase 2 — needs decisions.**
- **Zoom / true source-rect crop.** `object-view-box` is the semantically exact
  primitive but is **not Baseline** (unsupported in Firefox), so it fails the 3-engine
  gate. Recommended alternative: L1 keeps a one-node `crop` rect, and the *renderer*
  emits a wrapper `<span>` around the `<img>` with the clip — one L1 node, two DOM
  elements, construction owned entirely by the sole emitter. Precedent: `link` already
  wraps the img in `<a style="display:contents">`. Rejected alternative: an `overflow`
  axis plus an authored wrapper box, which re-opens the "two nodes for one element"
  hole REQ-98/REQ-105 closed.
- **Tint / duotone over an `<img>`** — needs the same wrapper.
- **Background-surface framing** — unpin BUG-13's `cover` / `center` / `no-repeat` so a
  painted surface gets the same crop vocabulary.

## Edit-surface plumbing this needs

- `L1FieldDescriptor.type` is `'string' | 'enum'` and the change map is string-only
  (`applyCopyFields` rejects non-strings). Adjustments are numbers → a numeric field
  type carrying `min` / `max` / `step`.
- `applyCopyFields` writes flat names today; adjustments live at `node.axes.*`, so it
  needs a field-name → axis-path mapping (assignment into the existing `axes` object,
  never a replacement — the invariant the background field already relies on).
- `mountFields` has a number input but no slider. Sliders are ours, mounted beside it —
  the precedent `image-picker.js` set for a control the component cannot express.

## Test plan

UATs at `test_UAT_FC_REQ-136_*`, driving the real edit loop end to end:
- an adjustment posted through the edit endpoint lands as an L1 axis and survives
  validation;
- the re-render emits the expected declarations, and the edit render emits the same
  ones (parity, asserted on rendered output);
- a rejected adjustment (out of range, unknown field) leaves the node byte-identical;
- the shared emitter used by the live preview and the renderer produces identical
  declarations for the same axes.

## Status

Design under discussion — no code yet. Open questions listed above are for the operator.
