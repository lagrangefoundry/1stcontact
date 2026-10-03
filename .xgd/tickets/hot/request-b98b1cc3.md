---
uid: request-b98b1cc3
id: REQ-363
type: request
title: 'Screenshots: show the page a screen at a time, with a conservative default
  the AI can widen'
created_by: EPIC-20
created_at: '2026-10-02T19:01:38.804395+00:00'
updated_at: '2026-10-03T17:06:05.175588+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d953efda
  commits:
  - working_sha: c64d5f56441d2e865ee4803537051b1301255d00
    reconcile_sha: null
    main_sha: null
  - working_sha: 6f693aea31ba928c7e1dd661fa51b643c9cf931d
    reconcile_sha: null
    main_sha: null
  - working_sha: 06f10c9cffa6b2f2bd67bbd80d730347dda86eaf
    reconcile_sha: null
    main_sha: null
  version: 0.2.443
  story_points: 5
---

**Parent:** EPIC-20. **Evidence:** EPIC-20 § "Charlie's Plumbing session, 2026-10-01/02".

## Problem

The `screenshot` tool photographs the whole page and then shrinks it until its **longest** edge is 1,024 px (`MAX_IMAGE_EDGE` in `fidelity-core.ts`). For a tall page that leaves a sliver: in the Charlie's Plumbing session a 1280×9059 desktop page arrived as 169×1024, and 375×2427 mobile pages as about 158×1024. At that size nothing on the page can be read, so the consultant pays for a picture it can't judge from.

It's also not how anyone sees a site. A visitor sees one screen at a time and scrolls.

## Required behaviour

### Pictures of a page are taken one screen at a time

- A page picture is a **tile**: one screen-height slice of the page at the viewport it was taken at. The page is never squeezed into one image.
- Tiles are reduced by **width**, never by the longest edge:
  - desktop: rendered at its viewport (1,280), sent about 1,024 wide;
  - mobile: sent at its real width (375) with no reduction;
  - tablet: rendered at 768 and sent unreduced.
- The text beside each tile says where it is: `tile 2 of 9`, the page's y-range in pixels, and the addresses of the top-level sections the tile shows. The model can then ask for the next tile, or the tile with a given section, without guessing.
- The text also states the tile's approximate token cost, so the cost of looking is visible when the model decides to look.

### A reasonable, conservative default the AI can change

- **Default:** the first tile only (what a visitor sees on arrival), at normal detail.
- The AI may ask for more or less:
  - **which part:** a tile index or range, the tile(s) covering a named section address, or the whole page;
  - **how much detail:** `low` (about 768 wide on desktop, for layout and rhythm), `normal` (the default, about 1,024), `high` (as wide as the provider will use without downscaling it again, under about 1,568). Mobile is always its real width.
- **The whole page is bounded.** One call returns at most a configured number of tiles (default 4). Asking for more returns the first batch and says how many tiles remain and how to fetch them, rather than refusing or silently truncating.
- The default tile, default detail and per-call cap are configuration, not constants in code. Changing them needs no code change.

### Unchanged

- Pictures of a stored image (an uploaded or generated asset) keep today's rule: the whole image, reduced on its longest edge.
- `compare` keeps measuring the full-resolution rasters.
- `after` (photographing a state a visitor reaches by acting) works for tiles as it does today.

## Prose

The `screenshot` description in `fidelity-surface.json` is rewritten to match: what the default shows, how to ask for a section, more tiles or more detail, and that each tile states its cost. The current text ("a full-page shot of a long page is scaled down so that its longest edge is manageable") is replaced, not added to.

## Acceptance

- A default `screenshot` of a 1280×9059 desktop draft returns one image about 1,024 wide whose height is one screen, labelled `tile 1 of N` with its y-range and section addresses.
- A default mobile screenshot returns one image 375 wide and one screen tall.
- Asking for the tile that shows a given section returns the tile(s) containing that section's top.
- Asking for the whole of a 12-tile page returns 4 tiles and says 8 remain, with how to fetch them.
- `low`, `normal` and `high` produce the documented widths. `high` never exceeds the provider's no-downscale limit.
- A stored-image picture is reduced exactly as before.
- Changing the default tile count, detail or per-call cap in configuration changes behaviour with no code change.


## Implementation design (free-coded, 2026-10-03)

**Where it lives.** The `screenshot` operation in `fidelity-core.ts` stays the single entry point; tiling is a pure module `tools/generate/src/cli/ai/picture-tiles.ts`, and its settings are `tools/generate/src/cli/ai/picture-tiles.json` (the same "a JSON file with an `about` and the values" pattern as `turn-clock.json`). Nothing new is built for resampling: the existing box-average resampler in `perceptual-core.ts` gains a width-targeted entry point beside `downsampleRaster`, and tiles are cut with the existing `extractRect`.

**How tiles are made.** The browser still takes one full-page shot at the viewport (unchanged capture path, one browser lease per call); the page is sliced into screen-height tiles (`VIEWPORTS[...].height`: desktop 800, tablet 1024, mobile 667) and only the selected tiles are encoded and sent. A reference bundle's stored full-page shot is tiled the same way.

**Section addresses.** For our own rendered pages (`draft`, `edit`, `revision`), the same browser session measures the top-level sections after the shot: the L1 root is the body's `.l1-0` element (the renderer's first node class), and its element children are `0.0`, `0.1`, … — the same addresses `describe_page` hands out (descending through a single-child wrapper, so a page wrapped in one container still lists its real sections). `url` and `reference` pictures have no L1 addresses: their tiles carry position only, and asking for a `section` on them is refused by name (PICTURE_INVALID).

**Parameters added to `screenshot`:**
- `tiles` — `"3"`, `"2-5"` or `"all"` (1-based). Default comes from configuration (`"1"`).
- `section` — a top-level section address (e.g. `0.3`); returns the tile containing that section's top, and says which tile the section ends in. `tiles` and `section` together are refused.
- `detail` — `low` | `normal` | `high`; default from configuration (`normal`).

**Widths.** A tile is scaled so its width is at most the detail's width (`low` 768, `normal` 1024, `high` 1568 — all configured) and never upscaled, and both edges are kept within the provider's no-downscale limit (1568, configured). So desktop: 768 / 1024 / 1280; tablet: 768 at every detail; mobile: always 375.

**The per-call cap.** At most `max_tiles_per_call` (default 4) tiles are returned. Asking for more returns the first batch plus a closing text block saying how many tiles remain and the exact `tiles` value to ask for next.

**Labels.** Each tile's text block reads like: `<picture label> — tile 2 of 9, page y 800–1600 of 7200 px; sections 0.0.2, 0.0.3; 1024×640 (reduced from 1280×800), about 874 tokens` plus the channel caption when there is one. Token cost is width×height÷750 (configured divisor).

**Unchanged.** `kind: image` keeps the whole-image, longest-edge (`MAX_IMAGE_EDGE`) reduction; `tiles`/`section` on an image are refused, `detail` is ignored. `compare` and `check_fidelity` still measure full-resolution rasters. `after` steps work for tiles exactly as before.

**Configuration proven, not asserted.** `fidelityOperations` takes an optional `tiles` settings override in its deps (defaulting to `picture-tiles.json`), so a UAT changes the default tile, detail and cap and observes the behaviour change with no code change.

## Test plan

`tests/test_UAT_FC_REQ-363_screenshot_tiles.test.ts`, through `fidelityOperations` with only the browser doubled (real PNGs, real decode):
- default desktop draft of a 1280×9059 page → one image 1024 wide × one screen tall, labelled `tile 1 of 12` with y-range and section addresses;
- default mobile → one image 375 wide, one screen tall;
- `section` → the tile holding that section's top; `section` on a `url` picture is refused;
- `tiles: "all"` on a 12-tile page → 4 images and "8 remain" with the next `tiles` value;
- `low`/`normal`/`high` widths, `high` within the provider limit;
- a stored image is reduced exactly as before (longest edge);
- changed configuration (default tiles / detail / cap) changes behaviour;
- `after` steps still drive the page before a tiled shot.
Regression scope: the REQ-157 and REQ-218 fidelity UATs, and the fidelity-surface declaration validation.


## As built (commits c64d5f56441d, 6f693aea31ba)

Landed as designed above. Details settled during implementation:

- **Refusals, all before a browser is leased:** `tiles` and `section` together; `tiles`/`section` on a stored `image`; `section` on a `url` or `reference` picture; an unknown `detail`. After the page is shot: a `tiles` value that isn't `N`, `N-M` or `all`, or a first tile past the end ("this page is 12 tiles long, so there is no tile 13"); a `section` address that isn't one of the page's top-level sections (the refusal lists the ones that are). A range running past the end is clamped to the last tile.
- **A section spanning several tiles** returns the tile its top is in, and the text adds "Section 0.1 starts in tile 1 and runs to tile 2; ask for tiles `2` to see the rest of it" (a range like `2-4` when it spans more) so the model can fetch the rest.
- **Section measurement** runs in the same browser session, after the shutter (so positions match the layout the pixels show, at the shot's viewport, including after `after` steps). If the measurement fails the picture is still returned, just without section addresses. Sections with zero height (a closed panel) are not listed.
- **The last tile** is the remainder of the page, not a padded full screen (e.g. `page y 8800–9059 of 9059 px`).
- **REQ-157's "no picture synonyms" invariant** (`test_UAT_FC_REQ_157_no_operation_carries_its_own_ref_shaped_parameters`) whitelisted the scalar params that aren't pictures; `tiles`, `section` and `detail` were added to that list. Its intent — every param that names a picture uses the one `picture` type — is unchanged.
- The `screenshot` declaration also gained a `where` and `more` entry in the `picture` result shape, and the stored-picture paragraph now says a stored picture is shown whole (no screens), longest edge reduced. `surface_version` 7 → 8.

UATs: `tests/test_UAT_FC_REQ-363_screenshot_tiles.test.ts` (9 tests, all passing). Regression run: REQ-157, REQ-216, REQ-218, BUG-80/118/127/148/99, REQ-126/182/284/302/361, BUG-63, the assistant-control-surface reconciliation, and the workerd suites REQ-154/156/206/217/286 and BUG-129 — all green. `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed` fails, but it fails identically on clean xgd-working and is unrelated (router error scrubbing).