---
uid: request-6c2b1cf4
id: REQ-97
type: request
title: 'L1 text leaves cannot declare a measure: add sizing to l1TextSchema'
created_by: xgd
created_at: '2026-07-26T01:25:20.200206+00:00'
updated_at: '2026-08-06T04:55:03.030167+00:00'
completed_at: '2026-08-06T04:55:03.030167+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a9d8eee2c6426bfe8fd8f13b801e83eb80feef1e
    reconcile_sha: null
    main_sha: null
  version: 0.0.209
  story_points: 2
  bundled_in: bundle-ee56a66e
  chat_comment: comment-431315b0
---

## The gap

`l1TextSchema` was the only leaf that could not size itself. `box`, `image`,
`container` and `control` all carry `sizing: l1AxisSizingSchema`; `text` did
not.

The consequence: **a text leaf could not declare its own measure** — the max
line length that is the single most fundamental control in typography.

Found while authoring the xgd.dev hero ([[request-d41fd017]], REQ-95). The
subhead had to be wrapped in a container (`sub-measure`) whose only purpose was
to cap line length:

```jsonc
{ "kind": "container", "id": "sub-measure",
  "sizing": { "width": { "mode": "fluid", "maxPx": 620 } },
  "children": [ { "kind": "text", … } ] }
```

That cost a wrapper node per constrained paragraph and filled the tree with
nodes that carry no semantic meaning.

## Why the asymmetry existed (and why it was not a decision)

Capture folds text as absolutely-positioned with a geometry track, so the
transcription face never needed `sizing` on text. The authoring face does. An
artefact of which face was exercised first, not a deliberate constraint —
`l1ImageSchema`, an equally leaf-like node, has `sizing`.

## Why it mattered beyond ergonomics

[[request-3a064234]] (REQ-96) makes L1 the sole owner of appearance — modules
ship zero CSS. Under that contract, anything L1 cannot express must be painted
by a module, which is the exact outcome REQ-96 exists to prevent. A missing
sizing axis stops being an authoring annoyance and becomes a hole in the
contract.

## What changed

**1. Schema — `packages/site-schema/src/l1/schema.ts`**

`l1TextSchema` gains `sizing: l1AxisSizingSchema.optional()`, documented as the
run's own measure. Units stay **px** (`maxPx`), consistent with L1 being
px-faithful throughout; no `ch` was introduced. Types propagate automatically
(`types.ts` infers from the Zod schemas).

**2. Renderer — `packages/framework/src/l1/render.ts`**

The `text` case now calls the existing `axisSizingCss(node.sizing)` helper, so a
measured run emits `width` / `min-width` / `max-width` exactly as every other
kind does. A run with no `sizing` emits no sizing declarations — the field is
strictly opt-in.

**3. Analytic gate — `tools/generate/src/l1/probes.ts`**

New `constrainWidth(node, avail)` narrows the extent a node was offered by its
own `sizing.width` (`fixed` px, then `minPx`/`maxPx` clamps), applied in
`layout()` for **every** node kind — mirroring the CSS the renderer emits.

This was not optional. A text leaf's *height* is a function of its width, so a
run declaring a measure wraps to more lines than the frame alone predicts; a
model that ignored the measure would have reported phantom drift against the
browser. Making it generic (rather than text-only) also closes a pre-existing
mirror gap: a wrapper container's `max-width` was previously invisible to the
probe, so the wrapper and direct forms did not evaluate identically.

## Design decisions made during implementation

- **`height` is admitted, not forbidden.** The ticket left this open. Accepting
  the shared `l1AxisSizingSchema` rather than minting a width-only variant is
  simpler and keeps one shape across all five node kinds. `height` on a text run
  is rarely what an author wants (a text leaf's height is natural, from flow) so
  the schema doc-comment says so explicitly instead of the type forbidding it.
- **`constrainWidth` is generic, not text-only.** See above — a text-only clamp
  would have left the wrapper form and the direct form modelling differently,
  which is the opposite of the mirror invariant the probe depends on.
- **No validator change.** `validate.ts` does not bound `sizing` for any node
  kind today; text is consistent with the rest rather than a special case.

## Test plan

`tests/req97-text-measure.test.ts` — 5 UATs, all deterministic (no browser):

- `test_UAT_FC_REQ-97_text_node_accepts_sizing_width` — the schema admits the
  whole axis-sizing shape (`fixed`/`fluid`/`hug`, `px`/`minPx`/`maxPx`), stays
  `.strict()` (bad mode and extra keys rejected), and `validateL1` passes a
  measured document end to end.
- `test_UAT_FC_REQ-97_renderer_emits_width_min_and_max_for_a_measured_run` —
  the emitted base rule carries `width: 100%` / `min-width` / `max-width` for a
  fluid measure and `width: 480px` for a fixed one; a run with no `sizing` gains
  no width declarations at all.
- `test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container` — the xgd.dev
  hero subhead both ways: one fewer `<div>` in the markup, the measure on the
  run itself, and the analytic gate reporting identical leaf width and height
  for the two forms.
- `test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame` —
  at 1440 a 620px measure narrows the box and increases the wrapped height; at
  320 the cap is inert (max-width caps, it does not stretch).
- `test_UAT_FC_REQ-97_folded_reproductions_are_unaffected` — a pinned,
  geometry-tracked run (the shape every capture-folded reproduction on disk
  carries) emits only its keyframe width, and the probe sees that width
  unnarrowed.

Regression scope run green: the L1 family (`req82`, `req83`, `req92`, `req93`,
`req96`, `reconciliation-3probe-gate`, `site-schema`) and then the full suite —
**826 tests, 117 files, all passing**. Clean workspace `tsc` across
`site-schema`, `framework`, `tools/generate`, `public-site`, `control-app`.

## Acceptance — status

- ✅ A `text` node accepts `sizing.width` with `mode`/`px`/`minPx`/`maxPx` and
  the renderer emits the corresponding `width` / `min-width` / `max-width`.
- ✅ The xgd.dev hero subhead sets its own measure with no wrapper container.
  `storage/sites/xgd/draft/pages/home.json` was collapsed accordingly and
  re-rendered (`1c render xgd`): the `sub-measure` container is gone and
  `max-width: 620px` paints from the run. **That site is still untracked in
  git** — it belongs to REQ-95's session, so it was edited in the working tree
  but deliberately not committed under this ticket.
- ✅ Existing folded reproductions (gigabytealchemy, joyful) are unaffected —
  capture never populates the field, pinned by the fifth UAT and by the full
  suite staying green.