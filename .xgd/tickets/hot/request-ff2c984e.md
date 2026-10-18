---
uid: request-ff2c984e
id: REQ-404
type: request
title: 'Site tab Edit mode: click a selected picture to open the photo editor for
  that use; every site image has a Library item'
created_by: EPIC-19
created_at: '2026-10-17T23:11:37.210282+00:00'
updated_at: '2026-10-18T00:41:41.626786+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5a27fef3
---

## What changes

### 1. The photo editor opens from Edit mode on the Site tab

- **First click on a picture in Edit mode selects it.** Today's selection panel opens, unchanged: image chooser, alt text, properties.
- **A click on the picture that is already selected opens the photo editor**, the same `image-editor.js` the Library and the chat use (REQ-220). This is a third caller of the same editor, not a second editor.
- **The editor edits this use of the picture only** (operator decision, 2026-10-17). It writes the placement's own recipe (`Placement.edits`, BUG-213) for the site copy the page points at. The Library original and every other copy are untouched. The Library editor stays the way to change the original everywhere.
- **The editor says which one you are in**, e.g. *"Editing this use of IMAGE-1 — the Library original is unchanged."*
- **It saves the moment a change is applied**, like the Library editor. It does not wait for the selection panel's Save. The page re-renders with the new framing.
- **A placement that has no recipe of its own** starts from the material's current recipe, so opening the editor on an already-cropped photo shows it as it appears on the page.
- **Two uses of one Library item on one page** are independent: cropping one leaves the other as it was.

### 2. Every image on a site has a Library item behind it

Operator rule: an image on a site with no Library item is a bug. The Library is the catalogue of everything the client has; the site's assets are copies of entries in it.

- **Every path that adds an image to a site's assets creates or names its Library item**, and records the placement on it (`placed_as`). Known paths that currently bypass the Library:
  - `write_image` (`toolbox-core.ts`, `editAssetWrite`, REQ-130): an SVG the consultant composes goes straight into `assets/`. It becomes a Library item (origin generated, kind image), then is placed.
  - Pages reproduced from a capture: assets folded in from a reference bundle.
  - The CLI's `add_asset` (Node only, not granted to the consultant).
  The implementer must find every path that writes `assets/`, not just these, and list them in the commit.
- **Existing sites are backfilled.** A one-off pass creates a Library item for each existing site image with no item behind it, records the placement, and reports what it created. Nothing on any page changes.
- **A missing item is a loud fault from then on.** If the editor (or anything else) finds a site image with no Library item, it is reported as an error naming the asset, not silently ignored. The second click on such a picture shows *"This picture isn't in your Library — please tell us"* rather than doing nothing.

## Why free-coded

A builder UI change over an existing editor and an existing per-placement recipe, plus closing the asset-write paths — one coherent change.

## Test plan

UATs (`test_UAT_FC_<ID>_*`):
- Edit mode: first click on an unselected picture opens the selection panel; a click on the selected picture opens the photo editor.
- A crop applied in that editor is written to the placement's own recipe, the page re-renders cropped, and the Library item's recipe and another copy of the same item are unchanged.
- The editor's banner names the item and says the original is unchanged.
- `write_image` produces a Library item with the placement recorded.
- The backfill creates a Library item for an orphan site image and leaves the page byte-identical.
- A site image with no Library item reports an error on the second click rather than doing nothing.

Regression scope: REQ-220, REQ-229, BUG-213, REQ-282, REQ-130 UATs.


## As implemented (2026-10-17)

### The gesture (Site tab, Edit mode)
- **Selection** is a picture segment the client clicked. It is drawn with the hover outline, held (`data-builder-selected`, inline editor chrome — no framework CSS change). The selection lives in `app.js` (`pictureSelection`), so it outlives the frame reload a save triggers. Clicking any non-picture segment clears it.
- **First click** opens the selection panel, unchanged. **A click on the selected picture** reads the segment's `src` through `/api/copy`, then `GET /api/site/picture?site=&name=`, and opens `image-editor.js` with:
  - a `banner`: *"Editing this use of IMAGE-1 — the Library original is unchanged."*
  - no name field (`transport.saveName` absent ⇒ none — the name is the item's);
  - a transport whose `saveRecipe` posts `POST /api/site/picture/recipe {site, name, recipe}`;
  - the stage showing the site file itself (the placement's current render).
  Each applied change saves at once, and `onSaved` reloads the page.
- A picture whose `src` is not one of the site's own files (`/assets/…`) opens the selection panel as before. A drawing (SVG) gets a message saying it is redrawn, not cropped.
- **No Library item** ⇒ the route answers 404 `code: NOT_IN_LIBRARY` naming the asset and logs `console.error` server-side. The builder also logs, naming the asset, and shows *"This picture isn't in your Library — please tell us."*

### The routes
- `GET /api/site/picture` → `sitePicture()`: `{uid, label, title, filename, asset, edits, own, editable}`. `edits` is the placement's own recipe, or the material's where it has none.
- `POST /api/site/picture/recipe` → `revisePlacementRecipe()`: parse, compile against the material ORIGINAL's real pixels, then write through the existing `placementRecipes().write` (BUG-213). That records `placed_as[].edits` and re-renders that file alone via `editAssetReplace`. Refusals use the existing codes: a drawing is 403, a recipe the picture can't take is 409.

### Every site image has a Library item: one door, not per-caller fixes
- `libraryDoor()` (material.ts) wraps the site store in `openSiteStore` (router.ts), outermost of the three layers: lease, then picture cap, then the Library door. After any `write({assets})` it catalogues each image no `placed_as` entry accounts for. It goes through the ordinary `ingest` (described, labelled `IMAGE-n`, indexed), then records the placement.
  - `origin: 'generated'` when the asset is marked `StoredAsset.generated`. `editAssetWrite` (write_image / `1c asset write`) now sets that marker.
  - `origin: 'site'` for every other road onto a site (import/push, pages reproduced from a capture, tab icons).
  - `Provenance` widened to `uploaded | fetched | generated | site`. Classification is the upload branch: owned, republishable, role site.
  - No Library on the deployment (`BlobsNotConfiguredError`, the `1c` dev builder) ⇒ silently nothing. Any other failure is logged loudly naming the asset and not thrown, because the bytes already landed.
- `promoteToSiteAsset` now records a FIRST placement *before* its write and takes it back if the write throws. Without that, the door would see an unaccounted file and catalogue the Library's own placement a second time. `recordPlacement` returns that undo.
- **Backfill**: `POST /api/library/backfill` → `backfillSiteImages()`. For every site the business holds, it catalogues each image no item accounts for and returns `{created: [{slug, asset, uid, label}]}`. It writes nothing to any site. A second run creates nothing. It has to be run once per business.

### Every path that writes `assets/` (audited)
| Path | Covered by |
|---|---|
| `promoteToSiteAsset` (upload onto site, picker Save, `place_on_site`, role → site) | names its own item (unchanged), records first |
| `republishMaterial`, `placementRecipes.write` (recipe edits) | already accounted (replace at recorded name) |
| `editAssetWrite` — consultant `write_image` (Worker) | door, origin generated |
| `/api/import` (`payloadToWrite`) — push / copy-to-cloud, incl. `1c repro` capture folds | door, origin site |
| `editFaviconMake` (REQ-400 tab icons) | door, origin site |
| `editAssetAdd` via `1c asset add` / Node toolbox `add_asset`; `1c asset write` | Node filesystem store has **no Library** — reaches the Worker only via `/api/import`, where the door catalogues it |
| checkout / revision restore (`assetRefs`) | not catalogued — restores files that were on the site, not new pictures |

### Known gaps (not in scope)
- Deleting a Library item (REQ-281) deliberately leaves the site's copy. Such a picture then reads as NOT_IN_LIBRARY, which is the loud fault this ticket asks for.
- A non-Library rewrite of an already-catalogued file (e.g. `write_image` with `replace` on an existing drawing) changes the site bytes, but the item keeps its first bytes.