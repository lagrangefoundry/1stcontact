---
uid: request-b3f68517
id: REQ-378
type: request
title: 'Builder: start with comparable sites — a comp board, viewed in the preview
  pane, with web search'
created_by: EPIC-19
created_at: '2026-10-04T00:14:10.660139+00:00'
updated_at: '2026-10-04T00:14:10.660139+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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
