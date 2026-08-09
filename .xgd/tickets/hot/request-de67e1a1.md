---
uid: request-de67e1a1
id: REQ-128
type: request
title: 'Background image selection: the container segment''s backgroundImageUrl in
  the phase-1 picker'
created_by: xgd
created_at: '2026-08-08T21:22:38.782599+00:00'
updated_at: '2026-08-09T19:49:59.968586+00:00'
completed_at: null
last_field_updated: status
status: in_progress
fields:
  priority: medium
  story_points: 2
  depends_on:
  - request-66e4c630
  auto_merge_back: true
  needs_review: false
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

## Today's behaviour

`backgroundImageUrl` is one axis of the shared surface group (`l1/schema.ts`, REQ-98),
carried by every box-rendering kind. A node painting one stamps as a **container**
segment, not an image one:

```ts
// packages/framework/src/l1/render.ts — segmentKind()
case 'box':
case 'container':
  return surfaceDecls(node.axes ?? {}).length > 0 ? 'container' : null
```

`copyFieldsOf` returns `null` for those kinds, so the segment outlines on hover and the
click lands on `editor.js`'s "Nothing to edit on this container segment yet."

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

## Non-goals — carried forward from REQ-118, still deferred

- **Framing controls** (crop, scale, scrim, rotation, edge effects, free positioning) —
  still blocked on [[DOC-28]] §13 Q5, verified open as of this ticket. The editor must
  write the fields the capture/fold pipeline already folds into L1, not a parallel
  vocabulary. AC-6 pins the surrounding axes through a swap, so the place those
  parameters will live stays protected.
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

## Test plan

`tests/req128-background-image-selection.test.ts`, mirroring REQ-118's two-suite shape:
the definition + CLI half over the bytes `1c render --edit` writes, and an origin half
(`skipIf(!WEBUI_INSTALLED)`) against a real `startBuilder`. One UAT per AC, named
`test_UAT_FC_REQ-128_*`.

Regression scope: `req118-image-selection`, `req117-copy-editing`, `req117-edit-loop`,
`req116-edit-render`, `req11-structured-edit`, `reconciliation-edit-render-channel`,
`chat9-edit-hooks`, plus the full suite.

**Note a known pre-existing failure**, unrelated and inherited:
`tests/reconciliation-edit-render-channel.test.ts:316` expects `<body data-fc-edit>` but
the render emits `<body data-fc-edit data-fc-page="home">`. REQ-118 verified it failing
identically on a clean tree. Not caused here; not fixed here.