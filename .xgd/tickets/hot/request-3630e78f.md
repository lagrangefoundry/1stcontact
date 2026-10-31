---
uid: request-3630e78f
id: REQ-620
type: request
title: 'Comparison sites: a light capture, run in the background and in parallel,
  instead of the full import capture'
created_by: EPIC-19
created_at: '2026-10-31T20:02:35.179582+00:00'
updated_at: '2026-10-31T20:02:44.172500+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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
