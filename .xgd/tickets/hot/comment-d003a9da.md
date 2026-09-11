---
uid: comment-d003a9da
id: COMMENT-2682
type: comment
title: Comment on bug BUG-79
created_by: xgd
created_at: '2026-09-11T01:57:07.831839+00:00'
updated_at: '2026-09-11T02:20:45.966398+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-00de1faf
  kind: chat_transcript
---

<!-- xgd-turn id="aa20827d-d919-4a97-b361-7dd625a31456-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T01:56:25.883375+00:00" -->
#### You
Moving back and forth between view and edit mode on the site page looses the scroll position and reverts the page to the top. It needs to flip in-place

<!-- xgd-turn id="aa20827d-d919-4a97-b361-7dd625a31456-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T02:20:45.912667+00:00" -->
#### Claude
I've traced the mechanism. Let me scope the ticket first.

Now the implementation. First `panel.js`:

Now the CSS and the `app.js` call sites:

Now the BUG-79 UATs:

The fix works for every flip after the first. Let me make the first flip in-place too, by priming the idle channel once the shown one has arrived:

Done. BUG-79 is `free_coded` at 0.2.160.

## What was wrong

The pane had **one iframe** and a mode was a `src` on it — so View↔Edit *navigated*: the document you were looking at was destroyed and rebuilt. REQ-215 (landed a few hours earlier) carried the page state across that navigation and re-applied it on `load`, which is the right thing to carry but isn't the same as never losing it: the pane still blanks, the render restarts, and the offset is re-applied against a layout that isn't necessarily final at `load`.

## What it does now

A document mode **owns its own frame**, kept for the panel's lifetime. Switching mode swaps which frame is visible and navigates nothing.

- **Hidden is `visibility`, never `display`** — a `display:none` iframe is out of layout and loses its scroll offset, which would give the bug back through the side door.
- **The idle channel is primed** once the visible one has loaded, so the *first* flip is in place too, not just every flip after it. Priming only fires for a genuinely different URL (a site change), never merely because a frame is stale — re-rendering a page nobody is looking at is a cost nobody asked for.
- A frame navigates only when what it holds is really out of date: never pointed anywhere, site changed, explicit refresh, or a write.

Consequences worth knowing: the panel now announces its document on *show* as well as on load (a revealed frame fires no `load`, and the edit bridge, Marked Points and the carry all bind on that announcement); `panel.reloadDocument()` replaces the three `contentWindow.location.reload()` call sites so a write also marks the idle channel stale; and `.builder-panel__frame` now names *the shown frame*, with geometry moved to `.builder-panel__pane`, which every frame carries — so the browser suites and the viewport-fill measurement keep meaning what they meant.

## Verification

- 6 new UATs in `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`, mutation-checked: making `setMode` invalidate, or removing priming, fails them.
- 29-file builder regression scope green (180 tests).
- Full sweep: 16 failures across 12 files — I re-ran every one of them with my changes reverted and they all fail identically. They're KB-not-built and no-chromium/no-webui environment failures, plus one route-coverage assertion (`/api/material/changes`), none builder-related.
- Four existing UATs adjusted where they asserted the single-frame model rather than the property they're about (REQ-115 ×2, AC-968, AC-1249, plus the REQ-215 frame helper). Each still proves its criterion — pane identity and `getSrc()` carry AC-968; the palette UAT names the displayed frame instead of relying on it being the only iframe. All recorded in the ticket body so reconciliation sees them.

**To see it:** the builder JS is served from `dist-assets`, so your checkout needs `./bin/1c assets` before a restart shows the change. I didn't run it in your checkout in case another session is mid-suite.

<!-- xgd-chat-end -->