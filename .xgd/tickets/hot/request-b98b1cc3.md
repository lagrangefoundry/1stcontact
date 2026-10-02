---
uid: request-b98b1cc3
id: REQ-363
type: request
title: 'Screenshots: show the page a screen at a time, with a conservative default
  the AI can widen'
created_by: EPIC-20
created_at: '2026-10-02T19:01:38.804395+00:00'
updated_at: '2026-10-02T19:01:38.804395+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
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
