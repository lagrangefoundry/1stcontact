---
uid: request-78c04ff9
id: REQ-650
type: request
title: 'Image viewer and product page: a reusable full-screen viewer with zoom, and
  a product-page photo standard'
created_by: EPIC-19
created_at: '2026-11-04T23:52:30.349844+00:00'
updated_at: '2026-11-05T01:24:30.505022+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fe10dd96
  commits:
  - working_sha: d96eee5e00a6b7f0e7c57975096ad77a276c8768
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6bb1af13099de1465f66d865d0929743e8dab5a3
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.775
  story_points: 18
---

## Why

Product pages (the `catalog` module's `product` mode, REQ-633) receive every photo of the item, but nothing gives them a layout or a common size. As with the listing grid before REQ-648, the consultant's product pages come out with mixed-size, unresized photos in no particular arrangement. There is also no way to look at a photo properly. The `carousel` module is an inline scroll-snap row of at most 20 static slides; it can't open full-screen or draw its slides from an item's photos.

Follows REQ-648 (listing-grid standard, built), which this mirrors for the product page.

## 1. A reusable image viewer (new behaviour, not shop-only)

A general behaviour any group of images on any site can use (product photos, an artist's gallery, a portfolio, before/after shots), not tied to the catalog. Like `carousel`, it owns only behaviour, in vetted client code (`capabilities.js`). Its look (backdrop colour, control styling) comes from L1 and the site's design, with no visual dials (DOC-25 §2, REQ-96). It is added by marking an image group as viewable in the site definition, as structured data only.

**Opening:** tapping or clicking any image in the group opens the viewer on that image.

**Two views of the photo:**
1. **Whole photo (the view it opens in):** the entire photo, uncropped and fitted to the screen, on a dark backdrop.
2. **Full width with zoom:** clicking or tapping the photo switches to it filling the screen's width. The visitor can then **zoom** further (pinch, scroll wheel or trackpad, double-tap, and on-screen + / − buttons) and **pan** (drag, or swipe when zoomed). Clicking again, or a reset control, returns to the whole photo.

**Paging:** previous/next arrows, swipe (when not zoomed), and the ← → keys move through the group, with a position indicator ("3 of 7"). Paging resets zoom.

**Closing:** Esc, a close button, or a tap on the backdrop (not on the photo). Focus returns to the image that opened it.

**Loading:** the grid shows renditions sized to their boxes. The viewer fetches a large rendition only when it opens, and the next and previous photos once it's open. Zoom uses the largest rendition available, not the multi-megabyte original.

**Accessibility:** a modal dialog (`<dialog>` or equivalent) with a focus trap, labelled controls, the photo's alt text, the position announced, and respect for reduced motion (no sliding animations).

**No script:** each image is an ordinary link to its large rendition, so nothing is lost.

## 2. Product-page photo standard

**Layout:**
- **The default (the starter product page):** photos on the left (about 60% of the content width) and details on the right (title, price or Sold, Buy/Enquire, description), with the details staying in view while the photos scroll on desktop. On phone the photos come first, then the details.
- **Other arrangements must remain possible** through ordinary L1, with nothing in the module preventing them. Examples: the photo grid full width above the details, or an inline carousel of the photos. The module adds no layout dial; the starter is just the default.

**Photos:** a grid of 2 columns with the first photo spanning full width, every thumbnail in the same frame (4:5, cropped to fill, matching REQ-648's cards). The group is viewable (§1), so a tap opens the viewer on that photo, where it is shown whole.

**The host check** from REQ-648 extends to product pages: equal photo boxes within the grid, no thumbnail wider than the photo column, and files sized to their boxes.

**Guidance:** a few lines in the consultant's and builder's notes. The starter is the standard; arrangement may vary per site; photo boxes stay uniform; the photo group stays viewable.

## Not in scope

- Video in the viewer.
- Variant pickers (size/colour) or any change to Buy/Enquire.

## Test plan

`test_UAT_FC_<ID>_*` (render output, plus Chromium for the viewer):
- **Open:** clicking the third photo of a 7-photo group opens a modal dialog showing that photo whole, with "3 of 7", and focus inside the dialog.
- **Full width and zoom:** clicking the photo switches to full width. Zooming in (wheel or + button) enlarges it and dragging pans it. Clicking or reset returns to the whole photo.
- **Paging:** the arrows, ← → and swipe move to the neighbouring photo and update the count. Paging while zoomed resets the zoom.
- **Close:** Esc, the close button and a backdrop click each close it, and focus returns to the photo that opened it.
- **Loading:** no large rendition is requested before the viewer opens. On opening, the current photo's large rendition and its neighbours' are requested, and never the original upload.
- **No script:** each photo renders as a link to its large rendition.
- **Reuse:** a non-catalog image group (a plain gallery section) marked viewable gets the same viewer.
- **Product page starter:** at desktop the photos sit left at ~60% with the details right and sticky. At phone the photos come first. Every thumbnail box is equal and 4:5, with the first spanning both columns. The extended host check passes, and fails when one photo renders at natural size.
- **Arrangement stays open:** a product page whose L1 puts the photo grid above the details renders and passes the check.


## Open questions (session, 2026-11-04) — awaiting operator

**Finding:** the L1 `zoom` role (REQ-327) with `zoom.group` sets (REQ-330) is already an image viewer: modal dialog, dark backdrop, prev/next + ← →, Esc/backdrop close, focus trap and return, one vetted renderer script (`L1_ZOOM_SCRIPT`). `bindL1` copies `zoom` onto every bound `photos` picture. Proposal: §1 is built by **upgrading `zoom` in place** ("marked viewable" = `zoom: { group }`), not a new module or a second viewer.

1. **Supersession of REQ-327/330 behaviour?** (a) a click on the photo toggles whole ↔ full width instead of closing; (b) the wheel zooms instead of closing; (c) the no-script render is a link to the large rendition instead of in-flow panels; (d) the large photo is the largest ladder rendition, not the original (the original only where no ladder exists: draft/preview). (d) reverses REQ-327's deliberate choice for every existing zoom.
2. **The ladder tops out at 1,920 px.** Accept as the zoom ceiling (recommended), or add a larger rung for viewer photos only?

**Assumptions (proceeding unless told otherwise):** a typed per-width grid-child `span` L1 primitive for the full-width first photo, with schema, render re-check and capture round-trip; the ~60/40 split is ordinary L1 sizing; the zoom script also ships when a zoom lives only in a module fragment (today it does not); optional wording fields for the count, close, zoom ± and reset beside `prevLabel`/`nextLabel`; the host check's file-size rule is REQ-648's 2× rule, judged only where a `srcset` exists.


## Answers to the open questions (operator, via EPIC-19, 2026-11-05)

**Approach agreed:** build §1 by upgrading the existing L1 `zoom` role (REQ-327, `zoom.group` from REQ-330) in place. That keeps one viewer for every site, with no new module and no second viewer in `capabilities.js`.

**Q1: yes, this ticket deliberately replaces these parts of REQ-327/330's behaviour,** for every existing `zoom` on every site:
- **(a)** Clicking the photo switches between the whole photo and full width. Closing is by the close button, Esc or a backdrop click.
- **(b)** The scroll wheel zooms instead of closing.
- **(c)** With no script, each image is a link to its large rendition, and the viewer's own markup is hidden.
- **(d)** The viewer stops showing the original upload. Originals can be tens of MB and not web-safe (HEIC). It shows the largest rendition whenever a publish built the size ladder; draft and preview, which have no ladder, still show the original. REQ-327's reason for the original (readable fine detail) is met by Q2's zoom rendition instead.

**Q2: add one larger rendition for zoom (option b).**
- A **~3,000 px wide** rendition, built **only for images that carry `zoom`**, and **requested only when the visitor zooms in** (the full-width/zoom view).
- Opening the viewer and the whole-photo view use the existing largest rendition (1,920 px).
- Never the original.
- If this takes the ticket over the 20-point limit (the estimate was 18), split the zoom rendition into its own follow-up ticket and ship the rest with 1,920 px as the zoom ceiling. Don't let it block the viewer and product page.

**The session's stated assumptions are all agreed:**
- a typed per-width `span` on grid children (strict schema, re-checked at render, capture round-trip, as REQ-648 did) for the full-width first photo, with the ~60/40 split as ordinary L1 sizing and no module dial;
- fixing the missing viewer script for a `zoom` that sits only inside a module's slot;
- optional wording fields for the count, close, zoom in, zoom out and reset, beside `prevLabel`/`nextLabel`;
- the host check's file-size rule using REQ-648's 2× rule, judging only photos that have a `srcset`.

**Test plan additions:**
- **Superseded behaviour:** clicking the photo toggles full width rather than closing; the wheel zooms rather than closing; no-script renders links. Update or replace REQ-327/330's tests that pinned the old behaviour, saying so in the commit.
- **Zoom rendition:** opening the viewer requests no ~3,000 px file. Zooming in requests it once. No request ever goes to the original upload on a published site.


## Split (session, 2026-11-05)

The ~3,000 px zoom rendition (Q2b) would take this ticket past 20 points, so per the operator's instruction it is split to **REQ-652** (`request-6dd070ae`). This ticket ships with the largest ladder rendition (1,920 px) as the zoom ceiling.

## What was built (implementation as it stands)

**The viewer is the L1 `zoom` role (REQ-327/330), upgraded in place** (`packages/framework/src/l1/render.ts`). An image group is marked viewable with `zoom: { group }` on its images. There is still one viewer, in the renderer's one vetted script (`L1_ZOOM_SCRIPT`), and no module.
- **Trigger:** each placed photo is wrapped in an ordinary link (`<a href>`) to its large rendition. With script, a click opens the viewer instead of following the link.
- **Focus:** the placed photo itself is the tab stop (`tabindex="0"`), because Chromium cannot focus a `display: contents` element (this was also true of REQ-327's button). The link carries `tabindex="-1"`. Enter or Space on a focused photo opens the viewer. The modal script (`L1_DIALOG_SCRIPT`) returns focus to the first focusable element inside an opener that cannot take focus itself, so closing returns focus to the photo.
- **Two views:**
  - It opens on the whole photo, fitted to the screen on the dark backdrop.
  - A click on the photo switches to it filling the screen's width.
  - The wheel or trackpad, a pinch, a double tap, the + / − buttons and the + − 0 keys zoom around a point, up to 8×.
  - A drag pans the photo, held so it always covers the screen it is wider than.
  - A click on an enlarged photo, or the reset button, returns to the whole photo.
  - A click within 400 ms of a drag or pinch ending is treated as the drag's release, not a click.
- **Paging:** the arrows, ← → and a horizontal swipe on a photo that isn't enlarged page through the set, wrapping at the ends. Every page turn returns to the whole photo. The position line ("3 of 7") is rewritten on every turn and announced (`aria-live`).
- **Closing:** the close button (first in the dialog, so it takes focus on opening), Esc, or a click anywhere that is not the photo or a control (the backdrop). Focus returns to the photo that opened it.
- **Loading:** the large pictures carry no `src` (`data-l1-zoom-src`) until the viewer shows one. On opening, the photo shown and its two neighbours are loaded. The large picture is the **largest rendition the ladder built** (the entry before the original). Where no ladder exists (draft and preview, or a picture smaller than the smallest rung) it is the picture's own file.
- **With no script:** the viewer's markup is hidden (`.l1-dlg[data-l1-zoom] { display: none }`), and each photo is a link to its large rendition.
- **Look:** the backdrop and control colour come from the existing typed `backdrop` and `ink`. The controls are drawn in CSS (`currentColor`), with no sliding or animation. The chrome is fixed to the screen, not to the photo.
- **Wording:** new optional fields `closeLabel`, `zoomInLabel`, `zoomOutLabel`, `resetLabel` and `countLabel` (with `{n}` and `{total}`, default `{n} of {total}`). They are overlay fields, so a set's members must agree on them, and they are always written as text.
- **A viewer inside a module's slot** (the catalog product page) now gets its script: the page ships the dialog and viewer scripts when a mounted fragment carries a viewer.

**L1 `span` on grid children** (`packages/site-schema/src/l1`):
- The value is `'all'` (the whole row at every width, so it follows the parent's per-width columns with no second per-width mechanism) or an integer from 1 to 12.
- Only a direct child of a container that is a grid at some width may carry it, and never the root (`spanNeedsAGrid`).
- The renderer emits `grid-column: 1 / -1` or `span n`, re-checked at emit time.
- **`sizes` follows the grid:** a child of a grid that states per-width columns, or anything nested in such a child, is drawn in its share of the grid (columns over span, multiplied through nested grids). So a spanning photo asks for a rendition as wide as it is drawn. Documents without per-width grids are unchanged.

**Bind field `morePhotos`:** every photo after the first. A product page draws `photo` across the photo grid and `morePhotos` two to a row, in the same order a `photos` gallery would.

**The product-page starter** (`catalogProductPagePreset`, `packages/framework/src/l2/catalog.ts`):
- **Layout:** a 5-column grid from 768 px, with the photos spanning 3 (about 60%) and the details 2. It stacks below 768 px, photos first.
- **Details:** sticky from 768 px (`sticky: { topPx: 24, fromPx: 768 }`). They hold:
  - the name (h1) and price/Sold, held close together;
  - Buy, Enquire and Commission;
  - the description.
- **Photos:** a 2-column grid, every photo `aspect: portrait` with `objectFit: cover`, the main photo with `span: 'all'`, and all in viewer group `product-photos`.
- **Registration:** it is the preset for `catalog` in `product` mode (`presetSlots`), and a product instance with no `product-page` template draws it.

**The host check** (`catalog_grid` in `tools/generate/src/cli/ai/layout-check.ts`) extends to `.catalog[data-catalog="product"]`, measuring the shown photos outside the viewer at every width:
- `product_uneven`: photos of different shapes (aspect within `aspectTolerance` 2%), or thumbnails (photos narrower than the photo column) of different sizes.
- `product_wide_photo`: a photo wider than the photo column.
- `product_heavy_photo`: REQ-648's 2× file rule, judged only where a `srcset` exists.

**Guidance:**
- The builder's `add_component` description (`l1-surface.json`) has a product-page paragraph after the grid one.
- The consultant's site-plan stage guide (doc `doc-50b859e0`) has a product-page bullet after the shop-page bullet.

## Superseded behaviour of REQ-327/330 (operator decision Q1)

REQ-327/330's suites were updated in place, each change marked `[[REQ-650]]`:
- The trigger is a link, not a button.
- A click on the large photo enlarges it; it no longer closes the viewer.
- The wheel zooms; it no longer dismisses.
- Without script the viewer is hidden and the photos are links; the plates no longer lie in flow.
- The large picture is the largest rendition, with no `src` until shown, replacing the lazy-loaded original.
- Focus on opening goes to the close button.
- The overlay's `zoom-out` cursor is gone.

## UATs (as written)

- `tests/test_UAT_FC_REQ-650_image_viewer.test.ts` (Chromium, the real catalog product page with 7 photos):
  - **Open:** clicking the third photo opens a modal on it whole, "3 of 7", with focus inside.
  - **Full width and zoom:** a click fills the width; the wheel and the + button zoom; a drag pans; reset and a click return to the whole photo; − never shrinks below the whole photo.
  - **Paging:** the arrows, ← → and a swipe page through the set; paging while zoomed returns the photo whole; the set wraps.
  - **Close:** Esc, the close button and the backdrop each close it, and focus returns to the photo.
  - **Keyboard:** Tab reaches a photo, Enter opens the viewer, Tab stays inside it, and Esc returns focus.
  - **Loading:** no large rendition before opening; on opening, the current photo and its neighbours at 1,920 px; never the original.
  - **No script:** each photo is a link to its 1,920 px rendition, the viewer is hidden, and a click follows the link.
  - **Wording:** markup in the wording fields is inert, set members must agree on it, and unknown fields are refused.
  - **Reuse:** a plain gallery gets the same viewer, with localised wording.
- `tests/test_UAT_FC_REQ-650_product_page_standard.test.ts` (Chromium plus `checkLayoutAt`):
  - At desktop the photos sit left at 55–62%, with the details right and sticky through a scroll. At phone the photos come first.
  - Every thumbnail is one 4:5 box at every width, and the first spans both columns.
  - The starter is the product preset and the default template.
  - The starter's product section has no finding of any kind.
  - A photo at natural size fails (`product_uneven` / `product_wide_photo`).
  - A photo sent a whole-screen file fails (`product_heavy_photo`).
  - The photo grid above the details renders and passes.
- `tests/test_UAT_FC_REQ-650_l1_span.test.ts`: envelope acceptance and refusals, render and emit-time re-check, `sizes` for a spanning photo in a nested split (60vw / 30vw), and a capture round-trip with no Type-A deltas.
- `tests/test_UAT_FC_REQ-650_product_page_guidance.test.ts`: the builder's manual and the consultant's site-plan guide state the standard.


## Also in the commits (found by the regression run)

- **The L1 reference now projects the grid rules.** REQ-648's four structural-rule comments (`pinIsOnePlacement`, `pinNeedsAParent`, `columnsOnlyOnGrid`, `columnsAgreeWithTrack`) opened `[[REQ-648]] —`, which the L1 reference cannot project. They now open `REQ-648 —`, as does the new `spanNeedsAGrid` (`REQ-650 —`). The reference-coverage and BUG-48 suites gained a provoking document for each of the five.
- **The axis-group sweep covers `pin` and `span`.** The AC-802 shared-axis-group sweep samples both, checked as children of a grid because the root can carry neither.
- **Still red on clean xgd-working, unrelated to this ticket:**
  - the reference-coverage and BUG-48 suites, because about 30 older rules have no provoking document;
  - AC1627 in `reconciliation-l1-fold-responsive-axes` and AC694 in `reconciliation-l1-fold`;
  - two cases in `test_UAT_FC_REQ-418_table`.

**Verification:** 151 tests across the REQ-650 suites, REQ-327/330, REQ-648, REQ-212, REQ-275 and AC-802 pass in a real Chromium (single-process mode), with none skipped. They still pass after merging xgd-working.