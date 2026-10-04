---
uid: request-b3f68517
id: REQ-378
type: request
title: 'Builder: start with comparable sites — a comp board, viewed in the preview
  pane, with web search'
created_by: EPIC-19
created_at: '2026-10-04T00:14:10.660139+00:00'
updated_at: '2026-10-04T03:01:35.441685+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8e73a41e
  commits:
  - working_sha: 511d2f824c2dbc60dcfa3b5ee60a70a4c554ee1b
    reconcile_sha: null
    main_sha: null
  - working_sha: 7fcf3e19b79d0d59025515957678c9c4272bc7f3
    reconcile_sha: null
    main_sha: null
  - working_sha: bfe377f8319c7876f17e12436bf715e3ed846e28
    reconcile_sha: null
    main_sha: null
  version: 0.2.476
---

## What changes

A new engagement starts by looking at **comparable sites** ("comps"), before anything is built. The consultant finds three or four real sites in the client's trade and area. The client can add their own. The two look at each one in the preview pane and talk through what the client likes and dislikes. The conventions the client agrees with become the basis of the first rough cut.

## Why

Charlie's Plumbing 2 (EPIC-19 Finding 18) produced a site the operator judged "a mock plumber site… it looks like an HTML class". Real trade sites are dense and busy, and nothing in our process set how dense or conventional the site should be for its kind of business. Comps fix that before the first build, and with the client's agreement. It's the variants lesson applied early: the client points at real sites instead of describing taste, so no design vocabulary is needed. Comps also bring up features the client hadn't thought of (online booking, coupons, financing banners), which fills the plan's empty `functionality` list.

## Requirements

### 1. Web search is a hard requirement

The consultant must be able to find comps, especially strong **local independents**, which are the right comparison for a small business and which it can't know from memory. Its grant includes the provider `web_search` tool from **lagrange-framework REQ-206**. That's the half of REQ-207 that never landed. **This ticket is blocked until REQ-206 lands**, and must not ship with comps limited to sites the model remembers.

### 2. The comp board

- **Shown on the plan panel:** a "Sites we're comparing" list. The consultant adds entries, and **the client can add a URL too**.
- **Every entry is a capture.** Adding one runs `capture_site`, so the address is checked to exist, and the result becomes the existing `reference` ticket (REQ-166). Each entry shows the site's name, the source (consultant or client), and a **thumbnail of its hero**, meaning the first desktop viewport cropped from the capture's screenshot. The thumbnail stays as a reminder for the rest of the engagement.
- **Each entry holds the client's likes and dislikes**, as short structured notes on that reference ticket, in the client's words. The client can edit them, and the consultant records them from the conversation.
- **The consultant records the conventions to follow**, for example "dense services grid, phone in three places, reviews near the top, no coupons". They go into the plan's `visual_concept` decision with links to the comps that shaped them. The first rough cut is built from that decision.

### 3. Viewing a comp in the preview pane

- **Clicking an entry shows that comp's captured full-page screenshot** in the preview pane, scrollable, with the same desktop/phone toggle (the capture already holds screenshots at several viewport widths).
- **The pane goes into a clearly separate "Viewing: <site>" mode** while it shows a comp:
  - a banner naming the site;
  - a **"Back to your draft"** control;
  - previous and next between comps;
  - a **"Visit the live site"** link that opens it in a new tab.
- **Nothing in this mode can edit or publish.** Edit mode, the page picker, colours and Publish are hidden or disabled, so nobody can mistake a competitor's page for their own draft. The chat stays live throughout.
- **Never a live iframe**, because many sites refuse to be framed. **Never re-served captured HTML**, because that would serve a third party's site and scripts from our origin.

### 4. Motion

A screenshot doesn't show animation or behaviour on scroll. The viewer says so in one line, and "Visit the live site" is how the client sees motion. Where the capture's own record shows animation or transitions, the comp's description says so, for example "uses scroll-in animations on the service tiles". A recorded scroll-through is a possible later addition and is not part of this ticket.

### 5. Method

The consultant's priming and DOC-64 make the comp review **the step before the first rough cut**. Start by asking *"Who do you lose jobs to? Whose site have you looked at and thought 'that's what I want'?"*. Then propose a range: one national chain, one or two strong local independents, and one outlier that shows the options (for example a clean premium site), so the client can say where they want to sit. Work from each comp's written description, and take screenshots sparingly, because images cost context.

## Out of scope

Annotating regions of a comp screenshot ("I like this bit"). It's a good idea for later, but v1 notes are text.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- Adding a comp URL (consultant or client) creates a capture-backed board entry with a hero thumbnail.
- Opening an entry puts the preview pane into viewing mode with the screenshot, banner and back control; edit and publish controls are unavailable; "Back to your draft" restores the draft at the page it was on.
- The desktop/phone toggle switches between the capture's viewport screenshots.
- Likes and dislikes saved by the client persist on the reference ticket and appear in the consultant's next turn.
- The consultant's grant includes `web_search` on a backend that offers it.
- The priming and DOC-64 name the comp review as the step before the first build.


## As built

Agreed with the operator on 2026-10-03: build everything on the branch and hold the merge until lagrange-framework REQ-206 landed, so nothing shipped without web search. REQ-206 landed the same day and the branch was merged with search in place.

**Comp board data.** The plan gains `comps`: each entry is `{reference, title, url, source: consultant|client, added_at, notes_by?, notes_at?}`. The client's likes and dislikes are `likes`/`dislikes` lists on the comp's `reference` ticket. The plan records who last wrote the notes and when, which is where the consultant's next-turn notice is read from. Removing a comp (consultant or client) takes it off the board, and its capture stays in the Library. Adding a site that's already on the board changes nothing.

**Consultant tools.** The plan surface gains `add_comp` (takes the reference uid that `capture_site` answered), `note_comp` (likes and/or dislikes; each list replaces the old one) and `remove_comp`, in a new `KeepComps` group granted to both roles. `set_decision` takes `comps` (reference uids on the board), so the conventions recorded in `visual_concept` link to the comps that shaped them. `read_plan` includes the board with its notes, and the per-turn plan reminder names the comps on the board.

**Client route.** `POST /api/plan/comp` takes `{site, action: add|note|remove, url | reference, likes, dislikes}`. `add` runs the same `capture_site` the consultant uses, assembled the same way. An address that can't be captured, such as a private address, is refused (400 `REFUSED`) and nothing is added. Every plan route (`GET /api/plan`, `POST /api/plan/ask`, `POST /api/plan/comp`) answers the panel view with `comps` filled in with notes, the desktop screenshot (`screenshot-1280.png`), the phone screenshot (`screenshot-375.png`) and the motion line. Notes the client writes reach the consultant on its next turn, once, as "Your client updated their likes and dislikes on N comp(s)…".

**Plan panel.** The "Sites we're comparing" list has a 16:10 hero thumbnail per comp. The thumbnail is the desktop full-page screenshot, cropped to its top by CSS, so no image is processed or stored. Each entry shows the name, "Suggested" or "You added", Likes and Dislikes boxes (one per line, saved when the client leaves the box) and Remove. Below the list is "Add a site you like" with a URL field.

**Viewer.** The viewer is a transient pane mode, `comp`. The mode toggle doesn't offer it and it's never remembered across reloads. It lists no toolbar actions, so edit, pages, colours and Publish are absent. Its own dark banner holds "Back to your draft", "Viewing: <site>", previous/next with a count, a Desktop/Phone toggle between the capture's 1280px and 375px full-page screenshots, and "Visit the live site" (new tab, http(s) only). Below the banner is the one-line motion note. The images are served from `/api/material/file`, so there's no iframe and no captured HTML. "Back to your draft" returns to whichever of View/Edit the client was in, on the same frame, without navigating it, so the draft is on the page it was on. Changing site exits the viewer. The preview pane had no desktop/phone toggle before this ticket, so the viewer has its own.

**Motion.** At adoption, the capture's per-element `motion` record (`animation`/`transition`/`both`) becomes one line, for example "Motion: uses animation (entrance or scroll-in) on 3 elements and hover transitions on 5 elements, which a screenshot does not show." The line is added to the reference description and stored as `motion` on the ticket.

**Web search (requirement 1).** The consultant's Claude API backend carries the framework's `web` surface (REQ-206) in its own Toolbox. That Toolbox declares `web_search` to the provider in the provider's own form, offers it only where the adapter can search (it's withheld silently elsewhere), and caps it at 20 searches (`CONSULTANT_WEB_SEARCHES`). Following REQ-228, the grant travels with the surface in `host-core.ts` rather than sitting in `instances.json`, because the in-repo declaration validator can't check a framework surface's grant. Only the consultant gets it; the builder worker and the coordinator don't.

**Searches are metered and priced.** REQ-206 adds a fifth usage counter, `web_search_requests`, so 1stcontact's spend ledger takes it as a fifth counter too. It's priced at $10 per 1,000 searches, written as `web_search: 10000` per million in `prices.json` on the Claude consultant models, so `count × rate` is still micros. A price entry with no search rate prices a turn that searched as unpriced, never as free. Migration `0027_turn_spend_web_search.sql` adds `turn_spend.web_search_requests` (default 0), and a spend record that doesn't carry the counter is stored as zero.

**Priming.** The consultant priming (with and without a corpus) has a "Start with comparable sites" section. It makes the comp review the step before the first build, with the opening question, the range (national chain, local independents, outlier), finding local independents by web search, the tools, the `visual_concept` conventions, and taking screenshots sparingly.

**DOC-64.** §8 "How we get there" now has step 3, **Comp review** — the step before the first build. It covers the opening question, the range of sites, local independents found by web search, the comp board, the client's likes and dislikes, `visual_concept` conventions linked to comps, and features into `functionality`. The first pass follows the conventions the review agreed, and the later steps are renumbered.

## UATs

- `tests/test_UAT_FC_REQ-378_the_comp_board.workers.test.ts`: a client URL is captured into a board entry with a hero and motion; an address that can't be captured is refused; the consultant captures, adds, notes and records conventions (and is granted the tools); client likes and dislikes persist on the reference ticket and reach the next turn once; remove; the consultant is granted `web_search` (provider form, cap 20) and each search is counted and priced in `turn_spend`.
- `tests/test_UAT_FC_REQ-378_viewing_a_comp.test.ts`: the board UI (add, note); opening a comp gives the viewing mode with no edit or publish; the desktop/phone toggle; "Back to your draft" restores the same page.
- `tests/test_UAT_FC_REQ-378_the_comp_review_method.test.ts`: the priming and DOC-64 name the comp review as the step before the first build.
- Existing pins updated by design: REQ-356 (the plan schema gains `comps`) and REQ-362 (the consultant's price entry gains `web_search`). `test_UAT_FC_REQ-292_turn_price`, which had failed since REQ-206 added the counter, passes again.