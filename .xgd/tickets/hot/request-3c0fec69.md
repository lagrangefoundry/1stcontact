---
uid: request-3c0fec69
id: REQ-140
type: request
title: 'Page editor: colour — text colour and panel background from the palette (REQ-135
  Phase B)'
created_by: xgd
created_at: '2026-08-15T00:34:37.398758+00:00'
updated_at: '2026-08-15T00:56:46.312507+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
  - REQ-135
  story_points: 8
---

# Page editor: colour — text colour and panel background from the palette

**REQ-135 Phase B.** Phase A (typography) landed and reconciled; §9 named the remainder
"Phase B — colour (blocked on REQ-133)". [[REQ-133]] is implemented and on `xgd-working`, so
the block is cleared and this ticket finishes the work.

Builds on [[REQ-114]] (the L1 palette colour model), [[REQ-137]] (entry = one colour,
continuous `shade` on the reference) and [[REQ-133]] (the palette popup, which already
implements pick mode). Design: [[DOC-28]] §8, [[DOC-23]] §5.

## 1. What it adds

Two colour fields on the segment surface, plus the navigation that connects them:

- **Text colour** on a `text` segment → the `color` axis.
- **Background colour** on a painted `box`/`container` segment → the `surfaceFill` axis.
- **The escalation row** — REQ-135 §2 variant B — a read-only swatch of the panel's current
  fill in the text modal, labelled *from the panel behind this text*, with an
  `edit the panel ↗` link.

## 2. REQ-135 §3.1 is superseded, and the work shrinks

That section specified a **ramp grid of named steps** writing `{ref:'slate', step:'900'}`.
[[REQ-137]] deleted named steps in favour of a continuous `shade` on the reference, so both
the control and the value shape it described are gone.

What replaces it is not a new control. [[REQ-133]]'s popup **already implements pick mode**
and already resolves to `{ref, shade}` (`openPalettePopup`, `apps/control-app/src/builder/palette-popup.js`).
Today its only caller is the toolbar's Colors button in manage mode. This ticket supplies
the missing caller. No picker is built here.

## 3. Colour writes a palette reference, never a hex

Unchanged from REQ-135 §3 and load-bearing. From a segment a user cannot invent an
off-system colour; free hex entry is a deliberate, separate act inside the palette editor.
Picking on a folded site converts literal→reference, which is the refinement direction
DOC-23 §5.2 wants.

## 4. Decided: the descriptor carries the colour, and the write side validates it

`L1FieldValue` is `string | number | boolean` and `L1FieldDescriptor.type` has no colour
case (`format` knows only `'image'`). A colour value is a typed object, so something has to
widen.

**Decided: widen the descriptor** — a `'color'` type, `L1FieldValue` extended with `L1Color`,
`L1SegmentFieldOptions.palette`, and `applyCopyFields` enforcing that the value is a
reference into *this site's* palette. The rejected alternative was staging the colour
entirely client-side, outside `mountFields`.

The reason is the one that already settled `imageChoices`: **the write side is the
authority, not the client**. A palette reference needs the same membership check an image
handle gets, or a stale client can post a `ref` the palette does not hold. Encoding
`{ref, shade}` into a magic string was also rejected — `palette.ts` chose a typed object
over a magic string deliberately, and the field layer should not undo that.

Values already travel as JSON (`tools/generate/src/cli/edit.ts` parses a CLI value as JSON
with a raw-string fallback), so a typed object needs no new transport.

## 5. Decided: the client control mirrors the image-picker seam

`mountFields` has an `enum` + `format: 'color'` swatch grid, but its value is a hex string
and ours is a reference. So the colour row is **a field the dialog owns**, exactly as
`image-picker.js` owns `format: 'image'` fields — split by descriptor, not by segment kind,
so the day a third surface exposes a colour it is answered there too.

## 6. Empty palettes are the common case at first

`gigabytealchemy` has 15 entries and `xgd` 7; every folded site holds literals and no
palette. So a picker that opens onto nothing is not an edge case, and it must read as
"no colours yet, add one" rather than as broken. REQ-133's popup already carries that
empty state, and manage-editing lives in the same surface, so the recovery is one gesture.

## 7. Dead site removal

`storage/sites/1stcontact` and `storage/sites/harbor-cafe` are dead examples and are
deleted here (confirmed by the operator).

Two test suites use them as **fixtures for real properties**, so the claims survive and only
the fixture changes — neither assertion is dropped:

- `tests/reconciliation-colour-palette-overlay.test.ts` — "a site with no L1 colour axes
  carries no palette at all and remains valid".
- `tests/reconciliation-colour-census-and-retrofit.test.ts` — the census over a site with no
  colour literals writes nothing.

Both are re-pointed at a synthesised bare site rather than a stored one. That is the better
arrangement independently: a stored site kept alive only so a test can read it is a fixture
wearing a site's clothes, and it made an unrelated deletion look like a test failure.

`tests/generate.test.ts` and `tests/req22-storage.test.ts` name
`storage/sites/1stcontact/site.json` in **gitignore-pattern** assertions — string checks that
never open the file. They are re-pointed at a live slug so they stop naming a path that
cannot exist.

## 8. Acceptance criteria

1. Clicking a text segment offers a text-colour field; choosing a palette entry writes
   `{ref, shade}` into the `color` axis and the re-render paints it.
2. Clicking a painted panel segment offers a background-colour field writing `surfaceFill`
   the same way.
3. A colour value naming an entry the site's palette does not hold is REFUSED by
   `applyCopyFields`, with the field named — a stale client cannot write it.
4. A `shade` outside `[-1, +1]` is refused.
5. The text modal shows the inherited panel fill read-only and can navigate to the panel's
   own modal; a dirty modal saves before it navigates.
6. A site with an empty palette opens the picker in its "no colours yet" state rather than
   an empty or broken control.
7. `storage/sites/1stcontact` and `storage/sites/harbor-cafe` no longer exist, and the full
   suite passes without them.
