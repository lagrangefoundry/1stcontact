---
uid: request-2272efe6
id: REQ-648
type: request
title: 'Shop display: product grid standard, consultant guidance, starter template
  and a host check'
created_by: EPIC-19
created_at: '2026-11-04T21:17:04.687242+00:00'
updated_at: '2026-11-04T23:32:10.879692+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-77dd8e50
  commits:
  - working_sha: 1e4131d215cd9f632fc711fddd841e2e3df6c326
    reconcile_sha: null
    main_sha: null
  - working_sha: 4ca701365663a66809e7d4bcca79efd073ca10ac
    reconcile_sha: null
    main_sha: null
  - working_sha: 44340a30ddfe8055c70160af7b43067e0ba4b8ba
    reconcile_sha: null
    main_sha: null
  - working_sha: 288422b5f92bb63bb985e21decd58c52f2cad864
    reconcile_sha: null
    main_sha: null
  - working_sha: 516fffb4def504829ea5835f73b80d79ef21f7c6
    reconcile_sha: null
    main_sha: null
  - working_sha: 7ceef3dc53abbd503fb2d4f8e42a19458c326505
    reconcile_sha: null
    main_sha: null
  version: 0.2.766
  story_points: 13
---

## Why

The `catalog` module (REQ-633) works, but the product grids the consultant builds with it are unusable on desktop. On a real jewellery site (336 live items) it produced full-size photos stacked one per row down the page. On desktop the photos were huge, unresized and all different sizes. The previous hand-built site for the same business showed square cards up to 5 across.

The causes are in the system, not one site:
- **The grid's arrangement is the optional `list` slot, and "absent, the cards stack"** (`packages/framework/src/modules/product-catalog/meta.ts`). The consultant left it out, so the cards stacked.
- **Nothing gives the card photo one fixed shape.** Each photo renders at its own size and proportions, so cards differ in size.
- **Nothing checks the result.** The host's floor tests pass a page of giant, mismatched photos.

## The standard: the Etsy listing grid

The reference is Etsy's search and listing grid (operator's screenshot, 2026-11-04, `.xgd/tmp/etsy-layout.png` in the main checkout; the measurements below are the standard, the image is only illustration). At a ~1,400 px desktop viewport:

| Aspect | Standard |
|---|---|
| **Columns** | **4 on desktop** (≥ 1,024 px), **3 on tablet**, **2 on phone**. Every card in a row is the same width. |
| **Gap** | Narrow: about 16–20 px desktop, a little less on phone; the same between rows and columns, from the design's space steps. |
| **Photo shape** | **One portrait 4:5 frame for every card** (≈ 328 × 408 px at 4 columns on 1,400 px). |
| **Photo fit** | **Cropped to fill the frame** (cover), centred. Never letterboxed, never natural size. |
| **Photo corners** | Small radius from the design, or square if the design is square-cornered. |
| **Badges** | Laid over the photo's top-left corner as a small pill (here: **Sold**, and later things like "New" or "One of a kind"). |
| **Title** | **One line**, cut off with an ellipsis. Never wraps, so every card's text block lines up. |
| **Under the title** | Price (or the sold state, per `showSoldPrice`), then the action: Buy/Add or Enquire, per REQ-642. |
| **Per page** | 24 per static page (the module's `pageSize` default), with the pager under the grid. |

Not adopted from Etsy: ratings, "Ad"/seller lines, strikethrough sale prices, shipping lines (we don't have that data), and filter pills (a separate feature).

## What to build

1. **The starter template follows the standard.** The catalog's starter `list` (when the consultant adds a grid) is a responsive grid at 4/3/2 columns with the design's gap step. The starter `card` has the 4:5 cover photo frame, the overlaid Sold badge, a one-line title and the price/action line. A grid made from the starter is right with no further work; the consultant changes it deliberately, never builds one from nothing. A grid with no `list` slot must no longer render as a stack: either the starter fills it, or the host refuses the grid (see 3).
2. **Guidance for the consultant and builder.** The site-plan playbook's shop section and the builder's catalog notes state the standard above in a few lines. They say the frame and columns may be adjusted to suit a site (e.g. 3 columns, or a square frame for a minimal look) but must stay one shape and one width across every card, and never drop below 2 columns from tablet up. Keep it short; the starter does most of the work.
3. **A host check (a floor test, like the existing layout checks) on any page with a `catalog` grid,** measured on the rendered page at phone, tablet and desktop widths:
   - **Columns:** at tablet and desktop, the cards form **at least 2 columns**. At desktop, at least 3.
   - **Uniform cards:** every card's photo box has the **same width and height**, within 2 px, and all photo boxes share one aspect ratio.
   - **No giant photos:** no card photo box is wider than **half the content width** at tablet and desktop.
   - **Right-sized files:** the photo file served for a card isn't more than ~2× its displayed width (via the image ladder's renditions and `srcset`/`sizes`), so a 22 MB original is never sent to a 300 px card.
   - A failure is reported like the other floor tests: the build isn't finished, with a one-line reason the builder can act on (e.g. "catalog grid on home: 1 column at desktop; set the list to the 4/3/2 grid").

## Not in scope

- Filters and sorting pills, ratings, quick view and hover second image.
- The product page's own layout (`product` mode). This ticket is the grid only.

## Test plan

`test_UAT_FC_<ID>_*`:
- **Starter grid meets the standard:** a site with a `catalog` grid built from the starter, with 30 items whose photos have mixed sizes and aspects, rendered at 1,400 / 900 / 390 px has 4 / 3 / 2 columns, identical 4:5 photo boxes, one-line titles, and the check passes.
- **Stacked grid is refused:** the same grid with no `list` (or a list one column wide) fails the check at desktop, with the column reason.
- **Mixed photo boxes are refused:** a card whose photo renders at natural size fails on uniformity.
- **Giant photo is refused:** a card photo wider than half the content width at desktop fails.
- **Oversized file is refused:** a card served the original multi-megabyte file instead of a rendition near its display width fails on file size.
- **Guidance present:** the consultant's and builder's priming carries the 4/3/2, 4:5-cover, one-line-title standard.


## Coordination with REQ-638 (consultant model cutover, unmerged)

REQ-638 replaces the consultant's playbook (DOC-75) and its stage-based priming with a goal-and-plan model. Whichever lands second must carry the other's changes:
- **If this ticket lands first:** put the guidance where today's playbook and priming have their shop/catalog material. REQ-638's merge guard (appended to REQ-638) carries it into the new playbook.
- **If REQ-638 lands first:** put the guidance in the `goal-and-plan` playbook and the builder's catalog notes, not in the removed stage guides.
- **Either way,** the catalog-grid check is a **floor test** (site quality), so REQ-638's §6 gate removal never applies to it. It counts toward Building and Final checks like the other floor tests.


## Decisions on the session's questions (operator via EPIC-31, 2026-11-04)

**1. Yes: this ticket adds the typed L1 primitives it needs** (operator: "it can add what it needs to L1"). Keep the badge over the photo. Each primitive follows the security policy and the existing L1 rules:
- **Per-width columns on a grid.** Extend the existing breakpoint track (REQ-104) so a grid entry can carry its column count at each width. Do not add a second, parallel per-width mechanism next to it: one way to say "at this width".
- **`maxLines` on text,** rendered as a line clamp with an ellipsis. The `clipped` layout check treats text clipped by its own `maxLines` as deliberate and still reports any other clipping.
- **Pin a child to a corner of its box** (a closed enum of corners plus an inset from the design's space steps). The pinned child is out of flow, so a sold card is exactly the same height as an unsold one.
- **The card's drawn width reaches the card render.** The catalog derives each card photo's `sizes` from the grid's per-width columns and the content width, so the browser fetches a rendition near the drawn width. Compute it in the renderer from typed values, never from author-supplied strings.
- **For every primitive:** a strict schema with closed enums and range bounds in `validateL1`; the renderer re-checks it at emit time; and it **round-trips through capture** (`capture(render(L1)) ≈ L1`, REQ-82/DOC-13) so the round-trip gate stays meaningful. It also needs envelope security and robustness UATs, as the existing primitives have.

**2. The 4:5 frame comes from the design's `portrait` aspect.** A design that doesn't define `portrait` gets 4:5 by default (and `square` gets 1:1). The starter card names `portrait`, so a site changes every card's frame through its design, never by editing the card.

**3. A grid with no `list` draws the starter 4/3/2 grid.** This replaces "absent, the cards stack". `add_component` fills any slot the consultant leaves out from the starter, not only when all of them are missing. The new check catches a `list` deliberately set too narrow.

**Widths:** run the check at the layout check's existing widths (1,280 / 900 / 375). The test plan's 1,400 / 900 / 390 are illustrative, in the same bands.


## What was built (implementation as it stands)

**L1 primitives** (`packages/site-schema/src/l1`, rendered in `packages/framework/src/l1/render.ts`):
- **Per-width columns on REQ-104's track.** A `responsiveLayout` keyframe may carry `columns` (an integer 1–12), but only at a `grid` keyframe. The static `columns` must agree with the widest grid keyframe that states one. A grid whose track states columns draws equal columns (`repeat(n, minmax(0, 1fr))`), so a long one-line title never widens its own column. `layoutColumnsTrack` / `gridColumnsOf` in `layout.ts` resolve the columns per width, for the renderer and for `sizes`.
- **`maxLines` on text** (integer 1–10): a line clamp with an ellipsis. The `clipped` layout check does not report text clamped by its own `maxLines`.
- **`pin`** (`{ corner: top-left | top-right | bottom-left | bottom-right, inset?: <space step> }`): the node is absolutely placed at that corner of its parent, out of the flow. The inset is the design's step, or 8px when none is named. A pinned node can't also have a `geometry` track or `sticky`, and the root can't be pinned. A named inset must be a step the design defines.
- **The card's drawn width reaches its render.** `renderL1Fragment` takes `drawnIn` (the grid's per-width columns). A picture that fills its box takes `sizes` from it: `(min-width: 1024px) 25vw, (min-width: 768px) 34vw, 50vw` for the starter.
- **Default aspects:** `portrait` is 4:5 and `square` is 1:1 on every design that doesn't state its own (`L1_DEFAULT_ASPECTS`, `l1DesignAspect`). This holds in the renderer and in the missing-reference check.
- Each primitive is re-checked at emit time: corners against the closed set, counts as bounded integers. Nothing from an instance reaches the CSS.

**The starter** (`packages/framework/src/l2/catalog.ts`, registered in `l2/presets.ts`):
- The `list` is a grid with 2 columns from 0, 3 from 768 and 4 from 1024. Its gap is the design's `md` step, or 16px.
- The `card` is a stack holding:
  - a frame box: the photo (`aspect: portrait`, `objectFit: cover`, bound to `photo` with a link), with the Sold badge pinned top-left;
  - the name (`maxLines: 1`, linked);
  - the price;
  - the enquiry and commission lines.
- The `pager` is the previous and next links in a row.
- The preset reads the site design's space steps (`presetSlots(id, config, { spaceSteps })`), so it never names a step the design lacks.
- A product-mode instance has no starter.

**Module and tools:**
- A grid with no `list` (or one that isn't a container or box) draws the starter grid. "Absent, the cards stack" is gone.
- `add_component` merges the preset under whatever slots the caller supplies, so any slot left out is the starter's.

**The floor check** (`catalog_grid` in `tools/generate/src/cli/ai/layout-check.ts`, thresholds in `layout-check.json`). It runs at desktop, tablet and phone, has four finding kinds, and each finding names one fix:
- `grid_columns`: the first row holds fewer than `minColumns` cards (phone 1, tablet 2, desktop 3) and the cards wrap past it.
- `grid_uneven`: a photo box differs from the first by more than 2px.
- `grid_giant_photo`: a photo is wider than half the grid's width at tablet and desktop.
- `grid_heavy_photo`: the file is more than 2× the drawn width. The file is the `srcset` candidate the browser takes, from `currentSrc` or worked out from `sizes`.

**Capture round-trip:** extraction reads the computed line clamp (`lineClamp`), carries it through sections and the value-axes table, and the fold writes `axes.maxLines` back. The per-width columns and the pin fold back as the geometry they produce.

**Guidance:**
- The builder's `add_component` description (`l1-surface.json`) states the standard, what may be adjusted, and that left-out seams take the starter.
- The consultant's site-plan stage guide (DOC-75) has a short shop-page bullet.

## Design decisions made during implementation

- **The file-size rule judges only photos that have a `srcset`.** A draft is served before its publish builds the image ladder (card photos come full size from `/shop-photos/…`). Judging those would fail every builder check with a fault the builder can't fix.
- **The ladder's smallest rendition is never "too heavy".** It's 320px (`DELIVERY_WIDTHS`), and a 2-column phone card is about 155px at the check's 1× pixel ratio. No smaller file exists, so the limit is the larger of 2× the drawn width and the smallest candidate.
- **A missing `list` draws the starter grid** (decision 3). So "Stacked grid is refused" in the test plan is now tested as a `list` deliberately one column wide.
- Equal-width tracks (`minmax(0, 1fr)`) apply only where the track states per-width columns. Existing static grids render byte-identically.

## UATs (as written)

- `tests/test_UAT_FC_REQ-648_catalog_grid_standard.test.ts` (Chromium): the starter grid with 30 mixed-shape photos is 4/3/2 columns, every photo box is identical 4:5, every title is one line with an ellipsis, and the check passes. A card photo is sent a rendition near its drawn width. A grid with no `list` draws 4 columns. A one-column list is refused with the column reason. Unframed photos are refused as uneven. A photo wider than half the grid is refused. A photo whose `sizes` was lost is refused on file size. A photo with no ladder is not judged.
- `tests/test_UAT_FC_REQ-648_l1_grid_primitives.test.ts`: renders, envelope robustness and envelope security for the columns, `maxLines` and `pin` primitives; the default aspects; the card photo's `sizes`; and `add_component` filling the starter list and pager around a caller's card, or giving the whole starter.
- `tests/test_UAT_FC_REQ-648_grid_primitives_roundtrip.test.ts` (Chromium): `capture(render(L1)) ≈ L1` with no Type-A deltas at 375 and 1280. Columns are 4 and 2. Sold cards' titles are level with unsold ones. Badges sit at their photo's corner. Folded titles carry `maxLines: 1`.
- `tests/test_UAT_FC_REQ-648_grid_guidance.test.ts`: the builder's manual and the consultant's site-plan guide state the standard.