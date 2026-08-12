---
uid: request-5946d045
id: REQ-132
type: request
title: 'Page editor: image picker shows thumbnails with file names'
created_by: xgd
created_at: '2026-08-12T00:37:38.714532+00:00'
updated_at: '2026-08-12T00:42:16.193912+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What changes for the user

Clicking an image segment (or a painted panel's background) today opens a native
`<select>` listing raw handles — `/assets/hero.png`, `/assets/beta.png`. You pick
an image by reading a path.

After this change the same modal shows a **grid of thumbnails**, each with its
**file name underneath**. Clicking a thumbnail selects it; Save commits, exactly
as now. The directory part of the handle is never shown: the handle is an
internal address, and once assets live in a store rather than a filesystem it
stops meaning anything to the user at all.

## Why free-coded

A presentation change to one existing control on one existing surface. No new
transport, no new command, no schema beyond one descriptor hint.

## Design decisions

1. **The value is unchanged.** A tile still commits the full handle
   (`/assets/hero.png`) — the vocabulary L1 nodes hold and the write side
   validates against. Only the *label* is the file name. Stripping the path is a
   display projection and nothing else.

2. **The descriptor gains `format: 'image'`**, set by `copyFieldsOf` on the two
   picker fields (`image.src`, and a surface's `backgroundImageUrl`). This
   mirrors `webui-fields`' own `enum + format: 'color'` → swatch-grid pairing, so
   the descriptor already speaks the shape upstream would need if the control
   ever moves there. An unrecognised `format` is inert in `mountFields`, so
   nothing breaks in the meantime.

3. **The grid is rendered in the builder modal, not by `mountFields`.**
   `@lagrangefoundry/webui-fields` is an installed out-of-repo component whose
   enum control is a `<select>`; a thumbnail grid is not reachable through its
   seams. The modal therefore renders picker fields itself and hands the
   remaining fields (an image's `alt`) to `mountFields` as before. One modal
   still produces one diff: the staged pick and the buffered form values are
   merged into a single change map on Save.

4. **Thumbnails resolve through the existing preview route.** A site-local
   handle renders from `/preview/<slug>/draft/assets/<name>`, which the preview
   server already serves; a complete URL (a folded reproduction's off-site image)
   is used verbatim. No new endpoint, and no bytes are copied anywhere.

5. **An image that will not load still shows and is still selectable.** The tile
   falls back to a named placeholder. This is not cosmetic: the node's current
   handle is always an option (it may be off-disk), and a tile that vanished
   would leave the segment unable to keep the image it has.

6. **Duplicate file names are tolerated, not disambiguated.** The asset listing
   walks sub-directories, so `a/logo.svg` and `logo.svg` both display as
   `logo.svg`. Each tile carries the full handle as its accessible name/tooltip,
   and selection is by value, so the collision is legible without putting the
   path back on screen.

## Test plan

UATs named `test_UAT_FC_REQ-132_*`, driven through the real entry points already
used by the REQ-118/REQ-128 suites (real `1c render --edit` bytes, real builder
origin, real modal in jsdom):

- an image segment's modal renders one tile per offered handle, with a thumbnail
  and the file name — and no path text anywhere in the picker
- the tile for the segment's current handle is marked selected
- clicking a tile then Save writes that handle to the node (value unchanged in
  form), leaving other fields untouched
- an image segment's `alt` still edits and saves in the same modal, one diff
- a painted container's background picker gets the same treatment
- a handle that cannot load still renders a named, selectable tile

Regression scope: the REQ-117/118/121/128 modal and image-selection suites.
