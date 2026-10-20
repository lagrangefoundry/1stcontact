---
uid: request-a71bd8f1
id: REQ-419
type: request
title: 'Comparisons: a preview mode of site tiles that open the real sites, replacing
  the comp viewer and the panel''s comp board'
created_by: EPIC-20
created_at: '2026-10-20T22:19:26.112561+00:00'
updated_at: '2026-10-20T22:19:32.136952+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes

The comparable sites get their own place in the preview: a **Comparisons** mode beside View, Edit and Story. It shows every comp as a tile with a small thumbnail of the site's home page and the client's likes and dislikes underneath. Clicking a tile opens the **real site** in a new browser tab. The screenshot is there only so the client recognises the site; the real site is what they're meant to look at.

The "Sites we're comparing" item on the questions panel goes away. The comp carousel viewer goes away.

## Why (operator, 2026-10-20, Bob's Salon 3 session)

- **Navigation felt out of control.** The comp viewer (REQ-378) is a temporary mode that isn't on the View | Edit | Story toggle. The only ways in are clicking a comp card in chat or the panel item. "Back to your draft" returns to whatever mode the client was in before, which was the story board, not the draft. Once out, the client had to go back to the chat or the panel to get in again.
- **The controls looked unfinished, and the carousel arrows jump about** because they sit either side of site names of different lengths.
- **The design is built around the screenshot, and the screenshot is often useless.** It's only the home page, motion and effects are lost, and a slow page or a cookie popup ruins it. Drybar's capture was half-loaded with a consent banner across it. We want the client to visit the real sites.

## Required behaviour

**The mode**
- **Comparisons** is a mode on the preview's mode toggle, after Story: View | Edit | Story | Comparisons.
- It's on the toggle only once the comp board has been raised (the consultant's `ask_comps` or the first `add_comp`). Before that, it doesn't appear.
- It behaves like the other modes: the client switches to it and away from it with the toggle, and it's remembered like the others. No "Back to your draft" button and no separate way in or out.
- Like Story, it offers no toolbar actions (no edit, pages, colours or Publish).
- When the consultant shows comps in chat, clicking a comp card switches the preview to Comparisons, with that comp's tile scrolled into view.
- On the progress bar, the explanation for the "Looking at other sites" stage (shown on hover, focus or tap) includes a link that opens Comparisons. The progress bar still never changes a stage when clicked.

**The tiles**
- All comps are shown at once as a grid of tiles. No carousel, no previous/next.
- Each tile has:
  - a thumbnail: the top of the site's home page, cropped to about one screen, at desktop width;
  - the site's name and address;
  - **"Open the site ↗"**, which opens the real site in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Clicking the thumbnail does the same;
  - who added it (the consultant or the client);
  - the client's likes and dislikes, edited in place, with the per-site **Done** that BUG-236 added.
- Under the grid: **add a site you know** (by address, as the panel's "Add" does today), and **"I've finished commenting"** (BUG-236), which tells the consultant the client is done with the comps.
- Only http(s) addresses become links, as today.
- The tiles say nothing that suggests the thumbnail shows how the site works. One line above the grid invites the client to open each site and scroll it, for example: *"Open each site and have a look around — how it moves and how it feels on your phone matters as much as how it looks."*

**When the picture is bad**
- If the capture failed, or produced no usable picture, the tile shows the site's name, address and (if captured) its icon, in place of the thumbnail. It is still a full tile, with the link and the likes and dislikes.
- The capture itself is not changed by this ticket.

**What goes**
- The "Sites we're comparing" item on the questions panel, including its Add, thumbnails and comp notes. Its contents move to the tiles. Nothing else on the panel changes.
- The comp viewer (`apps/control-app/src/builder/comp-viewer.js`), its transient `comp` mode, its full-page screenshot display, the desktop/phone switch and the motion note. Delete them, and the CSS and config strings only they use; don't leave them unused.

**What doesn't change**
- How the consultant finds, captures and adds comps, and records likes, dislikes and the visual direction (`capture_site`, `add_comp`, `note_comp`, `visual_concept`).
- The client's comp notes still reach the consultant the same way, including the "I've finished commenting" notice.
- The looks carousel (REQ-391) is unchanged. Only the comp viewer stops using it.

## Supersedes

This ticket is later intent and replaces, where they conflict:
- **REQ-378** (`request-b3f68517`): the comp viewer as a transient mode not offered by the toggle; "Back to your draft"; previous/next between comps; the full-page screenshot as what the client looks at; the comp board on the questions panel.
- **REQ-391** (`request-3ed38543`): only the part that applies its carousel to comps.
- **BUG-236** (`bug-6facfa71`) item 5: only *where* the comp Done and "I've finished commenting" live. They move from the panel to the Comparisons mode; their behaviour is unchanged.

Reconcile should treat their ACs/UATs that pin those specific points as invalidated by this ticket. All three are at `ready_to_reconcile`, so their bodies can't be edited.

## Test plan

- `test_UAT_FC_REQ-419_*`, driving the real builder in jsdom:
  - with no comps raised, the toggle shows View, Edit and Story only; after the comp board is raised, Comparisons appears after Story;
  - in Comparisons, every comp is a tile, with no previous/next control;
  - each tile's link and thumbnail link point at the comp's real address with `target="_blank"` and `rel` including `noopener`; a non-http(s) address produces no link;
  - a comp with no usable picture renders the name-and-address tile, still with its link and notes;
  - editing likes/dislikes and pressing Done on a tile saves them through the same route as before; "I've finished commenting" sends the same notice as before;
  - adding a site by address from the Comparisons mode adds a tile;
  - clicking a comp card in chat switches to Comparisons;
  - the "Looking at other sites" stage explanation has a link that switches to Comparisons, and clicking the stage does not change its state;
  - switching away with the toggle and back returns to Comparisons; there is no "Back to your draft";
  - the questions panel has no "Sites we're comparing" item.
- Update or remove the REQ-378, REQ-391 and BUG-236 UATs that pin the comp viewer, its carousel or the panel comp board, and say so in the commit.
- Regression: the plan-panel, story-board and builder mode suites. Some builder suites need sockets and skip in the sandbox; note which ran.
