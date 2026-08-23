---
uid: request-5946d045
id: REQ-132
type: request
title: 'Page editor: image picker shows thumbnails with file names'
created_by: xgd
created_at: '2026-08-12T00:37:38.714532+00:00'
updated_at: '2026-08-12T17:23:43.933957+00:00'
completed_at: '2026-08-12T17:21:11.726461+00:00'
last_field_updated: result
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: null
    reconcile_sha: null
    main_sha: 6cb3942fdbc8271b1142858f7546943642f53aa4
  version: 0.1.36
  merged_at_commit: 6cb3942fdbc8271b1142858f7546943642f53aa4
  chat_comment: comment-bff7e360
result: pass
---

## What changed for the user

Clicking an image segment (or a painted panel's background) opened a native
`<select>` listing raw handles — `/assets/hero.png`, `/assets/beta.png`. You
picked an image by reading a path.

It is now a **grid of thumbnails**, each with its **file name underneath**.
Clicking a tile selects it; Save commits, exactly as before. The directory part
of the handle is never shown: it is an internal address, and once assets live in
a store rather than a filesystem it stops meaning anything to the user at all.

## Why free-coded

A presentation change to one existing control on one existing surface. No new
transport, no new command, no new value vocabulary — one optional descriptor
hint.

## As implemented

1. **The value is unchanged.** A tile commits the full handle
   (`/assets/hero.png`) — what L1 nodes hold and what `applyCopyFields`
   validates membership against. Only the *label* is the file name (basename,
   query/fragment stripped). Stripping the path is a display projection.

2. **`L1FieldDescriptor` gains `format?: 'image'`**
   (`packages/site-schema/src/l1/edit.ts`), set by `copyFieldsOf` on `image.src`
   and a surface's `backgroundImageUrl`. A hint, never a constraint: the closed
   list is still `enum`. It mirrors `webui-fields`' own `enum` + `format: 'color'`
   → swatch-grid pairing, so the descriptor already speaks the shape the
   component would need if the control moves upstream; an unrecognised `format`
   is inert there today.

3. **The grid is `apps/control-app/src/builder/image-picker.js`, not
   `mountFields`.** That component is an installed out-of-repo artifact whose
   enum control is a `<select>`, with no seam for a thumbnail grid. The modal
   splits its schema by descriptor: picker fields are drawn here, the rest go to
   `mountFields` unchanged. One modal is still one diff — the staged pick and the
   buffered form values merge into a single change map on Save, and the picker
   joins the dirty check rather than replacing it.

   Options are `<input type="radio">` in one group, so the browser supplies
   arrow-key navigation and the single-selection invariant rather than this
   reimplementing them behind a `listbox` role it would not honour. The grid
   takes focus when the dialog opens (after it is appended — focus does not move
   to a detached element).

4. **Thumbnails resolve through the existing preview route.** `assetUrl(slug,
   handle)` in `api.js` appends a site-local handle to `/preview/<slug>/draft/`,
   reproducing the page's own document-relative resolution (`relativizeUrl`,
   REQ-109) rather than a second convention; a complete URL is used verbatim. No
   new endpoint, no bytes copied.

5. **An unloadable image still shows and is still selectable.** The tile keeps
   its name and a placeholder frame. Not cosmetic: the node's current handle is
   always an option and may name bytes this origin cannot serve (an off-site URL
   a fold could not mirror), and a vanishing tile would leave the segment unable
   to keep the image it has.

6. **Duplicate file names are tolerated, not disambiguated.** The asset listing
   walks sub-directories, so `a/logo.svg` and `logo.svg` both read `logo.svg`.
   Each tile carries the full handle as its tooltip and selection is by value, so
   the collision is resolvable without putting a path on screen for every tile
   that never needed one.

7. **A background modal has no editing box.** A painted surface exposes only its
   background handle, so with the picker drawing it there are no form fields
   left; the text-editing box is not built at all, and the panel's narrowing rule
   now keys on the absence of *either* editing surface so an all-thumbnails
   dialog keeps the full width.

### Files

- `packages/site-schema/src/l1/edit.ts` — `format?: 'image'` on the descriptor,
  set on both picker fields
- `apps/control-app/src/builder/image-picker.js` — new; the grid
- `apps/control-app/src/builder/editor.js` — schema split, merged change map,
  merged dirty check, focus
- `apps/control-app/src/builder/api.js` — `assetUrl`
- `apps/control-app/src/builder/builder.css` — grid, tiles, missing-thumbnail
  state, panel-width rule

## Tests

`tests/req132-image-picker-thumbnails.test.ts` — 12 UATs named
`test_UAT_FC_REQ-132_*`, driven through the real entry points (real
`1c render --edit` bytes, real builder origin, real `defaultModal` in jsdom):
the derivation's hint; one tile per image with fonts/stylesheets excluded;
file-name labels with no path in the picker; the `<select>` gone rather than
offered alongside; the thumbnail URL fetched from the origin and matching the
asset's bytes; the current handle pre-selected; a pick + Save writing only that
handle (axes, id and alt intact); image + alt in one POST; an untouched dialog
sending nothing; the background picker; an unservable handle staying named and
selectable; and the radiogroup/focus behaviour.

Two existing suites asserted the `<select>` this replaces and now assert the
same criteria against the control that carries them:
`reconciliation-copy-edit-gesture-modal` (AC-1050) and
`reconciliation-copy-edit-form-presentation` (AC-1043, AC-1044).

Regression: all 11 editor/image suites pass (85 tests). Full run is green apart
from the assistant suites (REQ-122/127/AC-105x), which fail identically on a
clean tree — they need a live model credential.