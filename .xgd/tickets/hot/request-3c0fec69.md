---
uid: request-3c0fec69
id: REQ-140
type: request
title: 'Page editor: colour — text colour and panel background from the palette (REQ-135
  Phase B)'
created_by: xgd
created_at: '2026-08-15T00:34:37.398758+00:00'
updated_at: '2026-08-20T12:50:19.553707+00:00'
completed_at: '2026-08-20T12:50:19.553707+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  depends_on:
  - REQ-133
  - REQ-135
  story_points: 8
  commits:
  - working_sha: 61f337fe5484521b99156c5e45a5fa8fe128fad9
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - b2699987b3d4281051bb078d209d3a8099cd7054
  - working_sha: 45cccf0cd08603a8a490af33152ae01949ec71e5
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - e70668dd1ce02f09ab7f914cbaa5ac672454535a
  version: 0.1.46
  bundled_in: bundle-77b28def
  chat_comment: comment-cd188be0
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
7. `1stcontact` and `harbor-cafe` are gone from the store — neither has a site definition
   or any revisions — and the full suite passes without them. Stated against the definition
   rather than the directory: git tracks files, so a site directory outlives its own
   deletion whenever something untracked is inside it (`.DS_Store`, on any checkout Finder
   has visited), and a directory holding only that is not a site. See §9.

## 9. A directory entry is not a site

Found by running the suite after the merge: the deletion in §7 left
`storage/sites/1stcontact/` standing, because a `.DS_Store` was inside it and git tracks
files rather than directories. Two criteria read that leftover as a site, in opposite
directions:

- AC-7 asserted the **directory** was absent, so it failed on a machine holding the
  leftover while nothing had in fact come back — and would have passed on one without it.
  It now asks for the site definition and the revisions.
- REQ-137's store walk (`test_UAT_FC_REQ-137_no_stored_site_carries_a_step`) had already
  anticipated `.DS_Store` as a *file* and filtered it from the site list, but then treated
  the directory containing one as a site and read a `site.json` that was never there. A
  stored site is now selected as a directory that holds a definition.

Neither claim is weakened: one still proves the sites are gone, the other still walks every
site on disk. Both were the same mistake — taking a directory entry for a site — which is
why the fix is the same predicate in both places.

## 10. Verification

Full suite, foreground, on the merged `xgd-working`: **zero regressions**. The failing set
is a strict subset of `main`'s pre-existing baseline (74 vs 75 failing tests), with one
`main` failure — `reconciliation-l1-navigation` AC-845 — now passing. The pre-existing
failures are unrelated to this ticket (the REQ-122/126/127/129/130 tool-surface suites) and
fail identically on `main`.