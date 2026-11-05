---
uid: request-3630e78f
id: REQ-620
type: request
title: 'Comparison sites: a light capture, run in the background and in parallel,
  instead of the full import capture'
created_by: EPIC-19
created_at: '2026-10-31T20:02:35.179582+00:00'
updated_at: '2026-11-01T00:22:34.844862+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-87797927
  commits:
  - working_sha: f3398ba4daa29e1b8eb95aff143c01575594005c
    reconcile_sha: null
    main_sha: null
  - working_sha: cb87e9e0419d5a65a50d6af574b239abb861607d
    reconcile_sha: null
    main_sha: null
  version: 0.2.721
  story_points: 8
---

## Why

Operator, full site build on production (2026-10-31): comparison sites were very slow to appear, only 2 arrived, and the Site consultant seemed to struggle with one capture. Showing a comparison site needs a couple of page loads and a screenshot — seconds, not minutes.

Today every comparison site, whether added by the consultant (`capture_site`) or by the client's "add a site" (`router.ts` comps route → `fidelityOperations(...).capture_site`), runs the full fidelity capture (`cmdCapturePage`, DOC-13) built for rebuilding a client's own site: the multi-state pass over 6 widths (`RESPONSIVE_VIEWPORTS`) × rest/hover with the full extract each time, a screenshot ladder at every width, height probes, structural hints and the initial pass — 15+ page loads on Browser Rendering per site. `slow-tools.json` budgets it at 5 minutes. Each runs inside the consultant's turn, one after another, blocking the conversation and spending Worker CPU (a contributor to the turn CPU kills REQ-483 addresses).

## What

1. **Comparison sites use a light capture.** For a comp, capture only what the board and the consultant use: a desktop (1280) and a phone (375) full-page screenshot, and one extract pass at desktop width for what the consultant reads about the site (colours, fonts, motion summary, title/headline text — what `compDeps`/`BoardComp` and `captureMotion` draw today). Target: two page loads, a few seconds per site. It is still stored as a `reference` capture ticket (REQ-166, REQ-378) so the board, the comp viewer (`desktop`/`phone` members) and likes/dislikes work unchanged. It keeps the same egress guard and the BUG-127/BUG-315 verdict (a refused document is not adopted).
2. **The full capture is unchanged where fidelity matters.** Importing or rebuilding a client's own site keeps `cmdCapturePage`. One capture code path with a light option, not a second pipeline: the light capture is the existing pipeline asked for fewer widths and no states/ladder.
3. **Captures run in the background, in parallel, off the conversation.** Adding a comp (consultant or client) puts it on the board immediately as "loading" and starts its capture as background work; several captures run at once. The consultant's turn does not wait for them: its tool returns at once that the site is being captured. Each tile fills in when its capture lands, through the board's usual refresh.
4. **The consultant reads a site when there is something to read.** The consultant gets a site's captured notes when the client comments on it (or on its next turn after the capture lands), not by waiting for all captures before speaking. The client can look at and comment on a site as soon as its tile is drawn.
5. **A capture that fails shows on its tile.** "Couldn't load this site", with Retry and Remove; it never stalls a turn. A failed or still-loading site stays open for `sites_settled` until the client comments on it, skips it or removes it: the client decides, and the consultant may suggest removing it.
6. `slow-tools.json`'s capture estimate for comps is updated to match (seconds), and `capture_site` stays the consultant's tool for a full capture where it is needed.

## Test plan

UATs `test_UAT_FC_<this ticket>_*`:

- A comp capture (fake browser driver recording navigations) makes exactly two page loads (1280, 375) and produces a reference capture whose board view has `desktop` and `phone` members and a motion line.
- A client-site import still makes the full set of page loads (unchanged).
- Adding three comps returns at once with three "loading" tiles; the three captures run concurrently (driver sees overlapping navigations); each tile fills in as its capture completes.
- The consultant's tool call for a comp returns without waiting for the capture.
- A capture whose document is refused leaves a "couldn't load" tile with Retry/Remove, and the turn is not blocked.

## What landed

- **Light capture** — `cmdCapturePage(url, store, { light: true })` (`capture/capture.ts`): the existing first pass at 1280 (extract → `capture.json`, `screenshot.full.png`) plus one full-page screenshot at 375 (`screenshot-375.png`). No ladder, height probes, hover states, hints or fold (`multiState`/`hints`/`l1` are `null`), one retry instead of two. Same egress guard and BUG-127/BUG-315 verdict, asked before anything is written. `capture_site` is unchanged: still the full capture (`slow-tools.json` keeps its 5 minutes; its note says comps are not there because they no longer keep the client waiting).
- **One path** — `fidelity-core.ts`: `capture_site` and the new `captureComp(deps, url, into)` share one guarded capture-and-adopt function; the comp one asks for `light` and adopts into the waiting ticket (`adoptCapture(bundle, into)`).
- **On the board at once, captured in the background** — `comps.ts` `compDeps(..., capture)` gains `start(url)` and `retry(reference)`. `start` refuses a bad address at once (`REFUSED`, nothing added), else writes the `reference` ticket now with `capture_status: loading` and runs the capture unawaited. An address already captured and ready is put on the board as it stands and not captured again. On landing, adoption sets `capture_status: ready`; on failure (capture error, refused document, or not adoptable) the ticket gets `capture_status: failed` and `capture_error`. A `loading` older than 3 minutes reads as failed ("took too long"), since the isolate that ran it is gone. Running captures sit in a per-isolate set; the client route and the consultant's turn stream hold the isolate open on `compCapturesSettled()` via `ctx.waitUntil`.
- **Client** — `/api/plan/comp` `add` uses `start` and answers at once with the loading tile; a new `retry` action restarts a failed capture.
- **Consultant** — `add_comp` takes `url` (the usual way) or `reference` (a capture already held). With `url` it returns at once with `capture: 'loading'` and a line telling the consultant not to wait or capture again. `read_plan` comps carry `capture` when not ready. `note_comp` answers `comp.about` (the capture's description and measured facts, clipped to 1,200 characters) once it has landed: the consultant reads a site when the client comments on it. The declaration (`plan-surface.json`), the UNKNOWN_COMP message, the new REFUSED error and DOC-75's comparison-board stage guide now say "add_comp by its address" rather than "capture_site first".
- **Board UI** (`builder/comparisons.js`) — a loading card says "Loading this site…" where the picture goes and is usable at once (open the site, write a note). A failed card says "Couldn't load this site" (the reason on hover) with **Retry** and **Remove**. While any card is loading the board reads the plan again every 3 s (`refresh` → `planPanel.refresh()`) until it lands.
- A failed or loading card stays open for `sites_settled` until the client sends, skips or removes it (unchanged card-state rules).

## Design decisions

- The waiting ticket is created up front (not a placeholder plan entry) so the comp's `reference` is stable from the moment it is on the board: likes, notes, skip and remove all work on a loading card, and the capture lands on that same ticket even if the host that answered differs from the one typed.
- Background work is held by `ctx.waitUntil` on the route that started it, not by a queue: a light capture takes seconds, and turns already run in the router isolate.
- The desktop picture of a light capture is `screenshot.full.png` (the first pass's own shot) rather than a duplicate `screenshot-1280.png`; the board's `desktop` already falls back to it.

## UATs (as implemented)

`tests/test_UAT_FC_REQ-620_comps_capture_light_in_the_background.workers.test.ts` (real routes, D1, R2, guarded driver and pipeline; fake Puppeteer and model at the boundary):
- a comp capture is exactly two page loads (1280 then 375) and lands as a `reference` capture whose board view has `desktop`, `phone` and a motion line;
- `capture_site` still makes the full set of page loads;
- three comps added by the client each answer at once with a loading tile, their three captures run at the same time, and each tile fills in;
- the consultant's `add_comp` with a url returns while its capture is still held; the card fills in afterwards; `note_comp` then answers what the capture recorded;
- a page that redirects into private space (refused document) leaves a failed tile with its reason, without holding the turn; Retry shows it loading again; Remove takes it off;
- a refused address is refused at once and nothing is added or loaded.

`tests/test_UAT_FC_REQ-620_loading_and_failed_tiles.test.ts` (jsdom, the real board): a loading card is usable at once; a failed card says so with Retry and Remove and Retry posts `retry`; the board refreshes while a card is loading and stops once it lands.

REQ-378's client-add UAT now expects the loading tile first and `screenshot.full.png` as the desktop picture after the capture lands.