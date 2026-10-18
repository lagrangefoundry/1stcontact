---
uid: request-ff2c984e
id: REQ-404
type: request
title: 'Site tab Edit mode: click a selected picture to open the photo editor for
  that use; every site image has a Library item'
created_by: EPIC-19
created_at: '2026-10-17T23:11:37.210282+00:00'
updated_at: '2026-10-17T23:11:37.210282+00:00'
completed_at: null
last_field_updated: created_at
status: draft
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