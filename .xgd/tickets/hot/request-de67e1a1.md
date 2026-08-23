---
uid: request-de67e1a1
id: REQ-128
type: request
title: 'Background image selection: the container segment''s backgroundImageUrl in
  the phase-1 picker'
created_by: xgd
created_at: '2026-08-08T21:22:38.782599+00:00'
updated_at: '2026-08-10T11:00:54.303488+00:00'
completed_at: '2026-08-10T11:00:54.303488+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 2
  depends_on:
  - request-66e4c630
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 2e3f0b7c22eeea7d64b6a6dfc66fc9b5870ca5b8
    reconcile_sha: null
    main_sha: null
  version: 0.1.31
  bundled_in: bundle-e59210c5
  chat_comment: comment-2e8da8c2
---

## What this builds

**Background image selection** — click a painted container, pick which image sits behind
it. The same "which image goes here" question [[REQ-118]] answered for `image` nodes,
asked of the `backgroundImageUrl` axis.

Follows [[REQ-118]] (T4 of [[DOC-28]] §12). Reuses that ticket's derivation, its enum
control, its asset listing, its `1c copy get|set` / `/api/copy` surface. No new command,
no new route, no editor change.

## Why this is a separate ticket, not REQ-118 finishing

REQ-118 delivered its scope in full: 7 ACs, 11 UATs, `free_and_reconciled`. Background
images were never in it. [[DOC-28]] §6.2's segment table puts the container segment's
"background colour/image" in **phase 2**, and §12 records that "phase 1 is functionally
complete at T4" — REQ-118 closed phase 1 as specified. Its own test suite even took the
painted container as its example of *a segment with nothing to edit yet*.

So this is not a gap in REQ-118. It is a **re-phasing**: phase 2's gate turns out to be
about *colour*, not images.

- Background **colour** needs the site palette ([[REQ-114]]) and a colour-valued control
  (`xgd-framework` [[REQ-55]]), neither of which exists. Genuinely phase 2.
- Background **image** needs neither. It is a handle from a closed list of site assets —
  the exact control REQ-118 built, over the exact listing REQ-118 built.
- [[DOC-28]] §13 **Q5** (still open, and the blocker on framing) asks about image
  *params* — crops and scrims — against the capture/fold vocabulary. A background image
  *handle* is not a param, so Q5 does not gate this.

## Today's behaviour (before this change)

`backgroundImageUrl` is one axis of the shared surface group (`l1/schema.ts`, REQ-98),
carried by every box-rendering kind. A node painting one stamps as a **container**
segment, not an image one:

```ts
// packages/framework/src/l1/render.ts — segmentKind()
case 'box':
case 'container':
  return surfaceDecls(node.axes ?? {}).length > 0 ? 'container' : null
```

`copyFieldsOf` returned `null` for those kinds, so the segment outlined on hover and the
click landed on `editor.js`'s "Nothing to edit on this container segment yet."

## Acceptance criteria

- **AC-1** — Clicking a container segment whose node carries `backgroundImageUrl` opens a
  picker of the site's image assets, exactly as an image segment does.
- **AC-2** — Choosing an asset updates `node.axes.backgroundImageUrl` and the re-rendered
  page's `background-image`.
- **AC-3** — The edit travels the same `copy get`/`copy set` surface and the same
  whole-definition validator as REQ-118's image edit and the AI's `config set`. No second
  write path.
- **AC-4** — The node's **current** handle is always among the options, for REQ-118's
  reason: a folded reproduction can hold a handle the mirror never got, and a `<select>`
  whose options omit its own value renders with the first option selected.
- **AC-5** — A handle outside the offered options is refused at the field, whole-or-
  nothing, by `applyCopyFields` — not merely by the client widget.
- **AC-6** — Choosing a background bakes nothing: every other axis on the node, and every
  byte in `draft/assets/`, is unchanged across the edit.
- **AC-7** — A container segment carrying paint but **no** `backgroundImageUrl` still
  reports nothing to edit. Adding a background where there was none is out (see below).

## Design decisions

**Selection only — no "none" option.** If a box's only paint *is* its background image,
offering removal means `surfaceDecls` drops to zero on the next render, the node stops
being a segment, and it vanishes from the editor with no way to re-add it. A `required`
enum with no empty option makes that unreachable by construction rather than by a special
case. Removal stays the AI's job, which already addresses the axis directly.

**Change, never add.** An unpainted container is not a segment at all, so it has no
address to click — the picker can only ever *change* a background on a box that already
paints something. That is derived segmentation's known edge ([[DOC-28]] §6.4) seen from
the other side; widening what counts as a container segment is a bigger question than
this ticket and is deliberately not opened here.

**The container segment gains a field; the copy and image segments do not.** Since REQ-98
a `text` or `image` node can carry `backgroundImageUrl` too. Exposing it there would make
the copy modal a paint surface and blur DOC-28 §6.2's kind→segment map. The axis is
offered on the segment the user actually clicks to mean "this panel".

## Implementation as it stands

Three source files. The whole change is in the **derivation**; the claim that this is not
a second mechanism is structural, not asserted.

**`packages/site-schema/src/l1/edit.ts`** — the derivation and the write.

- `backgroundHandleOf(node)` — the handle a painted surface carries, or `undefined`.
  Gates on `kind` being `box`/`container` and on the value being a **non-empty** string.
  The empty string is deliberately not a background: the renderer's `cssUrl` emits nothing
  for it, so offering a picker there would be offering to *add* one (AC-7's rule seen from
  the value side rather than the segment side).
- `copyFieldsOf` gains a branch returning **one** field — `backgroundImageUrl`, label
  `Background image`, `type: 'enum'`, `required: true`, options from the shared
  `imageChoices(assets, current)` REQ-118 already uses. `imageChoices` is what delivers
  AC-4: it unions the site's handles with the node's own, so an off-disk handle is always
  in its own picker. Nothing else of the surface group is exposed.
- `applyCopyFields` gains a matching branch that assigns into the **existing** `axes`
  object rather than replacing it — which is what makes AC-6 true of the whole node, not
  just of the asset store. AC-5 needs no new code: the pre-existing enum-membership check
  refuses any handle the derivation did not offer, including the empty string, a
  `.woff2`, and `javascript:`.

**`tools/generate/src/cli/edit.ts`** — `segmentOptions` now supplies the asset listing for
`PICKER_KINDS = {image, box, container}` instead of `image` alone. One listing serves both
pickers, so what a segment can sit *in front of* and what it can sit *behind* cannot
disagree about what the site has. Text runs still skip the directory read.

**`tools/generate/src/cli/ai/l1-surface.json`** — the L1 control-surface declaration
([[DOC-30]]) is documentation of this same write path, so three strings are corrected to
stay true: `set_copy`'s `values` description, the `WriteCopy` group description, and the
"changing how something looks" absence, which now carves out the background handle and
states plainly that *adding* a background is still not possible.

**No client change.** `editor.js` already branches on `loaded.fields.length`, so a
container that now returns a field opens the fields modal instead of the "nothing to edit"
message, with no edit there. `previewOf` correctly returns `null` for a non-copy segment —
a background handle is metadata about the page, not words on it.

**No renderer change.** `segmentKind` already stamps `container` for any box that would
emit a surface declaration, and `backgroundImageUrl` is one of those. The address the
picker writes to is the address the render already hands out.

## Test plan and results

`tests/req128-background-image-selection.test.ts`, mirroring REQ-118's two-suite shape:
the definition + CLI half over the bytes `1c render --edit` writes, and an origin half
against a real `startBuilder`. **10 UATs**, all named `test_UAT_FC_REQ-128_*`, all passing.

Coverage is one-per-AC plus the origin re-checks:

| UAT | AC |
|---|---|
| `clicking_a_painted_container_offers_a_picker_of_the_sites_images` | AC-1 |
| `choosing_an_asset_updates_the_axis_and_the_rerendered_background` | AC-2 |
| `background_edits_run_the_same_whole_definition_validator_as_the_ai_surface` | AC-3 |
| `an_offdisk_handle_is_still_among_its_own_options` | AC-4 |
| `a_handle_the_site_does_not_have_is_refused_and_nothing_is_applied` | AC-5 |
| `choosing_a_background_bakes_nothing_and_moves_one_structured_field` | AC-6 |
| `a_painted_container_without_a_background_still_exposes_nothing` | AC-7 |
| `the_modal_reads_its_background_picker_from_the_same_copy_transport` | AC-1/AC-3 at the origin |
| `saving_a_background_choice_rerenders_both_channels` | AC-2/AC-3 at the origin |
| `a_rejected_background_comes_back_as_a_field_scoped_400` | AC-5 at the origin |

**Discrimination checked**, not assumed: with the two source changes stashed, 9 of the 10
fail. The one that still passes is AC-7 — correctly, since it asserts the behaviour that
did **not** change.

The origin suite is deliberately **ungated** on `WEBUI_INSTALLED`, for REQ-118's reason:
every test in it is a plain fetch and `startBuilder` binds a port without touching a
component.

**Regression scope run**: `req118-image-selection`, `req117-copy-editing`,
`req117-edit-loop`, `req117-modal-dismiss`, `req116-edit-render`,
`reconciliation-copy-edit-{write-path,image-selection,gesture,gesture-modal}`,
`chat9-edit-hooks`, `test_UAT_FC_REQ-126_l1_surface`, `test_UAT_FC_REQ-122_tool_surface`.
Then the **full suite**: `192 files, 1364 tests — 14 failed, 1283 passed, 67 skipped`.

**All 14 failures are pre-existing and unrelated**, verified by re-running the four
failing files with this ticket's source changes stashed and getting an identical
baseline (3 + 1 + 2 + 8):

- `reconciliation-copy-edit-gesture.test.ts` — 3, browser timeouts on
  `.builder-modal .fields-value`
- `req115-builder-composition.test.ts` — 1
- `req117-edit-loop-browser.test.ts` — 2
- `test_UAT_FC_REQ-122_chat_host.test.ts` — 8

**Correction to this ticket's earlier note**: the predicted pre-existing failure at
`reconciliation-edit-render-channel.test.ts:316` (`<body data-fc-edit>` vs
`<body data-fc-edit data-fc-page="home">`) is **not** failing on this tree — that file
passes. The four files above are the actual baseline.

`pnpm -r typecheck` clean across all three packages.

## Non-goals — carried forward from REQ-118, still deferred

- **Framing controls** (crop, scale, scrim, rotation, edge effects, free positioning) —
  still blocked on [[DOC-28]] §13 Q5, verified open as of this ticket. The editor must
  write the fields the capture/fold pipeline already folds into L1, not a parallel
  vocabulary. AC-6 pins the surrounding axes through a swap — the fixture's node carries
  a fill, radius, opacity and an `overlay` precisely so "nothing else moved" is measurable
  — so the place those parameters will live stays protected.
- **Asset upload** — the picker lists what exists.
- **Background colour** — genuinely phase 2, gated on [[REQ-114]] + `xgd-framework`
  [[REQ-55]].
- **`pattern`, `overlay`, `surfaceGradient`** and the rest of the surface group — same
  phase-2 reasoning as colour; this ticket adds one axis, not a paint panel.

## Known limitation — inherited, and more acute here

`webui-fields`' enum control renders each option as its value verbatim, so the picker
shows `/assets/hero.png` rather than a name or a thumbnail. Per [[DOC-8]] §9.4 a component
gap is closed upstream, never wrapped here. It bites harder for backgrounds than for
inline images — a background is exactly the case where the user is choosing by *look* and
the filename tells them least — which strengthens the existing upstream ask alongside
REQ-55 rather than changing what this ticket does.